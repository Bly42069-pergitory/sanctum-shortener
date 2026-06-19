# Master Sanctum Restoration — URL Shortener

Premium static URL shortener and brand landing page for **Master Sanctum Restoration**.

**Tagline:** *Protecting What Endures*

## Live URLs

| Environment | URL |
|-------------|-----|
| Custom domain | https://sanctum-shortener.is-a.dev/ |
| GitHub Pages | https://bly42069-pergitory.github.io/sanctum-shortener/ |
| Example slug | `/quote` → contact page |

## How it works

1. `index.html` — luxury homepage with gallery lightbox, guardian mascot, and link directory
2. `404.html` — GitHub Pages redirect engine (all `/slug` paths)
3. `links.yml` — source of truth for short links (titles + descriptions supported)
4. `gallery.json` + `assets/gallery/` — restoration photo grid with Before/After labels

Auto-detects **custom domain** (`PATH_SEGMENTS_TO_SKIP = 0`) vs **github.io/repo/** (`skip = 1`).

## Add a short link

Edit `links.yml`:

```yaml
portfolio:
  url: https://mastersanctumrestoration.com/gallery
  title: Restoration Portfolio
  description: Selected conservation work
```

Or simple form:

```yaml
contact: https://mastersanctumrestoration.com/contact
```

Commit and push — live in 1–3 minutes.

## Custom domain (`sanctum-shortener.is-a.dev`)

1. `CNAME` file contains: `sanctum-shortener.is-a.dev`
2. GitHub **Settings → Pages → Custom domain** → enter the same
3. Register at [is-a.dev](https://github.com/is-a-dev/register) — add `domains/sanctum-shortener.json`:
   ```json
   {
     "owner": { "username": "Bly42069-pergitory" },
     "records": { "CNAME": "bly42069-pergitory.github.io" }
   }
   ```
4. Enable **Enforce HTTPS** after DNS propagates

## Files

| File / folder | Purpose |
|---------------|---------|
| `links.yml` | Short link map (YAML, human-editable) |
| `links.json` | Legacy/simple slug map |
| `404.html` | Redirect engine |
| `index.html` | Homepage (Tailwind CDN + inline styles) |
| `gallery.json` | Gallery manifest (`label`, `caption`, `pair`) |
| `assets/logo-msr.webp` | MSR shield logo |
| `assets/guardian-marble.webp` | Marble guardian mascot |
| `assets/gallery/` | Restoration photos |
| `CNAME` | Custom domain |
| `.nojekyll` | Static file serving |

## Local preview

```powershell
cd C:\Users\rbly8\OdysseusOCRAT\shortener
python -m http.server 8765
# http://127.0.0.1:8765/
```

## Deploy to GitHub Pages

**Repo:** `Bly42069-pergitory/sanctum-shortener` · branch `main`

### Option A — Git push

```powershell
cd C:\Users\rbly8\OdysseusOCRAT\shortener
git add index.html 404.html links.yml links.json gallery.json README.md
git commit -m "Polish MSR shortener: typography, gallery lightbox, mobile nav"
git push origin main
```

### Option B — GitHub MCP / web editor

Push the same files via GitHub MCP `push_files` or edit directly on github.com.

### After push

1. **Settings → Pages** → Source: `main` / `/ (root)`
2. Custom domain: `sanctum-shortener.is-a.dev`
3. **Enforce HTTPS** ✓
4. Verify: homepage, `/quote` redirect, gallery lightbox on mobile

## Changelog (2026-06-19)

- Improved text contrast (`stone` palette lift)
- Mobile hamburger navigation
- Larger guardian mascot with glow ring
- Gallery lightbox, featured hero tile, label styling
- Rich link cards (title + description from `links.yml`)
- Polished 404/miss page and OG image → guardian WebP

## License

GPL-3.0 — see [LICENSE](LICENSE).
