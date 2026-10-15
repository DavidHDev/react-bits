# Preview videos

`npm run previews:record` records every component's preview clip from its live demo page, in dark and light mode, and writes them to `public/assets/video/`:

- `<name>.webm` (VP9, 800×500) with an `<name>.mp4` (H.264, 30 fps) fallback and an `<name>.webp` poster
- the same three files with a `-light` suffix for light mode

`<name>` comes from the component's `videoUrl` in `src/constants/Information.js`.

```bash
npm run previews:record -- --only ghost-fibers --site http://localhost:5173
```

Flags:

- `--only a,b` / `--category Backgrounds,Micro`: limit the run (slugs and categories as in the docs URLs and `Information.js`)
- `--mode dark|light|both` (default both)
- `--site <url>`: record from a running server. Without it the site is built and served on port 4190. A production build records fastest.
- `--workers <n>` (default 3): parallel Chrome instances
- `--force`: re-record even when the outputs are newer than the demo, the component and `choreography.json`
- `--out <dir>` (default `public/assets/video`), `--masters <dir>` (default a temp folder)
- `--reencode`: re-encode the final files from the kept masters without recording again. `--mp4-only` and `--posters-only` redo just those.

## How it records

- Each demo page loads in headless Chrome at 2× density (3.2× for auto-framed clips).
- The page runs on a virtual clock:
  - `requestAnimationFrame`, `performance.now`, `Date`, timers, CSS and WAAPI animations, `<video>` and event timestamps all advance exactly one frame at a time.
  - Every clip is a smooth 60 fps take, however heavy the demo.
  - Time stays frozen while the page loads, so `t = 0` is the first recorded frame and mount intros start right there.
- The capture covers only `.demo-container`. Its width is forced to 1.6 × its height.
- The site header, side rails, the refresh button, toasts, background hero overlays and docs-only hints ("Move your cursor", "Scroll down in this box") are hidden.
- The page scroll is locked and link navigation is cancelled.
- Input is real Chrome mouse, wheel and key input. A drawn cursor shows the pointer. It hides itself over elements with `cursor: none`.

## Choreography

`choreography.json` holds one entry per component, keyed by `slug`:

```json
{
  "slug": "splash-cursor",
  "duration": 6,
  "warmup": 0,
  "loop": "crossfade",
  "frame": "full",
  "cursor": "none",
  "props": {},
  "lightProps": {},
  "actions": [
    {
      "type": "path",
      "from": 0.3,
      "to": 4.5,
      "points": [
        [0.15, 0.6],
        [0.4, 0.3],
        [0.88, 0.4]
      ],
      "ease": "inOut"
    },
    { "type": "click", "at": 2.4, "x": 0.5, "y": 0.5 },
    { "type": "leave", "at": 4.8 }
  ]
}
```

- `duration` (2–10 s) is the loop length. `warmup` runs that many seconds before recording starts, to skip a slow start.
- `loop` options:
  - `crossfade`: ambient motion; the end blends into the start.
  - `replay`: one-shot animations. The clip starts on the finished state (so the poster shows it), dips to the background and replays.
  - `cut`: interactions that end where they started.
- `frame` options:
  - `full`
  - `auto`: zooms in on where content appears.
  - `{ "zoom": 1.5, "cx": 0.5, "cy": 0.5 }`

  Keep the subject inside the middle 73% horizontally. The narrowest grid cards crop the sides.

- `cursor`: `auto` (default, drawn when there are pointer actions), `none`, or `show`.
- `props` / `lightProps` are set through the demo's URL query (colors without `#`).
- `pageScroll: true` lets the page itself scroll, for components that react to window scroll.
- Coordinates are normalized to the demo container. Any point or click can target `{ "selector": ".css", "dx": 0, "dy": 0 }` instead, resolved inside the container.
- Actions use times in seconds from `t = 0`:
  - `path`: `from`, `to`, `points`, optional `ease` (`inOut`, `linear`, `out`, `in`).
  - `click`: `at`, a point or `selector`, optional `hold` for long presses.
  - `drag`: press, move along `points`, release.
  - `wheel`: `from`, `to`, `deltaY`, `x`, `y`.
  - `scroll`: `from`, `to`, an optional `selector` (`"window"` for the page; defaults to the container's scrollable child), and `to_px` (a number or `"bottom"`). It starts from wherever the scroller currently is.
  - `key`: `at`, `key`.
  - `leave`: the pointer glides out of the container.
  - `refresh`: replays the demo through its refresh button.
- Encoding overrides: `fps`, `crf`, `kbPerSecond` (size budget), `mp4Crf`, `settle` (ms to wait after load).

The pointer glides between actions on its own and starts outside the container. For a clean loop, end where the clip started, or `leave` before the end.
