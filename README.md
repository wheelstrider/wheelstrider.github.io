# WheelStrider project page

Source of <https://wheelstrider.github.io>, the project page for
*WheelStrider: Sim-to-Real Learning Unified Perceptive Hybrid Locomotion for Wheeled Bipeds*.

The site is plain static HTML/CSS/JS with no build step, served by GitHub Pages from the repository root.

```
index.html              page content
static/css/style.css    styles (light and dark themes)
static/js/main.js       lazy video playback, terrain gallery, view toggles, lightbox, navigation
static/images/          figures, terrain thumbnails, social preview image, favicon
static/videos/          web-encoded clips and their poster frames
  real/                 real-robot clips (TRON1, real-time speed)
  sim/                  MuJoCo-Warp / MuJoCo clips
  terrain/              flat-rough-flat runs per terrain, side and rear views
  wheelstrider_video.mp4  supplementary video
```

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Updating

- Text, numbers and links live in `index.html`. The per-terrain descriptions of the simulation gallery are in the `TERRAINS` array in `static/js/main.js`.
- To de-anonymize after review, replace the "Anonymous Authors" line in the hero, the BibTeX entry, and the disabled
  *Paper* / *Code* buttons (they are `<span class="btn disabled">` elements; turn them into `<a class="btn" href="...">`).
- Videos are H.264 (yuv420p, `+faststart`) with all metadata stripped; looping clips have no audio.
  Keep new clips short, around 1280 px wide, and add a `.jpg` poster frame with the same base name.
