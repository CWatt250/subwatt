# SubWatt

HFIAW Western Jurisdiction travel rate estimator. Installable PWA.

Live: https://cwatt250.github.io/subwatt/

## Deploy

Hosted on GitHub Pages (main branch, root). Any push to `main` rebuilds the site.

```
git add .
git commit -m "..."
git push
```

The service worker caches the app shell and OSM tiles (capped at 500 tiles, oldest evicted first). When you ship asset changes, bump `CACHE_NAME` in `sw.js` so clients pick up the new build.
