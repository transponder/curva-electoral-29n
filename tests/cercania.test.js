// Ejecutar con:  node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../js/cercania.js');

const T = ['a', 'b', 'c', 'd'];
const pct = (res, id) => res.find(r => r.id === id).pct;

test('mismas respuestas que el partido: 100 %', () => {
  const res = C.calcular({ a: 1, b: 3, c: 5, d: 2 }, {}, { x: { a: 1, b: 3, c: 5, d: 2 } }, T);
  assert.deepEqual(res, [{ id: 'x', pct: 100, n: 4 }]);
});

test('extremos opuestos en todos los temas: 0 %', () => {
  assert.equal(pct(C.calcular({ a: 1, b: 5, c: 1, d: 5 }, {}, { x: { a: 5, b: 1, c: 5, d: 1 } }, T), 'x'), 0);
});

test('cada paso de distancia resta lo mismo', () => {
  // 1 paso en 1 de 4 temas: 1 − 1/16 = 93,75 → 94
  assert.equal(pct(C.calcular({ a: 2, b: 3, c: 3, d: 3 }, {}, { x: { a: 3, b: 3, c: 3, d: 3 } }, T), 'x'), 94);
});

test('los temas saltados (0 o ausentes) no cuentan', () => {
  const res = C.calcular({ a: 3, b: 0 }, {}, { x: { a: 3, b: 5, c: 5, d: 5 } }, T);
  assert.deepEqual(res, [{ id: 'x', pct: 100, n: 1 }]);
});

test('sin ninguna respuesta el porcentaje es null, no 0 ni 100', () => {
  assert.equal(pct(C.calcular({}, {}, { x: { a: 3, b: 3, c: 3, d: 3 } }, T), 'x'), null);
});

test('un tema sin posición del partido no cuenta para ese partido', () => {
  const res = C.calcular({ a: 3, b: 1 }, {}, { x: { a: 3 } }, T);
  assert.deepEqual(res, [{ id: 'x', pct: 100, n: 1 }]);
});

test('la importancia pondera la distancia', () => {
  const pos = { x: { a: 5, b: 3 } };
  const u = { a: 1, b: 3 };                       // lejos en a, igual en b
  assert.equal(pct(C.calcular(u, { a: 1, b: 1 }, pos, T), 'x'), 50);
  assert.equal(pct(C.calcular(u, { a: 2, b: 0.5 }, pos, T), 'x'), 20);   // a importa mucho
  assert.equal(pct(C.calcular(u, { a: 0.5, b: 2 }, pos, T), 'x'), 80);   // a importa poco
});

test('los empates comparten puesto y no se ordenan por el alfabeto', () => {
  const pos = { alfa: { a: 3 }, beta: { a: 3 }, gamma: { a: 1 } };
  const res = C.clasificar(C.calcular({ a: 3 }, {}, pos, T), ['beta', 'gamma', 'alfa']);
  assert.deepEqual(res.map(r => [r.id, r.puesto, r.empate]), [['beta', 1, true], ['alfa', 1, true], ['gamma', 3, false]]);
});

test('la selección inicial incluye a todos los empatados en el corte', () => {
  const r = (id, p) => ({ id, pct: p, n: 1 });
  const res = C.clasificar([r('a', 90), r('b', 80), r('c', 70), r('d', 70), r('e', 60)], ['d', 'c', 'a', 'b', 'e']);
  assert.deepEqual(C.seleccionInicial(res, 3).sort(), ['a', 'b', 'c', 'd']);
  assert.deepEqual(C.seleccionInicial(res, 1), ['a']);
});

test('los partidos sin dato van al final y no entran en la selección', () => {
  const res = C.clasificar([{ id: 'a', pct: null, n: 0 }, { id: 'b', pct: 10, n: 1 }], ['a', 'b']);
  assert.deepEqual(res.map(r => r.id), ['b', 'a']);
  assert.equal(res[1].empate, false);
  assert.deepEqual(C.seleccionInicial(res, 3), ['b']);
});

test('con los datos reales: coincidencia total e invariantes', () => {
  const dir = path.join(__dirname, '..', 'data');
  const temas = JSON.parse(fs.readFileSync(path.join(dir, 'temas.json'), 'utf8')).map(t => t.id);
  const filas = fs.readFileSync(path.join(dir, 'codificacion.csv'), 'utf8').trim().split(/\r?\n/).slice(1).map(l => l.split(','));
  const pos = {};
  for (const [p, t, nivel] of filas) (pos[p] = pos[p] || {})[t] = Number(nivel);
  assert.equal(Object.keys(pos).length, 7);

  // Quien responde lo mismo que un partido obtiene 100 % con ese partido.
  for (const id of Object.keys(pos)) assert.equal(pct(C.calcular(pos[id], {}, pos, temas), id), 100);

  // Invariantes con respuestas al azar: porcentaje entre 0 y 100, y simetría de la distancia.
  let s = 42; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < 500; i++) {
    const u = Object.fromEntries(temas.map(t => [t, 1 + Math.floor(rnd() * 5)]));
    for (const r of C.calcular(u, {}, pos, temas)) {
      assert.ok(r.pct >= 0 && r.pct <= 100);
      const d = temas.reduce((acc, t) => acc + Math.abs(u[t] - pos[r.id][t]), 0);
      assert.equal(r.pct, Math.round(100 * (1 - d / (4 * temas.length))));
    }
  }
});
