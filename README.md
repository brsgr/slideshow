# Slideshow

A browser-based fullscreen slideshow app for local images and videos.

## Features

- Folder selection via File System Access API
- Supports JPEG, PNG, HEIC, TIFF, GIF, WebP images
- Supports MP4, MOV, WebM videos
- Configurable duration, shuffle, and loop options
- Keyboard controls (arrows, space, escape)
- Progress bar synced to image timer / video playback

## Development

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Build

```bash
npm run build
```

Output in `dist/`. Preview the build with:

```bash
npm run preview
```

## Browser Support

Requires File System Access API (Chrome/Edge only).
