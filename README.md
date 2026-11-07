# Matt's Pocket Farm

An immersive personal website presented as a small interactive 3D farm. The homepage is one large world: drag to rotate the camera through 360 degrees, scroll to zoom, and select the farmhouse, project barn, crop field or mailbox.

## Interaction

- Free 360° horizontal orbit with mouse, touch or trackpad
- Vertical drag changes the camera elevation
- Clickable 3D locations open content without leaving the main world
- Compact planting game inside the world, plus a full six-plot version
- Local progress saving, audio feedback and keyboard-accessible controls
- Responsive layouts for desktop and mobile

## Structure

The main experience is `index.html`. The deeper pages remain available for the assignment's multi-page requirement:

- `about.html` — farmer's journal
- `work.html` — project barn
- `lab.html` — full crop-field game
- `contact.html` — farm mailbox
- `project-learning.html` — learning website case study

The farm is drawn from scratch with the Canvas API. No external frameworks, 3D libraries or downloaded models are required.

## Run locally

Run `python -m http.server 8002` in this folder, then open `http://localhost:8002`.

Repository: https://github.com/Matt-061224/my-portfolio
Live site: https://matt-061224.github.io/my-portfolio/
