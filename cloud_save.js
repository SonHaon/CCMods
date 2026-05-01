// ==UserScript==
// @name         Cookie Clicker Cloud Save
// @namespace    https://github.com/SonHaon/CCMods/
// @version      1.7
// @description  Sauvegarde auto compatible avec les URLs Firebase Europe-West1
// @author       SonHaon
// @match        https://orteil.dashnet.org/cookieclicker/
// @grant        none
// @updateURL    https://raw.githubusercontent.com/SonHaon/CCMods/refs/heads/main/cloud_save.js
// @downloadURL  https://raw.githubusercontent.com/SonHaon/CCMods/refs/heads/main/cloud_save.js
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================
    //  TRADUCTIONS
    // =========================================================
    const I18N = {
        EN: {
            configure_url:       'Configure Firebase URL',
            connection_error:    'Connection error',
            not_configured:      'Not configured',
            force_sync:          'Force Cloud Sync',
            synced:              'Synced!',
            profile:             'Profile: ',
            show_pass:           'Show password',
            change_pass:         'Change password',
            change_profile:      'Change profile',
            change_url:          'Change Firebase URL',
            autosave:            'Auto-save: ',
            lb_refresh_label:    'LB refresh: ',
            lb_shown:            'Leaderboard: shown',
            lb_hidden:           'Leaderboard: hidden',
            disabled:            'disabled',

            prompt_url:          'Firebase Realtime Database URL:',
            prompt_name:         'Welcome! Choose a profile name:',
            prompt_pass_new:     'Profile «{name}» — Choose a password:',
            prompt_pass:         'Profile «{name}» — Password:',
            prompt_pass_retry:   'Wrong password (attempt {n}).\n\nProfile «{name}» — Password:',
            prompt_pass_current: 'Current password:',
            prompt_pass_new2:    'New password:',
            prompt_pass_confirm: 'Confirm new password:',
            prompt_interval_save:'Auto-save interval in seconds (0 = disabled):',
            prompt_interval_lb:  'Leaderboard auto-refresh interval in seconds (0 = disabled):',
            prompt_new_profile:  'New profile name:',

            alert_pass_show:     'Password for profile «{name}»:\n\n{pass}',
            alert_pass_none:     'No password stored locally.',
            alert_pass_wrong:    'Current password is incorrect.',
            alert_pass_mismatch: 'Passwords do not match.',
            alert_pass_changed:  'Password changed!',
            alert_firebase_err:  'Firebase error: current password rejected.\n\n',
            alert_name_adjusted: 'Name adjusted (invalid characters removed): ',

            notify_synced:       'Save sent to the cloud',
            notify_access:       'Access granted to profile ',

            lb_title:            'Leaderboard',
            lb_refresh_btn:      '↻ Refresh',
            lb_loading:          'Loading...',
            lb_empty:            'No players found.',
            lb_error:            'Error while loading.',
            lb_you:              '(you)',
            lb_online_title:     'Online',

            time_min:            '{n} min ago',
            time_hour:           '{n}h ago',
            conflict_msg:        'Save from another device detected.\n\n☁ Cloud: {cloud_ago} — {cloud_cookies} cookies earned\n💻 Local: {local_ago} — {local_cookies} cookies earned\n\nOK = load CLOUD save\nCancel = keep LOCAL save',
            notify_kept_local:   'Local save kept.',
            notify_loaded_cloud: 'Cloud save loaded.',
        },
        FR: {
            configure_url:       "Configurer l'URL Firebase",
            connection_error:    'Erreur de connexion',
            not_configured:      'Non configuré',
            force_sync:          'Force Cloud Sync',
            synced:              'Synced!',
            profile:             'Profil : ',
            show_pass:           'Voir le mot de passe',
            change_pass:         'Changer le mot de passe',
            change_profile:      'Changer de profil',
            change_url:          "Changer l'URL Firebase",
            autosave:            'Save auto : ',
            lb_refresh_label:    'Refresh LB : ',
            lb_shown:            'Leaderboard : affiché',
            lb_hidden:           'Leaderboard : caché',
            disabled:            'désactivé',

            prompt_url:          'URL Firebase Realtime Database :',
            prompt_name:         'Bienvenue ! Choisissez un nom de profil :',
            prompt_pass_new:     'Profil « {name} » — Choisissez un mot de passe :',
            prompt_pass:         'Profil « {name} » — Mot de passe :',
            prompt_pass_retry:   'Mot de passe incorrect (tentative {n}).\n\nProfil « {name} » — Mot de passe :',
            prompt_pass_current: 'Mot de passe actuel :',
            prompt_pass_new2:    'Nouveau mot de passe :',
            prompt_pass_confirm: 'Confirmez le nouveau mot de passe :',
            prompt_interval_save:'Intervalle de sauvegarde automatique en secondes (0 = désactivé) :',
            prompt_interval_lb:  'Intervalle de refresh automatique du leaderboard en secondes (0 = désactivé) :',
            prompt_new_profile:  'Nouveau nom de profil :',

            alert_pass_show:     'Mot de passe du profil « {name} » :\n\n{pass}',
            alert_pass_none:     'Aucun mot de passe stocké localement.',
            alert_pass_wrong:    'Mot de passe actuel incorrect.',
            alert_pass_mismatch: 'Les mots de passe ne correspondent pas.',
            alert_pass_changed:  'Mot de passe changé !',
            alert_firebase_err:  'Erreur Firebase : mot de passe actuel refusé.\n\n',
            alert_name_adjusted: 'Nom ajusté (caractères invalides retirés) : ',

            notify_synced:       'Sauvegarde envoyée sur le cloud',
            notify_access:       'Accès accordé au profil ',

            lb_title:            'Leaderboard',
            lb_refresh_btn:      '↻ Actualiser',
            lb_loading:          'Chargement...',
            lb_empty:            'Aucun joueur trouvé.',
            lb_error:            'Erreur lors du chargement.',
            lb_you:              '(vous)',
            lb_online_title:     'En ligne',

            time_min:            'il y a {n} min',
            time_hour:           'il y a {n}h',
            conflict_msg:        'Save d\'un autre appareil détectée.\n\n☁ Cloud : {cloud_ago} — {cloud_cookies} cookies gagnés\n💻 Local : {local_ago} — {local_cookies} cookies gagnés\n\nOK = charger la save CLOUD\nAnnuler = garder la save LOCALE',
            notify_kept_local:   'Save locale conservée.',
            notify_loaded_cloud: 'Save cloud chargée.',
        },
    };

    const getLang = () => {
        const stored = localStorage.getItem('CookieClickerLang') || 'EN';
        return stored.toUpperCase();
    };

    const t = (key, vars = {}) => {
        let str = (I18N[getLang()] || I18N.EN)[key] || I18N.EN[key] || key;
        for (const [k, v] of Object.entries(vars)) {
            str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        }
        return str;
    };
    // =========================================================

    const sanitizeName = (name) => name.replace(/[.#$[\]]/g, '_').trim();

    let DB_URL  = localStorage.getItem('CCCloud_DB_URL')  || "";
    let DB_NAME = localStorage.getItem('CCCloud_DB_NAME') || "";
    let DB_PASS = (localStorage.getItem('CCCloud_DB_PASS') || "").trim();

    // Identifiant unique de cet appareil — généré une fois, persisté en localStorage
    let DEVICE_ID = localStorage.getItem('CCCloud_DEVICE_ID');
    if (!DEVICE_ID) {
        DEVICE_ID = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
        localStorage.setItem('CCCloud_DEVICE_ID', DEVICE_ID);
    }

    const _rawSave = localStorage.getItem('CCCloud_SAVE_INTERVAL');
    let SAVE_INTERVAL = _rawSave !== null ? parseInt(_rawSave) : 60;
    let LB_INTERVAL   = parseInt(localStorage.getItem('CCCloud_LB_INTERVAL') || '0');
    let SHOW_LB       = localStorage.getItem('CCCloud_SHOW_LB') !== 'false';

    const hashPass = async (pass) => {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pass));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const CCCloud = {

        init: async function() {

            const fmt = (n) => { try { return Beautify(n, 1); } catch(_) { return Number(n).toLocaleString(); } };

            const menuHook = Game.UpdateMenu;
            Game.UpdateMenu = () => {
                menuHook();
                if (Game.onMenu !== 'prefs') return;
                const menu = document.querySelector('#menu .block');
                if (!menu) return;

                if (!document.getElementById('cccloud-section')) {
                    const div = document.createElement('div');
                    div.id = 'cccloud-section';
                    div.className = 'subsection';

                    if (!this._ready) {
                        div.innerHTML = `
                            <div class="title">Cloud Save</div>
                            <div class="listing">
                                <a class="option" id="setDbUrlBtn" style="color:#f93;">${t('configure_url')}</a>
                                <label>${DB_URL ? t('connection_error') : t('not_configured')}</label>
                            </div>
                        `;
                        div.querySelector('#setDbUrlBtn').onclick = () => {
                            const url = prompt(t('prompt_url'), DB_URL);
                            if (url && url.trim() !== DB_URL) {
                                localStorage.setItem('CCCloud_DB_URL', url.trim());
                                location.reload();
                            }
                        };
                    } else {
                        const saveLabel = SAVE_INTERVAL > 0 ? SAVE_INTERVAL + 's' : t('disabled');
                        const lbLabel   = LB_INTERVAL   > 0 ? LB_INTERVAL   + 's' : t('disabled');
                        div.innerHTML = `
                            <div class="title">Cloud Save</div>
                            <div class="listing">
                                <a class="option" id="cloudSaveBtn" style="color:#66f;font-weight:bold;">${t('force_sync')}</a>
                                <label>${t('profile')}<b>${DB_NAME}</b></label>
                            </div>
                            <div class="listing">
                                <a class="option" id="showPassBtn">${t('show_pass')}</a>
                            </div>
                            <div class="listing">
                                <a class="option" id="changePassBtn">${t('change_pass')}</a>
                            </div>
                            <div class="listing">
                                <a class="option" id="changeProfileBtn">${t('change_profile')}</a>
                            </div>
                            <div class="listing">
                                <a class="option" id="changeDbUrlBtn">${t('change_url')}</a>
                            </div>
                            <div class="listing">
                                <a class="option" id="setSaveIntervalBtn">${t('autosave')}${saveLabel}</a>
                            </div>
                            <div class="listing">
                                <a class="option" id="setLbIntervalBtn">${t('lb_refresh_label')}${lbLabel}</a>
                            </div>
                            <div class="listing">
                                <a class="option" id="toggleLbBtn">${SHOW_LB ? t('lb_shown') : t('lb_hidden')}</a>
                            </div>
                        `;

                        div.querySelector('#cloudSaveBtn').onclick = () => {
                            this.save();
                            const btn = div.querySelector('#cloudSaveBtn');
                            btn.textContent = t('synced');
                            setTimeout(() => { btn.textContent = t('force_sync'); }, 2000);
                        };
                        div.querySelector('#showPassBtn').onclick = () => {
                            alert(DB_PASS
                                ? t('alert_pass_show', { name: DB_NAME, pass: DB_PASS })
                                : t('alert_pass_none'));
                        };
                        div.querySelector('#changePassBtn').onclick = async () => {
                            const current = prompt(t('prompt_pass_current'));
                            if (!current) return;
                            const snapshot = await this._get(this._ref);
                            const data = snapshot.val();
                            if (data?.passhash) {
                                const h = await hashPass(current);
                                if (h !== data.passhash) { alert(t('alert_pass_wrong')); return; }
                            }
                            let newPass = "";
                            while (!newPass) { newPass = prompt(t('prompt_pass_new2')) || ""; }
                            if (newPass !== prompt(t('prompt_pass_confirm'))) { alert(t('alert_pass_mismatch')); return; }
                            try {
                                await this._update(this._passRef, { val: newPass, prev: current });
                            } catch(e) {
                                alert(t('alert_firebase_err') + e.message);
                                return;
                            }
                            DB_PASS = newPass;
                            localStorage.setItem('CCCloud_DB_PASS', newPass);
                            await this.save();
                            alert(t('alert_pass_changed'));
                        };
                        div.querySelector('#changeProfileBtn').onclick = () => {
                            const raw = prompt(t('prompt_new_profile'), DB_NAME);
                            if (!raw) return;
                            const newName = sanitizeName(raw) || DB_NAME;
                            if (newName === DB_NAME) return;
                            if (newName !== raw) alert(t('alert_name_adjusted') + newName);
                            localStorage.setItem('CCCloud_DB_NAME', newName);
                            localStorage.removeItem('CCCloud_DB_PASS');
                            location.reload();
                        };
                        div.querySelector('#changeDbUrlBtn').onclick = () => {
                            const url = prompt(t('prompt_url'), DB_URL);
                            if (url && url.trim() !== DB_URL) {
                                localStorage.setItem('CCCloud_DB_URL', url.trim());
                                localStorage.removeItem('CCCloud_DB_PASS');
                                location.reload();
                            }
                        };
                        div.querySelector('#setSaveIntervalBtn').onclick = () => {
                            const input = prompt(t('prompt_interval_save'), SAVE_INTERVAL);
                            if (input === null) return;
                            const val = Math.max(0, parseInt(input) || 0);
                            SAVE_INTERVAL = val;
                            localStorage.setItem('CCCloud_SAVE_INTERVAL', val);
                            this._startSaveInterval(val);
                            div.querySelector('#setSaveIntervalBtn').textContent = t('autosave') + (val > 0 ? val + 's' : t('disabled'));
                        };
                        div.querySelector('#setLbIntervalBtn').onclick = () => {
                            const input = prompt(t('prompt_interval_lb'), LB_INTERVAL);
                            if (input === null) return;
                            const val = Math.max(0, parseInt(input) || 0);
                            LB_INTERVAL = val;
                            localStorage.setItem('CCCloud_LB_INTERVAL', val);
                            this._startLbInterval(val);
                            div.querySelector('#setLbIntervalBtn').textContent = t('lb_refresh_label') + (val > 0 ? val + 's' : t('disabled'));
                        };
                        div.querySelector('#toggleLbBtn').onclick = () => {
                            SHOW_LB = !SHOW_LB;
                            localStorage.setItem('CCCloud_SHOW_LB', SHOW_LB);
                            const lbEl = document.getElementById('cccloud-leaderboard');
                            if (lbEl) lbEl.style.display = SHOW_LB ? '' : 'none';
                            div.querySelector('#toggleLbBtn').textContent = SHOW_LB ? t('lb_shown') : t('lb_hidden');
                        };
                    }

                    menu.insertBefore(div, menu.firstChild);
                }
            };

            if (!DB_URL) {
                console.log("CCCloud: Firebase URL not configured. Go to Options > Cloud Save.");
                return;
            }

            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js');
            const { getDatabase, ref, get, update } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js');

            try {
                const app = initializeApp({ databaseURL: DB_URL });
                this._db     = getDatabase(app);
                this._get    = get;
                this._update = update;

                if (!DB_NAME) {
                    const raw = prompt(t('prompt_name')) || "default";
                    DB_NAME = sanitizeName(raw) || "default";
                    if (DB_NAME !== raw) alert(t('alert_name_adjusted') + DB_NAME);
                    localStorage.setItem('CCCloud_DB_NAME', DB_NAME);
                }

                this._ref     = ref(this._db, 'users/' + DB_NAME);
                this._passRef = ref(this._db, 'passwords/' + DB_NAME);
                this._lbRef   = ref(this._db, 'leaderboard/' + DB_NAME);
                this._lbRoot  = ref(this._db, 'leaderboard');

                this._bootstrapPass = async (pass) => {
                    localStorage.setItem('CCCloud_DB_PASS', pass);
                    await update(this._passRef, { val: pass });
                };

                const askPassword = (attempts = 0) => {
                    const key = attempts > 0 ? 'prompt_pass_retry' : 'prompt_pass';
                    return prompt(t(key, { name: DB_NAME, n: attempts }));
                };

                const authenticateWithHash = async (storedHash) => {
                    if (DB_PASS) {
                        if (await hashPass(DB_PASS) === storedHash) return true;
                        DB_PASS = '';
                        localStorage.removeItem('CCCloud_DB_PASS');
                    }
                    let attempts = 0;
                    while (true) {
                        DB_PASS = (askPassword(attempts) || "").trim();
                        if (!DB_PASS) return false;
                        if (await hashPass(DB_PASS) === storedHash) {
                            localStorage.setItem('CCCloud_DB_PASS', DB_PASS);
                            return true;
                        }
                        attempts++;
                        DB_PASS = '';
                    }
                };

                this.save = async () => {
                    if (!this._authenticated) {
                        console.warn("CCCloud: save blocked, profile not unlocked.");
                        return;
                    }
                    const rawSave = Game.WriteSave(1);
                    if (!rawSave || rawSave.length < 50) {
                        console.warn("CCCloud: invalid save ignored.", rawSave);
                        return;
                    }
                    let cpsMult = 1;
                    for (const b of Object.values(Game.buffs || {})) {
                        if (b.multCpS) cpsMult *= b.multCpS;
                    }
                    const baseCps = Math.round((Game.cookiesPs / cpsMult) * 10) / 10;
                    const lbStats = {
                        cookies:  Math.floor(Game.cookies),
                        cps:      baseCps,
                        prestige: Game.prestige || 0,
                        time:     Date.now(),
                        _token:   DB_PASS,
                    };
                    try {
                        await update(this._ref, {
                            game:          rawSave,
                            time:          Date.now(),
                            passhash:      await hashPass(DB_PASS),
                            _token:        DB_PASS,
                            deviceId:      DEVICE_ID,
                            cookiesEarned: Math.floor(Game.cookiesEarned || 0),
                        });
                        await update(this._lbRef, lbStats);
                        Game.Notify('Cloud Sync', t('notify_synced'), '', 1);
                    } catch (e) { console.error(e); }
                };

                const timeAgo = (ms) => {
                    const mins = Math.round((Date.now() - ms) / 60000);
                    if (mins < 60) return t('time_min', { n: mins });
                    return t('time_hour', { n: Math.round(mins / 60) });
                };

                this.load = async () => {
                    const snapshot = await get(this._ref);
                    const data = snapshot.val();

                    // Nouveau profil
                    if (!data || !data.game) {
                        while (!DB_PASS) {
                            DB_PASS = prompt(t('prompt_pass_new', { name: DB_NAME })) || "";
                        }
                        await this._bootstrapPass(DB_PASS);
                        this._authenticated = true;
                        return;
                    }

                    // Même appareil : on garde le local (production offline préservée)
                    if (data.deviceId === DEVICE_ID) {
                        this._authenticated = await authenticateWithHash(data.passhash);
                        if (this._authenticated) {
                            Game.Notify('Cloud Sync', t('notify_access') + DB_NAME, [16, 5], 5);
                        }
                        return;
                    }

                    // Autre appareil : on demande à l'utilisateur
                    const useCloud = confirm(t('conflict_msg', {
                        cloud_ago:     timeAgo(data.time || 0),
                        cloud_cookies: fmt(data.cookiesEarned || 0),
                        local_ago:     timeAgo(Game.fullDate || 0),
                        local_cookies: fmt(Game.cookiesEarned || 0),
                    }));

                    if (useCloud) Game.LoadSave(data.game);

                    this._authenticated = await authenticateWithHash(data.passhash);
                    if (this._authenticated) {
                        if (useCloud) {
                            await this.save(); // met à jour deviceId sur le cloud immédiatement
                            Game.Notify('Cloud Sync', t('notify_loaded_cloud'), [16, 5], 5);
                        } else {
                            Game.Notify('Cloud Sync', t('notify_kept_local'), [16, 5], 5);
                        }
                    }
                };

                this._startSaveInterval = (secs) => {
                    clearInterval(this._saveTimer);
                    if (secs > 0) this._saveTimer = setInterval(() => this.save(), secs * 1000);
                };

                this._refreshLb = async () => {
                    const rows = document.getElementById('cccloud-lb-rows');
                    if (!rows) return;
                    try {
                        const snap = await this._get(this._lbRoot);
                        const all = snap.val() || {};
                        const now = Date.now();
                        const entries = Object.entries(all).sort(([a], [b]) => a.localeCompare(b));
                        if (!entries.length) {
                            rows.innerHTML = `<div style="padding:2px 0;opacity:0.6;">${t('lb_empty')}</div>`;
                        } else {
                            rows.innerHTML = entries.map(([name, d]) => {
                                const you    = name === DB_NAME ? ` <span style="color:#66f">${t('lb_you')}</span>` : '';
                                const online = (now - (d.time || 0)) < 90000
                                    ? ` <span style="color:#4f4;font-size:110%;" title="${t('lb_online_title')}">●</span>`
                                    : '';
                                return `<div style="padding:2px 0;border-top:1px solid rgba(255,255,255,0.05);">
                                    <b>${name}</b>${you}${online} —
                                    🍪 ${fmt(d.cookies)} |
                                    ⚡ ${fmt(d.cps)}/s |
                                    👑 ${d.prestige}
                                </div>`;
                            }).join('');
                        }
                    } catch (e) {
                        rows.innerHTML = `<div style="opacity:0.6;">${t('lb_error')}</div>`;
                    }
                };

                this._startLbInterval = (secs) => {
                    clearInterval(this._lbTimer);
                    if (secs > 0) this._lbTimer = setInterval(() => this._refreshLb(), secs * 1000);
                };

                this._ready = true;
                this.load();
                Game.Win('Third-party');
                this._startSaveInterval(SAVE_INTERVAL);

                const lb = document.createElement('div');
                lb.id = 'cccloud-leaderboard';
                lb.style.cssText = 'padding:4px 8px;background:rgba(0,0,0,0.5);border-bottom:1px solid rgba(255,255,255,0.1);';
                if (!SHOW_LB) lb.style.display = 'none';
                lb.innerHTML = `
                    <div class="title" style="font-size:90%;padding:4px 0;">${t('lb_title')} <a id="refreshLbBtn" class="option" style="font-size:80%;font-weight:normal;cursor:pointer;">${t('lb_refresh_btn')}</a></div>
                    <div id="cccloud-lb-rows" style="font-size:80%;"></div>
                `;
                lb.querySelector('#refreshLbBtn').onclick = async () => {
                    const btn = lb.querySelector('#refreshLbBtn');
                    btn.textContent = t('lb_loading');
                    await this._refreshLb();
                    btn.textContent = t('lb_refresh_btn');
                };
                const storeTitle = document.getElementById('storeTitle');
                if (storeTitle) storeTitle.parentNode.insertBefore(lb, storeTitle);

                this._startLbInterval(LB_INTERVAL);
                this._refreshLb();

                window.addEventListener('keydown', (e) => {
                    if ((e.ctrlKey || e.metaKey) && e.keyCode === 83) {
                        e.preventDefault();
                        this.save();
                    }
                });

            } catch (e) {
                console.error("CCCloud FATAL:", e);
            }
        }
    };

    const checkGame = setInterval(() => {
        if (typeof Game !== "undefined" && Game.ready) {
            clearInterval(checkGame);
            CCCloud.init();
        }
    }, 2000);
})();
