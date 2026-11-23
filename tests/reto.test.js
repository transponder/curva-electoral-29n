// Ejecutar con:  node --test
// «Compárate conmigo»: el enlace con las respuestas (js/reto.js) y su recuento anónimo (js/analitica.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = require('../js/reto.js');
const C = require('../js/cercania.js');

const temas = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'temas.json'), 'utf8')).map(t => t.id);

test('ida y vuelta con los temas reales, incluido «No lo tengo claro»', () => {
  assert.equal(temas.length, 11);
  const ans = [1, 2, 3, 4, 5, null, 3, 2, null, 5, 1];
  const w = [2, 1, 0, 2, 1, null, 1, 2, 0, 0, 1];
  const cod = R.codificar(temas, ans, w);
  assert.match(cod, /^[0-9a-z]{3}\.\d{22}$/);
  assert.equal(cod.split('.')[1], '1221304251' + '00' + '3122' + '00' + '5011');
  // «No lo tengo claro» vuelve sin importancia, aunque la persona la hubiera marcado.
  assert.deepEqual(R.decodificar(temas, cod), { ans, w: [2, 1, 0, 2, 1, null, 1, 2, null, 0, 1] });
});

test('sin importancia indicada cuenta como «Media», como en el cálculo del test', () => {
  const cod = R.codificar(['a', 'b'], [4, 2], [null, 0]);
  assert.equal(cod.split('.')[1], '4120');
  assert.deepEqual(R.decodificar(['a', 'b'], cod), { ans: [4, 2], w: [1, 0] });
});

test('el enlace no lleva nada más que posiciones e importancias', () => {
  const cod = R.codificar(temas, new Array(11).fill(3), new Array(11).fill(1));
  assert.equal(cod.length, 3 + 1 + 22);
});

test('si cambian los temas o su orden, el enlace deja de valer', () => {
  const cod = R.codificar(temas, new Array(11).fill(3), new Array(11).fill(1));
  const otro = temas.slice(); [otro[0], otro[1]] = [otro[1], otro[0]];
  assert.notEqual(R.firma(otro), R.firma(temas));
  assert.equal(R.decodificar(otro, cod), null);
  assert.equal(R.decodificar(temas.slice(0, 10), cod), null);
});

test('códigos manipulados o incompletos se rechazan', () => {
  const f = R.firma(temas), ok = '31'.repeat(11);
  assert.ok(R.decodificar(temas, f + '.' + ok));
  for (const malo of [
    '', null, undefined, ok, f + ok, f + '.' + ok.slice(2), f + '.' + ok + '31',
    f + '.' + '60' + ok.slice(2),     // posición 6
    f + '.' + '13' + ok.slice(2),     // importancia 3
    f + '.' + '03' + ok.slice(2),     // sin posición pero con importancia
    f + '.' + 'a1' + ok.slice(2),     // letras
    f + '.' + '00'.repeat(11),        // ninguna respuesta
    'zzz.' + ok, f.toUpperCase() + '.' + ok + ' ', f + '.' + ok + '<script>',
  ]) assert.equal(R.decodificar(temas, malo), null, String(malo));
});

test('codificar se niega con datos que no cuadran', () => {
  assert.throws(() => R.codificar(temas, [1, 2], [1, 1]));
  assert.throws(() => R.codificar(['a'], [6], [1]));
  assert.throws(() => R.codificar(['a'], [2.5], [1]));
  assert.throws(() => R.codificar(['a'], [2], [3]));
});

test('coincidencias: solo los temas que responden las dos personas', () => {
  const r = R.coincidencias([1, 3, 5, null, 2, 4], [1, 4, 2, 3, null, 4]);
  assert.equal(r.comparables, 4);
  assert.deepEqual([r.iguales, r.cerca, r.lejos], [2, 1, 1]);
  assert.deepEqual(r.temas, [{ i: 0, d: 0 }, { i: 1, d: 1 }, { i: 2, d: 3 }, { i: 5, d: 0 }]);
  assert.equal(R.coincidencias([null, null], [1, 2]).comparables, 0);
});

test('el mínimo para ofrecer el enlace es el mismo que para dar porcentajes', () => {
  assert.equal(R.MIN_RESPUESTAS, C.MIN_TEMAS);
  assert.equal(R.respondidas([1, null, 3, null]), 2);
});

test('GoatCounter cuenta la pantalla del reto sin el código', () => {
  global.window = {};
  require('../js/analitica.js');
  const A = global.window.Analitica;
  const cod = R.codificar(temas, new Array(11).fill(2), new Array(11).fill(2));
  assert.equal(A.normalizar('#/reto/' + cod), '/reto');
  assert.equal(A.normalizar('#/reto'), '/reto');
  assert.equal(A.normalizar('#/partido/pnv'), '/fichas');
  assert.equal(A.normalizar('#/curvas'), '/curvas');
});
