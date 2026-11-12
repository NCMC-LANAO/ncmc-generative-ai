# Generative AI: presentation site

Interactive slide deck for the TESDA Generative AI program at North Central Mindanao College.
Astro + React (one island) + Three.js. Fully static, no backend, works offline once built.

## Run

Requires **Node 22.23.4 or newer**.

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in ./dist
npm run preview    # serve ./dist locally
npx astro check    # type-check
```

## Presenting

| Key | Action |
| :-- | :----- |
| `→` `↓` `PageDown` `Space` | Next slide |
| `←` `↑` `PageUp` | Previous slide |
| `Home` / `End` | First / last slide |
| `O` | Slide overview |
| `F` | Fullscreen |

Each slide has a deep link, e.g. `/#software`. Swipe works on touch screens.

## Editing content

All slide text lives in [`src/data/deck.ts`](src/data/deck.ts). To add a slide, add an object to the
`slides` array. The agenda, progress rail, overview and links update automatically.

- `layout` picks the template (`title`, `agenda`, `statement`, `flow`, `problems`, `divider`, `sector`, `tools`, `software`, `equipment`, `closing`). Templates are in [`src/components/deck/SlideViews.tsx`](src/components/deck/SlideViews.tsx).
- `stage` places the 3D robot (`x`, `y`, `scale`, `ry`, `pose`, `companion`).
- Wrap a word in `*asterisks*` to show it in the accent colour.
- Set `presenter` in `deckMeta` to show a presenter name on the title slide.
- Tool logos are SVG files in [`public/logos/`](public/logos/). Logos are trademarks of their owners.

## Structure

```text
src/
  data/deck.ts              all content
  components/deck/          Deck shell (navigation, chrome, overview) and slide templates
  lib/scene/                Three.js scene: SceneController (render loop, placement) and robot (procedural model)
  styles/global.css         design tokens and all styles
  pages/index.astro         page shell, loads fonts
public/logos/               brand marks
design-system/              design notes (reference only)
```

## Performance and accessibility notes

- Three.js is code-split and loaded after first paint. If frames run slow, the scene drops to a low-effects mode automatically (1x pixel ratio, no backdrop blur).
- Honours `prefers-reduced-motion`. Falls back to a gradient if WebGL is unavailable or lost.
- Inactive slides are `inert`; focus moves to the active slide on change; the overview is a focus-trapped dialog.

## Deploying

`dist/` is plain static files and can go to any static host. The site expects to be served from the
domain root. For a sub-path (e.g. GitHub Pages project site) set `site` and `base` in
`astro.config.mjs` and prefix the `/logos/...` URLs in `SlideViews.tsx` with `import.meta.env.BASE_URL`.
