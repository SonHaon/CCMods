# Cookie Clicker Mods

Userscripts for [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/), installable via [Tampermonkey](https://www.tampermonkey.net/).

---

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension.
2. Open the script file on GitHub and click the **Raw** button.
3. Tampermonkey will detect it and prompt you to install — click **Install**.

Both scripts include `@updateURL` and `@downloadURL` headers, so Tampermonkey can automatically check for updates. Updates are applied when the `@version` number increases.

---

## cloud_save.js — Cloud Save & Leaderboard

Automatically saves your Cookie Clicker game to a [Firebase Realtime Database](https://firebase.google.com/products/realtime-database) and optionally displays a live leaderboard of all registered players.

### Features

- Auto-save to Firebase on a configurable interval (default: every 60s)
- Password-protected writes enforced at the **Firebase rules level** — no client-side encryption needed
- Password verified locally via SHA-256 hash (no external library required)
- Force sync with `Ctrl+S`
- Live leaderboard showing cookies, CPS and prestige of all players
- All settings accessible from the in-game **Options** menu

### How security works

Save data is stored in plaintext (the standard Cookie Clicker base64 export format). Protection comes from the Firebase security rules:

- **Writes** to your profile require a token that matches your password stored in a hidden `passwords/` node — anyone without your password can read your save but cannot overwrite it.
- **Passwords** are stored in a `passwords/` node with `.read: false` — invisible to all clients, but always visible from the Firebase console (admin access).
- **Password changes** require the old password as proof, validated by Firebase rules before accepting the new one.
- **Local verification** uses a SHA-256 hash stored alongside your save, so the script can verify your password without being able to read the `passwords/` node.

> **Save loss risk:** This script syncs your save to the cloud, but it is not a backup solution. A bug, a wrong password, or a Firebase misconfiguration could result in data loss. It is strongly recommended to occasionally export your save manually via the in-game **Options → Export save** button and keep a local copy.

> **What is Firebase?** Firebase Realtime Database is a cloud database service by Google. The free tier (Spark plan) includes 1 GB of storage and 10 GB of download per month — more than enough for a handful of players. Cookie Clicker saves are small (a few KB each), so you are very unlikely to hit any limit. No credit card is required to use the free tier.

### Setting up Firebase

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com) and sign in.
2. Click **Add project**, give it a name, disable Google Analytics if you don't need it, then click **Create project**.
3. In the left sidebar, go to **Build → Realtime Database**.
4. Click **Create Database**, select the **Europe-West (Belgium)** region, and start in **test mode**.
5. Copy the database URL — it looks like `https://your-project-default-rtdb.europe-west1.firebasedatabase.app`.
6. Go to the **Rules** tab and replace the default rules with the following:

```json
{
  "rules": {
    "passwords": {
      ".read": false,
      "$user": {
        ".write": "!data.child('val').exists() || data.child('val').val() === newData.child('prev').val()",
        ".validate": "newData.child('val').isString() && newData.child('val').val().length > 0"
      }
    },
    "users": {
      "$user": {
        ".read": true,
        ".write": "root.child('passwords').child($user).child('val').val() === newData.child('_token').val()",
        "_token": { ".read": false }
      }
    },
    "leaderboard": {
      ".read": true,
      "$user": {
        ".write": "root.child('passwords').child($user).child('val').val() === newData.child('_token').val()",
        "_token": { ".read": false }
      }
    }
  }
}
```

### First use

1. Open Cookie Clicker with the script installed.
2. A prompt will ask for the **Firebase database URL** — paste the URL from step 5 above.
3. Enter a **profile name** (used as your key in the database and on the leaderboard).
4. Set a **password** — this is used to gate writes to your profile at the Firebase level.

From then on, open **Options → Cloud Save** in-game to manage everything.


### Inspired by

[fmartingr/CookieClickerCloudSave](https://github.com/fmartingr/CookieClickerCloudSave/tree/master)

---

## info_panel.js — Info Panel

Displays a custom information panel above the in-game store, showing the result of user-defined formulas that update every second.

### Features

- Always-visible panel above the store with live formula results
- Built-in base formulas (defined in the script)
- Add and remove custom formulas directly from the in-game **Options** menu, no script editing needed
- Formulas are saved in `localStorage` and persist across sessions
- Show/hide the panel from the Options menu

### Adding a formula

1. Open **Options** in-game and scroll to the **Info Panel** section.
2. Click **+ Ajouter une formule**.
3. Enter a name, then an expression using any of these variables:

| Variable | Description |
|---|---|
| `G` | The full `Game` object |
| `cps` | Current CPS with all active multipliers (golden cookie buffs, etc.) |
| `baseCps` | CPS without temporary buffs (permanent upgrades only) |

**Expression examples:**

```js
baseCps * 1800 * 7 / 0.15   // cookies needed before casting a 30min spell under x7
G.cookies * 0.15             // 15% of current cookie bank
Math.pow(cps, 2)             // CPS squared
cps - baseCps                // bonus from active buffs
G.prestige * 1000            // prestige scaled
```

### Base formulas

Base formulas are defined at the top of the script and are always displayed. They cannot be removed from the Options menu — edit the script directly to change them.
