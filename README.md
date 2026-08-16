# Raster Tide

[![Deploy to GitHub Pages](https://github.com/DavidRDudas/rastertide/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/DavidRDudas/rastertide/actions/workflows/deploy-pages.yml)

Raster Tide turns images and video into animated ASCII art directly in the
browser. Adjust the grid, character set, motion, direction, palette, exposure,
and contrast, then export a PNG, copy the characters, or record a WEBM.

**Live site:** [rastertide.com](https://rastertide.com/)

## Highlights

- Image and video input stays on the device
- Animated letters and dot fields with four flow directions
- Fourteen graded color palettes
- Live 3× character magnifier
- PNG, text, and WEBM export
- Animated light and dark themes
- Responsive browser-based interface

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Builds

```bash
# Vinext/Cloudflare-compatible build
npm run build

# Static GitHub Pages build
npm run build:pages

# Build and verify the Pages artifact
npm run test:pages
```

The GitHub Pages build is emitted to `out/`. A workflow deploys that directory
whenever `main` is updated.

## Privacy

Raster Tide performs media decoding and rendering locally with browser APIs.
Uploaded files are not sent to an application server.
