/**
 * Firebase config for realtime chat
 * ---------------------------------
 * 1. Go to https://console.firebase.google.com → Create project (free)
 * 2. Add a Web app → copy the firebaseConfig object below
 * 3. Build → Realtime Database → Create database → Start in TEST mode
 *    (for production, tighten rules later)
 * 4. Paste your keys here and set enabled: true
 * 5. Commit & push to GitHub Pages
 */
window.HimelFirebase = {
  enabled: false,  // set true after you paste real keys
  config: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    databaseURL: 'https://YOUR_PROJECT-default-rtdb.firebaseio.com',
    projectId: 'YOUR_PROJECT',
    storageBucket: 'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID'
  }
};
