import {
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  SphereGeometry,
  TorusGeometry,
  MathUtils,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type Pose = 'idle' | 'wave' | 'present' | 'presentR' | 'point' | 'think';

export interface RobotPalette {
  body: number;
  dark: number;
  glow: number;
}

interface Joint {
  /** shoulder swing around z, elbow bend */
  sz: number;
  ez: number;
  sx: number;
}

/**
 * Arms hang along -y. Rotating about +z swings the hand toward +x.
 * "L" is the arm on the -x side (viewer's left when the robot faces us).
 */
const POSES: Record<Pose, { l: Joint; r: Joint; headTilt: number }> = {
  idle: { l: { sz: -0.22, ez: -0.25, sx: 0 }, r: { sz: 0.22, ez: 0.25, sx: 0 }, headTilt: 0 },
  wave: { l: { sz: -0.2, ez: -0.25, sx: 0 }, r: { sz: 2.55, ez: 0.35, sx: 0 }, headTilt: 0.08 },
  present: { l: { sz: -1.35, ez: -0.35, sx: 0 }, r: { sz: 0.2, ez: 0.25, sx: 0 }, headTilt: -0.06 },
  presentR: { l: { sz: -0.2, ez: -0.25, sx: 0 }, r: { sz: 1.35, ez: 0.35, sx: 0 }, headTilt: 0.06 },
  point: { l: { sz: -1.7, ez: -0.05, sx: 0 }, r: { sz: 0.25, ez: 0.3, sx: 0 }, headTilt: -0.05 },
  think: { l: { sz: -0.22, ez: -0.25, sx: 0 }, r: { sz: 0.5, ez: 2.3, sx: -0.9 }, headTilt: 0.12 },
};

export interface Robot {
  group: Group;
  setPose(p: Pose): void;
  update(t: number, dt: number, look: { x: number; y: number }): void;
  dispose(): void;
}

export function createRobot(palette: RobotPalette): Robot {
  const g = new Group();
  const owned: { dispose(): void }[] = [];
  const own = <T extends { dispose(): void }>(o: T) => (owned.push(o), o);

  const body = own(
    new MeshPhysicalMaterial({
      color: palette.body,
      roughness: 0.3,
      metalness: 0.05,
      clearcoat: 0.7,
      clearcoatRoughness: 0.18,
    }),
  );
  const dark = own(new MeshPhysicalMaterial({ color: palette.dark, roughness: 0.28, metalness: 0.65 }));
  const visorMat = own(new MeshPhysicalMaterial({ color: 0x030a16, roughness: 0.06, metalness: 0.9, clearcoat: 1 }));
  const glowMat = own(new MeshBasicMaterial({ color: palette.glow, toneMapped: false }));

  const add = (geo: { dispose(): void }, mat: MeshPhysicalMaterial | MeshBasicMaterial, parent: Group = g) => {
    const m = new Mesh(own(geo) as never, mat);
    parent.add(m);
    return m;
  };

  /* torso */
  const torso = add(new CapsuleGeometry(0.62, 0.5, 12, 32), body);
  torso.scale.set(1, 1, 0.84);
  const plate = add(new RoundedBoxGeometry(0.66, 0.4, 0.07, 4, 0.03), dark);
  plate.position.set(0, 0.22, 0.52);
  const line = add(new RoundedBoxGeometry(0.4, 0.035, 0.02, 2, 0.01), glowMat);
  line.position.set(0, 0.26, 0.565);
  for (let i = 0; i < 3; i++) {
    const d = add(new SphereGeometry(0.028, 12, 12), glowMat);
    d.position.set(-0.1 + i * 0.1, 0.14, 0.565);
  }

  /* hover base */
  const base = add(new CylinderGeometry(0.46, 0.2, 0.5, 40), dark);
  base.position.y = -1.12;
  const ring = add(new TorusGeometry(0.5, 0.028, 12, 64), glowMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.9;

  /* neck + head */
  const neck = add(new CylinderGeometry(0.14, 0.17, 0.26, 24), dark);
  neck.position.y = 0.98;

  const head = new Group();
  head.position.y = 1.62;
  g.add(head);
  const skull = add(new SphereGeometry(0.78, 48, 36), body, head);
  skull.scale.set(1.12, 0.92, 0.96);
  const visor = add(new SphereGeometry(0.62, 48, 32), visorMat, head);
  visor.scale.set(1.08, 0.7, 0.55);
  visor.position.set(0, 0.02, 0.52);

  const eyes = new Group();
  eyes.position.set(0, 0.05, 0.835);
  head.add(eyes);
  const eyeL = add(new CapsuleGeometry(0.066, 0.1, 6, 16), glowMat, eyes);
  eyeL.position.x = -0.25;
  const eyeR = add(new CapsuleGeometry(0.066, 0.1, 6, 16), glowMat, eyes);
  eyeR.position.x = 0.25;

  for (const s of [-1, 1]) {
    const ear = add(new CylinderGeometry(0.15, 0.15, 0.14, 32), dark, head);
    ear.rotation.z = Math.PI / 2;
    ear.position.set(s * 0.88, 0, 0);
    const er = add(new TorusGeometry(0.1, 0.014, 8, 32), glowMat, head);
    er.rotation.y = Math.PI / 2;
    er.position.set(s * 0.96, 0, 0);
  }

  const antenna = new Group();
  antenna.position.set(0.18, 0.7, 0);
  head.add(antenna);
  const stalk = add(new CylinderGeometry(0.022, 0.022, 0.34, 10), dark, antenna);
  stalk.position.y = 0.17;
  const bulb = add(new SphereGeometry(0.07, 16, 16), glowMat, antenna);
  bulb.position.y = 0.38;

  /* arms */
  const makeArm = (side: -1 | 1) => {
    const shoulder = new Group();
    shoulder.position.set(side * 0.8, 0.5, 0);
    g.add(shoulder);
    add(new SphereGeometry(0.19, 24, 24), dark, shoulder);
    const upper = add(new CapsuleGeometry(0.105, 0.34, 8, 20), body, shoulder);
    upper.position.y = -0.3;
    const elbow = new Group();
    elbow.position.y = -0.58;
    shoulder.add(elbow);
    add(new SphereGeometry(0.115, 20, 20), dark, elbow);
    const fore = add(new CapsuleGeometry(0.095, 0.28, 8, 20), body, elbow);
    fore.position.y = -0.24;
    const hand = add(new SphereGeometry(0.13, 20, 20), dark, elbow);
    hand.position.y = -0.52;
    return { shoulder, elbow };
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  /* animation state */
  let pose: Pose = 'idle';
  const cur = { lsz: -0.22, lez: -0.25, lsx: 0, rsz: 0.22, rez: 0.25, rsx: 0, tilt: 0, hx: 0, hy: 0 };
  let blinkAt = 2.5;
  let blinkT = -1;


  return {
    group: g,
    setPose(p) {
      pose = p;
    },
    update(t, dt, look) {
      const P = POSES[pose];
      const k = 1 - Math.exp(-dt * 5);
      const wave = pose === 'wave' ? Math.sin(t * 7) * 0.45 : 0;
      const nod = pose === 'present' || pose === 'point' ? Math.sin(t * 1.6) * 0.04 : 0;

      cur.lsz += (P.l.sz + nod - cur.lsz) * k;
      cur.lez += (P.l.ez - cur.lez) * k;
      cur.lsx += (P.l.sx - cur.lsx) * k;
      cur.rsz += (P.r.sz - cur.rsz) * k;
      cur.rez += (P.r.ez + wave - cur.rez) * k;
      cur.rsx += (P.r.sx - cur.rsx) * k;
      cur.tilt += (P.headTilt - cur.tilt) * k;

      armL.shoulder.rotation.set(cur.lsx, 0, cur.lsz + Math.sin(t * 1.3) * 0.015);
      armL.elbow.rotation.z = cur.lez;
      armR.shoulder.rotation.set(cur.rsx, 0, cur.rsz + Math.sin(t * 1.3 + 1) * 0.015);
      armR.elbow.rotation.z = cur.rez;

      // head follows the pointer, with weight
      const hk = 1 - Math.exp(-dt * 4);
      cur.hx += (look.x * 0.55 - cur.hx) * hk;
      cur.hy += (-look.y * 0.3 - cur.hy) * hk;
      head.rotation.set(cur.hy, cur.hx, cur.tilt);
      eyes.position.x = cur.hx * 0.04;

      // float + breathe
      g.position.y = Math.sin(t * 1.15) * 0.07;
      torso.scale.y = 1 + Math.sin(t * 1.15 + 0.6) * 0.008;
      ring.scale.setScalar(1 + Math.sin(t * 2.2) * 0.03);
      bulb.scale.setScalar(1 + (Math.sin(t * 3) * 0.5 + 0.5) * 0.35);
      antenna.rotation.z = Math.sin(t * 1.7) * 0.06;

      // blink
      if (blinkT < 0 && t > blinkAt) {
        blinkT = 0;
      }
      if (blinkT >= 0) {
        blinkT += dt;
        const b = blinkT < 0.07 ? blinkT / 0.07 : blinkT < 0.14 ? 1 - (blinkT - 0.07) / 0.07 : 0;
        eyes.scale.y = MathUtils.lerp(1, 0.08, Math.min(Math.max(b, 0), 1));
        if (blinkT >= 0.14) {
          eyes.scale.y = 1;
          blinkT = -1;
          blinkAt = t + 2.8 + Math.random() * 3;
        }
      }
    },
    dispose() {
      owned.forEach((o) => o.dispose());
    },
  };
}
