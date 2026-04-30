// ==UserScript==
// @name         Cookie Clicker Cloud Save
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Sauvegarde auto compatible avec les URLs Firebase Europe-West1
// @author       SonHaon
// @match        https://orteil.dashnet.org/cookieclicker/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const sanitizeName = (name) => name.replace(/[.#$[\]]/g, '_').trim();

    let DB_URL  = localStorage.getItem('CCCloud_DB_URL')  || "";
    let DB_NAME = localStorage.getItem('CCCloud_DB_NAME') || "";
    let DB_PASS = (localStorage.getItem('CCCloud_DB_PASS') || "").trim();

    const _rawSave = localStorage.getItem('CCCloud_SAVE_INTERVAL');
    let SAVE_INTERVAL = _rawSave !== null ? parseInt(_rawSave) : 60;
    let LB_INTERVAL   = parseInt(localStorage.getItem('CCCloud_LB_INTERVAL') || '0');
    let SHOW_LB       = localStorage.getItem('CCCloud_SHOW_LB') !== 'false';

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
                                <a class="option" id="setDbUrlBtn" style="color:#f93;">Configurer l'URL Firebase</a>
                                <label>${DB_URL ? 'Erreur de connexion' : 'Non configuré'}</label>
                            </div>
                        `;
                        div.querySelector('#setDbUrlBtn').onclick = () => {
                            const url = prompt("URL Firebase Realtime Database :", DB_URL);
                            if (url && url.trim() !== DB_URL) {
                                localStorage.setItem('CCCloud_DB_URL', url.trim());
                                location.reload();
                            }
                        };
                    } else {
                        const saveLabel = SAVE_INTERVAL > 0 ? SAVE_INTERVAL + 's' : 'désactivé';
                        const lbLabel   = LB_INTERVAL   > 0 ? LB_INTERVAL   + 's' : 'désactivé';
                        div.innerHTML = `
                            <div class="title">Cloud Save</div>
                            <div class="listing">
                                <a class="option" id="cloudSaveBtn" style="color:#66f;font-weight:bold;">Force Cloud Sync</a>
                                <label>Profil : <b>${DB_NAME}</b></label>
                            </div>
                            <div class="listing">
                                <a class="option" id="showPassBtn">Voir le mot de passe</a>
                            </div>
                            <div class="listing">
                                <a class="option" id="changePassBtn">Changer le mot de passe</a>
                            </div>
                            <div class="listing">
                                <a class="option" id="changeProfileBtn">Changer de profil</a>
                            </div>
                            <div class="listing">
                                <a class="option" id="changeDbUrlBtn">Changer l'URL Firebase</a>
                            </div>
                            <div class="listing">
                                <a class="option" id="setSaveIntervalBtn">Save auto : ${saveLabel}</a>
                            </div>
                            <div class="listing">
                                <a class="option" id="setLbIntervalBtn">Refresh LB : ${lbLabel}</a>
                            </div>
                            <div class="listing">
                                <a class="option" id="toggleLbBtn">Leaderboard : ${SHOW_LB ? 'affiché' : 'caché'}</a>
                            </div>
                        `;

                        div.querySelector('#cloudSaveBtn').onclick = () => {
                            this.save();
                            const btn = div.querySelector('#cloudSaveBtn');
                            btn.textContent = 'Synced!';
                            setTimeout(() => { btn.textContent = 'Force Cloud Sync'; }, 2000);
                        };
                        div.querySelector('#showPassBtn').onclick = () => {
                            alert(DB_PASS ? `Mot de passe du profil « ${DB_NAME} » :\n\n${DB_PASS}` : "Aucun mot de passe stocké localement.");
                        };
                        div.querySelector('#changePassBtn').onclick = async () => {
                            const current = prompt("Mot de passe actuel :");
                            if (!current) return;
                            const snapshot = await this._get(this._ref);
                            const data = snapshot.val();
                            if (data?.game) {
                                try {
                                    const test = CryptoJS.AES.decrypt(data.game, current).toString(CryptoJS.enc.Utf8);
                                    if (!test || test.length < 100) { alert("Mot de passe actuel incorrect."); return; }
                                } catch (_) { alert("Mot de passe actuel incorrect."); return; }
                            }
                            let newPass = "";
                            while (!newPass) { newPass = prompt("Nouveau mot de passe :") || ""; }
                            if (newPass !== prompt("Confirmez le nouveau mot de passe :")) { alert("Les mots de passe ne correspondent pas."); return; }
                            DB_PASS = newPass;
                            await this._storePass(DB_PASS);
                            await this.save();
                            alert("Mot de passe changé et sauvegarde re-chiffrée !");
                        };
                        div.querySelector('#changeProfileBtn').onclick = () => {
                            const raw = prompt("Nouveau nom de profil :", DB_NAME);
                            if (!raw) return;
                            const newName = sanitizeName(raw) || DB_NAME;
                            if (newName === DB_NAME) return;
                            if (newName !== raw) alert(`Nom ajusté (caractères invalides retirés) : ${newName}`);
                            localStorage.setItem('CCCloud_DB_NAME', newName);
                            localStorage.removeItem('CCCloud_DB_PASS');
                            location.reload();
                        };
                        div.querySelector('#changeDbUrlBtn').onclick = () => {
                            const url = prompt("URL Firebase Realtime Database :", DB_URL);
                            if (url && url.trim() !== DB_URL) {
                                localStorage.setItem('CCCloud_DB_URL', url.trim());
                                localStorage.removeItem('CCCloud_DB_PASS');
                                location.reload();
                            }
                        };
                        div.querySelector('#setSaveIntervalBtn').onclick = () => {
                            const input = prompt("Intervalle de sauvegarde automatique en secondes (0 = désactivé) :", SAVE_INTERVAL);
                            if (input === null) return;
                            const val = Math.max(0, parseInt(input) || 0);
                            SAVE_INTERVAL = val;
                            localStorage.setItem('CCCloud_SAVE_INTERVAL', val);
                            this._startSaveInterval(val);
                            div.querySelector('#setSaveIntervalBtn').textContent = `Save auto : ${val > 0 ? val + 's' : 'désactivé'}`;
                        };
                        div.querySelector('#setLbIntervalBtn').onclick = () => {
                            const input = prompt("Intervalle de refresh automatique du leaderboard en secondes (0 = désactivé) :", LB_INTERVAL);
                            if (input === null) return;
                            const val = Math.max(0, parseInt(input) || 0);
                            LB_INTERVAL = val;
                            localStorage.setItem('CCCloud_LB_INTERVAL', val);
                            this._startLbInterval(val);
                            div.querySelector('#setLbIntervalBtn').textContent = `Refresh LB : ${val > 0 ? val + 's' : 'désactivé'}`;
                        };
                        div.querySelector('#toggleLbBtn').onclick = () => {
                            SHOW_LB = !SHOW_LB;
                            localStorage.setItem('CCCloud_SHOW_LB', SHOW_LB);
                            const lbEl = document.getElementById('cccloud-leaderboard');
                            if (lbEl) lbEl.style.display = SHOW_LB ? '' : 'none';
                            div.querySelector('#toggleLbBtn').textContent = `Leaderboard : ${SHOW_LB ? 'affiché' : 'caché'}`;
                        };
                    }

                    menu.insertBefore(div, menu.firstChild);
                }
            };

            if (!DB_URL) {
                console.log("CCCloud: URL Firebase non configurée. Allez dans Options > Cloud Save.");
                return;
            }

            const loadCrypto = () => new Promise(resolve => {
                if (window.CryptoJS) return resolve();
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
                s.onload = resolve;
                document.head.appendChild(s);
            });

            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js');
            const { getDatabase, ref, get, update } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js');
            await loadCrypto();

            try {
                const app = initializeApp({ databaseURL: DB_URL });
                this._db = getDatabase(app);
                this._get = get;

                if (!DB_NAME) {
                    const raw = prompt("Bienvenue ! Choisissez un nom de profil :") || "default";
                    DB_NAME = sanitizeName(raw) || "default";
                    if (DB_NAME !== raw) alert(`Nom ajusté (caractères invalides retirés) : ${DB_NAME}`);
                    localStorage.setItem('CCCloud_DB_NAME', DB_NAME);
                }
                this._ref    = ref(this._db, DB_NAME);
                this._lbRef  = ref(this._db, 'leaderboard/' + DB_NAME);
                this._lbRoot = ref(this._db, 'leaderboard');

                this._storePass = async (pass) => {
                    localStorage.setItem('CCCloud_DB_PASS', pass);
                    await update(this._ref, { password: pass });
                };

                const askPassword = (attempts = 0) => {
                    const errorLine = attempts > 0 ? `Mot de passe incorrect (tentative ${attempts}).\n\n` : '';
                    return prompt(`${errorLine}Profil « ${DB_NAME} » — Mot de passe :`);
                };

                this.save = async () => {
                    if (!this._authenticated) {
                        console.warn("Sauvegarde bloquée : Profil non déverrouillé.");
                        return;
                    }
                    const rawSave = Game.WriteSave(1);
                    if (!rawSave || rawSave.length < 50) {
                        console.warn("CCCloud: Save invalide ignorée.", rawSave);
                        return;
                    }
                    const encrypted = CryptoJS.AES.encrypt(rawSave, DB_PASS).toString();
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
                    };
                    try {
                        await update(this._ref, { game: encrypted, time: Date.now() });
                        await update(this._lbRef, lbStats);
                        Game.Notify('Cloud Sync', 'Sauvegarde envoyée sur le cloud', '', 1);
                    } catch (e) { console.error(e); }
                };

                this.load = async () => {
                    const snapshot = await get(this._ref);
                    const data = snapshot.val();

                    if (!data) {
                        while (!DB_PASS) {
                            DB_PASS = prompt(`Profil « ${DB_NAME} » — Choisissez un mot de passe :`) || "";
                        }
                        await this._storePass(DB_PASS);
                        this._authenticated = true;
                        return;
                    }

                    if (data.game && (data.game.includes("|") || data.game.includes("%21END%21"))) {
                        Game.LoadSave(data.game);
                        while (!DB_PASS) {
                            DB_PASS = prompt(`Profil « ${DB_NAME} » — Créez un mot de passe pour chiffrer la sauvegarde :`) || "";
                        }
                        await this._storePass(DB_PASS);
                        this._authenticated = true;
                        Game.Notify('Cloud Sync', 'Ancienne sauvegarde récupérée. Elle sera chiffrée au prochain save.', [16, 5]);
                        return;
                    }

                    if (!data.game) {
                        if (!DB_PASS) {
                            DB_PASS = askPassword() || "";
                            if (!DB_PASS) { this._authenticated = false; return; }
                            await this._storePass(DB_PASS);
                        }
                        this._authenticated = true;
                        return;
                    }

                    if (DB_PASS) {
                        try {
                            const bytes = CryptoJS.AES.decrypt(data.game, DB_PASS);
                            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                            if (decrypted && decrypted.length > 100) {
                                Game.LoadSave(decrypted);
                                this._authenticated = true;
                                Game.Notify('Cloud Sync', 'Accès accordé au profil ' + DB_NAME, [16, 5], 5);
                                return;
                            }
                        } catch (_) {}
                        DB_PASS = '';
                        localStorage.removeItem('CCCloud_DB_PASS');
                    }

                    let attempts = 0;
                    while (true) {
                        DB_PASS = (askPassword(attempts) || "").trim();
                        if (!DB_PASS) { this._authenticated = false; break; }
                        try {
                            const bytes = CryptoJS.AES.decrypt(data.game, DB_PASS);
                            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                            if (decrypted && decrypted.length > 100) {
                                Game.LoadSave(decrypted);
                                await this._storePass(DB_PASS);
                                this._authenticated = true;
                                Game.Notify('Cloud Sync', 'Accès accordé au profil ' + DB_NAME, [16, 5], 5);
                                break;
                            }
                        } catch (_) {}
                        attempts++;
                        DB_PASS = '';
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
                        const entries = Object.entries(all)
                            .sort(([a], [b]) => a.localeCompare(b));
                        if (!entries.length) {
                            rows.innerHTML = '<div style="padding:2px 0;opacity:0.6;">Aucun joueur trouvé.</div>';
                        } else {
                            rows.innerHTML = entries.map(([name, d]) => {
                                const you    = name === DB_NAME ? ' <span style="color:#66f">(vous)</span>' : '';
                                const online = (now - (d.time || 0)) < 90000
                                    ? ' <span style="color:#4f4;font-size:110%;" title="En ligne">●</span>'
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
                        rows.innerHTML = '<div style="opacity:0.6;">Erreur lors du chargement.</div>';
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
                    <div class="title" style="font-size:90%;padding:4px 0;">Leaderboard <a id="refreshLbBtn" class="option" style="font-size:80%;font-weight:normal;cursor:pointer;">↻ Actualiser</a></div>
                    <div id="cccloud-lb-rows" style="font-size:80%;"></div>
                `;
                lb.querySelector('#refreshLbBtn').onclick = async () => {
                    const btn = lb.querySelector('#refreshLbBtn');
                    btn.textContent = 'Chargement...';
                    await this._refreshLb();
                    btn.textContent = '↻ Actualiser';
                };
                const storeTitle = document.getElementById('storeTitle');
                if (storeTitle) storeTitle.parentNode.insertBefore(lb, storeTitle);

                this._startLbInterval(LB_INTERVAL);

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
