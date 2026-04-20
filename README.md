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

## Editing rates

Rate data, dispatches, and Hanford configuration live in [`data.json`](data.json) (not baked into `index.html`). Edit directly via Git, or use the admin page:

**Admin URL:** https://cwatt250.github.io/subwatt/admin.html

The admin page is a GitHub-backed editor gated by a **fine-grained personal access token**:

1. Create a token at https://github.com/settings/personal-access-tokens/new
2. Under **Repository access**, select **Only select repositories** → `CWatt250/subwatt`
3. Under **Repository permissions**, grant **Contents: Read and write**. No other scopes are needed.
4. Paste the token into the admin page. It stays in that browser tab's `sessionStorage` and clears when you close the tab.

Publishing writes a commit to `main` via the GitHub Contents API. The service worker uses network-first for `data.json`, so users get the new rates on their next page load (~60s after commit, once Pages rebuilds).
