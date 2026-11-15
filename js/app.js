/* Tu curva de valor electoral · Euskadi 29-N
   Web estática sin dependencias. Los datos viven en /data y se cargan al abrir.
   Las respuestas del test solo existen en la memoria de esta pestaña: no se envían ni se guardan. */
(function () {
  'use strict';

  // ---------- Utilidades DOM ----------
  const SVGNS = 'http://www.w3.org/2000/svg';
  function add(el, children) {
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    }
    return el;
  }
  function setAttrs(el, attrs) {
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.setAttribute('class', v);
      else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) { if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv; } }
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    return el;
  }
  function h(tag, attrs, ...children) { return add(setAttrs(document.createElement(tag), attrs), children); }
  function s(tag, attrs, ...children) { return add(setAttrs(document.createElementNS(SVGNS, tag), attrs), children); }

  // ---------- Carga de datos ----------
  function parseCSV(text) {
    const rows = []; let row = [], field = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') q = false;
        else field += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    const [head, ...body] = rows;
    return body.map(r => Object.fromEntries(head.map((k, i) => [k.trim(), (r[i] || '').trim()])));
  }
  async function getJSON(p) { const r = await fetch(p, { cache: 'no-cache' }); if (!r.ok) throw new Error(p); return r.json(); }
  async function getCSV(p) { const r = await fetch(p, { cache: 'no-cache' }); if (!r.ok) throw new Error(p); return parseCSV(await r.text()); }

  const S = {
    temas: [], partidos: [], meta: {}, cod: new Map(), propuestas: [],
    visible: new Set(), temaSel: null,
    quiz: null,          // { step, order: {temaId:[idx…]}, answers: {temaId: nivel|0}, weights: {temaId: w} }
    resultsReady: false,
  };
  const key = (p, t) => p + '|' + t;
  const celda = (p, t) => S.cod.get(key(p, t));
  const partido = id => S.partidos.find(p => p.id === id);

  async function load() {
    const [temas, partidos, meta, cod, prop] = await Promise.all([
      getJSON('data/temas.json'), getJSON('data/partidos.json'), getJSON('data/meta.json'),
      getCSV('data/codificacion.csv'), getCSV('data/propuestas.csv').catch(() => []),
    ]);
    S.temas = temas;
    S.partidos = partidos.codificados.slice().sort((a, b) => a.siglas.localeCompare(b.siglas, 'es', { sensitivity: 'base' }));
    S.sinCurva = partidos.sin_curva || [];
    S.meta = meta;
    for (const r of cod) {
      const nivel = parseInt(r.nivel, 10);
      if (nivel >= 1 && nivel <= 5) S.cod.set(key(r.partido, r.tema), { ...r, nivel });
    }
    S.propuestas = prop;
    S.visible = new Set(S.partidos.map(p => p.id));
    S.temaSel = S.temas[0].id;
  }

  // ---------- Gráfico de curvas ----------
  // series: [{id, label, color, user?, valores: {temaId: {nivel, estado}}}]
  function curveChart(opts) {
    const box = h('div', { class: 'chart' });
    const draw = () => {
      const W = Math.max(280, box.clientWidth || 800);
      box.replaceChildren(drawSVG(W, opts));
    };
    let lastW = 0;
    const ro = new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width);
      if (w && Math.abs(w - lastW) > 4) { lastW = w; draw(); }
    });
    ro.observe(box);
    box._redraw = draw;
    requestAnimationFrame(draw);
    return box;
  }

  function drawSVG(W, { temas, series, selected, onSelect, highlight, compact }) {
    const n = temas.length;
    const vertical = W < 600;
    let H, pos, levelPos, M;
    if (!vertical) {
      const stepGuess = (W - 36) / n;
      M = { l: 26, r: 10, t: 14, b: compact ? 14 : (stepGuess < 84 ? 70 : 34) };
      H = compact ? 200 : (stepGuess < 84 ? 380 : 344);
      const iw = W - M.l - M.r, ih = H - M.t - M.b, step = iw / n;
      pos = i => M.l + step * (i + 0.5);
      levelPos = lv => M.t + (5 - lv) / 4 * ih;
      M.step = step;
    } else {
      M = { l: 104, r: 14, t: 24, b: 8 };
      const rowH = compact ? 30 : 40;
      H = M.t + n * rowH + M.b;
      const iw = W - M.l - M.r;
      pos = i => M.t + rowH * (i + 0.5);
      levelPos = lv => M.l + (lv - 1) / 4 * iw;
      M.step = rowH;
    }
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: onSelect ? 'group' : 'img', 'aria-label': 'Gráfico de curvas: ' + (series.map(se => se.label).join(', ') || 'ningún partido seleccionado') + '. Cada punto es la opción, de 1 a 5, que mejor describe su propuesta en cada tema.' + (onSelect ? ' Las mismas posiciones están en la tabla que sigue al gráfico.' : '') });

    // Bandas de tema (clicables)
    temas.forEach((t, i) => {
      const c = pos(i), half = M.step / 2;
      const attrs = vertical
        ? { x: 0, y: c - half, width: W, height: M.step }
        : { x: c - half, y: 0, width: M.step, height: H };
      const band = s('rect', { ...attrs, class: 'band' + (t.id === selected ? ' sel' : '') });
      if (onSelect) {
        setAttrs(band, { tabindex: 0, role: 'button', 'aria-label': 'Ver detalle: ' + t.nombre, onclick: () => onSelect(t.id),
          onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(t.id); } } });
      } else band.style.cursor = 'default';
      svg.appendChild(band);
    });

    // Rejilla de niveles
    for (let lv = 1; lv <= 5; lv++) {
      const p = levelPos(lv);
      if (!vertical) {
        svg.appendChild(s('line', { x1: M.l, x2: W - M.r, y1: p, y2: p, class: 'grid-line' }));
        svg.appendChild(s('text', { x: M.l - 10, y: p + 4, 'text-anchor': 'end', class: 'axis-label' }, String(lv)));
      } else {
        svg.appendChild(s('line', { y1: M.t - 6, y2: H - M.b, x1: p, x2: p, class: 'grid-line' }));
        svg.appendChild(s('text', { x: p, y: 12, 'text-anchor': 'middle', class: 'axis-label' }, String(lv)));
      }
    }

    // Etiquetas de tema
    if (!compact || vertical) {
      temas.forEach((t, i) => {
        const c = pos(i);
        const cls = 'tema-label' + (t.id === selected ? ' sel' : '');
        if (!vertical) {
          const rotate = M.step < 84;
          const y = H - M.b + 18;
          const tx = s('text', { x: c, y, 'text-anchor': rotate ? 'end' : 'middle', class: cls, transform: rotate ? `rotate(-38 ${c} ${y})` : null }, t.corto);
          svg.appendChild(tx);
        } else {
          svg.appendChild(s('text', { x: M.l - 10, y: c + 4, 'text-anchor': 'end', class: cls }, t.corto));
        }
      });
    }

    // Separación de puntos superpuestos (misma opción en el mismo tema)
    const groups = new Map();
    series.forEach(se => temas.forEach(t => {
      const v = se.valores[t.id]; if (!v) return;
      const k = t.id + ':' + v.nivel; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(se.id);
    }));
    const spread = Math.min(6, M.step * 0.5 / Math.max(1, series.length));
    const offset = (tId, lv, sid) => {
      const g = groups.get(tId + ':' + lv) || [sid]; const k = g.indexOf(sid);
      return (k - (g.length - 1) / 2) * spread;
    };
    const pt = (i, t, se) => {
      const v = se.valores[t.id]; if (!v) return null;
      const a = pos(i) + offset(t.id, v.nivel, se.id), b = levelPos(v.nivel);
      return vertical ? [b, a] : [a, b];
    };

    const order = series.slice().sort((a, b) => (a.user ? 1 : 0) - (b.user ? 1 : 0) || (a.id === highlight ? 1 : 0) - (b.id === highlight ? 1 : 0));
    for (const se of order) {
      const g = s('g', { class: 'serie' + (se.user ? ' user' : '') + (highlight && highlight !== se.id && !se.user ? ' dim' : '') });
      let d = '', pen = false;
      temas.forEach((t, i) => {
        const p = pt(i, t, se);
        if (!p) { pen = false; return; }
        d += (pen ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); pen = true;
      });
      g.appendChild(s('path', { d, stroke: se.color }));
      temas.forEach((t, i) => {
        const p = pt(i, t, se); if (!p) return;
        const v = se.valores[t.id];
        const hollow = v.estado === 'estimado';
        const title = s('title', null, `${se.label} · ${t.nombre}: ${t.opciones[v.nivel - 1]}${hollow ? ' (estimado)' : ''}`);
        if (se.user) {
          g.appendChild(s('rect', { x: p[0] - 6, y: p[1] - 6, width: 12, height: 12, rx: 2, fill: se.color, stroke: 'var(--bg)' }, title));
        } else {
          g.appendChild(s('circle', { cx: p[0], cy: p[1], r: 4.6, fill: hollow ? 'var(--panel)' : se.color, stroke: hollow ? se.color : 'var(--panel)' }, title));
        }
      });
      svg.appendChild(g);
    }
    return svg;
  }

  function seriePartido(p) {
    const valores = {};
    for (const t of S.temas) { const c = celda(p.id, t.id); if (c) valores[t.id] = { nivel: c.nivel, estado: c.estado }; }
    return { id: p.id, label: p.siglas, color: p.color, valores };
  }
  function serieUsuario() {
    if (!S.quiz) return null;
    const valores = {};
    for (const t of S.temas) { const a = S.quiz.answers[t.id]; if (a) valores[t.id] = { nivel: a, estado: 'usuario' }; }
    return { id: 'tu', label: 'Tú', color: 'var(--ink)', user: true, valores };
  }

  const legendNote = () => h('div', { class: 'chart-legend-note' },
    h('span', null, h('i', { class: 'lg-dot' }), 'Con evidencia (provisional)'),
    h('span', null, h('i', { class: 'lg-dot hollow' }), 'Estimado'),
    h('span', null, '1 y 5 son los extremos de cada tema: no significan izquierda o derecha, ni mejor o peor.'));

  // Alternativa en tabla al gráfico: mismas posiciones, legibles sin ver el gráfico.
  // La celda muestra el número y, para lectores de pantalla, el texto de la opción.
  function tablaPosiciones(partidos) {
    return h('details', { class: 'tabla-alt' },
      h('summary', null, 'Ver las posiciones como tabla'),
      h('div', { class: 'table-scroll', tabindex: 0, role: 'region', 'aria-label': 'Posiciones de cada partido por tema' },
        h('table', { class: 'data-table' },
          h('caption', null, 'Opción asignada a cada partido en cada tema, de 1 a 5. El 1 y el 5 son los extremos de cada tema, no izquierda o derecha. «est.» indica una posición estimada.'),
          h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Tema'), partidos.map(p => h('th', { scope: 'col' }, p.siglas)))),
          h('tbody', null, S.temas.map(t => h('tr', null,
            h('th', { scope: 'row', style: { textTransform: 'none', fontSize: '14px', color: 'var(--ink)', letterSpacing: 0 } }, t.nombre),
            partidos.map(p => { const c = celda(p.id, t.id);
              return h('td', { class: 'c' }, c ? [String(c.nivel), c.estado === 'estimado' ? ' est.' : null, h('span', { class: 'sr-only' }, ': ' + t.opciones[c.nivel - 1])] : '—'); })))))));
  }

  function estadoBadge(estado) {
    const map = { provisional: 'Provisional', estimado: 'Estimado', validado: 'Validado' };
    return h('span', { class: 'badge ' + (estado || '') }, map[estado] || estado || '—');
  }

  function partyChip(p, { pressed, onclick, small } = {}) {
    return h(onclick ? 'button' : 'span', {
      class: 'chip' + (onclick ? '' : ' chip-static'), type: onclick ? 'button' : null,
      'aria-pressed': onclick ? String(!!pressed) : null, onclick, style: small ? { fontSize: '13px' } : null,
    }, h('i', { class: 'dot', style: { background: p.color } }), p.siglas);
  }

  // ---------- Detalle de un tema ----------
  function temaDetalle(temaId, partidosIds, userNivel) {
    const t = S.temas.find(x => x.id === temaId);
    const list = h('ol', { class: 'scale' });
    t.opciones.forEach((op, i) => {
      const lv = i + 1;
      const aqui = partidosIds.map(partido).filter(p => { const c = celda(p.id, t.id); return c && c.nivel === lv; });
      list.appendChild(h('li', { class: userNivel === lv ? 'user' : null },
        h('span', { class: 'n' }, String(lv)),
        h('div', null,
          h('div', { class: 'txt' }, op),
          aqui.length || userNivel === lv
            ? h('div', { class: 'who' },
                userNivel === lv ? h('span', { class: 'chip chip-static', style: { fontSize: '13px', borderColor: 'var(--ink)' } }, '★ Tú') : null,
                aqui.map(p => {
                  const c = celda(p.id, t.id);
                  const chip = partyChip(p, { small: true });
                  if (c.estado === 'estimado') chip.appendChild(h('span', { class: 'muted' }, ' (estimado)'));
                  return h('a', { href: '#/partido/' + p.id, style: { textDecoration: 'none' } }, chip);
                }))
            : h('div', { class: 'empty' }, 'Ningún partido en esta opción'))));
    });
    const notas = partidosIds.map(partido).map(p => ({ p, c: celda(p.id, t.id) })).filter(x => x.c && (x.c.nota || x.c.cita || x.c.fuente));
    return h('div', { class: 'card tema-detail', id: 'detalle-' + t.id },
      h('div', { class: 'muted small' }, 'Tema ' + (S.temas.indexOf(t) + 1) + ' de ' + S.temas.length),
      h('h3', null, t.nombre),
      h('p', { class: 'pregunta' }, t.pregunta),
      t.aviso ? h('p', { class: 'aviso' }, t.aviso) : null,
      list,
      notas.length ? h('details', { class: 'why' },
        h('summary', null, 'Por qué cada partido está donde está'),
        h('ul', { class: 'why-list' }, notas.map(({ p, c }) => h('li', null,
          h('strong', null, p.siglas + ': '),
          c.cita ? h('q', null, c.cita) : c.nota,
          c.fuente ? h('span', { class: 'muted' }, ' — ', c.url ? h('a', { href: c.url, target: '_blank', rel: 'noopener' }, c.fuente) : c.fuente) : null)))) : null,
      h('p', { class: 'muted small', style: { marginBottom: 0 } }, 'Toca otro tema en el gráfico para cambiar.'));
  }

  // ---------- Vistas ----------
  function viewInicio() {
    const root = h('div');
    root.appendChild(h('section', { class: 'hero', style: { marginTop: 0 } },
      h('span', { class: 'kicker' }, 'Generales 29-N · Araba, Bizkaia y Gipuzkoa'),
      h('h1', null, '¿Qué propone cada partido? ', h('span', { class: 'mark' }, 'Míralo en una curva.')),
      h('p', { class: 'lead' }, `${S.temas.length} temas, ${S.partidos.length} partidos. Compara sus propuestas de un vistazo, contesta ${S.temas.length} preguntas y descubre qué partidos están más cerca de lo que tú piensas.`),
      h('div', { class: 'cta-row' },
        h('a', { class: 'btn btn-accent', href: '#/test' }, 'Haz el test (2 min)'),
        h('a', { class: 'btn', href: '#/comparar' }, 'Compara dos partidos'))));

    // Curvas
    const chartSlot = h('div');
    const detailSlot = h('div');
    const chips = h('div', { class: 'chips' });
    const renderChips = () => {
      chips.replaceChildren(
        ...S.partidos.map(p => partyChip(p, { pressed: S.visible.has(p.id), onclick: () => {
          if (S.visible.has(p.id)) S.visible.delete(p.id); else S.visible.add(p.id);
          renderChips(); renderChart(); renderDetail();
        } })),
        h('span', { class: 'chip-row-actions' },
          h('button', { class: 'linklike', type: 'button', onclick: () => { S.visible = new Set(S.partidos.map(p => p.id)); renderChips(); renderChart(); renderDetail(); } }, 'Todos'),
          h('button', { class: 'linklike', type: 'button', onclick: () => { S.visible.clear(); renderChips(); renderChart(); renderDetail(); } }, 'Ninguno')));
    };
    const visibles = () => S.partidos.filter(p => S.visible.has(p.id));
    const renderChart = () => {
      const series = visibles().map(seriePartido);
      const u = S.resultsReady ? serieUsuario() : null; if (u) series.push(u);
      chartSlot.replaceChildren(curveChart({ temas: S.temas, series, selected: S.temaSel, onSelect: id => { S.temaSel = id; renderChart(); renderDetail(true); } }), legendNote());
    };
    const renderDetail = (scroll) => {
      const u = S.resultsReady && S.quiz ? S.quiz.answers[S.temaSel] : null;
      detailSlot.replaceChildren(temaDetalle(S.temaSel, visibles().map(p => p.id), u || null));
      if (scroll && window.innerWidth < 900) detailSlot.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    renderChips(); renderChart(); renderDetail();

    root.appendChild(h('section', { id: 'curvas' },
      h('div', { class: 'section-head' }, h('div', null,
        h('h2', null, 'Las curvas de valor'),
        h('p', null, 'Cada línea es un partido. En cada tema, su punto marca la opción que mejor describe su propuesta concreta. Toca un tema para ver las cinco opciones y quién está en cada una.'))),
      chips,
      h('div', { class: 'curvas-layout' }, h('div', { class: 'card' }, chartSlot, tablaPosiciones(S.partidos)), detailSlot)));

    // Fichas
    root.appendChild(h('section', { id: 'fichas' },
      h('div', { class: 'section-head' }, h('div', null, h('h2', null, 'Fichas de partido'), h('p', null, 'Sus posiciones tema a tema, con la evidencia y las fuentes.'))),
      h('div', { class: 'grid' }, S.partidos.map(p => {
        const ev = S.temas.filter(t => { const c = celda(p.id, t.id); return c && c.estado !== 'estimado' && (c.cita || c.fuente || c.nota); }).length;
        return h('a', { class: 'card party-card', href: '#/partido/' + p.id },
          h('div', { class: 'top' }, h('i', { class: 'swatch', style: { background: p.color } }), h('span', { class: 'name' }, p.siglas)),
          sparkline(p),
          h('span', { class: 'sub' }, `${ev} de ${S.temas.length} temas con nota de evidencia`));
      })),
      S.sinCurva.length ? h('p', { class: 'muted small' }, 'Otras candidaturas proclamadas (sin curva, por falta de programa evaluable): ' + S.sinCurva.join(', ') + '.') : null));

    // Cómo lo hacemos
    root.appendChild(h('section', null, h('div', { class: 'card' },
      h('h2', null, 'Cómo lo hacemos'),
      h('div', { class: 'grid', style: { marginTop: '14px' } },
        miniPoint('1', 'Lo que proponen', 'Codificamos lo que cada partido propone para el Congreso y el Gobierno, a partir de su programa del 29-N y otras fuentes oficiales.'),
        miniPoint('2', 'Con cita y fuente', 'Cada posición lleva una cita textual y un enlace. Sin cita, la casilla es provisional o estimada, y lo decimos.'),
        miniPoint('3', 'Dos personas, por separado', 'Dos personas codifican cada casilla sin ver la otra. Publicamos su grado de acuerdo.')),
      h('p', { style: { marginBottom: 0 } }, h('a', { href: '#/metodologia' }, 'Lee la metodología completa →')))));
    return root;
  }
  const miniPoint = (n, t, d) => h('div', null, h('div', { class: 'scale' }, h('span', { class: 'n', style: { background: 'var(--accent)', color: 'var(--accent-ink)' } }, n)), h('h3', { style: { margin: '8px 0 4px' } }, t), h('p', { class: 'muted', style: { margin: 0 } }, d));

  function sparkline(p) {
    const W = 220, H = 44, n = S.temas.length;
    const x = i => 4 + i * (W - 8) / (n - 1), y = lv => 4 + (5 - lv) / 4 * (H - 8);
    let d = '';
    S.temas.forEach((t, i) => { const c = celda(p.id, t.id); if (c) d += (d ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(c.nivel).toFixed(1); });
    return s('svg', { class: 'spark', viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' },
      [1, 3, 5].map(lv => s('line', { x1: 0, x2: W, y1: y(lv), y2: y(lv), stroke: 'var(--line)' })),
      s('path', { d, fill: 'none', stroke: p.color, 'stroke-width': 2.4, 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round' }));
  }

  function viewPartido(id) {
    const p = partido(id);
    if (!p) return h('div', { class: 'error-box' }, 'No encontramos ese partido. ', h('a', { href: '#/' }, 'Volver al inicio'));
    const root = h('div');
    const series = [seriePartido(p)];
    const u = S.resultsReady ? serieUsuario() : null; if (u) series.push(u);
    root.appendChild(h('div', { class: 'party-head' },
      h('i', { class: 'swatch', style: { background: p.color } }),
      h('div', null, h('h1', null, p.siglas), p.nombre !== p.siglas ? h('p', { class: 'muted', style: { margin: '4px 0 0' } }, p.nombre) : null)));
    root.appendChild(h('section', { style: { marginTop: '20px' } }, h('div', { class: 'card' },
      curveChart({ temas: S.temas, series, compact: false }),
      u ? h('p', { class: 'muted small' }, 'La línea negra es tu curva, según tus respuestas al test.') : null,
      legendNote())));

    const props = S.propuestas.filter(x => x.partido === p.id);
    root.appendChild(h('section', null,
      h('h2', null, 'Tema a tema'),
      h('div', { class: 'tema-list', style: { marginTop: '14px' } }, S.temas.map(t => {
        const c = celda(p.id, t.id);
        const pt = props.filter(x => x.tema === t.id);
        return h('div', { class: 'card tema-item' },
          h('div', { class: 'row' }, h('h3', null, t.nombre), c ? estadoBadge(c.estado) : null),
          c ? h('div', { class: 'levelbar', style: { '--c': p.color }, role: 'img', 'aria-label': `Opción ${c.nivel} de 5` }, [1, 2, 3, 4, 5].map(lv => h('i', { class: lv === c.nivel ? 'on' : null }))) : null,
          h('div', { class: 'opcion' }, c ? t.opciones[c.nivel - 1] : 'Sin codificar'),
          c && (c.cita || c.nota) ? h('div', null, c.cita ? h('q', null, c.cita) : h('span', { class: 'muted' }, c.nota)) : null,
          c && c.fuente ? h('div', { class: 'meta' }, 'Fuente: ', c.url ? h('a', { href: c.url, target: '_blank', rel: 'noopener' }, c.fuente) : c.fuente, c.fecha_consulta ? ' · consultada el ' + c.fecha_consulta : '') : null,
          t.aviso ? h('div', { class: 'meta' }, t.aviso) : null,
          h('details', null, h('summary', { class: 'small', style: { cursor: 'pointer', fontWeight: 700 } }, 'Propuestas concretas'),
            pt.length ? h('ul', null, pt.map(x => h('li', null, h('span', { class: 'badge' }, x.etiqueta), ' ', x.texto, x.url ? h('span', { class: 'muted' }, ' — ', h('a', { href: x.url, target: '_blank', rel: 'noopener' }, x.fuente || 'fuente')) : null)))
              : h('div', { class: 'placeholder', style: { marginTop: '8px' } }, 'Todavía no hemos localizado propuestas concretas de este partido en este tema.')));
      }))));

    const cl = p.cabezas_lista || {};
    root.appendChild(h('section', null,
      h('h2', null, 'Candidaturas en Euskadi'),
      h('div', { class: 'grid', style: { marginTop: '14px' } },
        ['araba', 'bizkaia', 'gipuzkoa'].map(k => h('div', { class: 'card' }, h('div', { class: 'muted small' }, 'Cabeza de lista al Congreso · ' + k[0].toUpperCase() + k.slice(1)), h('div', { style: { fontWeight: 700, marginTop: '4px' } }, cl[k] || 'Pendiente de verificar'))),
        h('div', { class: 'card' }, h('div', { class: 'muted small' }, 'Responsable del partido en Euskadi'), h('div', { style: { fontWeight: 700, marginTop: '4px' } }, p.responsable_euskadi || 'Pendiente de verificar'))),
      h('p', { class: 'small muted' }, p.programa ? h('a', { href: p.programa, target: '_blank', rel: 'noopener' }, 'Programa electoral del 29-N') : 'Programa del 29-N: enlace pendiente.', p.web ? [' · ', h('a', { href: p.web, target: '_blank', rel: 'noopener' }, 'Web oficial')] : '')));
    root.appendChild(h('p', null, h('a', { class: 'btn', href: '#/comparar/' + p.id }, 'Comparar con otro partido')));
    return root;
  }

  function viewComparar(a, b) {
    const ids = S.partidos.map(p => p.id);
    a = ids.includes(a) ? a : ids[0];
    b = ids.includes(b) && b !== a ? b : ids.find(x => x !== a);
    const root = h('div');
    root.appendChild(h('h1', null, 'Compara dos partidos'));
    root.appendChild(h('p', { class: 'lead' }, 'Elige dos y mira en qué temas proponen lo mismo y en cuáles no.'));
    const mk = (val, other, onch) => h('select', { 'aria-label': 'Partido', onchange: e => onch(e.target.value) },
      S.partidos.map(p => h('option', { value: p.id, selected: p.id === val ? true : null, disabled: p.id === other ? true : null }, p.siglas)));
    root.appendChild(h('div', { class: 'compare-pickers', style: { marginTop: '20px' } },
      mk(a, b, v => { location.hash = `#/comparar/${v}/${b}`; }), h('span', { class: 'muted' }, 'frente a'), mk(b, a, v => { location.hash = `#/comparar/${a}/${v}`; })));
    const pa = partido(a), pb = partido(b);
    const same = S.temas.filter(t => { const x = celda(a, t.id), y = celda(b, t.id); return x && y && x.nivel === y.nivel; }).length;
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'chips' }, partyChip(pa), partyChip(pb)),
      curveChart({ temas: S.temas, series: [seriePartido(pa), seriePartido(pb)] }), legendNote()));
    root.appendChild(h('p', { style: { fontSize: '18px', marginTop: '20px' } }, h('strong', null, `Coinciden en ${same} de ${S.temas.length} temas.`)));
    root.appendChild(h('div', { class: 'card', style: { padding: '6px 14px' } }, h('table', { class: 'cmp-table' },
      h('thead', null, h('tr', null, h('th', null, 'Tema'), h('th', null, pa.siglas), h('th', null, pb.siglas), h('th', null, h('span', { class: 'sr-only' }, 'Diferencia')))),
      h('tbody', null, S.temas.map(t => {
        const x = celda(a, t.id), y = celda(b, t.id);
        const eq = x && y && x.nivel === y.nivel;
        const cellTxt = c => c ? [t.opciones[c.nivel - 1], c.estado === 'estimado' ? h('span', { class: 'muted' }, ' (estimado)') : null] : '—';
        return h('tr', null, h('td', null, h('strong', null, t.nombre)), h('td', null, cellTxt(x)), h('td', null, cellTxt(y)),
          h('td', { class: eq ? 'same' : 'diff' }, eq ? '= Coinciden' : (x && y ? `${Math.abs(x.nivel - y.nivel)} ${Math.abs(x.nivel - y.nivel) === 1 ? 'paso' : 'pasos'} de distancia` : '')));
      })))));
    return root;
  }

  // ---------- Test ----------
  const PESOS = [{ v: 0.5, t: 'Poco' }, { v: 1, t: 'Bastante' }, { v: 2, t: 'Mucho' }];
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function nuevoQuiz() {
    S.quiz = { step: 0, order: {}, answers: {}, weights: {} };
    S.resultsReady = false;
    for (const t of S.temas) { S.quiz.order[t.id] = shuffle([0, 1, 2, 3, 4]); S.quiz.weights[t.id] = 1; }
  }

  function cercania() {
    const q = S.quiz; const out = [];
    for (const p of S.partidos) {
      let num = 0, den = 0, n = 0;
      for (const t of S.temas) {
        const u = q.answers[t.id], c = celda(p.id, t.id);
        if (!u || !c) continue;
        const w = q.weights[t.id] || 1;
        num += w * Math.abs(u - c.nivel); den += w * 4; n++;
      }
      out.push({ p, pct: den ? Math.round(100 * (1 - num / den)) : null, n });
    }
    return out.sort((x, y) => (y.pct ?? -1) - (x.pct ?? -1) || x.p.siglas.localeCompare(y.p.siglas, 'es'));
  }

  function viewTest() {
    const root = h('div', { class: 'quiz' });
    if (!S.quiz) {
      root.append(
        h('span', { class: 'q-kicker' }, 'Test · ' + S.temas.length + ' preguntas · 2 minutos'),
        h('h1', { style: { marginTop: '8px' } }, 'Encuentra tu curva'),
        h('p', { class: 'lead' }, 'En cada tema elige la opción que más se acerque a lo que piensas, y dinos cuánto te importa. Al final verás tu curva junto a la de cada partido.'),
        h('ul', { class: 'prose', style: { color: 'var(--ink-2)' } },
          h('li', null, 'Las opciones salen en orden aleatorio y sin números: no hay respuestas de izquierda o de derecha.'),
          h('li', null, 'Puedes saltarte cualquier pregunta.'),
          h('li', null, 'Tus respuestas no salen de tu dispositivo: no se envían ni se guardan. Al cerrar la pestaña desaparecen.'),
          h('li', null, 'El resultado no es una recomendación de voto, sino una forma de ver qué propone cada partido.')),
        h('div', { class: 'cta-row' }, h('button', { class: 'btn btn-accent', type: 'button', onclick: () => { nuevoQuiz(); route(); } }, 'Empezar')));
      return root;
    }
    if (S.resultsReady) return viewResultados();

    const q = S.quiz, i = q.step, t = S.temas[i];
    const sel = q.answers[t.id];
    const go = d => { q.step = Math.min(S.temas.length, Math.max(0, i + d)); if (q.step >= S.temas.length) S.resultsReady = true; route(); window.scrollTo({ top: 0 }); };
    const pick = v => { q.answers[t.id] = v; route(); };
    root.append(
      h('div', { class: 'q-kicker' }, `Pregunta ${i + 1} de ${S.temas.length} · ${t.nombre}`),
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': S.temas.length, 'aria-valuenow': i }, h('i', { style: { width: (i / S.temas.length * 100) + '%' } })),
      h('h1', { class: 'q-title' }, t.pregunta),
      h('div', { class: 'options', role: 'radiogroup', 'aria-label': t.pregunta },
        q.order[t.id].map(k => h('button', { class: 'option', type: 'button', role: 'radio', 'aria-checked': String(sel === k + 1), onclick: () => pick(k + 1) }, h('span', { class: 'radio' }), h('span', null, t.opciones[k]))),
        h('button', { class: 'option skip-opt', type: 'button', role: 'radio', 'aria-checked': String(sel === 0), onclick: () => pick(0) }, h('span', { class: 'radio' }), h('span', null, 'No lo tengo claro / prefiero no contestar'))),
      h('div', { class: 'importance' },
        h('span', { class: 'label', id: 'imp-l' }, '¿Cuánto te importa este tema?'),
        h('div', { class: 'seg', role: 'group', 'aria-labelledby': 'imp-l' }, PESOS.map(w => h('button', { type: 'button', 'aria-pressed': String(q.weights[t.id] === w.v), onclick: () => { q.weights[t.id] = w.v; route(); } }, w.t)))),
      h('div', { class: 'q-nav' },
        h('button', { class: 'btn btn-ghost', type: 'button', disabled: i === 0 ? true : null, onclick: () => go(-1) }, '← Anterior'),
        h('button', { class: 'btn btn-primary', type: 'button', disabled: sel === undefined ? true : null, onclick: () => go(1) }, i === S.temas.length - 1 ? 'Ver mi curva' : 'Siguiente →')));
    return root;
  }

  function viewResultados() {
    const root = h('div');
    const res = cercania();
    const contestadas = S.temas.filter(t => S.quiz.answers[t.id]).length;
    root.append(h('span', { class: 'q-kicker' }, 'Tu resultado'), h('h1', { style: { marginTop: '8px' } }, 'Tu curva frente a la de los partidos'));
    if (!contestadas) {
      root.append(h('p', { class: 'lead' }, 'No has elegido ninguna opción, así que no podemos dibujar tu curva.'), h('button', { class: 'btn btn-accent', type: 'button', onclick: () => { nuevoQuiz(); route(); } }, 'Repetir el test'));
      return root;
    }
    root.append(h('p', { class: 'lead' }, `Has contestado ${contestadas} de ${S.temas.length} temas. La cercanía mide cuánto se parecen tus respuestas a las posiciones de cada partido, dando más peso a los temas que más te importan.`));

    const sel = new Set(res.slice(0, 3).map(r => r.p.id));
    const chipsBox = h('div', { class: 'chips' }), chartBox = h('div');
    const draw = () => {
      chipsBox.replaceChildren(...S.partidos.map(p => partyChip(p, { pressed: sel.has(p.id), onclick: () => { sel.has(p.id) ? sel.delete(p.id) : sel.add(p.id); draw(); } })));
      chartBox.replaceChildren(curveChart({ temas: S.temas, series: [...S.partidos.filter(p => sel.has(p.id)).map(seriePartido), serieUsuario()] }));
    };
    draw();
    root.append(h('section', { style: { marginTop: '20px' } }, h('div', { class: 'card' }, chipsBox, chartBox,
      h('div', { class: 'chart-legend-note' }, h('span', null, h('i', { class: 'lg-dot', style: { background: 'var(--ink)', borderRadius: '2px' } }), 'Tu curva'), h('span', null, 'Se muestran los tres más cercanos: activa otros para compararte.')))));

    root.append(h('section', null, h('h2', null, 'Cercanía con cada partido'),
      h('div', { class: 'card results-list', style: { marginTop: '14px' } }, res.map(r => h('a', { href: '#/partido/' + r.p.id, class: 'result-row', style: { textDecoration: 'none' } },
        h('span', { class: 'who' }, h('i', { class: 'dot', style: { width: '10px', height: '10px', borderRadius: '50%', background: r.p.color, display: 'inline-block' } }), r.p.siglas),
        h('span', { class: 'track' }, h('span', { class: 'fill', style: { display: 'block', width: (r.pct ?? 0) + '%', background: r.p.color } })),
        h('span', { class: 'pct' }, r.pct == null ? '—' : r.pct + '%')))),
      h('p', { class: 'muted small' }, 'Cálculo: en cada tema contestado, la distancia entre tu opción y la del partido (de 0 a 4 pasos), multiplicada por la importancia que le diste (poco ×0,5 · bastante ×1 · mucho ×2). 100 % significa que coincidís en todos los temas que contestaste. Las posiciones son provisionales.'),
      h('p', { class: 'aviso' }, 'Esto no es una recomendación de voto. Mira las fichas para ver qué propone cada partido y de dónde sale cada posición.')));

    const share = async () => {
      const data = { title: 'Tu curva de valor electoral · Euskadi 29-N', text: 'He hecho el test: compara en una curva lo que propone cada partido en Euskadi para el 29-N.', url: location.href.split('#')[0] };
      try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(data.url); btnShare.textContent = 'Enlace copiado'; } } catch (e) { /* cancelado */ }
    };
    const btnShare = h('button', { class: 'btn btn-accent', type: 'button', onclick: share }, 'Compartir el test');
    root.append(h('div', { class: 'cta-row' }, btnShare,
      h('button', { class: 'btn', type: 'button', onclick: () => { S.quiz.step = 0; S.resultsReady = false; route(); } }, 'Revisar respuestas'),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { nuevoQuiz(); route(); } }, 'Empezar de cero')));
    return root;
  }

  // ---------- Metodología ----------
  function viewMetodologia() {
    const m = S.meta;
    const P = (...c) => h('p', null, ...c);
    const root = h('div', { class: 'prose' },
      h('h1', null, 'Metodología y fuentes'),
      h('p', { class: 'lead' }, 'Cómo decidimos dónde está cada partido en cada tema, para que cualquiera pueda comprobarlo.'),
      h('p', { class: 'small muted' }, `Codificación ${m.version_codificacion} · actualizada el ${fmtFecha(m.actualizado)} · las posiciones se congelan el ${fmtFecha(m.congelacion)} salvo errores de hecho.`),

      h('h2', null, 'Qué medimos'),
      P(`En cada uno de los ${S.temas.length} temas asignamos a cada partido una de cinco opciones. La opción elegida es la que mejor describe su propuesta más concreta sobre ese tema, no su retórica general.`),
      h('ul', null,
        h('li', null, 'Elección: generales del 29 de noviembre de 2026, circunscripciones de Araba, Bizkaia y Gipuzkoa.'),
        h('li', null, `Partidos con curva (${S.partidos.length}): ${S.partidos.map(p => p.siglas).join(', ')}. Son las candidaturas que se presentan en las tres provincias y tienen un programa evaluable.`),
        h('li', null, 'Codificamos lo que cada partido propone para el Congreso y el Gobierno de España, no su gestión en instituciones vascas, salvo en los temas vascos (autogobierno y euskera).'),
        h('li', null, 'No valoramos credibilidad, cumplimiento de promesas pasadas ni a los candidatos.')),
      P('La escala ordena opciones dentro de cada tema. El 1 y el 5 no significan izquierda o derecha, ni mejor o peor. En el test las opciones se muestran sin números y en orden aleatorio.'),

      h('h2', null, 'Jerarquía de fuentes'),
      P('Usamos la fuente de rango más alto disponible. Una inferior solo completa lo que la superior no dice.'),
      h('ol', null,
        h('li', null, 'Programa electoral del 29-N (documento oficial del partido).'),
        h('li', null, 'Documentos programáticos oficiales de 2026.'),
        h('li', null, 'Compromisos de campaña del candidato a la Presidencia o del cabeza de lista en Euskadi, recogidos por al menos un medio.'),
        h('li', null, 'Votaciones nominales en el Congreso en la legislatura 2023-2026.'),
        h('li', null, 'Declaraciones públicas de dirigentes desde 2024.')),
      P('Si dos fuentes se contradicen, manda la de rango superior. Si son del mismo rango, la más reciente, y anotamos la contradicción. Los partidos estatales con federación vasca se codifican con su programa estatal, corregido por lo que su federación vasca diga expresamente sobre temas vascos.'),

      h('h2', null, 'Estados de cada casilla'),
      h('ul', null,
        h('li', null, h('strong', null, 'Validado: '), 'dos personas lo codificaron por separado y coinciden, con cita y fuente.'),
        h('li', null, h('strong', null, 'Provisional: '), 'codificado por una sola persona o sin cita todavía.'),
        h('li', null, h('strong', null, 'Estimado: '), 'ninguna fuente de rango 1 a 4 se pronuncia. Se deduce por coherencia con posiciones afines del partido y nunca a más de un paso de su posición documentada más próxima.')),

      h('h2', null, 'Doble codificación'),
      h('ol', null,
        h('li', null, 'Dos personas codifican cada casilla por separado, sin ver la otra codificación.'),
        h('li', null, 'Si coinciden, la casilla queda validada.'),
        h('li', null, 'Si difieren en un paso, discuten la evidencia y acuerdan; si no, decide una tercera persona.'),
        h('li', null, 'Si difieren en dos o más, se revisa la definición de las opciones de ese tema y el cambio queda registrado.'),
        h('li', null, 'Publicamos el porcentaje de acuerdo inicial por tema.')),
      acuerdoTabla(),

      h('h2', { id: 'correcciones' }, 'Correcciones'),
      P('Cualquier persona o partido puede señalar un error aportando su fuente. Si la fuente es de rango igual o superior a la usada, recodificamos en 48 horas y anotamos el cambio con fecha.'),
      P(m.contacto_correcciones ? ['Escríbenos a ', h('a', { href: 'mailto:' + m.contacto_correcciones }, m.contacto_correcciones), '.'] : h('span', { class: 'placeholder', style: { display: 'block' } }, 'Canal de correcciones pendiente (correo o formulario).')),

      h('h2', null, 'Cómo se calcula la cercanía del test'),
      P('En cada tema que contestas, medimos la distancia entre tu opción y la del partido (de 0 a 4 pasos) y la multiplicamos por la importancia que le das (poco ×0,5, bastante ×1, mucho ×2). La cercanía es 100 % menos la distancia total dividida por la máxima posible. Los temas que te saltas no cuentan. El cálculo se hace en tu navegador.'),

      h('h2', null, 'Los temas y sus opciones'),
      ...S.temas.map((t, i) => h('div', null,
        h('h3', null, `${i + 1}. ${t.nombre}`),
        h('p', null, h('em', null, t.pregunta)),
        h('ol', null, t.opciones.map(o => h('li', null, o))),
        t.aviso ? h('p', { class: 'aviso' }, t.aviso) : null)),

      h('h2', null, 'Estado actual de la codificación'),
      estadoTabla(),
      h('p', null, 'Descarga los datos: ', h('a', { href: 'data/codificacion.csv', download: true }, 'codificacion.csv'), ' · ', h('a', { href: 'data/temas.json', download: true }, 'temas.json'), ' · ', h('a', { href: 'data/propuestas.csv', download: true }, 'propuestas.csv'), m.repositorio ? [' · ', h('a', { href: m.repositorio, target: '_blank', rel: 'noopener' }, 'Código en GitHub')] : null),

      h('h2', null, 'Quiénes somos'),
      h('div', { class: 'placeholder' }, 'Pendiente: quiénes hacéis el proyecto, por qué, y declaración de independencia y financiación.'));
    return root;
  }
  function acuerdoTabla() {
    const a = S.meta.acuerdo_por_tema || {};
    if (!Object.keys(a).length) return h('p', { class: 'placeholder' }, 'El acuerdo por tema se publicará al terminar la segunda codificación.');
    return h('div', { class: 'table-scroll', tabindex: 0, role: 'region', 'aria-label': 'Acuerdo inicial por tema' }, h('table', { class: 'data-table' }, h('thead', null, h('tr', null, h('th', null, 'Tema'), h('th', null, 'Acuerdo inicial'))),
      h('tbody', null, S.temas.map(t => h('tr', null, h('td', null, t.nombre), h('td', { class: 'c' }, a[t.id] != null ? a[t.id] + ' %' : '—'))))));
  }
  function estadoTabla() {
    const abbr = { provisional: 'P', estimado: 'E', validado: 'V' };
    return h('div', null,
      h('div', { class: 'table-scroll', tabindex: 0, role: 'region', 'aria-label': 'Estado de la codificación por partido y tema' }, h('table', { class: 'data-table' },
        h('thead', null, h('tr', null, h('th', null, 'Partido'), S.temas.map(t => h('th', { title: t.nombre }, t.corto)))),
        h('tbody', null, S.partidos.map(p => h('tr', null, h('td', null, h('strong', null, p.siglas)),
          S.temas.map(t => { const c = celda(p.id, t.id); return h('td', { class: 'c', title: c ? c.estado : '' }, c ? `${c.nivel}${abbr[c.estado] ? ' ' + abbr[c.estado] : ''}` : '—'); })))))),
      h('p', { class: 'small muted' }, 'Número: opción asignada (1 a 5). Letra: V validado, P provisional, E estimado.'));
  }
  function fmtFecha(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function viewPrivacidad() {
    return h('div', { class: 'prose' },
      h('h1', null, 'Privacidad y aviso legal'),
      h('h2', null, 'Tus datos'),
      h('p', null, 'Esta web no usa cookies ni pide registrarte. Las respuestas del test se procesan solo en tu navegador: no se envían a ningún servidor ni se guardan, y desaparecen al cerrar la pestaña.'),
      h('p', { class: 'placeholder' }, 'Pendiente: si se añade analítica (por ejemplo, Plausible, sin cookies), describir aquí qué se mide y quién lo trata.'),
      h('h2', null, 'Independencia'),
      h('p', null, 'Es una iniciativa ciudadana sin afiliación ni financiación de ningún partido, candidatura o institución. No es una recomendación de voto.'),
      h('h2', null, 'Aviso legal'),
      h('p', { class: 'placeholder' }, 'Pendiente: titular de la web (nombre y contacto), conforme a la LSSI. Revisar con asesoría si procede.'));
  }

  // ---------- Router ----------
  const app = document.getElementById('app');
  function route() {
    const parts = (location.hash.replace(/^#\/?/, '').split('#')[0] || '').split('/').filter(Boolean);
    const [r, a, b] = parts;
    let view, nav;
    switch (r) {
      case undefined: view = viewInicio(); nav = 'inicio'; break;
      case 'test': view = viewTest(); nav = 'test'; break;
      case 'partido': view = viewPartido(a); nav = 'inicio'; break;
      case 'comparar': view = viewComparar(a, b); nav = 'comparar'; break;
      case 'metodologia': view = viewMetodologia(); nav = 'metodologia'; break;
      case 'privacidad': view = viewPrivacidad(); nav = null; break;
      default: view = h('div', { class: 'error-box' }, 'Página no encontrada. ', h('a', { href: '#/' }, 'Volver al inicio'));
    }
    app.replaceChildren(view);
    document.querySelectorAll('[data-nav]').forEach(el => {
      if (el.dataset.nav === nav) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
    });
    const anchor = location.hash.split('#')[2];
    if (anchor) { const el = document.getElementById(anchor); if (el) el.scrollIntoView(); }
  }
  let lastRoute = '';
  window.addEventListener('hashchange', () => {
    const base = location.hash.split('#').slice(0, 2).join('#');
    route();
    if (base !== lastRoute) { if (!location.hash.split('#')[2]) window.scrollTo({ top: 0 }); lastRoute = base; }
  });

  load().then(() => { lastRoute = location.hash.split('#').slice(0, 2).join('#'); route(); }).catch(err => {
    console.error(err);
    app.replaceChildren(h('div', { class: 'error-box' },
      h('h2', null, 'No se han podido cargar los datos'),
      h('p', null, location.protocol === 'file:'
        ? 'Has abierto el archivo directamente. Para verlo en local, abre una terminal en la carpeta del proyecto y ejecuta: python3 -m http.server 8000 — luego visita http://localhost:8000'
        : 'Recarga la página. Si el problema sigue, avísanos.')));
  });
})();
