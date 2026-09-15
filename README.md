# Himel — personal site

Natural portfolio + knowledge journal for **Md. Habib Hasan Himel**.  
Designed to deploy on **GitHub Pages** with optional free cloud sync.

## Structure

```
himel-site/
├── index.html           Public site
├── admin/index.html     Admin only (not linked publicly)
├── css/style.css
├── js/data.js           Storage + export/import + JSONBin
├── js/main.js           Public logic (set PUBLIC_BIN_ID here)
├── js/admin.js          Admin (passphrase: pswd.admin)
├── assets/logo.svg
└── README.md
```

## How data works

| Layer | Purpose |
|-------|---------|
| **localStorage** | Fast local cache on each device |
| **JSON backup** | Download/import file — always works offline |
| **JSONBin (optional)** | Free cloud so GitHub Pages visitors see the same posts |

### Recommended workflow

1. Work in **Admin** → publish posts, edit settings, upload CV  
2. **Download backup** regularly  
3. For public hosting:
   - Create free account at [jsonbin.io](https://jsonbin.io)
   - Create a bin → copy **Bin ID** + **Master Key**
   - In Admin → Cloud sync → paste → **Save** → **Push to cloud**
   - In `js/main.js` set: `const PUBLIC_BIN_ID = 'your-bin-id';`
   - Commit & push to GitHub Pages

After that, every visitor loads journal data from the cloud bin.

### CV on GitHub Pages

- Easiest: put `Himel_CV.pdf` in `assets/` and update the download link, **or**
- Upload via Admin (stored in that browser only; include in backup if needed)

## Admin passphrase

`pswd.admin` — change in `js/admin.js` if you want.

## Deploy (GitHub Pages)

1. Create a repo, upload this folder  
2. Settings → Pages → Deploy from branch (`main` / root or `/docs`)  
3. Site URL: `https://YOUR_USERNAME.github.io/REPO_NAME/`  
4. Open `.../admin/` only yourself (bookmark it; don’t share)

## Why not Google Drive?

Drive is great for personal files, awkward as a live website database (auth, CORS, no clean public JSON API).  
JSONBin / Supabase / Firebase are better for this use case. JSONBin is the simplest free option here.
