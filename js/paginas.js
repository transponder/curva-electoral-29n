/* Páginas de texto de la web: metodología completa, aviso legal, privacidad y «Quiénes somos».
   La metodología completa, el aviso legal y la privacidad están solo en castellano (pendiente de traducir):
   en euskera llevan un aviso al principio. */
(function () {
  'use strict';

  function h(tag, attrs) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v; else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  function P() { return h.apply(null, ['p', null].concat([].slice.call(arguments))); }
  function pendiente(texto) { return h('p', { class: 'pendiente' }, texto); }
  function correo(m, asunto, cuerpo) {
    var q = [];
    if (asunto) q.push('subject=' + encodeURIComponent(asunto));
    if (cuerpo) q.push('body=' + encodeURIComponent(cuerpo));
    return 'mailto:' + m.contacto_correcciones + (q.length ? '?' + q.join('&') : '');
  }
  function soloCastellano(lang) {
    return lang === 'eu' ? h('p', { class: 'aviso', lang: 'eu' }, 'Orrialde hau gaztelaniaz baino ez dago oraingoz.') : null;
  }
  var CUERPO_CORRECCION = 'Partido:\nTema:\nQué está mal:\nFuente (enlace):\nFecha de la fuente:\n';
  function fecha(iso) {
    if (!iso) return '—';
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function metodologia(D, C, lang) {
    var m = D.META, temas = D.TEMAS, partidos = D.ED.eu.parties, cod = D.CODIFICACION;
    var total = cod.length;
    var conCita = cod.filter(function (r) { return r.cita && r.url; }).length;
    var validadas = cod.filter(function (r) { return r.estado === 'validado'; }).length;
    var estimadas = cod.filter(function (r) { return r.estado === 'estimado'; }).length;
    var nProps = partidos.reduce(function (n, p) { return n + p.props.reduce(function (k, t) { return k + t.length; }, 0); }, 0);
    var abbr = { provisional: 'P', estimado: 'E', validado: 'V' };
    var acuerdo = m.acuerdo_por_tema || {};

    return [
      soloCastellano(lang),
      h('h2', null, 'Metodología completa'),
      h('p', { class: 'small' }, 'Codificación ' + (m.version_codificacion || '') + ' · actualizada el ' + fecha(m.actualizado) + ' · las posiciones se congelan el ' + fecha(m.congelacion) + ' salvo errores de hecho.'),
      h('p', { class: 'aviso' }, h('strong', null, 'Estado hoy: '),
        nProps + ' propuestas con fuente. De las ' + total + ' posiciones, ' + estimadas + ' son estimadas (sin propuesta localizada), ' +
        conCita + ' tienen cita textual y ' + validadas + ' están validadas por dos personas. Lo que sigue describe el método completo; todavía no está aplicado a todas las casillas.'),

      h('h3', null, 'Qué medimos'),
      P('En cada uno de los ' + temas.length + ' temas situamos a cada partido en una de cinco opciones: la que mejor describe su propuesta más concreta sobre ese tema, no su retórica general.'),
      h('ul', null,
        h('li', null, 'Elección: generales del 29 de noviembre de 2026, circunscripciones de Araba, Bizkaia y Gipuzkoa.'),
        h('li', null, 'Partidos con curva (' + partidos.length + '): ' + partidos.map(function (p) { return p.n; }).join(', ') + '. Son las candidaturas que se presentan en las tres provincias y tienen un programa evaluable.'),
        h('li', null, 'Recogemos lo que cada partido propone para el Congreso y el Gobierno de España, no su gestión en instituciones vascas, salvo en los temas vascos (autogobierno y euskera).'),
        h('li', null, 'No valoramos la credibilidad, el cumplimiento de promesas pasadas ni a los candidatos.')),
      P('La escala ordena las opciones dentro de cada tema. El 1 y el 5 no significan izquierda o derecha, ni mejor o peor. En el test las opciones salen sin números y en orden aleatorio.'),

      h('h3', null, 'Jerarquía de fuentes'),
      P('Usamos la fuente de rango más alto disponible. Una inferior solo completa lo que la superior no dice.'),
      h('ol', null,
        h('li', null, 'Programa electoral del 29-N (documento oficial del partido).'),
        h('li', null, 'Documentos programáticos oficiales de 2026.'),
        h('li', null, 'Compromisos de campaña del candidato a la Presidencia o del cabeza de lista en Euskadi, recogidos por al menos un medio.'),
        h('li', null, 'Votaciones nominales en el Congreso en la legislatura 2023-2026.'),
        h('li', null, 'Declaraciones públicas de dirigentes desde 2024.')),
      P('Si dos fuentes se contradicen, manda la de rango superior; si son del mismo rango, la más reciente, y anotamos la contradicción. Los partidos estatales con federación vasca se codifican con su programa estatal, corregido por lo que su federación vasca diga expresamente sobre temas vascos.'),
      P('Cada propuesta lleva una etiqueta de origen: ', h('strong', null, 'Programa'), ' (programa o documento del 29-N), ', h('strong', null, 'Campaña'), ' (compromiso anunciado en campaña) o ', h('strong', null, 'Antes del 29-N'), ' (actuación o postura previa), y un enlace a la fuente.'),

      h('h3', null, 'Estados de cada posición'),
      h('ul', null,
        h('li', null, h('strong', null, 'Validada: '), 'dos personas la codificaron por separado y coinciden, con cita y fuente.'),
        h('li', null, h('strong', null, 'Provisional: '), 'hay al menos una propuesta con fuente en ese tema, pero falta la segunda codificación.'),
        h('li', null, h('strong', null, 'Estimada: '), 'no hemos localizado ninguna propuesta ni cita con fuente en ese tema. Se deduce por coherencia con las posiciones afines del partido, por regla a no más de un paso de su posición documentada más próxima (las excepciones se anotan). En el gráfico se ve como un marcador hueco.')),

      h('h3', null, 'Doble codificación'),
      h('ol', null,
        h('li', null, 'Dos personas codifican cada posición por separado, sin ver la otra codificación.'),
        h('li', null, 'Si coinciden, queda validada.'),
        h('li', null, 'Si difieren en un paso, discuten la evidencia y acuerdan; si no, decide una tercera persona.'),
        h('li', null, 'Si difieren en dos o más, se revisa la definición de las opciones de ese tema y el cambio queda registrado.'),
        h('li', null, 'Publicamos el porcentaje de acuerdo inicial por tema.')),
      Object.keys(acuerdo).length
        ? h('div', { class: 'table-scroll', tabindex: 0, role: 'region', 'aria-label': 'Acuerdo inicial por tema' }, h('table', { class: 'data-table' },
            h('thead', null, h('tr', null, h('th', null, 'Tema'), h('th', { class: 'c' }, 'Acuerdo inicial'))),
            h('tbody', null, temas.map(function (t) { return h('tr', null, h('td', null, t.nombre), h('td', { class: 'c' }, acuerdo[t.id] != null ? acuerdo[t.id] + ' %' : '—')); }))))
        : pendiente('El acuerdo por tema se publicará al terminar la segunda codificación.'),

      h('h3', { id: 'correcciones', tabindex: '-1' }, 'Correcciones'),
      P('Cualquier persona o partido puede señalar un error aportando su fuente. Si la fuente es de rango igual o superior a la usada, recodificamos en 48 horas y anotamos el cambio con fecha.'),
      h('a', { class: 'btn line', href: correo(m, 'Corrección Kurba', CUERPO_CORRECCION) }, 'Pedir una corrección'),
      h('p', { class: 'small' }, 'Se abre tu aplicación de correo con un mensaje para ', h('a', { href: correo(m) }, m.contacto_correcciones), '. Indica el partido, el tema, qué está mal y el enlace a la fuente.'),

      h('h3', null, 'Cómo se calcula la cercanía'),
      P('En cada tema que contestas medimos la distancia entre tu opción y la del partido (de 0 a 4 pasos) y la multiplicamos por la importancia que le das: alta ×' + C.PESOS.alta + ', media ×' + C.PESOS.media + ', ninguna ×' + C.PESOS.ninguna + '. La cercanía es 100 % menos la distancia total dividida por la máxima posible. Los temas que no contestas o a los que no das importancia no cuentan. El cálculo se hace en tu navegador.'),
      P('Si das importancia a menos de ' + C.MIN_TEMAS + ' temas no mostramos porcentajes. El resultado agrupa a «los más cercanos», los partidos a ' + C.UMBRAL_GRUPO + ' puntos o menos del primero, y al resto. Dentro de cada grupo el orden es aleatorio en cada sesión, y los empates se marcan.'),
      P('Este cálculo tiene una limitación conocida: un partido situado en opciones intermedias nunca puede quedar tan lejos de alguien como uno situado en los extremos, así que tiende a aparecer más arriba. Por eso el porcentaje es una ayuda para explorar y no una clasificación.'),

      h('h3', null, 'Los temas y sus opciones'),
      temas.map(function (t, i) {
        return h('div', null,
          h('p', null, h('strong', null, (i + 1) + '. ' + t.nombre), ' · ', h('em', null, t.pregunta)),
          h('ol', null, t.opciones.map(function (o) { return h('li', null, o); })),
          t.aviso ? h('p', { class: 'aviso' }, t.aviso) : null);
      }),

      h('h3', null, 'Estado actual de la codificación'),
      h('div', { class: 'table-scroll', tabindex: 0, role: 'region', 'aria-label': 'Estado de la codificación por partido y tema' }, h('table', { class: 'data-table' },
        h('thead', null, h('tr', null, h('th', null, 'Partido'), temas.map(function (t) { return h('th', { class: 'c', title: t.nombre }, t.codigo); }))),
        h('tbody', null, partidos.map(function (p) {
          return h('tr', null, h('td', null, h('strong', null, p.n)), temas.map(function (t, i) {
            return h('td', { class: 'c', title: p.estado[i] }, p.s[i] + (abbr[p.estado[i]] ? ' ' + abbr[p.estado[i]] : ''));
          }));
        })))),
      h('p', { class: 'small' }, 'Número: opción asignada (1 a 5). Letra: V validada, P provisional, E estimada.'),
      P('Descarga los datos: ', h('a', { href: 'data/codificacion.csv', download: true }, 'codificacion.csv'), ' · ',
        h('a', { href: 'data/propuestas.csv', download: true }, 'propuestas.csv'), ' · ',
        h('a', { href: 'data/temas.json', download: true }, 'temas.json'),
        m.licencia_datos ? ' · Licencia ' + m.licencia_datos + ': puedes reutilizarlos citando a Kurba (kurba29n.com).' : null),
    ];
  }

  function privacidad(D, lang) {
    var m = D.META;
    return [
      soloCastellano(lang),
      h('h1', { style: 'font-size:28px' }, 'Privacidad'),
      h('p', { class: 'small' }, 'Última actualización: ' + fecha(m.actualizado)),
      h('h2', null, 'Tus datos'),
      P('Esta web no usa cookies ni pide registrarte. Las respuestas del test se procesan solo en tu navegador: no se envían a ningún servidor ni se guardan, y desaparecen al cerrar la pestaña.'),
      h('h2', null, 'Comparar con otra persona'),
      P('El botón «Compárate conmigo» crea un enlace solo si lo pulsas y aceptas el aviso. El enlace lleva tu respuesta y la importancia que diste a cada tema, sin tu nombre ni tus partidos más cercanos, en la parte de la dirección que va detrás de «#»: los navegadores no la envían a ningún servidor, tampoco al nuestro. Quien tenga el enlace podrá ver esas respuestas, y la aplicación con la que lo compartas (WhatsApp, por ejemplo) también.'),
      P('Si abres un enlace así, la curva de la otra persona solo está en la memoria de esa pestaña: la quitamos de la barra de direcciones en cuanto se lee, y desaparece al pulsar «Olvidar este resultado compartido» o al cerrar la pestaña.'),
      P('Las tipografías y todos los ficheros se sirven desde esta misma web. Tu navegador no hace peticiones a terceros, salvo el recuento anónimo de visitas que se explica a continuación. Los enlaces a fuentes externas solo se abren si los pulsas.'),
      m.analitica ? [h('h2', null, 'Recuento de visitas'), P(m.analitica)] : null,
      h('h2', null, 'Si nos escribes'),
      P('Si nos mandas un correo, solo usamos tu dirección y lo que nos cuentes para responderte y resolver la corrección. No lo compartimos con nadie ni lo usamos para otra cosa, y lo borramos al resolverla y, como tarde, al terminar las elecciones. Para consultar o borrar lo que nos hayas enviado, escribe a ', h('a', { href: correo(m) }, m.contacto_correcciones), '.'),
      h('h2', null, 'Independencia'),
      P('Es una iniciativa ciudadana sin afiliación ni financiación de ningún partido, candidatura o institución. No es una recomendación de voto.'),
      P('Los datos del titular, las licencias y las condiciones de uso están en el ', h('a', { href: '#/aviso-legal' }, 'aviso legal'), '.'),
    ];
  }

  function avisoLegal(D, lang) {
    var m = D.META;
    return [
      soloCastellano(lang),
      h('h1', { style: 'font-size:28px' }, 'Aviso legal'),
      h('p', { class: 'small' }, 'Última actualización: ' + fecha(m.actualizado)),
      h('h2', null, 'Quién está detrás'),
      P(m.titular),
      h('h2', null, 'Para qué es esta web'),
      P('Kurba muestra qué propone cada candidatura que se presenta en Araba, Bizkaia y Gipuzkoa a las elecciones generales del 29 de noviembre de 2026, tema a tema y con su fuente, e incluye un test para que cada persona compare su posición con la de los partidos. Es una herramienta informativa: no es una encuesta ni una recomendación de voto.'),
      h('h2', null, 'Independencia'),
      P('Kurba no tiene afiliación ni recibe financiación de ningún partido, candidatura, institución o empresa. Ningún partido ha revisado ni validado las posiciones antes de publicarlas.'),
      h('h2', null, 'Fuentes, citas y enlaces'),
      P('Las propuestas y citas proceden de programas electorales, documentos públicos de los partidos y medios de comunicación, que se nombran y enlazan en cada caso. Se reproducen en extractos breves con fines de análisis e información, al amparo del derecho de cita (artículo 32 de la Ley de Propiedad Intelectual). Los textos y publicaciones citados pertenecen a quienes los publicaron.'),
      P('Los enlaces a webs externas se ofrecen como fuente. No controlamos su contenido ni respondemos de él.'),
      h('h2', null, 'Datos abiertos'),
      P('Los datos de posiciones, propuestas y temas se publican con licencia ', m.licencia_datos || 'CC BY 4.0', ': puedes copiarlos, reutilizarlos y adaptarlos, también con fines comerciales, siempre que cites a «Kurba (kurba29n.com)». Se descargan desde la ', h('a', { href: '#/metodologia' }, 'metodología'), '.'),
      h('h2', null, 'Errores y correcciones'),
      P('Hacemos lo posible por que la información sea exacta, pero puede contener errores. Las posiciones son provisionales hasta completar la segunda codificación, como se explica en la metodología. Si encuentras un error, escríbenos con la fuente a ', h('a', { href: correo(m, 'Corrección Kurba', CUERPO_CORRECCION) }, m.contacto_correcciones), ': si la fuente es de rango igual o superior a la usada, lo corregimos en 48 horas y anotamos el cambio con fecha.'),
      h('h2', null, 'Ley aplicable'),
      P('Esta web se rige por la ley española.'),
    ];
  }

  function quienes(D, lang) {
    var q = D.META.quienes_somos || {};
    var txt = (lang === 'eu' && q.eu) || q.es || '';
    return txt ? txt.split(/\n\s*\n/).map(function (par) { return P(par.trim()); }) : null;
  }

  window.KurbaPaginas = { metodologia: metodologia, privacidad: privacidad, avisoLegal: avisoLegal, quienes: quienes };
})();
