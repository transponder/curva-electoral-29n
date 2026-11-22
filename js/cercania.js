/* Cálculo de cercanía entre las respuestas de una persona y las posiciones de los partidos.
   Reglas de la especificación de UX (Kurba, sección 4). Módulo puro, sin DOM:
   lo usan la web (window.Cercania) y los tests (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Cercania = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAX_PASOS = 4;      // distancia máxima entre dos opciones de un tema (de la 1 a la 5)
  var MIN_TEMAS = 5;      // con menos temas con peso no se muestra ningún porcentaje
  var UMBRAL_GRUPO = 8;   // «los más cercanos»: a 8 puntos o menos del primero
  var PESOS = { alta: 2, media: 1, ninguna: 0 };

  // respuestas[i]: 1..5, o null si no contestó («No lo tengo claro»)
  // pesos[i]: 2, 1, 0, o null si no lo indicó
  function peso(respuestas, pesos, i) {
    return respuestas[i] == null || pesos[i] == null ? 0 : pesos[i];
  }

  function temasContados(respuestas, pesos) {
    var n = 0;
    for (var i = 0; i < respuestas.length; i++) if (peso(respuestas, pesos, i)) n++;
    return n;
  }

  // Afinidad = 100 · (1 − Σ w·|u − s| / (4 · Σ w)), solo con los temas respondidos y con peso > 0.
  // null si hay menos de MIN_TEMAS temas con peso.
  function afinidad(respuestas, pesos, posiciones) {
    if (temasContados(respuestas, pesos) < MIN_TEMAS) return null;
    var d = 0, W = 0;
    for (var i = 0; i < respuestas.length; i++) {
      var w = peso(respuestas, pesos, i);
      if (w) { d += w * Math.abs(respuestas[i] - posiciones[i]); W += w; }
    }
    return W ? Math.round(100 * (1 - d / (MAX_PASOS * W))) : null;
  }

  // Ordena los partidos de mayor a menor afinidad. `orden` es una permutación de índices
  // barajada una vez por sesión: dentro de un empate manda ese orden, nunca el de los datos.
  function clasificar(partidos, respuestas, pesos, orden) {
    var ord = orden && orden.length === partidos.length ? orden : partidos.map(function (p, i) { return i; });
    var val = function (r) { return r.a === null ? -1 : r.a; };
    return ord
      .map(function (i) { return { p: partidos[i], a: afinidad(respuestas, pesos, partidos[i].s) }; })
      .sort(function (x, y) { return val(y) - val(x); });   // sort estable: conserva `orden` en los empates
  }

  // Grupo «los más cercanos»: los partidos a UMBRAL_GRUPO puntos o menos del primero.
  function grupo(clasificados) {
    if (!clasificados.length || clasificados[0].a === null) return [];
    var top = clasificados[0].a;
    return clasificados.filter(function (r) { return r.a !== null && top - r.a <= UMBRAL_GRUPO; });
  }

  function empatado(clasificados, r) {
    return r.a !== null && clasificados.some(function (o) { return o !== r && o.a === r.a; });
  }

  function empateEnCabeza(clasificados) {
    return clasificados.length > 1 && clasificados[0].a !== null && clasificados[1].a === clasificados[0].a;
  }

  return {
    afinidad: afinidad, clasificar: clasificar, grupo: grupo, empatado: empatado, empateEnCabeza: empateEnCabeza,
    temasContados: temasContados, peso: peso,
    MAX_PASOS: MAX_PASOS, MIN_TEMAS: MIN_TEMAS, UMBRAL_GRUPO: UMBRAL_GRUPO, PESOS: PESOS,
  };
});
