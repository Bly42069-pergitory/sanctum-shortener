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

1. `index.html` — luxury homepage with gallery, guardian mascot, and link directory
2. `404.html` — GitHub Pages redirect engine (all `/slug` paths)
3. `links.yml` — edit this file to add or change short links
4. `gallery.json` + `assets/gallery/` — restoration photo grid

Auto-detects **custom domain** (`PATH_SEGMENTS_TO_SKIP = 0`) vs **github.io/repo/** (`skip = 1`).

## Add a short link

Edit `links.yml`:

```yaml
portfolio:
  url: https://mastersanctumrestoration.com/gallery
  title: Restoration Portfolio
```

Or simple form:

```yaml
contact: https://mastersanctumrestoration.com/contact
```

Commit and push — live in 1–3 minutes.

## Custom domain (`sanctum-shortener.is-a.dev`)

1. `CNAME` file contains: `sanctum-shortener.is-a.dev`
2. GitHub **Settings → Pages → Custom domain** → enter the same
3. At [is-a.dev](https://is-a.dev) DNS panel, point subdomain to GitHub Pages:
   - CNAME `sanctum-shortener` → `bly42069-pergitory.github.io`
4. Enable **Enforce HTTPS**

## Files

| File / folder | Purpose |
|---------------|---------|
| `links.yml` | Short link map |
| `404.html` | Redirect engine |
| `index.html` | Homepage |
| `gallery.json` | Gallery manifest |
| `assets/logo-msr.png` | MSR shield logo |
| `assets/guardian-marble.png` | Marble guardian mascot |
| `assets/gallery/` | Restoration photos |
| `CNAME` | Custom domain |
| `.nojekyll` | Static file serving |

## Local preview

```powershell
cd C:\Users\rbly8\OdysseusOCRAT\shortener
python -m http.server 8765
# http://127.0.0.1:8765/
```

## Deploy

```powershell
git add -A
git commit -m "Update MSR shortener"
git push origin main
```

## License

GPL-3.0 — see [LICENSE](LICENSE).
