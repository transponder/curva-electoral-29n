# Tu curva de valor electoral · Euskadi 29-N

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
index.html            Página única (rutas con #/…)
css/styles.css        Estilos, sin fuentes externas
js/app.js             Interfaz y vistas, sin dependencias
js/cercania.js        Cálculo de cercanía (módulo puro, con tests)
data/temas.json       11 temas: pregunta y 5 opciones (texto exacto del codebook)
data/partidos.json    Partidos con curva, color neutro, candidaturas y enlaces (a verificar)
data/codificacion.csv Una fila por partido × tema: nivel, estado, cita, fuente, url…
data/propuestas.csv   Propuestas concretas por partido y tema (fichas)
data/meta.json        Versión, fechas (congelación 24-N), contacto de correcciones
assets/               Favicon e imagen para compartir
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

Las propuestas de las fichas van en `data/propuestas.csv` con `etiqueta` = `Programa`, `Campaña` o `Antes del 29-N`.

La metodología completa está en la página `#/metodologia`, basada en el codebook del proyecto.

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
