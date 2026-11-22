// Ejecutar con:  node --test
// Reglas de la sección 4 de la especificación de UX (Kurba).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../js/cercania.js');

const todos = (n, v) => new Array(n).fill(v);

test('mismas respuestas que el partido: 100 %', () => {
  const u = [1, 3, 5, 2, 4];
  assert.equal(C.afinidad(u, todos(5, 1), u), 100);
});

test('extremos opuestos en todos los temas: 0 %', () => {
  assert.equal(C.afinidad([1, 5, 1, 5, 1], todos(5, 1), [5, 1, 5, 1, 5]), 0);
});

test('cada paso de distancia resta lo mismo', () => {
  // 1 paso en 1 de 5 temas: 1 − 1/20 = 95
  assert.equal(C.afinidad([2, 3, 3, 3, 3], todos(5, 1), [3, 3, 3, 3, 3]), 95);
  assert.equal(C.afinidad([1, 3, 3, 3, 3], todos(5, 1), [3, 3, 3, 3, 3]), 90);
});

test(`con menos de ${C.MIN_TEMAS} temas con peso no hay porcentaje`, () => {
  assert.equal(C.MIN_TEMAS, 5);
  assert.equal(C.afinidad([3, 3, 3, 3, null], todos(5, 1), todos(5, 3)), null);   // 4 contestados
  assert.equal(C.afinidad([3, 3, 3, 3, 3], [1, 1, 1, 1, 0], todos(5, 3)), null);   // 5 contestados, 4 con peso
  assert.equal(C.afinidad([3, 3, 3, 3, 3], [1, 1, 1, 1, null], todos(5, 3)), null); // importancia sin indicar
  assert.equal(C.afinidad([3, 3, 3, 3, 3], todos(5, 1), todos(5, 3)), 100);
});

test('«Ninguna» importancia (peso 0) y «No lo tengo claro» no cuentan', () => {
  const s = [3, 3, 3, 3, 3, 1, 5];
  // los dos últimos temas estarían a 2 pasos, pero no cuentan
  assert.equal(C.afinidad([3, 3, 3, 3, 3, 3, null], [1, 1, 1, 1, 1, 0, 2], s), 100);
});

test('la importancia pondera la distancia: Alta ×2, Media ×1, Ninguna ×0', () => {
  assert.deepEqual(C.PESOS, { alta: 2, media: 1, ninguna: 0 });
  const s = [5, 3, 3, 3, 3];
  const u = [1, 3, 3, 3, 3];                                   // 4 pasos en el primer tema
  assert.equal(C.afinidad(u, [1, 1, 1, 1, 1], s), 80);         // 1 − 4/20
  assert.equal(C.afinidad(u, [2, 1, 1, 1, 1], s), 67);         // 1 − 8/24
  assert.equal(C.afinidad(u, [1, 2, 2, 2, 2], s), 89);         // 1 − 4/36
});

const P = (id, s) => ({ id, s });

test(`grupo de los más cercanos: a ${C.UMBRAL_GRUPO} puntos o menos del primero`, () => {
  assert.equal(C.UMBRAL_GRUPO, 8);
  const R = [92, 84, 83, 70].map((a, i) => ({ p: { id: 'p' + i }, a }));
  assert.deepEqual(C.grupo(R).map(r => r.a), [92, 84]);
  assert.deepEqual(C.grupo([{ p: {}, a: null }]), []);
});

test('el orden dentro de un empate lo da el barajado de la sesión, no el de los datos', () => {
  const partidos = [P('a', todos(5, 3)), P('b', todos(5, 3)), P('c', todos(5, 1))];
  const u = todos(5, 3), w = todos(5, 1);
  assert.deepEqual(C.clasificar(partidos, u, w, [1, 0, 2]).map(r => r.p.id), ['b', 'a', 'c']);
  assert.deepEqual(C.clasificar(partidos, u, w, [0, 1, 2]).map(r => r.p.id), ['a', 'b', 'c']);
  const R = C.clasificar(partidos, u, w, [2, 1, 0]);
  assert.equal(C.empateEnCabeza(R), true);
  assert.equal(C.empatado(R, R[0]), true);
  assert.equal(C.empatado(R, R[2]), false);
});

test('los partidos sin dato van al final y no entran en el grupo', () => {
  const R = C.clasificar([P('a', todos(5, 3))], [3, 3, null, null, null], todos(5, 1), [0]);
  assert.equal(R[0].a, null);
  assert.deepEqual(C.grupo(R), []);
  assert.equal(C.empatado(R, R[0]), false);
});

test('con los datos reales: coincidencia total e invariantes', () => {
  const dir = path.join(__dirname, '..', 'data');
  const temas = JSON.parse(fs.readFileSync(path.join(dir, 'temas.json'), 'utf8')).map(t => t.id);
  const filas = fs.readFileSync(path.join(dir, 'codificacion.csv'), 'utf8').trim().split(/\r?\n/).slice(1).map(l => l.split(','));
  const pos = {};
  for (const [p, t, nivel] of filas) (pos[p] = pos[p] || {})[t] = Number(nivel);
  const partidos = Object.entries(pos).map(([id, m]) => P(id, temas.map(t => m[t])));
  assert.equal(partidos.length, 7);

  // Quien responde lo mismo que un partido obtiene 100 % con ese partido.
  for (const p of partidos) assert.equal(C.afinidad(p.s, todos(temas.length, 1), p.s), 100);

  // Con respuestas al azar: porcentaje entre 0 y 100, y la composición de los grupos
  // no depende del barajado (dos sesiones con las mismas respuestas: mismo grupo).
  let s = 42; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const baraja = () => { const a = partidos.map((_, i) => i); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  for (let i = 0; i < 500; i++) {
    const u = temas.map(() => (rnd() < 0.1 ? null : 1 + Math.floor(rnd() * 5)));
    const w = temas.map(() => [0, 1, 2][Math.floor(rnd() * 3)]);
    const R1 = C.clasificar(partidos, u, w, baraja()), R2 = C.clasificar(partidos, u, w, baraja());
    for (const r of R1) if (r.a !== null) assert.ok(r.a >= 0 && r.a <= 100);
    assert.deepEqual(C.grupo(R1).map(r => r.p.id).sort(), C.grupo(R2).map(r => r.p.id).sort());
    assert.deepEqual(R1.map(r => r.a), R2.map(r => r.a));
  }
});
