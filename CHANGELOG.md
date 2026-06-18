# Changelog

All notable changes to Rio Panels are tracked here.

## Rio Flow — v3.1
- **Fixed:** `canvas.notify("onDraw")` is not supported in AE 2024/2026. Replaced with
  `window.update()` / `panel.update()`, which forces a full repaint and works in every AE version.
- Live curve preview now redraws reliably on every preset click.

## Rio Flow — v3.0
- 15 default easing presets with tuned speed + influence values.
- Live ScriptUI curve canvas (bezier approximation, grid, handle arms, linear reference).
- Custom curve builder with Save Preset (adds a session button).
- Utilities: Easy Ease, Linearize, Copy Current Settings, Reset Fields.

## Rio Tools — v1.0
- First focused release, split out from the original do-everything panel.
- **Align** — 3×3 grid, anchor + scale aware, 2D/3D, tinted Center In Comp.
- **Create** — Solid, Shape, Text, Null, Camera, Point Light, Adjustment Layer.
- **Modify** — Pre-Comp, Center, Fit To Comp, Mirror, Freeze Frame, Enable Motion Blur.
- **Effects** — 12 effects applied by exact internal `matchName`.
- **Export** — Save Current Frame to the render queue.
- All actions wrapped in undo groups. `C{}` colour block + `BTN_*_H` constants for easy retheming.

## Notes
The original build was a single do-everything toolkit. It was powerful but hard to learn at a glance,
so it was split into two focused panels — one for workflow actions (Tools), one for motion (Flow).
