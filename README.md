# stevenjhubbard-llc

Source for **[stevenjhubbard.com](https://www.stevenjhubbard.com/)** — the portfolio site for Steven J. Hubbard, Solutions Architect and Full Stack Developer.

Hand-written HTML, CSS, and vanilla JavaScript. No framework, no build step, no dependencies. `index.html` is the whole site.

## Layout

| Path | What it is |
|---|---|
| `index.html` | The site. Source of truth — edit this. |
| `assets/webp/` | Project, portrait, and testimonial images (WebP) |
| `assets/raw/` | Original PNG/JPEG sources, kept so images can be re-derived at other sizes |
| `build-inline.py` | Base64-inlines every local asset into one portable file |
| `favicon.svg` | Icon master — the PNG/ICO set is generated from these same coordinates |
| `dist/index.html` | Generated single-file build. Do not hand-edit — rerun the script. |

## Develop

```bash
python3 -m http.server 4317
```

Then open http://localhost:4317.

## Build the single-file version

```bash
python3 build-inline.py
```

Writes `dist/index.html` with every image embedded as a data URI — one file, no asset directory, works offline or from any host.

## Notes

Deliberately dark-only, with a `@media print` block that flips the page to ink-on-white so it prints cleanly as a resume. Type is Archivo (variable width axis) for display and IBM Plex Sans/Mono for body and metadata, loaded from Google Fonts — the only external request the page makes.

Don't upscale `assets/raw/portrait.jpg`; it's 662×800 native and goes soft above that.

© Steven Hubbard LLC. Code is reusable; the written content, résumé detail, and photography are not.
