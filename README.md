# Matt's Pocket Farm

An independent single-player browser game presented as a small interactive 3D farm. The homepage is one large world: drag horizontally to rotate the fixed camera through 360 degrees, then open the supply house, crop field, animal meadow or fish pond.

## Interaction

- Free 360° horizontal orbit with mouse, touch or trackpad
- Vertical drag changes the camera elevation
- Clickable 3D locations open content without leaving the main world
- Compact planting game inside the world, plus a full six-plot version
- A connected economy: buy seeds, feed and bait; grow crops; milk cows; raise chickens; sell fish meat
- Real-time crop growth that continues while the page is closed, with watering as a one-time speed boost
- Local progress saving, audio feedback and keyboard-accessible controls
- Responsive layouts for desktop and mobile

## Structure

The main experience is `index.html`. The deeper pages remain available for the assignment's multi-page requirement:

- `about.html` — farmer's journal
- `work.html` — game systems overview
- `lab.html` — full crop-field game
- `contact.html` — Matt and game links

The farm is drawn from scratch with the Canvas API. No external frameworks, 3D libraries or downloaded models are required.

## Run locally

Run `python -m http.server 8002` in this folder, then open `http://localhost:8002`.

Repository: https://github.com/Matt-061224/my-portfolio
Live site: https://matt-061224.github.io/my-portfolio/
