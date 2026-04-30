// ==UserScript==
// @name         Cookie Clicker Info Panel
// @namespace    https://github.com/SonHaon/CCMods/
// @version      1.6
// @description  Affiche un panneau d'informations personnalisées au-dessus du store
// @author       SonHaon
// @match        https://orteil.dashnet.org/cookieclicker/
// @grant        none
// @updateURL    https://raw.githubusercontent.com/SonHaon/CCMods/refs/heads/main/info_panel.js
// @downloadURL  https://raw.githubusercontent.com/SonHaon/CCMods/refs/heads/main/info_panel.js
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================
    //  FORMULES DE BASE -- toujours affichees, non modifiables depuis les options
    //  Chaque entree : { label: "...", fn: (G, cps, baseCps) => valeur }
    //
    //  G       = objet Game complet
    //  cps     = CPS avec tous les multiplicateurs actifs (buffs golden cookie, etc.)
    //  baseCps = CPS sans les buffs temporaires (permanent uniquement)
    // =========================================================
    const BASE_FORMULAS = [
    ];
    // =========================================================

    const REFRESH_MS      = 1000;
    const PANEL_ID        = 'ccInfoPanel';
    const LS_SHOW_KEY     = 'CCInfoPanel_SHOW';
    const LS_FORMULAS_KEY = 'CCInfoPanel_FORMULAS';

    let SHOW_PANEL = localStorage.getItem(LS_SHOW_KEY) !== 'false';

    // Formules utilisateur : [{label, expr}] stockees en JSON dans localStorage
    function loadUserFormulas() {
        try { return JSON.parse(localStorage.getItem(LS_FORMULAS_KEY) || '[]'); }
        catch(_) { return []; }
    }

    function saveUserFormulas(list) {
        localStorage.setItem(LS_FORMULAS_KEY, JSON.stringify(list));
    }

    // Compile une expression texte en fonction, retourne null si invalide
    function compileExpr(expr) {
        try {
            const fn = new Function('G', 'cps', 'baseCps', '"use strict"; return (' + expr + ');');
            fn({ cookiesPs: 1, cookies: 1 }, 1, 1); // test rapide
            return fn;
        } catch(e) {
            return null;
        }
    }

    // Fusion base + utilisateur en un tableau pret a l'emploi
    function buildAllFormulas() {
        const user = loadUserFormulas().map(({ label, expr }) => {
            const fn = compileExpr(expr);
            return fn ? { label, fn } : { label: label + ' [ERREUR]', fn: () => NaN };
        });
        return [...BASE_FORMULAS, ...user];
    }

    function fmt(n) {
        if (isNaN(n)) return 'erreur';
        try { return Beautify(n, 1); } catch(_) { return Number(n).toLocaleString(); }
    }

    function setPanelVisibility(visible) {
        SHOW_PANEL = visible;
        localStorage.setItem(LS_SHOW_KEY, visible);
        const panel = document.getElementById(PANEL_ID);
        if (panel) panel.style.display = visible ? '' : 'none';
    }

    function buildPanel() {
        if (document.getElementById(PANEL_ID)) return;
        const store = document.getElementById('store');
        if (!store) return;

        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = [
            'width:100%',
            'box-sizing:border-box',
            'background:rgba(0,0,0,0.75)',
            'border-bottom:1px solid rgba(255,255,255,0.1)',
            'padding:6px 8px',
            'font-family:Georgia,serif',
            'font-size:12px',
            'color:#ccc',
        ].join(';');
        if (!SHOW_PANEL) panel.style.display = 'none';

        const title = document.createElement('div');
        title.textContent = 'Infos';
        title.style.cssText = 'font-size:13px;font-weight:bold;color:#fff;margin-bottom:4px;letter-spacing:1px;';
        panel.appendChild(title);

        const grid = document.createElement('div');
        grid.id = PANEL_ID + '_grid';
        grid.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
        panel.appendChild(grid);

        store.parentNode.insertBefore(panel, store);
        refreshPanel();
    }

    function refreshPanel() {
        const grid = document.getElementById(PANEL_ID + '_grid');
        if (!grid || typeof Game === 'undefined') return;

        const cps     = Game.cookiesPs;
        const baseCps = Game.unbuffedCps !== undefined ? Game.unbuffedCps : Game.cookiesPs;
        const formulas = buildAllFormulas();

        const rows = grid.querySelectorAll('.cc-info-row');
        if (rows.length !== formulas.length) {
            grid.innerHTML = '';
            formulas.forEach((formula) => {
                const row = document.createElement('div');
                row.className = 'cc-info-row';
                row.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;';

                const lbl = document.createElement('span');
                lbl.style.cssText = 'color:#aaa;margin-right:8px;';
                lbl.textContent = formula.label;

                const val = document.createElement('span');
                val.style.cssText = 'color:#ffe;font-weight:bold;text-align:right;';
                val.className = 'cc-info-val';

                row.appendChild(lbl);
                row.appendChild(val);
                grid.appendChild(row);
            });
        }

        grid.querySelectorAll('.cc-info-val').forEach((el, i) => {
            try {
                el.textContent = fmt(formulas[i].fn(Game, cps, baseCps));
            } catch(e) {
                el.textContent = 'erreur';
                el.title = e.message;
            }
        });
    }

    function renderOptionsSection() {
        const menu = document.querySelector('#menu .block');
        if (!menu || document.getElementById('ccinfopanel-section')) return;

        const userFormulas = loadUserFormulas();

        const div = document.createElement('div');
        div.id = 'ccinfopanel-section';
        div.className = 'subsection';

        const rebuild = () => {
            const uf = loadUserFormulas();
            const listEl = div.querySelector('#ccInfoUserList');
            listEl.innerHTML = '';

            if (uf.length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'opacity:0.5;font-size:11px;padding:2px 0;';
                empty.textContent = 'Aucune formule ajoutee.';
                listEl.appendChild(empty);
            }

            uf.forEach((f, i) => {
                const row = document.createElement('div');
                row.className = 'listing';
                row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';

                const info = document.createElement('span');
                info.style.cssText = 'font-size:11px;color:#ccc;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
                info.title = f.expr;
                info.textContent = f.label + '  =  ' + f.expr;

                const del = document.createElement('a');
                del.className = 'option';
                del.style.cssText = 'color:#f66;margin-left:8px;cursor:pointer;flex-shrink:0;';
                del.textContent = 'Supprimer';
                del.onclick = () => {
                    const list = loadUserFormulas();
                    list.splice(i, 1);
                    saveUserFormulas(list);
                    rebuild();
                    // force reconstruction des lignes du panneau
                    const grid = document.getElementById(PANEL_ID + '_grid');
                    if (grid) grid.innerHTML = '';
                };

                row.appendChild(info);
                row.appendChild(del);
                listEl.appendChild(row);
            });
        };

        div.innerHTML = `
            <div class="title">Info Panel</div>
            <div class="listing">
                <a class="option" id="ccInfoToggleBtn">Panneau : ${SHOW_PANEL ? 'affiche' : 'cache'}</a>
            </div>
            <div id="ccInfoUserList"></div>
            <div class="listing">
                <a class="option" id="ccInfoAddBtn" style="color:#6f6;">+ Ajouter une formule</a>
            </div>
        `;

        div.querySelector('#ccInfoToggleBtn').onclick = function() {
            setPanelVisibility(!SHOW_PANEL);
            this.textContent = 'Panneau : ' + (SHOW_PANEL ? 'affiche' : 'cache');
        };

        div.querySelector('#ccInfoAddBtn').onclick = () => {
            const label = prompt('Nom de la formule :');
            if (!label || !label.trim()) return;

            const expr = prompt(
                'Expression (variables disponibles : G, cps, baseCps)\n\nExemples :\n  baseCps * 1800\n  G.cookies * 0.15\n  Math.pow(cps, 2)',
                'baseCps * 1800'
            );
            if (!expr || !expr.trim()) return;

            const fn = compileExpr(expr.trim());
            if (!fn) {
                alert('Expression invalide ou erreur de syntaxe. La formule n\'a pas ete ajoutee.');
                return;
            }

            const list = loadUserFormulas();
            list.push({ label: label.trim(), expr: expr.trim() });
            saveUserFormulas(list);
            rebuild();
            const grid = document.getElementById(PANEL_ID + '_grid');
            if (grid) grid.innerHTML = '';
        };

        rebuild();
        menu.insertBefore(div, menu.firstChild);
    }

    function hookOptionsMenu() {
        const _updateMenu = Game.UpdateMenu;
        Game.UpdateMenu = function() {
            _updateMenu();
            if (Game.onMenu !== 'prefs') return;
            renderOptionsSection();
        };
    }

    function init() {
        buildPanel();
        hookOptionsMenu();
        setInterval(refreshPanel, REFRESH_MS);
    }

    function waitForGame() {
        if (typeof Game === 'undefined' || !Game.ready) {
            setTimeout(waitForGame, 500);
            return;
        }
        init();
    }

    waitForGame();

})();
