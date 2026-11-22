# Kurba · Especificación UX para la v1 (lanzamiento del lunes 23-N)

Para integrar en `transponder/curva-electoral-29n`. UX: Ander. Arquitectura e integración: Jorge.
Fecha: 20-11-2026. Base analizada: commit `aa77a82` (merge de PR #11).

## 0. Decisión

**La interfaz, el flujo y el nombre son los de Kurba. La capa de datos es la de Jorge.**

- De Kurba se toman: nombre y marca, diseño visual, flujo con entrada neutra y revelación al final, resultado por grupos, importancia Alta / Media / Ninguna, curva horizontal, fichas de los 7 partidos, recursos para seguir informándose, bilingüe ES / EU, ajuste de respuestas e imagen para compartir.
- Del repositorio de Jorge se mantienen: datos en `data/` (CSV y JSON editables en Excel), `scripts/validar_datos.py` y el workflow de CI, página de metodología, comparador de dos partidos, bloque «Cómo lo hacemos / Quiénes somos», etiqueta «2 min», descarga de datos y página de privacidad.

Acordado por WhatsApp el 20-11:

1. Por defecto se entra «limpio» al cuestionario: sin ver curvas ni comparar partidos. La revelación llega al final.
2. Hay una vía secundaria para ir directamente a las curvas sin hacer el test.
3. Se mantiene el mensaje «2 minutos».
4. Se mantiene el «about us».
5. El comparador de dos partidos se añade al final, tal como está en la versión de Jorge.

Prototipo navegable de Kurba: https://claude.ai/artifact/Xv7uqTvqUnBNu3Bg9rCM8m (público). Código fuente en `referencia/kurba-repo.zip`.

## 1. Contenido de esta entrega

| Fichero | Qué es | Uso |
| --- | --- | --- |
| `ESPECIFICACION-UX.md` | Este documento | Guía de integración, en orden P0 → P1 |
| `referencia/kurba-repo.zip` | Kurba completo: `index.html`, `css/kurba.css`, `js/app.js`, `js/data/*.js`, codebook en `docs/`, prueba de regresión | Fuente de la interfaz y del comportamiento |
| `data/propuestas.csv` | 65 propuestas con fuente, con la cabecera exacta de `propuestas.csv` | Sustituye al fichero vacío. Pasa `validar_datos.py` |
| `data/codificacion.csv` | Tu fichero con el criterio de «estimado» aplicado (34 estimadas, 43 provisionales); niveles sin cambios | Sustituye al actual. Pasa `validar_datos.py` con un aviso (ver sección 7) |
| `i18n/temas.eu.json` | 11 temas en euskera, mismos `id` que `temas.json` | Versión EU |
| `i18n/propuestas.eu.csv` | Las 65 propuestas en euskera, mismo orden | Versión EU |
| `i18n/ui.eu.json` | 111 textos de interfaz en euskera y nombres de partido en euskera | Versión EU |

Glosario de euskera fijado por Ander (hablante nativo): «A-29» para el 29-N; «EAJ-PNV»; «Podemos Ahal Dugu»; «Frente Amplio» sin traducir; importancia «Handia / Ertaina / Batere ez»; pregunta de importancia «Zenbateko garrantzia ematen diozu gai honi?».

## 2. Integración: Kurba sobre los datos de Jorge

Kurba lleva hoy los datos dentro de `js/data/partidos.js` (objetos `A`, `ED`, `S`) y `js/data/guias.js` (`RES`). La integración consiste en que esos objetos se construyan a partir de `data/` en vez de estar escritos a mano. El resto de `js/app.js` no necesita cambios si recibe los objetos con la misma forma.

| Objeto de Kurba | Origen en el repositorio | Notas |
| --- | --- | --- |
| `A[tema]` = `{n, s, q, o[5]}` | `temas.json` (`nombre`, `corto`, `pregunta`, `opciones`) | `s` es el nombre partido en dos líneas para la curva |
| `ED.eu.parties[i].s[11]` | `codificacion.csv` (`nivel`) | Orden de temas: el de `temas.json` |
| `ED.eu.parties[i].props[11][]` = `[texto, claveFuente, etiqueta]` | `propuestas.csv` | Etiqueta `p` Programa, `c` Campaña, `a` Antes del 29-N. La fuente puede ir en línea en vez de por clave |
| `S[clave]` = `{t, u}` | columnas `fuente`, `url` de `propuestas.csv` | |
| `ED.eu.parties[i]`: `n`, `sh`, `slot`, `web` | `partidos.json` (`siglas`, `color`, `web`) | Kurba asigna `slot` de color por partido |
| `note`, `prog{docs,note}`, `ppl`, `senado`, `pres`, `lead`, `otros` | **No existen en `partidos.json`** | Añadir esos campos a `partidos.json`; los valores actuales están en `js/data/partidos.js` de la referencia |
| `RES` (recursos) | **No existe** | Nuevo `data/recursos.json` a partir de `js/data/guias.js` |
| `AEU`, `PEU`, `RESEU`, `TX.eu` (euskera) | **No existe** | Nuevos ficheros a partir de `i18n/` de esta entrega y de `js/app.js` de la referencia |

Ampliar `validar_datos.py` para comprobar que cada tema y cada propuesta tienen su versión en euskera.

## 3. Flujo

```
Inicio ──► Test (11 preguntas, 2 min) ──► Resultado ──► Fichas · Comparar · Recursos
   │
   └──► (secundario) Ver las curvas sin hacer el test
```

### 3.1 Inicio (pantalla `s-start` de Kurba)

1. Marca Kurba y selector ES / EU.
2. Titular, promesa y botón principal «Empezar · 2 min». **Ya en la referencia.**
3. Mini curva ilustrativa sin partidos.
4. Tres garantías: las respuestas no salen del dispositivo; no es una encuesta; 11 temas y 7 candidaturas con fuente.
5. Enlace secundario «Ver las curvas sin hacer el test». **Ya en la referencia:** abre el resultado en modo exploración, con las pestañas Curvas, Fichas y Guías, todos los partidos visibles, sin pestaña Cercanía ni curva propia, y una barra superior «Hacer el test · 2 min».
6. Recursos para seguir informándote.
7. Bloque «Cómo lo hacemos» al final de la portada. **Ya en la referencia.** Falta «Quiénes somos», cuyo texto decide Jorge.
8. Pie: metodología, señalar un error, privacidad, descargar datos.

Ninguna curva de partido aparece por encima del pliegue ni antes del botón «Empezar».

### 3.2 Test (pantalla `s-q`)

Como en Kurba: una pregunta por pantalla, opciones barajadas sin números, «No lo tengo claro», importancia obligatoria **Alta (×2) · Media (×1) · Ninguna (×0)**, mínimo de 5 temas con peso para calcular.

### 3.3 Resultado (pantalla `s-res`)

Pestañas de Kurba: Cercanía · Curvas · Fichas · Guías.

- Cercanía: dos grupos («los más cercanos», a 8 puntos o menos del primero, y «el resto»), orden aleatorio dentro de cada grupo y empates marcados. Debajo, los temas en los que difieren los partidos cercanos, ordenados por la importancia que les dio la persona.
- Curvas: la curva de la persona con los partidos que elija, horizontal, y el bloque «Ajustar».
- Fichas: las 7, con los temas ordenados por la importancia de la persona y las propuestas con etiqueta y fuente.
- Comparador de dos partidos al final de la pestaña Fichas, con un botón «Comparar dos partidos» en Cercanía. **Ya en la referencia**, con el mismo contenido que el de Jorge: dos selectores, curvas superpuestas, «Coinciden en X de 11 temas» y tema a tema con la distancia en pasos. Funciona también en modo exploración.
- Compartir: imagen de la curva de la persona, sin partidos ni porcentajes.

### 3.4 Metodología

La página de Jorge, enlazando el codebook (`docs/codebook.html` de la referencia). Rellenar el correo de correcciones antes del lunes.

## 4. Reglas de cálculo

| Regla | Valor |
| --- | --- |
| Afinidad | 100 · (1 − Σ w·\|u − s\| / (4 · Σ w)), solo temas respondidos con w > 0 |
| Pesos | Alta 2 · Media 1 · Ninguna 0 |
| Mínimo para calcular | 5 temas con peso > 0 |
| Grupo cercano | partidos a ≤ 8 puntos del primero |
| Orden dentro de grupo | aleatorio por sesión; empates marcados |
| Casilla estimada | punto hueco y etiqueta «estimado» |

La prueba de regresión `tests/kurba-regresion.js` de la referencia calcula los indicadores del instrumento (empates, distancia al segundo, posiciones estimadas). Conviene ejecutarla en CI junto a `validar_datos.py`.

## 5. Medición durante los 6 días

Analítica sin cookies y sin datos personales: GoatCounter o Cloudflare Web Analytics. Actualizar la página de privacidad.

| Evento | Para qué |
| --- | --- |
| `visita` por idioma | Peso del euskera |
| `test_inicio` | Conversión desde la portada |
| `curvas_sin_test` | Uso de la vía secundaria |
| `test_fin` y número de temas respondidos | Abandono |
| `pestana` (cercanía, curvas, fichas, guías) | Qué se consulta tras el resultado |
| `comparar` | Uso del comparador |
| `recurso_abierto` (id) | Qué recursos interesan |
| `compartir` | Difusión |

No se registran respuestas ni qué partidos salen cercanos.

## 6. Prioridades

**P0 · para publicar el lunes**

1. Kurba como interfaz sobre `data/` (sección 2), con `propuestas.csv` y `codificacion.csv` de esta entrega.
2. Selector ES / EU con los ficheros de `i18n/`.
3. Vía secundaria a las curvas sin test, «Cómo lo hacemos», etiqueta «2 min» y comparador: ya implementados en la referencia; solo hay que conservarlos al integrar.
4. «Quiénes somos» (texto de Jorge).
5. Guías «Fechas clave» y «Debates» ya actualizadas a 20-N en la referencia (`js/data/guias.js` y su versión en euskera): horario, dónde consultar el colegio (INE), documentos válidos (Interior), entrega del voto por correo hasta el 26-N a las 14:00 (Correos) y debates pendientes. Copiarlas tal cual.
6. Correo de correcciones y «Quiénes somos»: **los decide Jorge**.
7. Analítica sin cookies (sección 5).

**P1 · primera semana**

1. Validación del euskera en CI.
2. Regresión en CI.

**P2 · después del lanzamiento**

1. Propuestas en los 8 temas incompletos: Clima, Inmigración, Derechos civiles, Euskera, Autogobierno, Industria, Fiscalidad, Trabajo.
2. Segunda codificación independiente y acuerdo por tema.
3. Candidaturas verificadas.

## 7. Decisiones tomadas por Ander (20-11)

- **Criterio de «estimado»:** el de Kurba. «Estimado» = casilla sin propuesta ni cita con fuente; «provisional» = con propuesta pero sin doble codificación. Resultado: 34 estimadas y 43 provisionales. Ya aplicado en `data/codificacion.csv` y anotado en el codebook. El validador avisa de que Podemos · Euskera (3, estimada) queda a más de un nivel de cualquier posición documentada del partido; se revisará al completar el tema Euskera.
- **Aviso de versión de prueba:** etiqueta «Beta» junto a la marca y una línea en el pie; se retira la franja amarilla. La referencia ya lleva la etiqueta.
- **Fechas clave:** reescrita con fuentes oficiales (ver P0.5).
- **Correo de correcciones y «Quiénes somos»:** los decide Jorge.

## 8. Criterios de aceptación

- En un móvil de 390 × 844 el botón «Empezar» se ve sin hacer scroll y no aparece ninguna curva de partido antes que él.
- La vía «Ver las curvas sin hacer el test» existe y no compite visualmente con «Empezar».
- Con menos de 5 temas con peso no aparece ningún porcentaje.
- Dos sesiones con las mismas respuestas pueden variar el orden dentro de los grupos, nunca su composición.
- Toda propuesta mostrada lleva etiqueta de origen y enlace.
- Cambiar de idioma conserva la pantalla y las respuestas.
- `validar_datos.py` termina con «Datos válidos» y la regresión reproduce las cifras de referencia: 34 de 77 estimadas, 19,2 % de empates en cabeza, 84,6 % con el segundo a 8 puntos o menos.
