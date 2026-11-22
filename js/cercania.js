/* Cálculo de cercanía entre las respuestas de una persona y las posiciones de los partidos.
   Módulo puro, sin DOM: lo usan la web (window.Cercania) y los tests (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Cercania = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MAX_PASOS = 4;        // distancia máxima entre dos opciones de un tema (de la 1 a la 5)
  const MIN_RESPUESTAS = 6;   // con menos temas contestados no se muestra ningún porcentaje

  // respuestas: { temaId: 1..5 }   (0 o ausente = tema saltado, no cuenta)
  // pesos:      { temaId: número } (ausente = 1)
  // posiciones: { partidoId: { temaId: 1..5 } }
  // temas:      [temaId, …]
  // Devuelve [{ id, pct, n }]: pct es 100 × (1 − distancia ponderada / distancia máxima), redondeado;
  // null si no hay ningún tema en común. n es el número de temas que han contado.
  function calcular(respuestas, pesos, posiciones, temas) {
    return Object.keys(posiciones).map(id => {
      let num = 0, den = 0, n = 0;
      for (const t of temas) {
        const u = respuestas[t], c = posiciones[id][t];
        if (!u || !c) continue;
        const w = (pesos && pesos[t]) || 1;
        num += w * Math.abs(u - c); den += w * MAX_PASOS; n++;
      }
      return { id, pct: den ? Math.round(100 * (1 - num / den)) : null, n };
    });
  }

  // Ordena de mayor a menor cercanía. Los partidos con el mismo porcentaje comparten puesto
  // (1, 1, 3…) y se marcan como empate. El orden dentro de un empate lo da `desempate`
  // (una lista de ids barajada una vez por test), nunca el orden alfabético.
  function clasificar(resultados, desempate) {
    const orden = id => { const i = (desempate || []).indexOf(id); return i < 0 ? Infinity : i; };
    const val = r => (r.pct == null ? -1 : r.pct);
    return resultados
      .map(r => ({
        ...r,
        puesto: 1 + resultados.filter(o => val(o) > val(r)).length,
        empate: r.pct != null && resultados.some(o => o !== r && o.pct === r.pct),
      }))
      .sort((a, b) => val(b) - val(a) || orden(a.id) - orden(b.id));
  }

  // Ids que se muestran por defecto: los k primeros y todos los empatados con el último de ellos.
  function seleccionInicial(clasificados, k) {
    const conDato = clasificados.filter(r => r.pct != null);
    if (conDato.length <= k) return conDato.map(r => r.id);
    const corte = conDato[k - 1].puesto;
    return conDato.filter(r => r.puesto <= corte).map(r => r.id);
  }

  return { calcular, clasificar, seleccionInicial, MAX_PASOS, MIN_RESPUESTAS };
});
