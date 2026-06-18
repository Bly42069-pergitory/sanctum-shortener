# Master Sanctum Restoration — URL Shortener

A branded, zero-server URL shortener hosted entirely on **GitHub Pages**. Custom slugs are defined in a single `links.json` file.

**Brand:** Master Sanctum Restoration · *Protecting What Endures*

## Live URLs

- Landing: https://bly42069-pergitory.github.io/sanctum-shortener/
- Example: https://bly42069-pergitory.github.io/sanctum-shortener/quote

## Add a link

Edit `links.json`, commit, push:

```json
{
  "quote": "https://mastersanctumrestoration.com/contact"
}
```

## Enable GitHub Pages

Settings → Pages → Deploy from branch → `main` → `/ (root)` → Save

## Custom domain (`msr.link`)

1. Add `CNAME` with `msr.link`
2. Set `PATH_SEGMENTS_TO_SKIP = 0` in `404.html`
3. Configure DNS A records for GitHub Pages

See full docs in repo.
