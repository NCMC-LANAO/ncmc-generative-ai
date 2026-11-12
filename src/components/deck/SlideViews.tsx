import type {
  SoftwareSlide, EquipmentSlide, AgendaSlide, ClosingSlide, DividerSlide, FlowSlide, ProblemsSlide,
  SectorSlide, Slide, StatementSlide, TitleSlide, ToolsSlide,
} from '../../data/deck';
import { slides as allSlides, deckMeta } from '../../data/deck';
import { Headline, inline, rv } from './Rich';
import { ModalityIcon, StepGlyph } from './Icons';

type Go = (i: number) => void;
const two = (n: number) => String(n).padStart(2, '0');

function IndexList({ ids, go, start }: { ids: string[]; go: Go; start: number }) {
  const entries = ids
    .map((id) => ({ id, index: allSlides.findIndex((x) => x.id === id) }))
    .filter((e) => e.index >= 0);
  return (
    <ol className="index">
      {entries.map((e, n) => (
        <li key={e.id} className="rv" style={rv(start + n)}>
          <button onClick={() => go(e.index)}>
            <span className="num">{two(n + 1)}</span>
            <span>{allSlides[e.index].label}</span>
            <svg className="arrow" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 10h12M11 5l5 5-5 5" />
            </svg>
          </button>
        </li>
      ))}
    </ol>
  );
}

function Title({ s }: { s: TitleSlide }) {
  return (
    <div className="slide-inner">
      <p className="kicker rv" style={rv(0)}>{s.kicker}</p>
      <Headline as="h1" lines={s.lines} start={1} />
      <p className="lede rv" style={rv(4)}>{inline(s.lede)}</p>
      <dl className="meta rv" style={rv(5)}>
        {s.meta.map((m) => (
          <div key={m.label}><dt>{m.label}</dt><dd>{m.value}</dd></div>
        ))}
        {deckMeta.presenter && (<div><dt>Presented by</dt><dd>{deckMeta.presenter}</dd></div>)}
      </dl>
    </div>
  );
}

function Agenda({ s, go }: { s: AgendaSlide; go: Go }) {
  return (
    <div className="slide-inner split">
      <p className="kicker rv" style={rv(0)}>{s.kicker}</p>
      <Headline lines={s.lines} size="md" start={1} />
      <IndexList ids={s.items} go={go} start={3} />
    </div>
  );
}

function Statement({ s }: { s: StatementSlide }) {
  return (
    <div className="slide-inner split">
      <p className="kicker rv" style={rv(0)}>{s.kicker}</p>
      <Headline lines={s.lines} size="md" start={1} />
      <p className="statement rv" style={rv(3)}>{s.body}</p>
      {s.example && <p className="example rv" style={rv(4)}>{s.example}</p>}
      <ul className="modal-grid">
        {s.modalities.map((m, i) => (
          <li key={m.label} className="tile rv" style={rv(5 + i)}>
            <ModalityIcon name={m.icon} />
            {m.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Flow({ s }: { s: FlowSlide }) {
  return (
    <div className="slide-inner">
      <p className="kicker rv" style={rv(0)}>{s.kicker}</p>
      <Headline lines={s.lines} size="sm" start={1} />
      <p className="sub rv" style={rv(3)}>{s.sub}<span className="sub-hint"> · Hover or tap a step to see what it means</span></p>
      <ol className="flow">
        {s.steps.map((st, i) => (
          <li key={st.label} className="rv" style={rv(4 + i)} tabIndex={0} aria-describedby={`step-tip-${i}`}>
            <div className="ic"><StepGlyph name={st.icon} /></div>
            <span className="n">{two(i + 1)}</span>
            <span className="t">{st.label}</span>
            <span className="tip" role="tooltip" id={`step-tip-${i}`}>
              <strong>{st.label}</strong>
              {st.hint}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Problems({ s }: { s: ProblemsSlide }) {
  return (
    <div className="slide-inner">
      <p className="kicker rv" style={rv(0)}>{s.kicker}</p>
      <Headline lines={s.lines} size="sm" start={1} />
      <ul className="problems">
        {s.items.map((t, i) => (
          <li key={t} className="rv" style={rv(3 + i)}>
            <span className="num">{two(i + 1)}</span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Divider({ s, go }: { s: DividerSlide; go: Go }) {
  return (
    <div className="slide-inner split-right">
      <p className="kicker rv" style={rv(0)}>{s.kicker}</p>
      <Headline lines={s.lines} size="md" start={1} />
      <IndexList ids={s.items} go={go} start={4} />
    </div>
  );
}

function Sector({ s }: { s: SectorSlide }) {
  return (
    <div className="slide-inner split">
      <p className="kicker rv" style={rv(0)}>{s.kicker}</p>
      <Headline lines={s.lines} size="sm" start={1} />
      <ul className="points">
        {s.points.map((p, i) => (
          <li key={p} className="rv" style={rv(3 + i)}>
            <span className="num">{two(i + 1)}</span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Tools({ s }: { s: ToolsSlide }) {
  return (
    <div className="slide-inner">
      <p className="kicker rv" style={rv(0)}>{s.kicker}</p>
      <Headline lines={s.lines} size="sm" start={1} />
      <ul className="tool-grid">
        {s.tools.map((t, i) => (
          <li key={t.name} className="tool rv" style={rv(3 + i)}>
            <header>
              <span className="mono"><img src={`/logos/${t.logo}.svg`} alt="" width="28" height="28" loading="eager" decoding="async" /></span>
              <h3>{t.name}<small>{t.maker}</small></h3>
            </header>
            <p>{t.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Software({ s }: { s: SoftwareSlide }) {
  const half = Math.ceil(s.items.length / 2);
  const cols = [s.items.slice(0, half), s.items.slice(half)];
  return (
    <div className="slide-inner">  
      <p className="kicker rv" style={rv(0)}>{s.kicker}</p>
      <Headline lines={s.lines} size="sm" start={1} />
      <div className="inv">
        {cols.map((col, c) => (
          <div className="inv-col" key={c}>
            <div className="inv-head rv" style={rv(3)}>
              <span>Software and digital tools</span><span>Plan</span><span>Qty</span>
            </div>
            <ul>
              {col.map((it, i) => (
                <li key={it.name + it.plan} className="rv" style={rv(4 + c * 2 + i)}>
                  <span className="nm">
                    <span className={`sw${it.logo ? '' : ' sw-letter'}`} aria-hidden="true">
                      {it.logo ? <img src={`/logos/${it.logo}.svg`} alt="" width="20" height="20" decoding="async" /> : it.name[0]}
                    </span>
                    {it.name}
                  </span>
                  <span className={`plan${it.paid ? ' paid' : ''}`}>{it.plan}</span>
                  <span className="q">{it.qty}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Equipment({ s }: { s: EquipmentSlide }) {
  return (
    <div className="slide-inner">
      <p className="kicker rv" style={rv(0)}>{s.kicker}</p>
      <Headline lines={s.lines} size="sm" start={1} />
      <div className="eq-grid">
        {s.items.map((it, i) => (
          <article key={it.name} className={`eq rv${i === 0 ? ' eq-main' : ''}`} style={rv(3 + i)}>
            <header>
              <h3>{it.name}{it.note && <small>{it.note}</small>}</h3>
              <span className="qty"><small>Qty</small>{it.qty}</span>
            </header>
            <dl>
              {it.specs.map((sp) => (
                <div key={sp.k}><dt>{sp.k}</dt><dd>{sp.v}</dd></div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

function Closing({ s }: { s: ClosingSlide }) {
  return (
    <div className="slide-inner">
      <p className="kicker rv" style={rv(0)}>{s.kicker}</p>
      <Headline lines={s.lines} start={1} />
      <p className="lede rv" style={rv(4)}>{s.lede}</p>
    </div>
  );
}

export function SlideView({ s, go }: { s: Slide; go: Go }) {
  switch (s.layout) {
    case 'title': return <Title s={s} />;
    case 'agenda': return <Agenda s={s} go={go} />;
    case 'statement': return <Statement s={s} />;
    case 'flow': return <Flow s={s} />;
    case 'problems': return <Problems s={s} />;
    case 'divider': return <Divider s={s} go={go} />;
    case 'sector': return <Sector s={s} />;
    case 'tools': return <Tools s={s} />;
    case 'software': return <Software s={s} />;
    case 'equipment': return <Equipment s={s} />;
    case 'closing': return <Closing s={s} />;
  }
}
