# Kurba frente a la competencia: gaps y plan de trabajo

Análisis del 23 de noviembre de 2026, a seis días de la votación. La congelación de datos es el 24-N (`data/meta.json`).

- **Kurba:** www.kurba29n.com, este repositorio (v3, datos del 22-N).
- **Referencia:** el principal test electoral competidor, de ámbito estatal: portada, configuración del test y el resto de sus secciones, con datos de la semana anterior. Revisé su HTML, sus datos y su código.

## 1. Resumen

La referencia es un producto de ámbito estatal y con mucha profundidad: un centenar largo de preguntas, todas las candidaturas relevantes de todas las provincias, cientos de páginas indexables y un resultado que explica su propio cálculo. Kurba es un producto de nicho: está pensado para Euskadi, es bilingüe, se hace en 2 minutos y tiene un gráfico propio (la curva).

Kurba no puede igualar esa profundidad en seis días, y tampoco debe intentarlo. Lo que sí puede hacer antes del domingo es cerrar los gaps que frenan la confianza y el uso:

1. **Datos sin validar.** Hoy no hay ni una casilla `validado`: 43 son provisionales y 34 estimadas. La web lo muestra con el aviso «Datos provisionales». En la referencia, la mayoría de las posturas de los partidos principales tienen fuente documental.
2. **Propuesta de valor poco clara al llegar.** «Tu curva de valor electoral» no dice qué gana la persona ni por qué Kurba y no un test estatal. Además, el título no contiene lo que la gente busca («test político 29N», «con qué partido coincido»).
3. **Resultado que se pierde y apenas se comparte.** Las respuestas no se guardan (no se usa `localStorage`), no hay enlace al resultado y no hay forma de compararse con otra persona. La referencia guarda el progreso, ofrece un enlace al resultado, invita a compararse con otra persona y comparte una imagen con `navigator.share`.
4. **Utilidad práctica para la semana electoral.** La referencia pone en portada lo esencial para votar el domingo y tiene calendario, simulador D'Hondt y agenda de debates con fuentes. En Kurba la guía de debates se quedó en el 20-N.

Lo que diferencia a Kurba y hay que reforzar: está hecho para Euskadi y en euskera, tiene temas vascos propios (autogobierno, Concierto, euskera), guías del Concierto, del Estatuto y del Senado, candidaturas tomadas del BOE, la curva como gráfico y un test de 2 minutos.

## 2. Comparativa

| Dimensión | Kurba | Referencia | Gap |
|---|---|---|---|
| Ámbito | Araba, Bizkaia y Gipuzkoa | Toda España | Ventaja de Kurba si se explica |
| Idiomas | Castellano y euskera | Solo castellano | **Ventaja de Kurba** |
| Candidaturas | 7 con curva | Varias decenas en total; en Euskadi, además de las 7 de Kurba, varias candidaturas minoritarias | Faltan las demás candidaturas proclamadas, al menos como listado |
| Preguntas | 11, una por tema, 5 opciones | Más de cien en una docena de áreas; varias versiones, de una rápida a una completa; tests cortos por tema | Profundidad (después del 29-N) |
| Formato de respuesta | 5 opciones en orden aleatorio, «No lo tengo claro», importancia Alta/Media/Ninguna | Escala de acuerdo, opción de no saber, marca de importancia por pregunta, dilemas y algunas áreas prioritarias que pesan más | Equivalente; falta el contexto neutral |
| Contexto por pregunta | No tiene | Contexto desplegable con argumentos de ambos lados | **Gap** |
| Guardar progreso | No (se pierde al recargar) | Guarda el progreso; se puede ampliar el test sin perder respuestas | **Gap** |
| Resultado | % de cercanía, «los más cercanos», curva comparada, «Qué separa a tus más cercanos», ajuste en vivo | % por candidatura, perfil ideológico en varias dimensiones, mapa 2D, coincides o discrepas con la fuente de cada postura, por temas, más lejanas | Falta la explicación por partido con fuente (#5) |
| Solidez del resultado | Empates y grupo a 8 puntos | Recalcula con un segundo método, avisa de empates y dice cuánto fiarse del resultado | Gap medio |
| Compartir | Imagen (canvas) y «Copiar resumen» | Imagen + `navigator.share` + WhatsApp + enlace al resultado + «reto» para compararse con otra persona | **Gap** (#10 y reto) |
| Comparar partidos | `#/comparar/a/b` | Comparar en el test y una decena de comparativas indexables (incluye PNV–Bildu) | Faltan comparativas indexables |
| Comparar con personas | Candidaturas del BOE, sin comparación | Compara con lo que ha defendido cada político | Gap bajo |
| Cómo votar | Guía «votar» | Bloque en portada, guía completa (mesa electoral, voto por correo, CERA, braille y discapacidad) y calendario completo | Falta el bloque en portada y el calendario |
| Debates | Guía de texto a 20-N | Agenda con fuentes, buscador, próximos y emitidos, enlace a las posturas | **Gap** (desactualizado) |
| Escaños | Guía del Congreso (4, 8 y 6 diputados) | Simulador D'Hondt por provincia | Gap medio |
| Divulgación | Concierto, Estatuto, Senado, «Cómo usar este resultado» | Glosario y explicaciones breves de las instituciones (investidura, moción de censura…) | Contenido para después del 29-N |
| Programas | Programa enlazado en cada ficha | Página de programas con el estado de cada uno y cuántas posturas se han revisado con él | Falta una página única |
| Metodología | Página completa; `sensibilidad.py` y tests (no se ven en la web) | Pruebas publicadas (responder como cada partido, perfiles al azar, sesgo hacia el centro) y tabla de posturas con fuente por candidatura | Publicar las pruebas |
| Correcciones | Correo y plantilla de issue | Enlace para avisar de un error en cada postura, con correo ya rellenado | Gap bajo |
| SEO | 7 páginas de partido, metodología y páginas legales | Cientos de URL (una por pregunta, provincia, tema y comparativa…), FAQ con `FAQPage` en JSON-LD, títulos con la palabra clave | **Gap** |
| Difusión | No tiene | Página de prensa, textos para citar, imágenes, botón para enlazar, mini test en iframe | Gap medio |
| Privacidad | Sin cookies; GoatCounter; respeta DNT/GPC | Sin cookies; GoatCounter; CSP estricta | Paridad (Kurba respeta DNT/GPC) |
| Financiación | Sin actividad económica | Donaciones | No copiar |

## 3. Gaps por eje

### 3.1 Funcional

- **F1. Persistencia.** Las respuestas no se guardan en el navegador. Si la persona recarga o vuelve desde otra pestaña, pierde el test.
- **F2. Resultado explicable.** Falta «coincidís en…, discrepáis en…» por partido con enlace a la fuente. Ya está en #5, que sigue abierta.
- **F3. Compartir y reto.** Faltan la tarjeta vertical (#10), `navigator.share` con archivo y un enlace «compárate conmigo» que muestre en qué temas coinciden dos personas. Las respuestas solo deben ir en la URL si la persona lo elige.
- **F4. Solidez.** Falta un aviso de cuánto fiarse del resultado (temas respondidos, empate, segundo método).
- **F5. Simulador de escaños** para Araba, Bizkaia y Gipuzkoa.
- **F6. Aviso de error en cada posición**, con un `mailto` que ya lleve el partido y el tema.
- **F7. Profundidad** (después del 29-N): más preguntas por tema, versiones del test y tests por tema.

### 3.2 Contenido

- **C1. Validar los datos antes de la congelación.** Hay que pegar las citas de las 43 casillas provisionales y revisar las 34 estimadas (`revision/citas-provisionales.csv`).
- **C2. Otras candidaturas.** Hay que listar las candidaturas proclamadas en el BOE en cada circunscripción vasca que no tienen curva, y decir por qué no la tienen. `partidos.json` ya tiene `sin_curva`, pero está vacío.
- **C3. Contexto neutral** por tema: dos o tres frases de hechos, más un argumento a favor y otro en contra, en castellano y euskera.
- **C4. Semana electoral.** Falta el bloque «Cómo votar el 29-N» en portada, el calendario con fuentes y la guía de debates actualizada.
- **C5. Página de programas** con el estado de cada uno.
- **C6. Pruebas de la metodología** publicadas en la web (sensibilidad y responder como cada partido) y una tabla con el estado de las fuentes por partido.
- **C7. Contenido para después del 29-N:** investidura, pactos posibles y cómo leer el resultado real frente a la curva.

### 3.3 Propuesta de valor

- **V1. Mensaje.** El titular tiene que decir el beneficio y para quién: «¿Con qué partido coincides en Euskadi? El test del 29-N en 2 minutos, en castellano y euskera». «Curva de valor» puede quedar como el nombre del gráfico.
- **V2. «¿Por qué Kurba?»** Hay que decir explícitamente lo que no ofrece un test estatal: temas vascos (Concierto, autogobierno, euskera), las candidaturas de tu provincia vasca, el Senado y el euskera.
- **V3. Confianza.** Hay que sustituir «Datos provisionales» por contadores reales («N posiciones con cita del programa») en cuanto se validen, y añadir unas preguntas frecuentes visibles.
- **V4. SEO y difusión.** Faltan palabras clave en el título y la descripción, un `FAQPage`, páginas indexables por tema y comparativas (PNV–EH Bildu, PSE-EE–PP…), y un kit para medios y universidades vascas.

### 3.4 Qué no copiar (diferenciación deliberada)

- **El perfil ideológico en varias dimensiones o el mapa ideológico.** Kurba ha elegido no poner etiquetas («1 y 5 no significan izquierda o derecha»). La curva es su seña de identidad.
- **Donaciones.** El titular declara que no hay ninguna actividad económica.
- **Ampliar el ámbito al Estado.** El nicho vasco y bilingüe es la ventaja de Kurba.

## 4. Plan por fases

| Fase | Fechas | Objetivo | Issues |
|---|---|---|---|
| 0 · Congelación | Hasta el 24-N | Datos verificables y candidaturas completas | K01, K02 |
| 1 · Campaña | 24 a 27-N (máximo tráfico) | Que quien llega entienda el valor, termine el test, no lo pierda y lo comparta | K03 a K11, #5, #10 |
| 2 · Reflexión y votación | 28 y 29-N | Utilidad práctica: dónde y cómo votar hoy, escaños | K12, K13 |
| 3 · Después del 29-N | Desde el 30-N | Contenido sobre el resultado y la investidura; preparar la próxima edición | K14 a K18 |

Criterios: (1) lo que afecta a la confianza va antes que las funciones nuevas; (2) en la fase 1, solo cambios pequeños que no toquen `cercania.js` sin aprobación; (3) todo texto nuevo, en castellano y euskera (#23); (4) todo dato nuevo, con fuente y `fecha_consulta`, y validado por `validar_datos.py`.

Métricas en GoatCounter, de un día para otro: visitas a la portada → test empezado → test terminado → compartido; tráfico orgánico; vuelta a `#/resultado`.

## 5. Issues

Las issues abiertas ya cubren parte de los gaps: #3 (anclas de la escala), #5 (resultado explicable), #7 (gráfico accesible), #10 (tarjeta vertical) y #23 (euskera). Las nuevas las mencionan para no duplicarlas.

| ID | Issue | Título | Etiquetas | Fase | Prioridad |
|---|---|---|---|---|---|
| K01 | #34 | Validar las posiciones antes de la congelación: citas de las 43 provisionales y revisión de las 34 estimadas | datos, confianza | 0 | P0 |
| K02 | #35 | Listar todas las candidaturas proclamadas en Araba, Bizkaia y Gipuzkoa, también las que no tienen curva | datos, visitante, confianza | 0 | P0 |
| K03 | #36 | Portada: propuesta de valor clara y «¿Por qué Kurba?» frente a un test estatal | visitante, seo | 1 | P0 |
| K04 | #37 | Guardar las respuestas en el navegador y retomar el test | test, ingeniería | 1 | P0 |
| K05 | #38 | SEO para la semana electoral: título, descripción, FAQ con `FAQPage` y páginas por tema | seo, difusión | 1 | P1 |
| K06 | #39 | Contexto neutral en cada pregunta del test (hechos y un argumento a favor y otro en contra) | test, visitante, confianza, requiere-aprobación | 1 | P1 |
| K07 | #40 | «Compárate conmigo»: enlace opcional para comparar dos curvas | difusión, visitante | 1 | P1 |
| K08 | #41 | Bloque «Cómo votar el 29-N» en portada y calendario electoral con fuentes | visitante, confianza | 1 | P1 |
| K09 | #42 | Actualizar la guía de debates hasta el 27-N y fecharla | visitante, datos | 1 | P1 |
| K10 | #43 | Kit de difusión: página de prensa, textos para citar e imágenes | difusión | 1 | P2 |
| K11 | #44 | Enlace para avisar de un error en cada posición con el correo ya rellenado | confianza, datos | 1 | P2 |
| K12 | #45 | Simulador de escaños D'Hondt para Araba, Bizkaia y Gipuzkoa | visitante, algoritmo | 2 | P2 |
| K13 | #46 | Modo jornada electoral (28 y 29-N): portada orientada a votar | visitante | 2 | P1 |
| K14 | #47 | Publicar en la web las pruebas de la metodología y el estado de las fuentes por partido | confianza, algoritmo | 3 | P2 |
| K15 | #48 | Aviso de solidez del resultado (cuánto fiarte) | algoritmo, requiere-aprobación | 3 | P2 |
| K16 | #49 | Página de programas electorales con el estado de cada uno | datos, seo | 3 | P3 |
| K17 | #50 | Después del 29-N: resultados, investidura y «tu curva frente al resultado» | visitante, difusión | 3 | P2 |
| K18 | #51 | Próxima edición: más preguntas por tema, versiones del test y tests por tema | test, algoritmo | 3 | P3 |

Creadas en GitHub el 23-N con las etiquetas `competencia`, `P0`–`P3` y `fase-0`–`fase-3`, y un hito por fase. El detalle de cada issue (problema, propuesta y criterio de aceptación) está en [`issues-gaps.json`](issues-gaps.json).
