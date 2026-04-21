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

### What the admin page lets you do

- **No JSON typing.** Every field is a structured form input (text, number, color picker, dropdown). Zones, dispatches, and mileage brackets are editable tables with per-row add/delete.
- **Live validation.** Invalid numbers, out-of-range lat/lng, and empty required fields show a red border and inline error. Publish is disabled until all hard errors are cleared.
- **Preview before publishing.** Click *Preview changes* to see a unified diff of `data.json` (before → after). Commits are optimistic-locked on the current blob SHA, so if someone else has published since you started, you get a *reload or keep editing* prompt instead of silently clobbering their work.

### Adding a new local

Click **+ Add new local** at the top of the editor. The modal asks for:

- Local number (e.g. `290`)
- Name (e.g. `Local 290`)
- Region / hall city
- Color
- Feature template — which rate-structure sections to include (travel zones, mileage brackets, Appendix A zones, per-diem, Hanford-style override, vehicle-type split on zones)

Each selected feature is added as an empty skeleton section, ready to populate. The feature-detection renderer picks them up automatically — no code changes needed for a new local.

### Adding a new *rate structure* feature (i.e. a feature not already supported)

A code change is needed. The editor in [`admin.html`](admin.html) renders sections by detecting keys on each local's sub-tree (`travelZones`, `appendixA`, `mileageCalc`, `mileageBrackets`, `perDiem`, `hanford`). To add a brand-new structure, follow the comment block right above `buildEditor()`:

```
// ADDING A NEW RATE STRUCTURE FEATURE:
// 1. Add the key in data.json's local sub-tree (e.g. "myFeature": { ... })
// 2. Write a renderer function here that checks presence of the key and
//    returns a section element.
// 3. Wire it into buildLocalCard() below the other "if (local.xxx)" blocks.
```

Existing locals without the new key simply skip the section — feature detection is purely by key presence.

Publishing writes a commit to `main` via the GitHub Contents API. The service worker uses network-first for `data.json`, so users get the new rates on their next page load (~60s after commit, once Pages rebuilds).
