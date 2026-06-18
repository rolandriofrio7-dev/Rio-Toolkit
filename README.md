<div align="center">

<img src="assets/logo.png" width="120" alt="Rio Panels" />

# Rio Panels — Tools & Motion for After Effects

**Remove the clicks and the work starts moving on its own.**

![After Effects](https://img.shields.io/badge/After%20Effects-2024%2B-C2521B?style=flat-square)
![ScriptUI](https://img.shields.io/badge/ScriptUI-ExtendScript-8F3A12?style=flat-square)
![Rio Tools](https://img.shields.io/badge/Rio%20Tools-v1.0-4790FF?style=flat-square)
![Rio Flow](https://img.shields.io/badge/Rio%20Flow-v3.1-FAC719?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-38CC7D?style=flat-square)

[Website]((https://rolandriofrio7-dev.github.io/Rio-Toolkit/)) · [Install](#install) · [Rio Tools](#rio-tools--v10) · [Rio Flow](#rio-flow--v31) · [Customize](#customize)

</div>

---

Editing in After Effects is **death by a thousand clicks** — right-click menus, memorized shortcuts, the same setup steps on every comp. Rio Panels turns the repetitive 80% into a single button, so the time goes to the actual idea, not the busywork.

It's two focused ScriptUI panels:

- **Rio Tools** — one-click workflow actions (align, create, modify, effects, export).
- **Rio Flow** — easing presets and a live curve editor for keyframes.

Each ships as a single self-contained `.jsx` that works **both** as a docked ScriptUI panel and as a floating palette fallback — same file, whether you launch it from the Window menu or run it as a script.

## Why two panels

The first build crammed everything into one do-everything panel with too many options — powerful, but nobody could learn it at a glance. So it was split into two focused panels — one for workflow actions, one for motion — each laid out so the button you want is where you'd expect it, with hover and click feedback so it feels responsive.

## Install

Both panels install the same way.

**1. Download** `Rio_Tools.jsx` and `Rio_Flow.jsx` from this repo.

**2. Copy** them into the `ScriptUI Panels` folder:

```
macOS
  /Applications/Adobe After Effects [ver]/Scripts/ScriptUI Panels/

Windows
  C:\Program Files\Adobe\Adobe After Effects [ver]\Support Files\Scripts\ScriptUI Panels\
```

**3. Restart** After Effects.

**4. Open** via `Window > Rio_Tools.jsx` or `Window > Rio_Flow.jsx`, then dock it anywhere.

> First run blocked? In **Preferences → Scripting & Expressions**, enable *Allow Scripts to Write Files and Access Network*.

---

## Rio Tools · v1.0

One-click workflow actions, grouped by task. Every action runs inside a single undo group, so `Cmd/Ctrl + Z` always backs it out cleanly.

| Section | Count | What it does |
| --- | --- | --- |
| **Align** | 9 | 3×3 grid (top/middle/bottom × left/center/right). Reads anchor point and scale to land the layer correctly in 2D and 3D. Center In Comp is tinted to stand out. |
| **Create** | 7 | Solid, Shape, Text, Null, Camera, Point Light, Adjustment Layer — added straight to the active comp via native AE scripting. |
| **Modify** | 6 | Pre-Comp, Center, Fit To Comp, Mirror, Freeze Frame (hold keyframes via time-remap), Enable Motion Blur (layer + comp switch). |
| **Effects** | 12 | Lumetri, Curves, Hue/Sat, Levels, Brightness & Contrast, Tint, Fill, Glow, Drop Shadow, Gaussian Blur, Camera Lens Blur, Keylight — each applied by its exact internal `matchName`. |
| **Export** | 1 | Save Current Frame — adds a render-queue item at the playhead, ready to render. |

**Usage:** select layer(s) → click an action. Create buttons just add to the active comp.

## Rio Flow · v3.1

Interactive easing for keyframes, with a live curve preview.

- **15 default presets** — tuned `speed` + `influence` pairs approximating standard eases (Ease, Ease In/Out), polynomial curves (Quad / Cubic / Expo In/Out), anticipation (Back In/Out, Overshoot), and character presets (Bounce-ish, Smooth Pop, Snappy).
- **Live curve preview** — a ScriptUI canvas draws a bezier approximation of the selected preset, with handle arms, a linear reference diagonal, and grid lines. It repaints every time you click a preset.
- **Custom curve** — dial in name, in/out influence and speed, then **Save Preset** to add it as a button for the session.
- **Utilities** — Easy Ease, Linearize, Copy Current Settings, Reset Fields.

> **v3.1 note:** `canvas.notify("onDraw")` isn't supported in AE 2024/2026, so the redraw uses `window.update()` / `panel.update()` to force a full repaint — works in every AE version.

**Usage:** select keyframes → click a preset to apply its ease.

---

## Customize

Both panels are built to be re-themed without touching any logic.

- **Colors** — edit the `C{}` block near the top of each file (all values are `0.0–1.0` for ScriptUI).
- **Button heights** — named constants like `BTN_ALIGN_H`, `BTN_FX_H`, etc. in `Rio_Tools.jsx`.
- **New effects** — copy any `makeBtn(...)` line in the Effects section and change the label + effect function.

## Requirements

- Adobe After Effects (built and tested on 2024 / 2026).
- No third-party dependencies — pure ExtendScript / ScriptUI.

## License

[MIT](LICENSE) — use it, fork it, retheme it.

<div align="center">

*Built by Rio · [rioshotit.netlify.app](https://rioshotit.netlify.app)*

</div>
