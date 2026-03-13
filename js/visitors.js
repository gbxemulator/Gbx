/**
 * ============================================================
 *  GBX v1 — Compteur de visiteurs en temps réel
 * ============================================================
 *  Utilise Supabase (plan Free = gratuit, pas de 2FA).
 *
 *  SETUP (5 minutes) :
 *  1. Va sur https://supabase.com → "Start your project" → compte GitHub/email
 *  2. "New project" → donne un nom, choisis une région EU, crée un mot de passe DB
 *  3. Une fois le projet prêt, va dans Settings > API
 *  4. Copie "Project URL" et "anon public key" ci-dessous
 *  5. Va dans Table Editor > New Table :
 *       - Nom : visitors
 *       - Colonnes : id (text, primary key), ts (int8)
 *       - Désactive "Row Level Security (RLS)"
 *  6. Va dans Database > Replication > supabase_realtime > Tables :
 *       active la table "visitors"
 * ============================================================
 */

const GBX_VISITORS_CONFIG = {
    supabaseUrl:  "https://rchghwpxazjakmjloymm.supabase.co",
    supabaseKey:  "sb_publishable_5WaSGIXTFg1atLdxvKDVTw_TJ3viZjd",

    heartbeatInterval: 30_000,   // 30s — fréquence de mise à jour du timestamp
    sessionTimeout:    90_000,   // 90s — délai avant qu'une session soit considérée morte
};

// ─────────────────────────────────────────────────────────────
const GBXVisitors = (() => {

    // Identifiant unique par onglet
    const SESSION_KEY = "gbx_session_id";
    function getSessionId() {
        let id = sessionStorage.getItem(SESSION_KEY);
        if (!id) {
            id = "s" + Math.random().toString(36).slice(2, 10) + Date.now();
            sessionStorage.setItem(SESSION_KEY, id);
        }
        return id;
    }

    function isConfigured() {
        return GBX_VISITORS_CONFIG.supabaseUrl &&
               !GBX_VISITORS_CONFIG.supabaseUrl.startsWith("REMPLACE");
    }

    // ── REST helpers ─────────────────────────────────────────
    function headers() {
        return {
            "Content-Type":  "application/json",
            "apikey":        GBX_VISITORS_CONFIG.supabaseKey,
            "Authorization": "Bearer " + GBX_VISITORS_CONFIG.supabaseKey,
        };
    }

    async function upsertSession(id) {
        await fetch(`${GBX_VISITORS_CONFIG.supabaseUrl}/rest/v1/visitors`, {
            method:  "POST",
            headers: { ...headers(), "Prefer": "resolution=merge-duplicates" },
            body:    JSON.stringify({ id, ts: Date.now() }),
        });
    }

    async function deleteSession(id) {
        await fetch(`${GBX_VISITORS_CONFIG.supabaseUrl}/rest/v1/visitors?id=eq.${id}`, {
            method:  "DELETE",
            headers: headers(),
        });
    }

    async function fetchCount() {
        const cutoff = Date.now() - GBX_VISITORS_CONFIG.sessionTimeout;
        const res = await fetch(
            `${GBX_VISITORS_CONFIG.supabaseUrl}/rest/v1/visitors?ts=gte.${cutoff}&select=id`,
            { headers: { ...headers(), "Prefer": "count=exact", "Range-Unit": "items", "Range": "0-0" } }
        );
        const range = res.headers.get("Content-Range") || "";
        const match = range.match(/\/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
    }

    // ── Realtime via Supabase WebSocket ──────────────────────
    function startRealtime(onUpdate) {
        const wsUrl = GBX_VISITORS_CONFIG.supabaseUrl
            .replace("https://", "wss://")
            .replace("http://",  "ws://")
            + "/realtime/v1/websocket?apikey=" + GBX_VISITORS_CONFIG.supabaseKey
            + "&vsn=1.0.0";

        let ws, pingTimer;

        function connect() {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                ws.send(JSON.stringify({
                    topic:   "realtime:public:visitors",
                    event:   "phx_join",
                    payload: { config: { broadcast: { ack: false }, presence: { key: "" } } },
                    ref:     "1",
                }));
                pingTimer = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: "hb" }));
                    }
                }, 25_000);
            };

            ws.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    if (msg.topic === "realtime:public:visitors" &&
                        ["INSERT","UPDATE","DELETE"].includes(msg.payload?.data?.type)) {
                        onUpdate();
                    }
                } catch (_) {}
            };

            ws.onclose = () => {
                clearInterval(pingTimer);
                setTimeout(connect, 3_000);
            };

            ws.onerror = () => ws.close();
        }

        connect();
    }

    // ─────────────────────────────────────────────────────────
    let sessionId      = null;
    let heartbeatTimer = null;
    let countEl        = null;

    function updateDisplay(count) {
        if (!countEl) return;
        countEl.textContent = count;
        const pluralEl = document.getElementById("visitor-plural");
        if (pluralEl) pluralEl.textContent = (typeof count === "number" && count > 1) ? "s" : "";
        countEl.classList.remove("pulse");
        void countEl.offsetWidth;
        countEl.classList.add("pulse");
    }

    async function refresh() {
        try {
            const n = await fetchCount();
            updateDisplay(n);
        } catch (_) {}
    }

    async function cleanup() {
        if (!isConfigured() || !sessionId) return;
        try { await deleteSession(sessionId); } catch (_) {}
    }

    async function init(el) {
        countEl = el;

        if (!isConfigured()) {
            console.info(
                "%c[GBXVisitors]%c Configure Supabase dans visitors.js pour activer le compteur.",
                "color:#FF8C00;font-weight:bold", "color:inherit"
            );
            updateDisplay("—");
            return;
        }

        sessionId = getSessionId();

        // Nettoyage des vieilles sessions au démarrage
        try {
            const oldCutoff = Date.now() - GBX_VISITORS_CONFIG.sessionTimeout;
            await fetch(
                `${GBX_VISITORS_CONFIG.supabaseUrl}/rest/v1/visitors?ts=lt.${oldCutoff}`,
                { method: "DELETE", headers: headers() }
            );
        } catch (_) {}

        // Enregistre cette session
        await upsertSession(sessionId);

        // Premier affichage
        await refresh();

        // Écoute les changements en temps réel
        startRealtime(refresh);

        // Heartbeat régulier
        heartbeatTimer = setInterval(() => upsertSession(sessionId), GBX_VISITORS_CONFIG.heartbeatInterval);

        // Pause/reprise si l'onglet passe en arrière-plan
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                clearInterval(heartbeatTimer);
            } else {
                upsertSession(sessionId);
                heartbeatTimer = setInterval(() => upsertSession(sessionId), GBX_VISITORS_CONFIG.heartbeatInterval);
            }
        });

        // Nettoyage à la fermeture de l'onglet
        window.addEventListener("pagehide", cleanup);
        window.addEventListener("beforeunload", cleanup);
    }

    return { init };

})();

// ── Auto-init ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const el = document.getElementById("visitor-count");
    if (el) GBXVisitors.init(el);
});
