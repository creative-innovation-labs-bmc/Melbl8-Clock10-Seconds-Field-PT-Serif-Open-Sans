# Project brief

## Description

Shield-optimised Seconds Field gallery clock for the Melbourne 3840 × 804 Enplug display using PT Serif and Open Sans.

## Build brief

Purpose:
Create Clock 10 for the Melbourne video-wall clock rotation, based on the Seconds Field concept.

Core visual idea:
- HH:MM remains calm, monumental and highly legible.
- Seconds are represented as a 60-unit kinetic field rather than a conventional large seconds number.
- The field should feel like a gallery artwork/data sculpture, not a dashboard.
- Use a restrained still → event → still rhythm.

Initial composition:
- Native 3840 × 804 stage.
- Large HH:MM on the left/centre using PT Serif.
- A wide 60-unit seconds field spanning the remaining width.
- One unit corresponds to one second of the minute.
- Completed seconds remain Aurecon green #89C925; future seconds remain subdued grey; the current second gets a brief pulse/transition.
- At 00 seconds, reset the field with a lightweight staged wipe or snap-back that does not animate all elements continuously.
- Small Open Sans metadata for MELBOURNE / day / date only if it improves the composition.
- Australia/Melbourne timezone, 24-hour time.

Exploration directions to preserve in code/CSS for iteration:
1. 60 vertical ticks forming one long horizontal field.
2. 60 circles/dots arranged as a precise gallery grid.
3. 6 groups of 10 units to make elapsed seconds readable without looking like a chart.
4. Optional current-second marker that expands or lifts briefly, using transform/opacity only.

Performance constraints:
- Must run smoothly in Enplug on NVIDIA Shield.
- Static HTML/CSS/vanilla JavaScript.
- No canvas, WebGL, particle systems, SVG filter animation, blur filters or continuous animation loops.
- Keep DOM count low. Sixty simple field elements is acceptable.
- Update once per second; animate only the changed/current unit and minute reset.
- Prefer transform and opacity transitions.
- No external runtime libraries.

Brand / typography:
- Background Aurecon Grey #373A36.
- Primary accent Aurecon Green #89C925.
- Near black #1C1B1C and divider grey #BBC6C3 may be used for depth.
- PT Serif for principal time typography.
- Open Sans for supporting text.
- Use locally hosted PT Serif and Open Sans assets in the final repo.
- No Meta or legacy proprietary font files.

Publishing / privacy:
- Add noindex, nofollow, noarchive, nosnippet and noimageindex meta protections.
- Include robots.txt disallowing crawling.
- GitHub Pages production URL must work cleanly with no debug query parameters.
- Include a mobile-safe preview behaviour without changing the native 3840 × 804 composition.

Deployment:
Public GitHub repository with GitHub Pages enabled.
