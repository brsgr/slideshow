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

## Deploy to GitHub Pages

1. Update `base` in `vite.config.ts` to match your repo name
2. Push to GitHub
3. Go to repo **Settings > Pages**
4. Set source to **GitHub Actions**
5. Push to `main` triggers auto-deploy

## Browser Support

Requires File System Access API (Chrome/Edge only).
