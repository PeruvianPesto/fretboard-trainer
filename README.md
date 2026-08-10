# Fretboard Trainer

A 22-fret EADGBE fretboard drill: a note name is shown, click any matching fret/string.

## Run locally

```
npm install
npm run dev
```

Then open the printed localhost URL.

## Build for deployment

```
npm run build
```

Outputs a static `dist/` folder — deployable as-is to Vercel, Netlify, GitHub Pages, etc.

## Practice modes

- Single string: pick one of the 6 strings.
- String group: preset pairs/trios (bass, treble, etc.).
- Full neck: all strings, all 22 frets.

## Files

- `src/lib/fretboard.js` — tuning, note math, cell scoping.
- `src/components/Fretboard.jsx` — SVG neck rendering + click handling.
- `src/components/Controls.jsx` — mode/string selectors.
- `src/App.jsx` — game state (target note, scoring, streak).
