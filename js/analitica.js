/* Recuento anónimo de visitas con GoatCounter, sin cookies ni identificadores y sin cargar
   ningún script de terceros: solo una petición por vista o evento a la dirección de
   data/meta.json («goatcounter»). País o región, sistema y navegador los deduce GoatCounter
   de la propia petición; no guarda la dirección IP.
   Nunca se envían respuestas, importancias ni partidos: solo rutas normalizadas y nombres
   de eventos de uso (empezar o terminar el test, pestañas, guías…). */
(function () {
  'use strict';
  var url = null, primera = true, enviados = {};

  function configurar(endpoint) {
    if (!/^https:\/\/[a-z0-9-]+\.goatcounter\.com\/count$/.test(endpoint || '')) return;
    if (location.protocol !== 'https:' || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname)) return;
    // Quien pide no ser rastreado no se cuenta.
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
    url = endpoint;
  }

  function enviar(params) {
    if (!url) return;
    params.s = [screen.width, screen.height, window.devicePixelRatio || 1].join(',');
    params.rnd = Math.random().toString(36).slice(2, 8);
    if (primera) { params.r = document.referrer || ''; primera = false; }
    var q = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
    var u = url + '?' + q;
    try { if (navigator.sendBeacon && navigator.sendBeacon(u)) return; } catch (e) { /* sigue con la imagen */ }
    new Image().src = u;
  }

  // Ruta de la web → ruta que se cuenta. Las fichas y comparaciones se cuentan sin el partido:
  // la ficha que se abre al terminar el test es la del partido más cercano.
  function normalizar(hash) {
    var p = (hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
    if (!p.length) return '/';
    if (p[0] === 'partido') return '/fichas';
    if (p[0] === 'comparar') return '/comparar';
    return '/' + p.join('/');
  }

  window.Analitica = {
    configurar: configurar,
    normalizar: normalizar,
    vista: function (ruta) { enviar({ p: ruta, t: ruta }); },
    evento: function (nombre, unaVez) {
      if (unaVez) { if (enviados[nombre]) return; enviados[nombre] = true; }
      enviar({ p: nombre, t: nombre, e: 'true' });
    },
    activa: function () { return !!url; },
  };
})();
