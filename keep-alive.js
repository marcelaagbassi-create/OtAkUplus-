// keep-alive.js — OtAkU+ Anti-Sleep pour Render Free
// Ce fichier ping le serveur toutes les 14 minutes pour eviter le spin down

const SELF_URL = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || 'http://localhost:' + (process.env.PORT || 3000);

function keepAlive() {
    const url = SELF_URL + '/health';
    
    // Utiliser http/https natif Node.js (pas de dependance externe)
    const protocol = url.startsWith('https') ? require('https') : require('http');
    
    protocol.get(url, function(res) {
        console.log('[OtAkU+ Keep-Alive] Ping OK — Status:', res.statusCode, '— ', new Date().toLocaleTimeString());
    }).on('error', function(err) {
        console.warn('[OtAkU+ Keep-Alive] Ping failed:', err.message);
    });
}

// Demarrer le ping toutes les 14 minutes (840000ms)
// Render free dors apres 15 min d'inactivite
const INTERVAL = 14 * 60 * 1000;

function startKeepAlive() {
    // Premier ping apres 30 secondes
    setTimeout(function() {
        keepAlive();
        // Puis toutes les 14 minutes
        setInterval(keepAlive, INTERVAL);
        console.log('[OtAkU+ Keep-Alive] Service demarre — ping toutes les 14 min');
    }, 30000);
}

module.exports = { startKeepAlive };
