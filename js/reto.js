/* «Compárate conmigo»: codifica las respuestas de una persona en un enlace para que otra
   compare su curva con ella. Módulo puro, sin DOM: lo usan la web (window.Reto) y los tests.
   El código va en el fragmento de la dirección (#/reto/<código>), que el navegador no envía
   a ningún servidor, y solo se crea si la persona pulsa el botón y acepta el aviso.

   Formato: «<firma>.<2 dígitos por tema>», en el orden de data/temas.json.
     - firma: 3 caracteres que salen de los id de los temas. Si cambian los temas o su orden,
       los enlaces antiguos dejan de valer en lugar de comparar temas que no son.
     - por tema: <posición 1-5><importancia 0-2>, o «00» si respondió «No lo tengo claro». */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Reto = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MIN_RESPUESTAS = 5;   // con menos temas respondidos no se ofrece el enlace

  // Hash FNV-1a de 32 bits de los id de los temas, en base 36 y con 3 caracteres.
  function firma(attrs) {
    var s = attrs.join(','), h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('000' + (h % 46656).toString(36)).slice(-3);
  }

  function respondidas(ans) {
    var n = 0;
    for (var i = 0; i < ans.length; i++) if (ans[i] != null) n++;
    return n;
  }

  function codificar(attrs, ans, w) {
    if (ans.length !== attrs.length) throw new Error('reto: hay ' + ans.length + ' respuestas y ' + attrs.length + ' temas');
    var d = '';
    for (var i = 0; i < attrs.length; i++) {
      var a = ans[i];
      if (a == null) { d += '00'; continue; }
      if (!(a >= 1 && a <= 5 && a % 1 === 0)) throw new Error('reto: posición no válida en el tema ' + i);
      var p = w[i] == null ? 1 : w[i];   // sin importancia indicada cuenta como «Media», como en el test
      if (!(p === 0 || p === 1 || p === 2)) throw new Error('reto: importancia no válida en el tema ' + i);
      d += String(a) + String(p);
    }
    return firma(attrs) + '.' + d;
  }

  // Devuelve { ans, w } o null si el código no es de estos temas o está mal formado.
  function decodificar(attrs, codigo) {
    var m = /^([0-9a-z]{3})\.([0-9]+)$/.exec(String(codigo || ''));
    if (!m || m[1] !== firma(attrs) || m[2].length !== 2 * attrs.length) return null;
    var ans = [], w = [];
    for (var i = 0; i < attrs.length; i++) {
      var a = +m[2][2 * i], p = +m[2][2 * i + 1];
      if (a === 0 && p === 0) { ans.push(null); w.push(null); continue; }
      if (a < 1 || a > 5 || p > 2) return null;
      ans.push(a); w.push(p);
    }
    return respondidas(ans) ? { ans: ans, w: w } : null;
  }

  // Tema a tema, dónde coinciden dos personas: solo los temas que han respondido las dos.
  function coincidencias(ansA, ansB) {
    var temas = [], r = { iguales: 0, cerca: 0, lejos: 0 };
    for (var i = 0; i < ansA.length; i++) {
      if (ansA[i] == null || ansB[i] == null) continue;
      var d = Math.abs(ansA[i] - ansB[i]);
      temas.push({ i: i, d: d });
      if (d === 0) r.iguales++; else if (d === 1) r.cerca++; else r.lejos++;
    }
    r.temas = temas;
    r.comparables = temas.length;
    return r;
  }

  return {
    codificar: codificar, decodificar: decodificar, coincidencias: coincidencias,
    firma: firma, respondidas: respondidas, MIN_RESPUESTAS: MIN_RESPUESTAS,
  };
});
