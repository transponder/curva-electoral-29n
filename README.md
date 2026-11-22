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
js/paginas.js         Metodología completa, aviso legal, privacidad y «Quiénes somos»
data/temas.json       11 temas: pregunta, 5 opciones y código de 3 letras para el gráfico
data/partidos.json    Partidos: color y forma del marcador, nota, candidaturas, programa y otros compromisos, con fuente
data/codificacion.csv Una fila por partido × tema: nivel, estado, cita, fuente, url…
data/propuestas.csv   Propuestas concretas por partido y tema (fichas), con fuente
data/recursos.json    Guías para votar (fechas, Congreso, Senado, Concierto…), con fuentes
data/i18n/            Euskera: temas, propuestas (mismo orden), partidos, guías e interfaz; ui.es.json tiene los textos en castellano
data/meta.json        Versión, fechas, correo de correcciones, «Quiénes somos», titular y licencia de los datos
assets/               Favicon, imagen para compartir y tipografías (Inter y Space Grotesk, licencia OFL)
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
| `codificadores` | quién la ha codificado |
| `nota` | justificación breve si aún no hay cita |

Las propuestas de las fichas van en `data/propuestas.csv` con `etiqueta` = `Programa`, `Campaña` o `Antes del 29-N`. Cada propuesta necesita `fuente` y `url`.

### Euskera

Cada cambio en temas o propuestas tiene que ir también en `data/i18n/`:

- `temas.eu.json`: mismos `id` que `temas.json`, con `nombre`, `pregunta` y 5 `opciones`.
- `propuestas.eu.csv`: una fila por cada fila de `propuestas.csv`, **en el mismo orden**, con la etiqueta traducida (`Programa`, `Kanpaina`, `A-29 aurretik`).
- `ui.eu.json`: textos de la interfaz.

La validación falla si falta alguna traducción o si las filas no se corresponden.

La metodología completa está en la página `#/metodologia`, basada en el codebook del proyecto.

## Rutas

`#/` inicio · `#/test` · `#/resultado` · `#/curvas` · `#/fichas` · `#/partido/<id>` · `#/comparar/<id>/<id>` · `#/guias` · `#/guia/<id>` · `#/metodologia` (y `#/metodologia/correcciones`) · `#/quienes-somos` (y `#/contacto`) · `#/aviso-legal` · `#/privacidad`. Sin haber hecho el test, curvas, fichas y comparador se abren en modo exploración.

## Validar los datos antes de publicar

Cada cambio en `data/` se comprueba automáticamente en GitHub (workflow «Validar datos»). Para comprobarlo en local:

```bash
python3 scripts/validar_datos.py
```

La validación falla, entre otros casos, si falta alguna de las 77 casillas, si un `nivel` no está entre 1 y 5 o si una casilla marcada como `validado` no tiene `cita`, `fuente`, `url`, `fecha_consulta` y dos nombres en `codificadores` (separados por `;`). Una casilla `estimado` necesita una `nota`.
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
