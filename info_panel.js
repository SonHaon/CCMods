// ==UserScript==
// @name         Cookie Clicker Info Panel
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Affiche un panneau d'informations personnalisées au-dessus du store
// @author       SonHaon
// @match        https://orteil.dashnet.org/cookieclicker/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================
    //  FORMULES -- ajouter / modifier ici
    //  Chaque entree : { label: "...", fn: (G, cps, baseCps) => valeur }
    //
    //  G       = objet Game complet
    //  cps     = CPS avec tous les multiplicateurs actifs (buffs golden cookie, etc.)
    //  baseCps = CPS sans les buffs temporaires (permanent uniquement)
    // =========================================================
    const FORMULAS = [
        // Minimum a garder pour utiliser le max de spells de 30min pendant un cookie x7
        // utilise baseCps car le x7 n'est pas encore actif au moment du calcul
        {
            label: "Minimum pour les spells",
            fn: (G, cps, baseCps) => baseCps * 1800 * 7 / 0.15
        },
        // Gain du cookie dore normal
        {
            label: "Gain cookie dore",
            fn: (G, cps, baseCps) => Math.min(baseCps * 900 + 13, G.cookies * 0.15 + 13)
        }
        // Ajouter de nouvelles formules ici :
        // { label: "Mon label", fn: (G, cps, baseCps) => cps * 2 },
    ];
    // =========================================================

    const REFRESH_MS = 1000;
    const PANEL_ID   = 'ccInfoPanel';

    function fmt(n) {
        try { return Beautify(n, 1); } catch(_) { return Number(n).toLocaleString(); }
    }

    function buildPanel() {
        const existing = document.getElementById(PANEL_ID);
        if (existing) return;

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

        const rows = grid.querySelectorAll('.cc-info-row');
        if (rows.length !== FORMULAS.length) {
            grid.innerHTML = '';
            FORMULAS.forEach((formula, i) => {
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
                const result = FORMULAS[i].fn(Game, cps, baseCps);
                el.textContent = fmt(result);
            } catch(e) {
                el.textContent = 'erreur';
                el.title = e.message;
            }
        });
    }

    function waitForGame() {
        if (typeof Game === 'undefined' || !Game.ready) {
            setTimeout(waitForGame, 500);
            return;
        }
        buildPanel();
        setInterval(refreshPanel, REFRESH_MS);
    }

    waitForGame();

})();
