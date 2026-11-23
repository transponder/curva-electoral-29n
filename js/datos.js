/* Carga los datos editables de /data y construye los objetos que usa la interfaz de Kurba
   (A, ED, S, RES, RESEU, PEU, TX, PNAME, CODE, CODE_EU, METHOD, METHOD_EU).
   Así la interfaz no lleva datos escritos a mano: todo sale de los CSV y JSON del repositorio. */
(function () {
  'use strict';

  function parseCSV(text) {
    var rows = [], row = [], field = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
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
    var head = rows.shift().map(function (k) { return k.replace(/^﻿/, '').trim(); });
    return rows.map(function (r) {
      var o = {};
      head.forEach(function (k, i) { o[k] = (r[i] || '').trim(); });
      return o;
    });
  }

  function get(path, tipo) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(path);
      return tipo === 'csv' ? r.text().then(parseCSV) : r.json();
    });
  }

  var ETQ = { 'Programa': 'p', 'Campaña': 'c', 'Antes del 29-N': 'a' };

  function construir(d) {
    var temaIds = d.temas.map(function (t) { return t.id; });
    var temasEu = {};
    d.temasEu.forEach(function (t) { temasEu[t.id] = t; });

    // Fuentes: una clave por cada par (nombre, url) distinto.
    var S = {}, claves = {}, nf = 0;
    function fuente(nombre, url) {
      var k = nombre + '\u0000' + url;
      if (!claves[k]) { claves[k] = 'f' + (++nf); S[claves[k]] = { t: nombre || url, u: url }; }
      return claves[k];
    }

    // Temas
    var A = {}, CODE = {}, CODE_EU = {};
    d.temas.forEach(function (t) {
      var e = temasEu[t.id];
      A[t.id] = { n: t.nombre, q: t.pregunta, o: t.opciones, aviso: t.aviso || '' };
      if (e) A[t.id].eu = { n: e.nombre, q: e.pregunta, o: e.opciones };
      CODE[t.id] = t.codigo;
      CODE_EU[t.id] = (e && e.codigo) || t.codigo;
    });

    // Codificación: nivel y estado por partido y tema.
    var cod = {};
    d.codificacion.forEach(function (r) { cod[r.partido + '|' + r.tema] = r; });

    // Propuestas en castellano y en euskera (mismo orden, fila a fila).
    var props = {}, propsEu = {};
    d.propuestas.forEach(function (r, j) {
      var i = temaIds.indexOf(r.tema);
      if (i < 0) return;
      var pp = props[r.partido] = props[r.partido] || temaIds.map(function () { return []; });
      var pe = propsEu[r.partido] = propsEu[r.partido] || {};
      pp[i].push([r.texto, fuente(r.fuente, r.url), ETQ[r.etiqueta] || 'c']);
      var eu = d.propuestasEu[j];
      (pe[i] = pe[i] || []).push(eu && eu.partido === r.partido && eu.tema === r.tema ? eu.texto : r.texto);
    });

    var PEU = {}, PNAME = {};
    var parties = d.partidos.codificados.map(function (p, k) {
      var e = d.partidosEu[p.id] || {};
      if (e.siglas && e.siglas !== p.siglas) PNAME[p.id] = e.siglas;
      PEU[p.id] = {
        note: e.nota || p.nota || '',
        prog: e.programa_nota || p.programa_nota || '',
        docs: e.programa_docs || [],
        props: propsEu[p.id] || {},
        otros: e.otros || [],
        ppl: (e.personas || []).map(function (x) { return [x.cargo, x.descripcion]; }),
        senado: e.senado || '',
        lead: e.responsable_euskadi || '',
      };
      return {
        id: p.id, n: p.siglas, slot: k + 1, sh: p.forma || 'circle',
        color: p.color, colorOscuro: p.color_oscuro || p.color,
        s: temaIds.map(function (t) { var c = cod[p.id + '|' + t]; return c ? +c.nivel : 3; }),
        est: temaIds.map(function (t) { var c = cod[p.id + '|' + t]; return !c || c.estado === 'estimado'; }),
        estado: temaIds.map(function (t) { var c = cod[p.id + '|' + t]; return c ? c.estado : ''; }),
        note: p.nota || '', pres: p.candidatura_presidencia || null, web: p.web || '',
        prog: { docs: (p.programa_docs || []).map(function (x) { return { t: x.titulo, u: x.url }; }), note: p.programa_nota || '' },
        props: props[p.id] || temaIds.map(function () { return []; }),
        otros: (p.otros || []).map(function (x) { return [x.texto, fuente(x.fuente, x.url), ETQ[x.etiqueta] || 'c']; }),
        ppl: (p.personas || []).map(function (x) { return [x.nombre, x.cargo, x.descripcion, fuente(x.fuente, x.url), x.url_bio ? fuente(x.fuente_bio, x.url_bio) : null]; }),
        senado: p.senado || '', lead: p.responsable_euskadi || '',
        rep: p.representacion ? { t: p.representacion.texto, f: p.representacion.fuente, u: p.representacion.url } : null,
      };
    });

    // Candidaturas proclamadas sin curva y papeletas de cada provincia (BOE del 3 de noviembre).
    var OTRAS = (d.partidos.sin_curva || []).map(function (o) {
      return {
        id: o.id, n: o.siglas, nombre: o.nombre || o.siglas, web: o.web || '',
        listas: (o.listas || []).map(function (l) { return { prov: l.provincia, cam: l.camara, u: l.url }; }),
      };
    });

    var RES = d.recursos.map(function (r) {
      return { id: r.id, t: r.titulo, q: r.pregunta, b: r.cuerpo, src: (r.fuentes || []).map(function (x) { return fuente(x.fuente, x.url); }) };
    });
    var RESEU = {};
    Object.keys(d.recursosEu).forEach(function (id) {
      var r = d.recursosEu[id];
      RESEU[id] = { t: r.titulo, q: r.pregunta, b: r.cuerpo };
    });

    return {
      A: A, CODE: CODE, CODE_EU: CODE_EU, S: S, RES: RES, RESEU: RESEU, PEU: PEU, PNAME: PNAME,
      ED: { eu: { name: d.meta.edicion || 'Euskadi · 29-N', attrs: temaIds, parties: parties } },
      TX: { es: d.uiEs.ui || {}, eu: d.uiEu.ui || {} },
      METHOD: d.uiEs.metodo || [], METHOD_EU: d.uiEu.metodo || [],
      META: d.meta, TEMAS: d.temas, CODIFICACION: d.codificacion,
      OTRAS: OTRAS, PAPELETAS: d.partidos.papeletas || {},
    };
  }

  window.KurbaDatos = {
    parseCSV: parseCSV,
    cargar: function () {
      var f = {
        temas: ['data/temas.json'], partidos: ['data/partidos.json'], meta: ['data/meta.json'],
        codificacion: ['data/codificacion.csv', 'csv'], propuestas: ['data/propuestas.csv', 'csv'],
        recursos: ['data/recursos.json'],
        temasEu: ['data/i18n/temas.eu.json'], propuestasEu: ['data/i18n/propuestas.eu.csv', 'csv'],
        partidosEu: ['data/i18n/partidos.eu.json'], recursosEu: ['data/i18n/recursos.eu.json'],
        uiEs: ['data/i18n/ui.es.json'], uiEu: ['data/i18n/ui.eu.json'],
      };
      var ks = Object.keys(f);
      return Promise.all(ks.map(function (k) { return get(f[k][0], f[k][1]); })).then(function (vs) {
        var d = {};
        ks.forEach(function (k, i) { d[k] = vs[i]; });
        return construir(d);
      });
    },
  };
})();
