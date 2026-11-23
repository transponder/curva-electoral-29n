# Kurba · Tu curva de valor electoral · Elecciones Generales 29-N

Web estática e informativa para las elecciones generales del 29 de noviembre de 2026 en Araba, Bizkaia y Gipuzkoa. Muestra en una «curva de valor» qué propone cada partido en 11 temas e incluye un test para que cada persona compare su curva con la de los partidos.

Iniciativa ciudadana independiente, sin afiliación partidista. No es una recomendación de voto.

## Ver en local

Los datos se cargan con `fetch`, así que hay que servir la carpeta (abrir `index.html` con doble clic no funciona):

```bash
python3 -m http.server 8000
# y abre http://localhost:8000
```

## Estructura

```
index.html            Página única con las pantallas de Kurba (rutas con #/…)
css/kurba.css         Estilos (diseño de UX de Kurba)
js/datos.js           Carga data/ y construye los objetos que usa la interfaz
js/app.js             Interfaz, flujo y rutas, sin dependencias
js/cercania.js        Cálculo de cercanía (módulo puro, con tests)
js/reto.js            «Compárate conmigo»: respuestas codificadas en el enlace #/reto/<código> (módulo puro, con tests)
js/paginas.js         Metodología completa, aviso legal, privacidad y «Quiénes somos»
data/temas.json       11 temas: pregunta, 5 opciones y código de 3 letras para el gráfico
data/partidos.json    Partidos: color y forma del marcador, nota, candidaturas (fuente: BOE; la biografía, en fuente_bio/url_bio), programa y otros compromisos, con fuente
                      «representacion»: por qué tiene curva (criterio de la metodología, con fuente).
                      «sin_curva»: las demás candidaturas proclamadas, con sus listas y la página del BOE; «papeletas»: todas las de cada provincia, en el orden del BOE
data/codificacion.csv Una fila por partido × tema: nivel, estado, cita, fuente, url…
data/propuestas.csv   Propuestas concretas por partido y tema (fichas), con fuente
data/recursos.json    Guías para votar (fechas, Congreso, Senado, Concierto…), con fuentes
data/i18n/            Euskera: temas, propuestas (mismo orden), partidos, guías e interfaz; ui.es.json tiene los textos en castellano
data/meta.json        Versión, fechas, correo de correcciones, «Quiénes somos», titular y licencia de los datos
assets/               Favicon, iconos de la app, imagen para compartir y tipografías (Inter y Space Grotesk, licencia OFL)
manifest.webmanifest  Manifiesto web (nombre, colores e iconos)
scripts/generar_paginas.js  Genera las páginas indexables y sitemap.xml desde data/
js/estatica.js        Recuento anónimo de visitas en las páginas generadas
revision/             Hoja de citas y registro de la validación de fuentes (23-N)
```

## Cómo actualizar la codificación

Edita `data/codificacion.csv` (se puede abrir en Excel o Google Sheets y exportar como CSV UTF-8):

| columna | valores |
|---|---|
| `partido` | id de `partidos.json` (`pnv`, `eh-bildu`, `pse-ee`, `pp`, `vox`, `frente-amplio`, `podemos`) |
| `tema` | id de `temas.json` |
| `nivel` | 1 a 5 |
| `estado` | `validado`, `provisional` o `estimado` |
| `cita` | cita textual, máximo dos frases |
| `fuente`, `url`, `fecha_consulta` | de dónde sale (AAAA-MM-DD) |
| `codificadores` | quién ha comprobado la cita en la fuente (basta una firma; en las validadas, «Equipo Kurba») |
| `nota` | justificación breve si aún no hay cita |

Las propuestas de las fichas van en `data/propuestas.csv` con `etiqueta` = `Programa`, `Campaña` o `Antes del 29-N`. Cada propuesta necesita `fuente`, `url` y `fecha_consulta`.

### Fuentes

- Primero el programa oficial del 29-N, enlazado en la web del partido. Si la propuesta sale del programa, la `fuente` indica la página («Programa electoral del PP (29-N), pág. 53») y la `url` termina en `#page=53`, para que el PDF se abra por esa página. Es la página del PDF, la que muestra el visor.
- Si no está en el programa, un medio de referencia (EITB, Deia, El Correo, EFE, Europa Press…), en castellano o en euskera, no una traducción.
- `validar_datos.py` rechaza los dominios descartados (`DOMINIOS_DESCARTADOS`: brainsre.news, diarioestrategia.cl, vivirediciones.es).
- En `codificacion.csv`, una casilla es `validado` cuando lleva una `cita` literal de una fuente oficial (el programa del 29-N, otro documento oficial del partido o el Diario de Sesiones del Congreso), con su `fuente`, la `url` a la página y la `fecha_consulta`, y alguien del equipo ha comprobado que la cita está en la fuente y corresponde al `nivel`. Firma en `codificadores` (basta una firma: «Equipo Kurba»). La ficha de cada partido muestra esa cita en su tema, en la app y en `/partido/<id>/`. El registro de la validación del 23-N está en `revision/README.md`.

### Euskera

Cada cambio en temas o propuestas tiene que ir también en `data/i18n/`:

- `temas.eu.json`: mismos `id` que `temas.json`, con `nombre`, `pregunta` y 5 `opciones`.
- `propuestas.eu.csv`: una fila por cada fila de `propuestas.csv`, **en el mismo orden**, con la etiqueta traducida (`Programa`, `Kanpaina`, `A-29 aurretik`).
- `ui.eu.json`: textos de la interfaz.

La validación falla si falta alguna traducción o si las filas no se corresponden.

La metodología completa está en la página `#/metodologia`, basada en el codebook del proyecto.

## Rutas

`#/` inicio · `#/test` · `#/resultado` · `#/curvas` · `#/fichas` · `#/partido/<id>` · `#/comparar/<id>/<id>` · `#/reto/<código>` (comparar tu curva con la de otra persona; el código lleva sus respuestas y solo existe si esa persona lo crea) · `#/guias` · `#/guia/<id>` · `#/metodologia` (y `#/metodologia/correcciones`) · `#/quienes-somos` (y `#/contacto`) · `#/aviso-legal` · `#/privacidad`. Sin haber hecho el test, curvas, fichas y comparador se abren en modo exploración.

## Versiones de CSS y JS (caché)

Cloudflare guarda los CSS y JS en caché durante horas. Para que nadie vea el HTML nuevo con un CSS o JS antiguo, `index.html` los carga con una versión en la URL (`css/kurba.css?v=…`). Después de cambiar cualquier fichero de `css/`, `js/` o `data/`, y antes de publicar, ejecuta:

```bash
python3 scripts/versionar.py
node scripts/generar_paginas.js
```

El primero pone la versión de cada CSS y JS en `index.html`. El segundo regenera las páginas HTML indexables (`/metodologia/`, `/aviso-legal/`, `/privacidad/`, `/quienes-somos/`, `/partido/<id>/`) y `sitemap.xml` a partir de `data/`, con los mismos textos que la aplicación. No se editan a mano. El workflow «Tests» falla si alguno de los dos no está al día.

## Validar los datos antes de publicar

Cada cambio en `data/` se comprueba automáticamente en GitHub (workflow «Validar datos»). Para comprobarlo en local:

```bash
python3 scripts/validar_datos.py
```

La validación falla, entre otros casos, si falta alguna de las 77 casillas, si un `nivel` no está entre 1 y 5 o si una casilla marcada como `validado` no tiene `cita`, `fuente`, `url`, `fecha_consulta` y quién ha comprobado la cita en `codificadores` (basta una firma, por ejemplo «Equipo Kurba»). Una casilla `estimado` necesita una `nota`. Una `url` sin `fecha_consulta`, o un enlace a un dominio descartado, también es un error. Al final, la validación cuenta cuántas provisionales tienen ya fuente y cuántas tienen cita.
## Tests y sensibilidad del cálculo

El cálculo de cercanía está en `js/cercania.js`, separado de la interfaz. Para comprobarlo:

```bash
node --test
```

Para ver si la fórmula favorece por sí sola a algún partido (simulación con respuestas al azar):

```bash
python3 scripts/sensibilidad.py
```

## Privacidad

Sin cookies ni registro. Las respuestas del test se procesan solo en el navegador y no se envían a ningún sitio.
