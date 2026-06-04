# App icons & splash (native stores)

Source images for `@capacitor/assets`, which generates every Android/iOS icon
and splash size from these two files.

| File | Size | Used for |
|------|------|----------|
| `icon.png` | 1024×1024 | App icon (all platforms) |
| `splash.png` | 2732×2732 | Launch / splash screen |

Both were generated from the brand mark (`_icon.html` / `_splash.html` rendered
to PNG). To tweak the look, edit those HTML files and re-render, or just drop in
your own `icon.png` / `splash.png` at the sizes above.

## Generate the native assets

Run **after** the native projects exist (`npx cap add android` / `npx cap add ios`):

```bash
npm run assets        # writes all icon + splash sizes into android/ and ios/
npx cap sync
```

`npm run assets` uses the brand colours for the Android adaptive-icon background
(wine) and the splash background (sand light / near-black dark).
