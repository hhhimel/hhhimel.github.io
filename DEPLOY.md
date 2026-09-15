# Deploy to GitHub Pages

## 1. Create a repo
- GitHub → New repository (e.g. `himel` or `himel-portfolio`)
- Public is fine

## 2. Upload these files
Upload the **contents** of the `himel-site` folder to the repo root
(or keep the folder and set Pages to serve from `/himel-site` — root is simpler).

```
index.html
admin/
assets/
css/
js/
README.md
```

## 3. Enable Pages
Repo → **Settings** → **Pages**
- Source: Deploy from a branch
- Branch: `main` (or `master`)
- Folder: `/ (root)`
- Save

After 1–2 minutes your site is at:
`https://YOUR_USERNAME.github.io/REPO_NAME/`

## 4. Admin
`https://YOUR_USERNAME.github.io/REPO_NAME/admin/`
Passphrase: `pswd.admin`

## 5. Optional — cloud journal (JSONBin)
1. Free account at https://jsonbin.io
2. Create a bin → copy Bin ID + Master Key
3. Admin → Cloud sync → paste → Save → Push to cloud
4. In `js/main.js` set:
   `const PUBLIC_BIN_ID = 'your-bin-id';`
5. Commit & push again

## CV
Already included: `assets/Himel_CV.pdf`  
Replace that file anytime and push to update the download.

## 6. Realtime chat (Firebase — free)

Shared live messaging for all visitors.

### One-time setup (~10 minutes)

1. Open [Firebase Console](https://console.firebase.google.com) → **Create project** (Spark / free plan is enough).
2. **Add app** → Web (`</>`) → register app → copy the `firebaseConfig` object.
3. **Build → Realtime Database → Create database**
   - Start in **test mode** (allows read/write for 30 days while you try it).
   - Pick any region.
4. Open `js/firebase-config.js` in this project and paste your keys:

```js
window.HimelFirebase = {
  enabled: true,
  config: {
    apiKey: '...',
    authDomain: '...',
    databaseURL: 'https://YOUR_PROJECT-default-rtdb.firebaseio.com',
    projectId: '...',
    storageBucket: '...',
    messagingSenderId: '...',
    appId: '...'
  }
};
```

5. Commit & push. Chat appears under **Messages** on the public site.

### Database rules (after testing)

In Realtime Database → Rules, for a simple public room:

```json
{
  "rules": {
    "chat": {
      "messages": {
        ".read": true,
        ".write": true,
        ".indexOn": ["time"]
      }
    }
  }
}
```

For stricter control later, add Firebase Auth and limit writes.

### Notes

- Messages are stored in Firebase, not on GitHub.
- Free Spark plan is enough for light personal traffic.
- Until `enabled: true`, the Messages section shows an offline note.
