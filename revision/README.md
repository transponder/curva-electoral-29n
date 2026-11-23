# Revisión de fuentes · v3, bloque 2

Revisión del 22 de noviembre de 2026. Qué ha cambiado en `data/`, qué tenéis que hacer vosotros y qué queda pendiente.

## Qué ha cambiado

- **Programas oficiales en las fichas.** Los siete partidos tienen ya su programa del 29-N enlazado en `programa_docs`, con la URL de la web del propio partido. PNV y EH Bildu llevan también la versión en euskera.
- **Propuestas con página.** 52 de las 66 propuestas apuntan al programa oficial, con la página en la fuente («Programa electoral del PP (29-N), pág. 53») y en el enlace (`…pdf#page=53`, que abre el PDF por esa página). Cada una se ha comprobado sobre el texto del PDF.
- **Fuentes débiles fuera.** Ya no queda ningún enlace a brainsre.news (13 propuestas), al diario chileno (diarioestrategia.cl) ni a vivirediciones.es. En las propuestas tampoco quedan enlaces a Moncloa.com, Última Hora, Diari de Tarragona, ESdiario ni a la versión en inglés de Demócrata. `validar_datos.py` da error si vuelve a aparecer alguno de los tres primeros.
- **Textos ajustados a la fuente.** Cuando el programa dice algo distinto de lo que recogía el medio, el texto de la propuesta sigue al programa. Por ejemplo: el PSOE propone 37,5 horas, no 36; el PP no da ningún porcentaje del PIB para defensa; el «rechaza la prórroga obligatoria» del PNV no aparece en su programa y se ha quitado. Los cambios están también en `i18n/propuestas.eu.csv`.
- **Una propuesta nueva.** La del PSOE «SMI cada año y pensiones en la Constitución» se ha dividido en dos: las pensiones salen del programa y la subida anual del SMI, de un mitin (Deia, 19 de octubre). Ahora hay 66 propuestas.
- **`fecha_consulta`** está rellena en las 66 propuestas y en las 43 casillas provisionales, y ahora es obligatoria.
- **43 provisionales con fuente.** Cada casilla provisional tiene la fuente, la URL y la fecha de su propuesta principal (primero la de «Programa», si no la de «Campaña», si no la de «Antes del 29-N»). Falta la cita.

## Lo que os toca: pegar las citas

Abrid `citas-provisionales.csv`, que tiene una fila por casilla provisional:

1. Abrid la `url`, que lleva directamente a la página.
2. Copiad del original una cita literal de una o dos frases que justifique el `nivel`.
3. Pegadla en la columna `cita` de esa casilla en `data/codificacion.csv`. Si la cita sale de otra fuente, cambiad también `fuente`, `url` y `fecha_consulta`.
4. Ejecutad `python3 scripts/validar_datos.py`. La última línea cuenta las provisionales que ya tienen cita.

La columna `pasaje_del_programa` (34 de 43 filas) trae el párrafo del programa ya extraído del PDF, para ir más rápido. Lo ha sacado `pdftotext`, así que **comprobadlo contra el PDF antes de pegarlo** y recortadlo a dos frases como máximo. Las 9 filas sin pasaje tienen como fuente un medio, y hay que leer el artículo.

## Citas pegadas el 23-N (issue #34): 23 de 43

Están pegadas las citas de las 23 casillas provisionales cuya fuente es el programa de **EH Bildu, PP, Vox, Frente Amplio o Podemos**. Las casillas siguen como `provisional`: para pasarlas a `validado` hacen falta vuestros dos nombres en `codificadores`.

Cómo se han sacado:

- Los PDF se han descargado de la web oficial de cada partido (las URL de la tabla de abajo). Sus páginas coinciden con las de la tabla: 30, 82, 66, 151 y 141.
- Cada cita se ha copiado del texto del PDF y se ha comprobado que aparece literal en la página citada, con un máximo de dos frases. Una página (la 130 del Frente Amplio) se ha comprobado también sobre la imagen del PDF. La `fecha_consulta` es la del 23-N.
- Dos citas siguen en la página siguiente, y la fuente lo indica: PP · sanidad (págs. 68-69) y Vox · clima (págs. 11-12).

Cuando el pasaje no justificaba bien el nivel, la cita se ha tomado de otra frase del programa. En tres casillas eso cambia la página de la `fuente` y de la `url`:

| Casilla | Antes | Ahora | Por qué |
|---|---|---|---|
| EH Bildu · autogobierno (5) | pág. 23, Euskal Herria como nación | pág. 24, «derecho a decidir del pueblo vasco» | El nivel 5 es el derecho a decidir |
| Vox · vivienda (1) | pág. 24, IVA 0 % | pág. 23, «ampliación de suelo disponible… supresión de trabas» | El nivel 1 es liberalizar suelo y quitar trámites |
| Frente Amplio · vivienda (5) | pág. 10, expropiación | pág. 11, prohibir comprar vivienda que no sea para residir | El nivel 5 incluye límites a la compra |

En otras tres la cita también es otra frase, de la misma página: EH Bildu · vivienda (prohibición de la compra especulativa), Vox · sanidad («colaboración público-privada») y Podemos · trabajo (jornada de 30 horas, empezando por 35).

Con la cita delante, siguen pendientes las dudas de nivel de más abajo: PP · defensa (5) y Frente Amplio · defensa (2).

Lo que falta:

- **PNV (6) y PSE-EE (5).** Sus webs devuelven una página de verificación anti-bots en lugar del PDF, así que no se han podido comprobar desde el entorno automático. Hay que pegarlas a mano con `pasaje_del_programa`.
- **9 casillas con fuente en un medio** (PNV · euskera y defensa, PSE-EE · defensa, Vox · autogobierno, trabajo, derechos civiles y defensa, Frente Amplio · sanidad, Podemos · sanidad). Hay que leer el artículo o, mejor, buscar la propuesta en el programa.

## Comprobad una vez los enlaces oficiales

Desde el entorno en el que se hizo la revisión no se podía abrir las webs de los partidos. Los textos se han comprobado con los PDF archivados en [jynus/programas-electorales-29n-generales-2026](https://github.com/jynus/programas-electorales-29n-generales-2026), que guarda el original de cada programa, su URL oficial y su suma SHA-256. Las sumas coinciden. Aun así, abrid estos enlaces una vez y confirmad que es el mismo documento y que la página cuadra:

| Partido | Programa | Páginas |
|---|---|---|
| PNV | <https://www.eaj-pnv.eus/es/adjuntos-documentos/21765/pdf/programa-electoral-29n> (euskera: `/eu/adjuntos-agiriak/21765/pdf/hauteskunde-programa-a29`) | 43 |
| EH Bildu | <https://posibleegin.ehbildu.eus/wp-content/uploads/2026/11/PROGRAMA-CAS.pdf> (euskera: `PROGRAMA-EUS.pdf`) | 30 |
| PSOE (PSE-EE) | <https://www.psoe.es/media-content/2026/11/PROGRAMAPSOE29N26.pdf> | 114 |
| PP | <https://www.pp.es/wp-content/uploads/2026/11/LA-RECONSTRUCCION-NACIONAL.pdf> | 82 |
| Vox | <https://www.voxespana.es/wp-content/uploads/2026/11/Programa-completo-A5-1.pdf> | 66 |
| Frente Amplio | <https://frenteamplio.info/pdf/ProgramaFrenteAmplio.pdf> | 151 |
| Podemos | <https://pazcasaytrabajo.es/programa-electoral/programa-electoral-paz-casa-y-trabajo.pdf> | 141 |

La página citada es la del PDF, la que muestra el visor, no la impresa. En el PSOE la impresa es una más.

Dudas concretas:

- **Podemos**: el programa está en pazcasaytrabajo.es, no en podemos.info. Confirmad que es su web de campaña.
- **Vox**: el plan de desregulación de junio enlaza ahora al PDF de voxespana.es (`/2026/06/Programa-2026-envio.pdf`), no a la copia de El Independiente. Comprobad que es el mismo documento.
- **PP**: el «Contrato con España» sigue enlazado a la copia de El Debate; no lo hemos encontrado en pp.es.

## Niveles que convendría revisar (no se han cambiado)

Con el programa delante, algunas valoraciones parecen desajustadas. Decididlo vosotros:

- **Frente Amplio · defensa (2).** El programa (pág. 130) propone «una reducción efectiva de las partidas militares», que corresponde a la opción 1.
- **PP · defensa (5).** El programa no da ninguna cifra del PIB (pág. 26). Lo que propone es una ley de programación y la industria de defensa, más cerca de la opción 4.
- **PP · trabajo y pensiones (estimado 2).** El punto 108 (págs. 42-43) garantiza que las pensiones «suban cada año con el IPC». Pasaría a provisional, probablemente en 3 o 4.

## Estimadas que el programa ya permite documentar

Para las 34 casillas estimadas, estas son las que tienen una propuesta clara en el programa. Si las añadís a `propuestas.csv` (y a `propuestas.eu.csv`), pueden pasar a provisional:

| Casilla | Dónde | Qué dice |
|---|---|---|
| Vox · euskera (1) | pág. 37 | «Garantizar que el desconocimiento de las lenguas regionales no sea en ningún caso impedimento para el acceso por oposición a plazas de personal sanitario…» |
| PP · euskera (1) | pág. 39 | «Garantizaremos el derecho a recibir enseñanza en castellano en toda España» |
| EH Bildu · trabajo (5) | pág. 6 | «Reducción de la jornada laboral hasta las 32 horas semanales o la jornada de 4 días sin reducción salarial» |
| EH Bildu · inmigración (1) | pág. 20 | «Regularización y nueva Ley de Extranjería: Garantizar una regularización efectiva, accesible y estable» |
| EH Bildu · derechos civiles (5) | pág. 19 | «Blindar el derecho al aborto» |
| PNV · inmigración (3) | pág. 23 | «Queremos gestionar la migración desde Euskadi, con más capacidad de decisión…» |
| PSE-EE · euskera (3) | pág. 91 | Usar las lenguas cooficiales en la atención de la Administración General del Estado (punto 385) |
| Frente Amplio · trabajo (5) | pág. 7 | «Avanzaremos hacia la jornada laboral máxima de 32 horas semanales sin reducción salarial» |
| Frente Amplio · inmigración (1) | pág. 126 | Capítulo «Procedimientos estables de regularización y vías legales y seguras» |

Ni el Frente Amplio ni Podemos mencionan el euskera en su programa: sus casillas de euskera tienen que seguir como estimadas.

## Fuentes que aún se pueden mejorar

- 14 propuestas no enlazan al programa porque son de campaña o anteriores al 29-N: 12 a medios y 2 a documentos oficiales (una nota del Ministerio de Sanidad y un documento del PP de enero). Las más flojas son Onda Vasca (2), Orain en inglés (1), The Objective de 2025 (1), Vozpópuli (1) y Demócrata (1, los 40.000 sanitarios y docentes de Podemos).
- **Personas (hecho):** las 22 candidaturas de las fichas remiten al BOE de candidaturas proclamadas ([BOE-A-2026-23103](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23103), 3 de noviembre), con la página de cada lista. Todas se han comprobado en el texto del BOE, y la corrección de errores del 7 de noviembre no afecta a Araba, Bizkaia ni Gipuzkoa. La fuente anterior se conserva como fuente de la biografía (`fuente_bio`, `url_bio`). Algunas de esas biografías siguen apoyadas en Moncloa.com y en Demócrata en inglés, y convendría pasarlas a EITB o Deia. Los cuatro dirigentes que no son candidatos (Otegi, Esteban, De Andrés, Andueza) mantienen su fuente.
- **Senado de Progreso:** según el BOE, la coalición PSOE-EZAN IU-MS presenta lista al Senado también en Araba (Daniel Senderos, Paula Somalo, Adolfo Lander). Por eso se ha corregido el «no presenta lista al Senado por Álava» del Frente Amplio. Falta confirmar qué partido propone a cada candidato de Araba.
- La `fecha_consulta` de las propuestas que no se han tocado es la de su entrada en el repositorio (22 de noviembre). No es una nueva consulta del enlace. El workflow «Validar datos» comprueba en cada PR que los enlaces siguen respondiendo.
