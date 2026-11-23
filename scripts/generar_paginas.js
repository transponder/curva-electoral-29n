#!/usr/bin/env node
/* Genera páginas HTML reales e indexables a partir de data/, con los mismos datos y textos que la
   aplicación (js/datos.js, js/paginas.js y js/cercania.js), para que los buscadores y las redes
   sociales las lean sin ejecutar JavaScript:

     /metodologia/  /aviso-legal/  /privacidad/  /quienes-somos/  /partido/<id>/  y sitemap.xml

   La aplicación (index.html, rutas #/…) sigue siendo la misma; estas páginas enlazan a ella.

     node scripts/generar_paginas.js              # escribe las páginas
     node scripts/generar_paginas.js --comprobar  # falla si alguna no está al día (CI)
*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const RAIZ = path.resolve(__dirname, '..');
const BASE = 'https://www.kurba29n.com';
const COMPROBAR = process.argv.includes('--comprobar');

/* ---------- DOM mínimo para ejecutar js/paginas.js fuera del navegador ---------- */
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ESC[c]);

/* Los enlaces de la aplicación apuntan a rutas #/…; aquí se llevan a las páginas reales. */
const RUTAS = {
  '#/metodologia': '/metodologia/', '#/metodologia/correcciones': '/metodologia/#correcciones',
  '#/aviso-legal': '/aviso-legal/', '#/privacidad': '/privacidad/',
  '#/quienes-somos': '/quienes-somos/', '#/contacto': '/quienes-somos/#contacto',
};
function enlace(href) {
  if (RUTAS[href]) return RUTAS[href];
  if (/^#\/partido\/[a-z0-9-]+$/.test(href)) return '/partido/' + href.split('/')[2] + '/';
  if (href.startsWith('#/')) return '/' + href;
  if (href.startsWith('data/')) return '/' + href;
  return href;
}

class Elemento {
  constructor(tag) { this.tag = tag; this.attrs = {}; this.hijos = []; }
  set className(v) { this.attrs.class = v; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  appendChild(c) { this.hijos.push(c); return c; }
  html() {
    const a = Object.keys(this.attrs).map((k) => {
      const v = k === 'href' ? enlace(this.attrs[k]) : this.attrs[k];
      return v === '' ? ' ' + k : ` ${k}="${esc(v)}"`;
    }).join('');
    return `<${this.tag}${a}>${this.hijos.map((h) => h.html()).join('')}</${this.tag}>`;
  }
}
class Texto { constructor(t) { this.t = t; } html() { return esc(this.t); } }
const documento = { createElement: (t) => new Elemento(t), createTextNode: (t) => new Texto(t) };
const nodos = (x) => (x == null || x === false ? '' : Array.isArray(x) ? x.map(nodos).join('') : x.html());

/* ---------- carga de datos con el mismo código que la web ---------- */
function leerFetch(ruta) {
  const texto = fs.readFileSync(path.join(RAIZ, ruta), 'utf8');
  return Promise.resolve({ ok: true, text: () => Promise.resolve(texto), json: () => Promise.resolve(JSON.parse(texto)) });
}
function cargar() {
  const ctx = vm.createContext({ document: documento, fetch: leerFetch, console, Promise });
  ctx.window = ctx;
  for (const f of ['js/datos.js', 'js/paginas.js']) {
    vm.runInContext(fs.readFileSync(path.join(RAIZ, f), 'utf8'), ctx, { filename: f });
  }
  const C = require(path.join(RAIZ, 'js/cercania.js'));
  return ctx.KurbaDatos.cargar().then((D) => ({ D, C, KP: ctx.KurbaPaginas }));
}

const version = (ruta) => crypto.createHash('sha1').update(fs.readFileSync(path.join(RAIZ, ruta))).digest('hex').slice(0, 8);

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function fechaLarga(iso, conAnio = true) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return '';
  return `${+m[3]} de ${MESES[+m[2] - 1]}` + (conAnio ? ` de ${m[1]}` : '');
}

/* ---------- plantilla común ---------- */
const LOGO = '<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="10" fill="#FFC533"/><polyline points="7,25 14,13 22,20 29,9" fill="none" stroke="#14161B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="14" cy="13" r="2.6" fill="#14161B"/><circle cx="22" cy="20" r="2.6" fill="#14161B"/></svg>';
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.goatcounter.com; font-src 'self'; connect-src 'self' https://*.goatcounter.com; base-uri 'self'; form-action 'none'; object-src 'none'";

function plantilla({ ruta, titulo, descripcion, cuerpo, ld, seccion, meta }) {
  const url = BASE + ruta;
  const fecha = fechaLarga(meta.actualizado);
  const menu = [
    ['/#/test', 'Test', ''], ['/#/curvas', 'Curvas', ''], ['/#/fichas', 'Partidos', 'partidos'],
    ['/#/guias', 'Guías', ''], ['/metodologia/', 'Metodología', 'metodologia'], ['/quienes-somos/', 'Quiénes somos', 'quienes-somos'],
  ].map(([h, t, s]) => `<a href="${h}"${s && s === seccion ? ' aria-current="page"' : ''}>${t}</a>`).join('\n    ');
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${CSP}">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title>${esc(titulo)} · Kurba</title>
  <meta name="description" content="${esc(descripcion)}">
  <meta name="theme-color" content="#F2F3F0" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#121315" media="(prefers-color-scheme: dark)">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Kurba">
  <meta property="og:locale" content="es_ES">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(titulo)} · Kurba">
  <meta property="og:description" content="${esc(descripcion)}">
  <meta property="og:image" content="${BASE}/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Kurba: tu curva de valor electoral para las generales del 29-N en Euskadi.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(titulo)} · Kurba">
  <meta name="twitter:description" content="${esc(descripcion)}">
  <meta name="twitter:image" content="${BASE}/assets/og-image.png">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="preload" href="/assets/fonts/inter-latin-wght.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/space-grotesk-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/css/kurba.css?v=${version('css/kurba.css')}">
  <script src="/js/analitica.js?v=${version('js/analitica.js')}" defer></script>
  <script src="/js/estatica.js?v=${version('js/estatica.js')}" defer data-gc="${esc(meta.goatcounter || '')}"></script>
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body class="estatica" data-pantalla="s-met">
<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="top">
 <div class="top-in">
  <a class="brand" href="/" aria-label="Kurba, ir al inicio">
    ${LOGO}
    <b>kurba</b>
  </a>
  <nav class="menu" aria-label="Principal">
    ${menu}
  </nav>
 </div>
</header>
<main id="contenido" tabindex="-1">
<section class="stack">
${cuerpo}
</section>
</main>
<footer class="pie">
 <div class="pie-in">
  <div class="pie-col pie-kurba">
    <a class="pie-brand" href="/" aria-label="Kurba, ir al inicio">${LOGO.replace('width="36" height="36"', 'width="28" height="28"')}<b>kurba</b></a>
    <p>Tu curva de valor electoral para las elecciones generales del 29-N en Araba, Bizkaia y Gipuzkoa.</p>
    <p>Iniciativa ciudadana independiente, sin afiliación ni financiación de ningún partido. No es una recomendación de voto.</p>
  </div>
  <nav class="pie-col" aria-labelledby="pie-h1">
    <h2 class="pie-h" id="pie-h1">Explora</h2>
    <a href="/#/test">Test</a>
    <a href="/#/curvas">Curvas</a>
    <a href="/#/fichas">Partidos</a>
    <a href="/#/guias">Guías</a>
  </nav>
  <nav class="pie-col" aria-labelledby="pie-h2">
    <h2 class="pie-h" id="pie-h2">Transparencia</h2>
    <a href="/metodologia/">Metodología y fuentes</a>
    <a href="/metodologia/#correcciones">Señalar un error</a>
    <a href="/data/codificacion.csv" download>Descargar datos</a>
  </nav>
  <nav class="pie-col" aria-labelledby="pie-h3">
    <h2 class="pie-h" id="pie-h3">Sobre Kurba</h2>
    <a href="/quienes-somos/">Quiénes somos</a>
    <a href="/quienes-somos/#contacto">Contacto</a>
    <a href="/aviso-legal/">Aviso legal</a>
    <a href="/privacidad/">Privacidad</a>
  </nav>
 </div>
 <p class="pie-fin">Actualizado el ${fecha} · <a href="/aviso-legal/">Datos con licencia ${esc(meta.licencia_datos || 'CC BY 4.0')}</a></p>
</footer>
</body>
</html>
`;
}

function ldPagina(ruta, titulo, descripcion, extra) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': BASE + ruta,
    url: BASE + ruta,
    name: titulo,
    description: descripcion,
    inLanguage: 'es',
    isPartOf: { '@id': BASE + '/#web' },
    publisher: { '@id': BASE + '/#organizacion' },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Kurba', item: BASE + '/' },
        { '@type': 'ListItem', position: 2, name: titulo, item: BASE + ruta },
      ],
    },
    ...extra,
  };
}

const CTA = (texto, href = '/#/test', boton = 'Hacer el test · 2 min') =>
  `<div class="card stack cta-estatica" style="gap:10px"><p>${texto}</p><a class="btn acc" href="${href}">${boton}</a></div>`;

/* ---------- páginas de texto ---------- */
function paginasDeTexto({ D, C, KP }) {
  const m = D.META;
  const correo = m.contacto_correcciones;
  const asunto = encodeURIComponent('Corrección Kurba');
  const cuerpoCorreo = encodeURIComponent('Partido:\nTema:\nQué está mal:\nFuente (enlace):\nFecha de la fuente:\n');
  const estado = `<a class="estado" href="/metodologia/">Datos validados · ${fechaLarga(m.actualizado, false)}</a>`;
  return [
    {
      ruta: '/metodologia/', seccion: 'metodologia',
      titulo: 'Metodología y fuentes',
      descripcion: 'Cómo sitúa Kurba a cada partido en 11 temas para las generales del 29-N en Euskadi: jerarquía de fuentes, validación con cita, posiciones estimadas, cálculo de la cercanía y datos descargables.',
      cuerpo: `<h1>Metodología y fuentes</h1>\n${estado}\n` +
        (D.METHOD || []).map((p) => `<p class="lead" style="font-size:16px">${esc(p)}</p>`).join('\n') +
        `\n<div class="prose">${nodos(KP.metodologia(D, C, 'es'))}</div>`,
    },
    {
      ruta: '/aviso-legal/', seccion: '',
      titulo: 'Aviso legal',
      descripcion: 'Quién está detrás de Kurba, para qué es esta web, independencia, fuentes y derecho de cita, licencia de los datos y correcciones.',
      cuerpo: `<div class="prose">${nodos(KP.avisoLegal(D, 'es'))}</div>`,
    },
    {
      ruta: '/privacidad/', seccion: '',
      titulo: 'Privacidad',
      descripcion: 'Kurba no usa cookies ni pide registro: las respuestas del test se procesan solo en tu navegador. Qué se cuenta de forma anónima y qué pasa si nos escribes.',
      cuerpo: `<div class="prose">${nodos(KP.privacidad(D, 'es'))}</div>`,
    },
    {
      ruta: '/quienes-somos/', seccion: 'quienes-somos',
      titulo: 'Quiénes somos',
      descripcion: 'Kurba es una iniciativa ciudadana sin ánimo de lucro de dos estudiantes universitarios del País Vasco, sin afiliación ni financiación de ningún partido.',
      cuerpo: `<h1>Quiénes somos</h1>\n<div class="prose">${nodos(KP.quienes(D, 'es'))}</div>
<div class="card stack" style="gap:12px">
  <h2 id="contacto">Contacto</h2>
  <p class="small" style="font-size:14.5px">¿Has visto un error, echas en falta una propuesta o quieres decirnos algo? Escríbenos. Para una corrección, lo que más nos ayuda es el partido, el tema y el enlace a la fuente.</p>
  <a class="btn acc" href="mailto:${esc(correo)}?subject=${asunto}&amp;body=${cuerpoCorreo}">Proponer una corrección</a>
  <p class="small" style="font-size:14.5px">O escribe directamente a <a href="mailto:${esc(correo)}">${esc(correo)}</a></p>
  <ul class="pts">
    <li>Si la fuente es de rango igual o superior a la que usamos, corregimos en 48 horas y anotamos el cambio con fecha.</li>
    <li>Solo usamos tu correo para responderte. Lo borramos al resolver tu mensaje.</li>
  </ul>
</div>`,
    },
  ];
}

/* ---------- una página por partido ---------- */
const TAG = { p: 'Programa', c: 'Campaña', a: 'Antes del 29-N' };
const ESTADO = { validado: ['Validada', 'good'], provisional: ['Provisional', 'mid'], estimado: ['Estimada', 'bad'] };

function paginasDePartido({ D }) {
  const partidos = D.ED.eu.parties, temas = D.ED.eu.attrs, A = D.A, S = D.S, m = D.META;
  const datos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data/partidos.json'), 'utf8')).codificados;
  const nombre = Object.fromEntries(datos.map((p) => [p.id, p.nombre || p.siglas]));
  const fuente = (k, lab = 'Fuente') => ` <a href="${esc(S[k].u)}" title="${esc(S[k].t)}" target="_blank" rel="noopener">${lab} ↗</a>`;
  const fuentePer = (x) => (x[4] ? `${fuente(x[4])} ·${fuente(x[3], 'Candidatura')}` : fuente(x[3]));
  const prop = (x) => `<li><span class="tag">${TAG[x[2]]}</span> ${esc(x[0])}${fuente(x[1])}</li>`;
  // Por qué está en esa opción: la cita literal que la respalda, con su fuente, o el aviso de que es estimada.
  const base = (c) => {
    if (!c) return '';
    const nota = c[3] ? `<p class="cita-n">${esc(c[3])}</p>` : '';
    if (c[0] && c[1]) {
      // El estado (Validada, Provisional) ya va en la píldora de la cabecera del tema.
      return `<div class="cita"><p class="cita-h">Por qué está en esta opción</p><blockquote>«${esc(c[0])}»</blockquote><p class="cita-f"><a href="${esc(S[c[1]].u)}" target="_blank" rel="noopener">${esc(S[c[1]].t)} ↗</a></p>${nota}</div>`;
    }
    return `<div class="cita est-c"><p class="cita-h">Ninguna fuente oficial la documenta: se deduce por coherencia con el resto de posiciones del partido.</p>${nota}</div>`;
  };
  const ext = (href, texto) => `<a href="${esc(href)}" target="_blank" rel="noopener"><span>${esc(texto)}</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 16L16 8M9 8h7v7"/></svg></a>`;

  return partidos.map((p) => {
    const nProps = p.props.reduce((n, t) => n + t.length, 0);
    const conPropuesta = p.props.filter((t) => t.length).length;
    const validadas = p.estado.filter((e) => e === 'validado').length;
    const titulo = `${p.n}: qué propone en Euskadi para el 29-N`;
    const descripcion = `Las posiciones de ${nombre[p.id]} (${p.n}) en ${temas.length} temas para las elecciones generales del 29-N en Araba, Bizkaia y Gipuzkoa: ${nProps} propuestas con su fuente, candidaturas y programa.`;
    const temasHtml = temas.map((id, i) => {
      const a = A[id], v = p.s[i], [etq, cls] = ESTADO[p.estado[i]] || ['', 'off'];
      const lista = p.props[i].length
        ? `<ul class="pts">${p.props[i].map(prop).join('')}</ul>`
        : '<p class="none">Sin propuestas localizadas sobre este tema todavía.</p>';
      return `<div class="tcard">
  <div class="th"><h3 class="tn">${esc(a.n)}</h3>${etq ? `<span class="pill ${cls}">${etq}</span>` : ''}</div>
  <p class="small"><em>${esc(a.q)}</em></p>
  <div class="tv"><b>${esc(p.n)}</b><span>${esc(a.o[v - 1])}${p.est[i] ? ' <span class="est">(estimado)</span>' : ''}</span></div>
  ${base(p.cit[i])}
  ${lista}
</div>`;
    }).join('\n');
    const prog = p.prog.docs.map((d) => ext(d.u, d.t)).join('') +
      (p.prog.note ? `<p>${esc(p.prog.note)}</p>` : '') +
      (p.web ? ext(p.web, 'Web oficial') : '<p>Web oficial: pendiente de verificar.</p>');
    const personas = p.ppl.map((x) => `<li><b>${esc(x[0])}</b><span class="role">${esc(x[1])}</span><span class="bio">${esc(x[2])}${fuentePer(x)}</span></li>`).join('') +
      (p.lead ? `<li><span class="role">${esc(p.lead)}</span></li>` : '');
    const resto = partidos.filter((o) => o.id !== p.id)
      .map((o) => `<a href="/partido/${o.id}/"><span class="on">${esc(o.n)}</span><svg class="ch" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></a>`).join('');

    const cuerpo = `<p class="kicker">Elecciones generales 29-N · Araba, Bizkaia y Gipuzkoa</p>
<h1>${esc(p.n)}</h1>
${nombre[p.id] !== p.n ? `<p class="small" style="margin-top:-8px">${esc(nombre[p.id])}</p>` : ''}
<p class="lead">${esc(p.note)}</p>
<a class="estado" href="/metodologia/">Datos validados · ${fechaLarga(m.actualizado, false)}</a>
${CTA(`¿En qué coincides con ${esc(p.n)} y en qué no? Responde 11 preguntas y compara tu curva con la de los ${partidos.length} partidos. Tus respuestas no salen de tu dispositivo.`)}
<p class="small"><a href="/#/partido/${p.id}">Ver la curva de ${esc(p.n)} junto a la de los demás partidos →</a></p>
<h2>Tema a tema</h2>
<p class="small">${validadas} de ${temas.length} posiciones validadas: cada una lleva la cita literal de una fuente oficial que la justifica, con el enlace a la página. ${conPropuesta} de ${temas.length} temas con propuestas localizadas y ${nProps} propuestas con su fuente. <span class="tag">Programa</span> viene del programa o de un documento del 29-N, <span class="tag">Campaña</span> es un compromiso anunciado en campaña y <span class="tag">Antes del 29-N</span> es una actuación o postura previa.</p>
<div class="stack" style="gap:10px">
${temasHtml}
</div>
${p.otros.length ? `<h2>Otros compromisos</h2>\n<ul class="pts card">${p.otros.map(prop).join('')}</ul>` : ''}
<h2>Candidaturas en Euskadi</h2>
<ul class="ppl list">${personas}</ul>
<p class="small"><b>Senado:</b> ${esc(p.senado)}<br>${p.pres ? `<b>Candidatura a la Presidencia:</b> ${esc(p.pres)}` : 'No presenta candidatura a la Presidencia del Gobierno.'}</p>
<h2>Programa y web</h2>
<div class="darklist">${prog}</div>
<h2>El resto de partidos</h2>
<nav class="list others" aria-label="Fichas del resto de partidos">${resto}</nav>
<p class="small">Las posiciones se han elaborado a partir de programas electorales, votaciones parlamentarias y declaraciones públicas, sin consultar a los partidos, y cada una lleva una cita comprobada en la fuente. <a href="/metodologia/">Cómo lo hacemos</a> · <a href="/metodologia/#correcciones">Señalar un error</a></p>`;

    return {
      ruta: `/partido/${p.id}/`, seccion: 'partidos', titulo, descripcion, cuerpo,
      extra: { about: { '@type': 'PoliticalParty', name: nombre[p.id], alternateName: p.n, ...(p.web ? { url: p.web } : {}) } },
    };
  });
}

/* ---------- escritura y comprobación ---------- */
function sitemap(paginas, meta) {
  const urls = ['/', ...paginas.map((p) => p.ruta)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${BASE}${u}</loc><lastmod>${meta.actualizado}</lastmod></url>`).join('\n')}
</urlset>
`;
}

cargar().then((ctx) => {
  const meta = ctx.D.META;
  const paginas = [...paginasDeTexto(ctx), ...paginasDePartido(ctx)];
  const ficheros = {};
  for (const p of paginas) {
    const ld = ldPagina(p.ruta, p.titulo, p.descripcion, p.extra);
    ficheros[path.join(p.ruta.slice(1), 'index.html')] = plantilla({ ...p, ld, meta });
  }
  ficheros['sitemap.xml'] = sitemap(paginas, meta);

  let malos = 0;
  for (const [rel, contenido] of Object.entries(ficheros)) {
    const destino = path.join(RAIZ, rel);
    const actual = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : null;
    if (actual === contenido) continue;
    if (COMPROBAR) { console.log(`ERROR  ${rel} no está al día; ejecuta node scripts/generar_paginas.js`); malos++; continue; }
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, contenido);
    console.log(`escrito ${rel}`);
  }
  if (!COMPROBAR) console.log(`${paginas.length} páginas y sitemap.xml al día.`);
  process.exit(malos ? 1 : 0);
}).catch((e) => { console.error(e); process.exit(1); });
