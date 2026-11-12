import { useCallback, useEffect, useRef, useState } from 'react';
import type { SceneController } from '../../lib/scene/SceneController';
import { slides, deckMeta } from '../../data/deck';
import { SlideView } from './SlideViews';

const clamp = (n: number) => Math.max(0, Math.min(slides.length - 1, n));
const pad = (n: number) => String(n).padStart(2, '0');

function indexFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  const i = slides.findIndex((s) => s.id === id);
  return i >= 0 ? i : 0;
}

export default function Deck() {
  const [index, setIndex] = useState(indexFromHash);
  const [overview, setOverview] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [scene, setScene] = useState<SceneController | null>(null);
  const [gl, setGl] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);
  indexRef.current = index;

  const go = useCallback((i: number) => {
    setIndex(clamp(i));
    setOverview(false);
  }, []);

  /* ── WebGL lifecycle ── */
  useEffect(() => {
    if (!canvasRef.current) return;
    let ctrl: SceneController | null = null;
    let cancelled = false;
    const canvas = canvasRef.current;
    // Three.js is split into its own chunk so the first paint isn't blocked.
    import('../../lib/scene/SceneController')
      .then(({ SceneController }) => {
        if (cancelled) return;
        ctrl = new SceneController(canvas, () => {
          setScene(null);
          setGl(false); // GPU context lost: fall back to the static gradient
        });
        setScene(ctrl);
      })
      .catch(() => !cancelled && setGl(false));
    return () => {
      cancelled = true;
      ctrl?.dispose();
      setScene(null);
    };
  }, []);

  /* ── Drive the 3D scene + URL from the current slide ── */
  useEffect(() => {
    const s = slides[index];
    scene?.morphTo({ ...s.stage, companion: !!s.stage.companion });
    history.replaceState(null, '', `#${s.id}`);
    document.title = `${s.label} · ${deckMeta.title}`;
  }, [index, scene]);

  useEffect(() => {
    const onHash = () => setIndex(indexFromHash());
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  /* ── Input: keyboard, wheel, touch, pointer ── */
  useEffect(() => {
    const step = (d: number) => setIndex((i) => clamp(i + d));

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return; // let sliders work
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
          if (t.tagName === 'BUTTON' && e.key === ' ') return;
          e.preventDefault(); step(1); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
          e.preventDefault(); step(-1); break;
        case 'Home': e.preventDefault(); setIndex(0); break;
        case 'End': e.preventDefault(); setIndex(slides.length - 1); break;
        case 'o': case 'O': setOverview((v) => !v); break;
        case 'Escape': setOverview(false); break;
        case 'f': case 'F': toggleFullscreen(); break;
      }
    };

    let acc = 0, lock = 0, resetT = 0;
    const onWheel = (e: WheelEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('.overview')) return;
      // A slide taller than the screen scrolls natively; only change slide at its top/bottom edge.
      const slide = t.closest('.slide') as HTMLElement | null;
      if (slide && slide.scrollHeight > slide.clientHeight + 4) {
        const atBottom = slide.scrollTop + slide.clientHeight >= slide.scrollHeight - 2;
        const atTop = slide.scrollTop <= 1;
        if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) return;
      }
      const now = performance.now();
      if (now < lock) return;
      acc += e.deltaY + e.deltaX;
      clearTimeout(resetT);
      resetT = window.setTimeout(() => (acc = 0), 120);
      if (Math.abs(acc) > 60) {
        step(acc > 0 ? 1 : -1);
        acc = 0;
        lock = now + 1000;
      }
    };

    let sx = 0, sy = 0, sTarget: EventTarget | null = null;
    const onTouchStart = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; sTarget = e.target; };
    const onTouchEnd = (e: TouchEvent) => {
      if ((sTarget as HTMLElement)?.closest?.('input, .overview')) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
    };

    const onMove = (e: PointerEvent) => {
      scene?.setPointer((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
    };

    addEventListener('keydown', onKey);
    addEventListener('wheel', onWheel, { passive: true });
    addEventListener('touchstart', onTouchStart, { passive: true });
    addEventListener('touchend', onTouchEnd, { passive: true });
    addEventListener('pointermove', onMove, { passive: true });
    return () => {
      removeEventListener('keydown', onKey);
      removeEventListener('wheel', onWheel);
      removeEventListener('touchstart', onTouchStart);
      removeEventListener('touchend', onTouchEnd);
      removeEventListener('pointermove', onMove);
    };
  }, [scene]);

  /* ── Fullscreen ── */
  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }
  useEffect(() => {
    const on = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  /* ── Overview dialog: move focus in, trap Tab, return focus on close ── */
  const overviewRef = useRef<HTMLDivElement>(null);
  const overviewBtnRef = useRef<HTMLButtonElement>(null);
  const wasOverview = useRef(false);
  useEffect(() => {
    if (overview) {
      overviewRef.current?.querySelector<HTMLElement>('[aria-current="true"]')?.focus();
    } else if (wasOverview.current) {
      overviewBtnRef.current?.focus(); // if a slide was picked, the effect below moves focus onward
    }
    wasOverview.current = overview;
  }, [overview]);

  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const items = Array.from(overviewRef.current?.querySelectorAll<HTMLElement>('button') ?? []);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  /* ── Move focus to the new slide so screen readers announce "N of M: title" ── */
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (overview) return;
    slideRefs.current[index]?.focus({ preventScroll: true });
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="deck" ref={rootRef} data-gl={gl ? 'on' : 'off'}>
      <div className="stage-canvas" aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>
      <div className="vignette" aria-hidden="true" />

      <header className="chrome-top">
        <div className="brand"><i aria-hidden="true" />{deckMeta.title}</div>
        <div className="tools-bar">
          <span className="counter">
            <b>{pad(index + 1)}</b> / {pad(slides.length)}
          </span>
          <button ref={overviewBtnRef} className="icon-btn" aria-pressed={overview} onClick={() => setOverview((v) => !v)} aria-label="Slide overview">
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="1.5" width="5" height="5" rx="1" /><rect x="9.5" y="1.5" width="5" height="5" rx="1" /><rect x="1.5" y="9.5" width="5" height="5" rx="1" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /></svg>
            <span className="lbl">Overview</span>
          </button>
          <button className="icon-btn" aria-pressed={fullscreen} onClick={toggleFullscreen} aria-label="Toggle fullscreen">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" /></svg>
            <span className="lbl">Present</span>
          </button>
        </div>
      </header>

      <main id="slides">
        {slides.map((s, i) => (
          <section
            key={s.id}
            ref={(el) => { slideRefs.current[i] = el; }}
            tabIndex={-1}
            className="slide"
            data-state={i === index ? 'active' : i < index ? 'past' : 'future'}
            aria-hidden={i !== index}
            inert={i !== index}
            aria-label={`${i + 1} of ${slides.length}: ${s.label}`}
          >
            <SlideView s={s} go={go} />
          </section>
        ))}
      </main>

      <footer className="chrome-bottom">
        <nav className="rail" aria-label="Slides">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => go(i)}
              data-done={i < index}
              aria-current={i === index}
              aria-label={`Go to slide ${i + 1}: ${s.label}`}
              title={s.label}
            />
          ))}
        </nav>
        <div className="hint" aria-hidden="true">
          <span><kbd>←</kbd> <kbd>→</kbd> navigate</span>
          <span><kbd>O</kbd> overview</span>
          <span><kbd>F</kbd> present</span>
        </div>
      </footer>

      <div className="overview" ref={overviewRef} data-open={overview} inert={!overview} role="dialog" aria-modal="true" aria-label="Slide overview" onKeyDown={trapTab}>
        <ul className="overview-grid">
          {slides.map((s, i) => (
            <li key={s.id}>
              <button className="ov-card" aria-current={i === index} onClick={() => go(i)}>
                <span>{pad(i + 1)}</span>
                <strong>{s.label}</strong>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
