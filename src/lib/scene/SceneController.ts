import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  ACESFilmicToneMapping,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createRobot, type Pose, type Robot } from './robot';

export interface SceneTarget {
  /** world units from centre; + is right */
  x: number;
  y: number;
  scale: number;
  /** yaw in radians; negative turns the robot toward screen-left */
  ry: number;
  pose: Pose;
  /** show the smaller companion robot */
  companion: boolean;
}

const CAMERA_Z = 9;
const FOV = 38;
/** Stage positions in deck.ts were authored for a 16:10 screen; they are rescaled to the real aspect. */
const DESIGN_ASPECT = 1.6;
const DESIGN_HALF_W = Math.tan((FOV * Math.PI) / 360) * CAMERA_Z * DESIGN_ASPECT;
const MAX_DPR = 1.5;
/** Average frame time (s) above which we drop to low-effects mode. */
const SLOW_FRAME = 0.027;

function radialTexture(stops: [number, string][]) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

interface Actor {
  robot: Robot;
  holder: Group;
  glow: Mesh;
  cur: { x: number; y: number; s: number; ry: number };
}

export class SceneController {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  private dust: Points;
  private main: Actor;
  private buddy: Actor;
  private target: SceneTarget = { x: 3, y: -0.2, scale: 1, ry: -0.3, pose: 'wave', companion: false };
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private portrait = false;
  private raf = 0;
  private last = performance.now();
  private t = 0;
  private reduced: boolean;
  private disposed = false;
  private ro: ResizeObserver;
  private textures: CanvasTexture[] = [];
  private pmrem: PMREMGenerator;
  private lowfx = false;
  private frames = 0;
  private perfAcc = 0;
  private perfN = 0;
  private onVisibility = () => {
    this.last = performance.now();
  };
  private onContextLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(this.raf);
    this.onLost?.();
  };

  constructor(
    private canvas: HTMLCanvasElement,
    private onLost?: () => void,
  ) {
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    canvas.addEventListener('webglcontextlost', this.onContextLost);

    // Image-based light from a procedural studio: glossy materials with no asset downloads.
    this.pmrem = new PMREMGenerator(this.renderer);
    this.scene.environment = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;

    this.scene.add(new HemisphereLight(0xbcd6ff, 0x0a1a38, 0.5));
    const key = new DirectionalLight(0xffffff, 2.1);
    key.position.set(3, 5, 6);
    this.scene.add(key);
    const rim = new PointLight(0x3d8bff, 60, 20, 1.6);
    rim.position.set(-5, 2, -3);
    this.scene.add(rim);
    const rim2 = new PointLight(0x7fd4ff, 30, 20, 1.6);
    rim2.position.set(6, 1, -2);
    this.scene.add(rim2);

    this.camera.position.set(0, 0.4, CAMERA_Z);

    // sparse, slow ambient dust: depth, not noise
    const N = 700;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    const dg = new BufferGeometry();
    dg.setAttribute('position', new BufferAttribute(pos, 3));
    const dotTex = radialTexture([
      [0, 'rgba(190,220,255,1)'],
      [0.4, 'rgba(120,180,255,0.4)'],
      [1, 'rgba(120,180,255,0)'],
    ]);
    this.textures.push(dotTex);
    this.dust = new Points(
      dg,
      new PointsMaterial({ size: 0.07, map: dotTex, transparent: true, opacity: 0.45, depthWrite: false, blending: AdditiveBlending }),
    );
    this.scene.add(this.dust);

    const glowTex = radialTexture([
      [0, 'rgba(77,155,255,0.55)'],
      [0.5, 'rgba(77,155,255,0.12)'],
      [1, 'rgba(77,155,255,0)'],
    ]);
    this.textures.push(glowTex);

    const makeActor = (robot: Robot): Actor => {
      const holder = new Group();
      holder.add(robot.group);
      const glow = new Mesh(
        new CircleGeometry(1.5, 48),
        new MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: AdditiveBlending }),
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = -1.75;
      holder.add(glow);
      this.scene.add(holder);
      return { robot, holder, glow, cur: { x: 3, y: -0.2, s: 1, ry: -0.3 } };
    };

    this.main = makeActor(createRobot({ body: 0xeaf0fa, dark: 0x0c1c3a, glow: 0x7fd4ff }));
    this.buddy = makeActor(createRobot({ body: 0xc4d9f8, dark: 0x12306a, glow: 0xa7e8ff }));
    this.buddy.cur.s = 0;
    this.buddy.holder.visible = false;

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    this.resize();
    document.addEventListener('visibilitychange', this.onVisibility);
    this.snap();
    this.raf = requestAnimationFrame(this.tick);
  }

  morphTo(t: SceneTarget) {
    this.target = t;
    this.main.robot.setPose(t.pose);
    this.buddy.robot.setPose(t.pose === 'wave' ? 'idle' : 'wave');
    if (this.reduced) this.snap();
  }

  setPointer(nx: number, ny: number) {
    this.pointer.tx = nx;
    this.pointer.ty = ny;
  }

  private placement() {
    const t = this.target;
    // phones: robot becomes a quiet backdrop centred above the copy
    if (this.portrait) return { x: 0, y: 2.1, s: t.companion ? t.scale * 0.55 : 0.0001, ry: t.ry * 0.4 };

    // Rescale the authored position to the real aspect, shrink on squarer screens,
    // and keep the whole robot (arms included) inside the frame.
    const aspect = this.camera.aspect;
    const halfW = Math.tan((FOV * Math.PI) / 360) * this.camera.position.z * aspect;
    const fit = Math.min(1, Math.max(0.7, aspect / DESIGN_ASPECT));
    const s = t.scale * fit;
    const x = (t.x / DESIGN_HALF_W) * halfW;
    const reach = 1.25 * s + 0.35;
    const limit = Math.max(halfW - reach, 0);
    return { x: Math.sign(x) * Math.min(Math.abs(x), limit), y: t.y, s, ry: t.ry };
  }

  private enableLowFx() {
    this.lowfx = true;
    this.resize();
    // lets CSS drop expensive backdrop blurs over the canvas
    this.canvas.closest('.deck')?.setAttribute('data-lowfx', 'true');
  }

  private snap() {
    const p = this.placement();
    Object.assign(this.main.cur, { x: p.x, y: p.y, s: p.s, ry: p.ry });
    this.apply();
  }

  private apply() {
    const p = this.placement();
    const m = this.main;
    m.holder.position.set(m.cur.x, m.cur.y, 0);
    m.holder.scale.setScalar(m.cur.s);
    m.holder.rotation.y = m.cur.ry;

    const b = this.buddy;
    const want = this.target.companion && !this.portrait ? p.s * 0.52 : 0;
    b.cur.s += (want - b.cur.s) * (this.reduced ? 1 : 0.08);
    b.holder.visible = b.cur.s > 0.01;
    b.cur.x = m.cur.x + (m.cur.x >= 0 ? -2.2 : 2.2) * p.s;
    b.cur.y = m.cur.y - 0.95 * p.s;
    b.holder.position.set(b.cur.x, b.cur.y, 0.8);
    b.holder.scale.setScalar(Math.max(b.cur.s, 0.0001));
    b.holder.rotation.y = m.cur.x >= 0 ? 0.35 : -0.35;
  }

  private resize() {
    const host = this.canvas.parentElement ?? this.canvas;
    const w = host.clientWidth || innerWidth;
    const h = host.clientHeight || innerHeight;
    this.renderer.setPixelRatio(this.lowfx ? 1 : Math.min(devicePixelRatio || 1, MAX_DPR));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.portrait = w / h < 0.85;
    this.camera.position.z = CAMERA_Z * (this.portrait ? 1.35 : 1);
    this.camera.updateProjectionMatrix();
    host.dataset.portrait = String(this.portrait);
  }

  private tick = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    const raw = (now - this.last) / 1000;
    const dt = Math.min(raw, 0.05);
    this.last = now;
    if (!this.reduced) this.t += dt;

    // adaptive quality: after warm-up, if frames are consistently slow, go low-effects once
    if (!this.lowfx && ++this.frames > 90 && raw < 0.25) {
      this.perfAcc += raw;
      if (++this.perfN === 120) {
        if (this.perfAcc / this.perfN > SLOW_FRAME) this.enableLowFx();
        this.perfAcc = 0;
        this.perfN = 0;
      }
    }

    const p = this.placement();
    const f = 1 - Math.exp(-dt * 2.6);
    const c = this.main.cur;
    c.x += (p.x - c.x) * f;
    c.y += (p.y - c.y) * f;
    c.s += (p.s - c.s) * f;
    c.ry += (p.ry - c.ry) * f;
    this.apply();

    const pt = this.pointer;
    const pf = 1 - Math.exp(-dt * 6);
    pt.x += (pt.tx - pt.x) * pf;
    pt.y += (pt.ty - pt.y) * pf;

    // look direction is relative to the actor, not the screen centre
    const look = { x: pt.x - c.x / 6, y: pt.y };
    if (this.reduced) {
      look.x = 0;
      look.y = 0;
    }
    this.main.robot.update(this.t, dt, look);
    if (this.buddy.holder.visible) this.buddy.robot.update(this.t + 1.7, dt, look);

    this.dust.rotation.y = this.t * 0.012;
    this.camera.position.x += (pt.x * 0.3 - this.camera.position.x) * pf * 0.4;
    this.camera.position.y += (0.4 + pt.y * 0.18 - this.camera.position.y) * pf * 0.4;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.ro.disconnect();
    this.main.robot.dispose();
    this.buddy.robot.dispose();
    for (const a of [this.main, this.buddy]) {
      a.glow.geometry.dispose();
      (a.glow.material as MeshBasicMaterial).dispose();
    }
    this.dust.geometry.dispose();
    (this.dust.material as PointsMaterial).dispose();
    this.textures.forEach((t) => t.dispose());
    this.scene.environment?.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
  }
}
