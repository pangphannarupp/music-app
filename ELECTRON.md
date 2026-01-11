# Electron Desktop App

This app can run as both a web application and a native desktop app using Electron.

## Development

### Web Version
```bash
npm run dev
```
Opens at `http://localhost:5173`

### Electron Version
```bash
npm run electron:dev
```
Runs the app in an Electron window with:
- Native file picker for downloads
- Better performance
- No CORS restrictions
- System integration

## Building

### Build for Distribution
```bash
npm run electron:build
```

This creates distributable packages in the `release/` folder:
- **macOS**: `.dmg` and `.zip` files
- **Windows**: `.exe` installer and portable version
- **Linux**: `.AppImage` and `.deb` packages

## Features in Electron

### Enhanced Downloads
- Native file picker dialog
- Choose save location
- Better progress feedback
- Direct file system access

### Desktop Integration
- Standalone app (no browser needed)
- System tray support (future)
- Global keyboard shortcuts (future)
- Native notifications (future)

## Project Structure

```
yt-music-player/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # IPC bridge (secure)
├── src/
│   ├── types/
│   │   └── electron.d.ts # TypeScript definitions
│   └── ...
└── package.json         # Electron config
```

## Notes

- The app automatically detects if it's running in Electron
- Download feature works in both web and Electron versions
- Web version uses browser blob download
- Electron version uses native file dialog
