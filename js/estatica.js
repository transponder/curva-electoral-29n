/* Páginas estáticas (/metodologia/, /partido/<id>/…): recuento anónimo de la visita con GoatCounter,
   igual que en la aplicación (js/analitica.js). Las páginas de partido se cuentan todas juntas,
   como promete la página de privacidad. */
(function () {
  'use strict';
  var s = document.currentScript, A = window.Analitica;
  if (!s || !A) return;
  A.configurar(s.getAttribute('data-gc'));
  var ruta = location.pathname.replace(/^\/partido\/[^/]+\/?$/, '/partido/');
  A.vista(ruta);
})();
