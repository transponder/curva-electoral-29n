#!/usr/bin/env python3
"""Valida los datos de la web antes de publicarlos.

Uso:  python3 scripts/validar_datos.py [carpeta_de_datos]

Sin dependencias: solo la biblioteca estándar de Python 3.8+.
Devuelve 0 si no hay errores y 1 si los hay. Los avisos no hacen fallar la validación.
"""
import csv
import json
import re
import sys
from pathlib import Path

CABECERA = ["partido", "tema", "nivel", "estado", "cita", "fuente", "url",
            "fecha_consulta", "codificadores", "nota"]
CABECERA_PROPUESTAS = ["partido", "tema", "etiqueta", "texto", "fuente", "url", "fecha_consulta"]
ESTADOS = {"validado", "provisional", "estimado"}
ETIQUETAS = {"Programa", "Campaña", "Antes del 29-N"}
ETIQUETAS_EU = {"Programa": "Programa", "Campaña": "Kanpaina", "Antes del 29-N": "A-29 aurretik"}
FECHA = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MAX_FRASES_CITA = 2
FORMAS = {"circle", "square", "triup", "diamond", "tridown", "penta", "cross"}
COLOR = re.compile(r"^#[0-9A-Fa-f]{6}$")
# Fuentes descartadas en la revisión de noviembre de 2026: agregadores, medios sin relación con
# la elección o copias de terceros de notas de agencia. Se sustituyen por el programa oficial o
# por un medio de referencia (EITB, Deia, El Correo, EFE, Europa Press…).
DOMINIOS_DESCARTADOS = {"brainsre.news", "diarioestrategia.cl", "vivirediciones.es"}
PROVINCIAS = ("araba", "bizkaia", "gipuzkoa")
CAMARAS = ("congreso", "senado")
BOE_PROCLAMACION = re.compile(r"^https://www\.boe\.es/boe/dias/\d{4}/\d{2}/\d{2}/pdfs/BOE-A-\d{4}-\d+\.pdf#page=\d+$")
# Textos del bloque «Otras candidaturas»: tienen que estar en castellano y en euskera (error, no aviso).
CLAVES_OBLIGATORIAS_EU = ("oc_h", "oc_s", "oc_por", "oc_araba", "oc_bizkaia", "oc_gipuzkoa", "oc_cong", "oc_sen",
                          "oc_y", "oc_cuenta", "oc_boe", "oc_web", "oc_fuente")


def dominio_descartado(url):
    host = re.sub(r"^https?://", "", url or "").split("/")[0].lower()
    return next((d for d in DOMINIOS_DESCARTADOS if host == d or host.endswith("." + d)), None)


def n_frases(texto):
    """Cuenta frases de forma aproximada: trozos separados por . ! ? seguidos de espacio."""
    return len([t for t in re.split(r"(?<=[.!?…])\s+", texto.strip()) if t])


def n_codificadores(valor):
    return len([c for c in re.split(r"[;,+/]", valor) if c.strip()])


def validar_euskera(carpeta, temas, propuestas, err):
    """Cada tema, cada propuesta y la interfaz tienen que tener su versión en euskera."""
    ruta = carpeta / "temas.eu.json"
    if not ruta.exists():
        err("i18n/temas.eu.json: falta el fichero")
    else:
        eu = {t.get("id"): t for t in json.loads(ruta.read_text(encoding="utf-8"))}
        for t in temas:
            te = eu.get(t.get("id"))
            if not te:
                err(f"i18n/temas.eu.json: falta el tema «{t.get('id')}»")
                continue
            for campo in ("nombre", "codigo", "pregunta"):
                if not (te.get(campo) or "").strip():
                    err(f"i18n/temas.eu.json: el tema «{t['id']}» no tiene «{campo}»")
            if len(te.get("opciones", [])) != 5 or not all(isinstance(o, str) and o.strip() for o in te.get("opciones", [])):
                err(f"i18n/temas.eu.json: el tema «{t['id']}» debe tener exactamente 5 opciones con texto")
        for i in eu:
            if i not in {t.get("id") for t in temas}:
                err(f"i18n/temas.eu.json: tema «{i}» que no existe en temas.json")

    ruta = carpeta / "propuestas.eu.csv"
    if not ruta.exists():
        if propuestas:
            err("i18n/propuestas.eu.csv: falta el fichero")
    else:
        with open(ruta, encoding="utf-8-sig", newline="") as f:
            lector = csv.DictReader(f)
            if lector.fieldnames != ["partido", "tema", "etiqueta", "texto"]:
                err("i18n/propuestas.eu.csv: la cabecera debe ser exactamente partido,tema,etiqueta,texto")
                return
            filas = list(lector)
        if len(filas) != len(propuestas):
            err(f"i18n/propuestas.eu.csv: tiene {len(filas)} propuestas y propuestas.csv tiene {len(propuestas)}; deben ir en el mismo orden, una por una")
        for n, (r, es) in enumerate(zip(filas, propuestas), start=2):
            if (r["partido"], r["tema"], r["etiqueta"]) != (es[0], es[1], ETIQUETAS_EU.get(es[2])):
                err(f"i18n/propuestas.eu.csv línea {n}: no corresponde a la línea {n} de propuestas.csv ({es[0]} · {es[1]} · {ETIQUETAS_EU.get(es[2], es[2])})")
            if not (r["texto"] or "").strip():
                err(f"i18n/propuestas.eu.csv línea {n}: falta el «texto»")

    ruta = carpeta / "ui.eu.json"
    if not ruta.exists():
        err("i18n/ui.eu.json: falta el fichero")
    else:
        ui = json.loads(ruta.read_text(encoding="utf-8")).get("ui", {})
        vacios = [k for k, v in ui.items() if not (isinstance(v, str) and v.strip())]
        if not ui or vacios:
            err(f"i18n/ui.eu.json: textos vacíos o ausentes: {', '.join(vacios) or 'todos'}")


def validar_recursos_y_partidos_eu(carpeta, partidos, err, avisos):
    """Guías (recursos.json) y fichas de partido en euskera."""
    ruta = carpeta / "recursos.json"
    recursos = json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else []
    if not ruta.exists():
        err("recursos.json: falta el fichero")
    ids = [r.get("id") for r in recursos]
    if len(set(ids)) != len(ids):
        err("recursos.json: hay ids de guía repetidos")
    for r in recursos:
        for campo in ("id", "titulo", "pregunta"):
            if not (r.get(campo) or "").strip():
                err(f"recursos.json: la guía «{r.get('id')}» no tiene «{campo}»")
        if not r.get("cuerpo"):
            err(f"recursos.json: la guía «{r.get('id')}» no tiene «cuerpo»")
        for f in r.get("fuentes", []):
            if not f.get("fuente") or not str(f.get("url", "")).startswith("https://"):
                err(f"recursos.json: cada fuente de la guía «{r.get('id')}» necesita «fuente» y una «url» https://")
    ruta = carpeta / "i18n" / "recursos.eu.json"
    eu = json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else {}
    for r in recursos:
        e = eu.get(r.get("id"))
        if not e or not all((e.get(c) or "") for c in ("titulo", "pregunta", "cuerpo")):
            err(f"i18n/recursos.eu.json: falta la guía «{r.get('id')}» en euskera (titulo, pregunta y cuerpo)")

    ruta = carpeta / "i18n" / "partidos.eu.json"
    eu = json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else {}
    for p in partidos.get("codificados", []):
        e = eu.get(p.get("id"))
        if not e:
            err(f"i18n/partidos.eu.json: falta el partido «{p.get('id')}»")
            continue
        if p.get("nota") and not e.get("nota"):
            err(f"i18n/partidos.eu.json: «{p['id']}» no tiene «nota»")
        for lista in ("personas", "otros"):
            if len(e.get(lista, [])) != len(p.get(lista, [])):
                err(f"i18n/partidos.eu.json: «{p['id']}» tiene {len(e.get(lista, []))} «{lista}» y partidos.json tiene {len(p.get(lista, []))}")

    # Textos de interfaz: los que falten en euskera salen en castellano (aviso, no error).
    es = json.loads((carpeta / "i18n" / "ui.es.json").read_text(encoding="utf-8")).get("ui", {}) if (carpeta / "i18n" / "ui.es.json").exists() else {}
    claves = set(es)
    html = carpeta.parent / "index.html"
    if html.exists():
        claves |= set(re.findall(r'data-(?:t|th|ta|talt)="([^"]+)"', html.read_text(encoding="utf-8")))
    ui_eu = json.loads((carpeta / "i18n" / "ui.eu.json").read_text(encoding="utf-8")).get("ui", {}) if (carpeta / "i18n" / "ui.eu.json").exists() else {}
    faltan = sorted(claves - set(ui_eu))
    if faltan:
        avisos.append(f"i18n/ui.eu.json: {len(faltan)} textos sin traducir (salen en castellano): {', '.join(faltan)}")


def validar_candidaturas(partidos, err):
    """Candidaturas sin curva («sin_curva») y papeletas de cada provincia, sacadas del BOE de proclamación.
    Cada candidatura de las papeletas tiene que ser un partido con curva o estar en «sin_curva», y al revés:
    así no puede faltar ninguna en la web."""
    cod = {p.get("id"): p for p in partidos.get("codificados", [])}
    for p in cod.values():
        r = p.get("representacion") or {}
        if not all((r.get(c) or "").strip() for c in ("texto", "fuente", "url")) or not r.get("url", "").startswith("https://"):
            err(f"partidos.json: «{p.get('id')}» necesita «representacion» con texto, fuente y url https:// (criterio para tener curva)")
    sin = {}
    for n, o in enumerate(partidos.get("sin_curva", []), start=1):
        i = o.get("id")
        if not i or i in cod or i in sin:
            err(f"partidos.json: «sin_curva» n.º {n}: id vacío, repetido o de un partido con curva («{i}»)")
            continue
        sin[i] = o
        for campo in ("siglas", "nombre"):
            if not (o.get(campo) or "").strip():
                err(f"partidos.json: «sin_curva» «{i}» no tiene «{campo}»")
        if o.get("web") and (not o["web"].startswith("https://") or dominio_descartado(o["web"])):
            err(f"partidos.json: la web de «{i}» debe empezar por https:// y no ser una fuente descartada")
        if not o.get("listas"):
            err(f"partidos.json: «sin_curva» «{i}» no tiene «listas»")
        for l in o.get("listas", []):
            if l.get("provincia") not in PROVINCIAS or l.get("camara") not in CAMARAS:
                err(f"partidos.json: «{i}»: lista con provincia o cámara no válida ({l.get('provincia')}, {l.get('camara')})")
            if not BOE_PROCLAMACION.match(l.get("url", "")):
                err(f"partidos.json: «{i}»: la url de cada lista debe ser el PDF del BOE con #page=N")
    pap = partidos.get("papeletas") or {}
    if sin and not pap:
        err("partidos.json: falta «papeletas»")
        return
    aparece = {i: set() for i in sin}
    for prov in PROVINCIAS:
        for cam in CAMARAS:
            x = (pap.get(prov) or {}).get(cam)
            if not x:
                err(f"partidos.json: falta «papeletas.{prov}.{cam}»")
                continue
            if not BOE_PROCLAMACION.match(x.get("url", "")):
                err(f"partidos.json: «papeletas.{prov}.{cam}»: la url debe ser el PDF del BOE con #page=N")
            if cam == "senado" and not (isinstance(x.get("personas"), int) and x["personas"] > 0):
                err(f"partidos.json: «papeletas.{prov}.senado» necesita «personas» (número de titulares)")
            vistos = []
            for c in x.get("candidaturas", []):
                ids = c if isinstance(c, list) else [c]
                for i in ids:
                    if i in sin:
                        aparece[i].add((prov, cam))
                    elif i not in cod:
                        err(f"partidos.json: «papeletas.{prov}.{cam}»: «{i}» no es un partido con curva ni está en «sin_curva»")
                vistos += ids
            if len(set(vistos)) != len(vistos):
                err(f"partidos.json: «papeletas.{prov}.{cam}» repite alguna candidatura")
    for i, o in sin.items():
        listas = {(l.get("provincia"), l.get("camara")) for l in o.get("listas", [])}
        if listas != aparece[i]:
            err(f"partidos.json: «{i}»: sus «listas» ({sorted(listas)}) no coinciden con las «papeletas» ({sorted(aparece[i])})")


def validar_claves_eu(carpeta, err):
    for lengua in ("es", "eu"):
        ruta = carpeta / "i18n" / f"ui.{lengua}.json"
        ui = json.loads(ruta.read_text(encoding="utf-8")).get("ui", {}) if ruta.exists() else {}
        faltan = [k for k in CLAVES_OBLIGATORIAS_EU if not (isinstance(ui.get(k), str) and ui[k].strip())]
        if faltan:
            err(f"i18n/ui.{lengua}.json: faltan textos de «Otras candidaturas»: {', '.join(faltan)}")


def pendientes_de_publicar(carpeta, err, avisos):
    """Lo que tiene que estar relleno para publicar: sin esto la web enseña textos «pendiente»."""
    meta = json.loads((carpeta / "meta.json").read_text(encoding="utf-8"))
    for campo, que in (("contacto_correcciones", "correo de correcciones"), ("titular", "titular de la web (aviso legal)")):
        if not (meta.get(campo) or "").strip():
            err(f"meta.json: falta «{campo}» ({que}): la web lo mostraría como pendiente")
    correo = (meta.get("contacto_correcciones") or "").strip()
    if correo and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[a-z]{2,}", correo):
        err(f"meta.json: «contacto_correcciones» no parece un correo: {correo}")
    gc = (meta.get("goatcounter") or "").strip()
    if not gc:
        avisos.append("meta.json: falta «goatcounter» (código de GoatCounter): la analítica está apagada")
    q = meta.get("quienes_somos") or {}
    for lengua in ("es", "eu"):
        if not (q.get(lengua) or "").strip():
            err(f"meta.json: falta «quienes_somos.{lengua}»")


def validar(carpeta):
    errores, avisos = [], []
    err = errores.append

    temas = json.loads((carpeta / "temas.json").read_text(encoding="utf-8"))
    partidos = json.loads((carpeta / "partidos.json").read_text(encoding="utf-8"))
    json.loads((carpeta / "meta.json").read_text(encoding="utf-8"))

    ids_tema = [t.get("id") for t in temas]
    ids_partido = [p.get("id") for p in partidos.get("codificados", [])]
    if len(set(ids_tema)) != len(ids_tema):
        err("temas.json: hay ids de tema repetidos")
    if len(set(ids_partido)) != len(ids_partido):
        err("partidos.json: hay ids de partido repetidos")
    for t in temas:
        for campo in ("id", "nombre", "corto", "codigo", "pregunta"):
            if not t.get(campo):
                err(f"temas.json: el tema «{t.get('id')}» no tiene «{campo}»")
        if len(t.get("opciones", [])) != 5 or not all(isinstance(o, str) and o.strip() for o in t.get("opciones", [])):
            err(f"temas.json: el tema «{t.get('id')}» debe tener exactamente 5 opciones con texto")
    for p in partidos.get("codificados", []):
        for campo in ("id", "siglas", "nombre", "color"):
            if not p.get(campo):
                err(f"partidos.json: el partido «{p.get('id')}» no tiene «{campo}»")
        if p.get("color") and not COLOR.match(p["color"]):
            err(f"partidos.json: el color de «{p.get('id')}» debe tener el formato #RRGGBB")
        if p.get("color_oscuro") and not COLOR.match(p["color_oscuro"]):
            err(f"partidos.json: el color_oscuro de «{p.get('id')}» debe tener el formato #RRGGBB")
        if p.get("forma") not in FORMAS:
            err(f"partidos.json: la «forma» de «{p.get('id')}» debe ser una de {', '.join(sorted(FORMAS))}")
        for campo in ("web",):
            if p.get(campo) and not p[campo].startswith("https://"):
                err(f"partidos.json: «{campo}» de «{p.get('id')}» debe empezar por https://")
        for d in p.get("programa_docs", []):
            if not d.get("titulo") or not str(d.get("url", "")).startswith("https://"):
                err(f"partidos.json: cada documento de «programa_docs» de «{p.get('id')}» necesita «titulo» y una «url» https://")
            if dominio_descartado(d.get("url")):
                err(f"partidos.json: «programa_docs» de «{p.get('id')}»: {dominio_descartado(d['url'])} es una fuente descartada")
        for lista, campos in (("personas", ("nombre", "cargo", "fuente", "url")), ("otros", ("texto", "etiqueta", "fuente", "url"))):
            for n, x in enumerate(p.get(lista, []), start=1):
                for campo in campos:
                    if not (x.get(campo) or "").strip():
                        err(f"partidos.json: «{lista}» n.º {n} de «{p.get('id')}» no tiene «{campo}»")
                if x.get("url") and not x["url"].startswith("https://"):
                    err(f"partidos.json: «{lista}» n.º {n} de «{p.get('id')}»: la url debe empezar por https://")
                if dominio_descartado(x.get("url")):
                    err(f"partidos.json: «{lista}» n.º {n} de «{p.get('id')}»: {dominio_descartado(x['url'])} es una fuente descartada")
                # Fuente aparte para la biografía de una persona (la principal acredita la candidatura).
                if bool((x.get("fuente_bio") or "").strip()) != bool((x.get("url_bio") or "").strip()):
                    err(f"partidos.json: «{lista}» n.º {n} de «{p.get('id')}»: «fuente_bio» y «url_bio» van juntas")
                if x.get("url_bio") and not x["url_bio"].startswith("https://"):
                    err(f"partidos.json: «{lista}» n.º {n} de «{p.get('id')}»: la url_bio debe empezar por https://")
                if lista == "personas" and x.get("cargo", "").startswith(("Congreso", "Senado")) and "boe.es" not in x.get("url", ""):
                    avisos.append(f"partidos.json: «{x.get('nombre')}» ({p.get('id')}) es candidato/a y su fuente no es el BOE")
                if lista == "otros" and x.get("etiqueta") and x["etiqueta"] not in ETIQUETAS:
                    err(f"partidos.json: «otros» n.º {n} de «{p.get('id')}»: etiqueta debe ser Programa, Campaña o Antes del 29-N")

    with open(carpeta / "codificacion.csv", encoding="utf-8-sig", newline="") as f:
        lector = csv.DictReader(f)
        if lector.fieldnames != CABECERA:
            err(f"codificacion.csv: la cabecera debe ser exactamente {','.join(CABECERA)}")
            return errores, avisos
        filas = list(lector)

    vistas = {}
    for n, r in enumerate(filas, start=2):
        donde = f"codificacion.csv línea {n} ({r['partido']} · {r['tema']})"
        if None in r or any(v is None for v in r.values()):
            err(f"{donde}: número de columnas incorrecto (¿una coma sin comillas?)")
            continue
        r = {k: v.strip() for k, v in r.items()}
        if r["partido"] not in ids_partido:
            err(f"{donde}: partido desconocido")
        if r["tema"] not in ids_tema:
            err(f"{donde}: tema desconocido")
        clave = (r["partido"], r["tema"])
        if clave in vistas:
            err(f"{donde}: casilla repetida (ya está en la línea {vistas[clave]})")
        vistas[clave] = n
        if r["nivel"] not in {"1", "2", "3", "4", "5"}:
            err(f"{donde}: «nivel» debe ser un entero de 1 a 5 (hay «{r['nivel']}»)")
        if r["estado"] not in ESTADOS:
            err(f"{donde}: «estado» debe ser validado, provisional o estimado (hay «{r['estado']}»)")
        if r["url"] and not r["url"].startswith("https://"):
            err(f"{donde}: «url» debe empezar por https://")
        if r["fecha_consulta"] and not FECHA.match(r["fecha_consulta"]):
            err(f"{donde}: «fecha_consulta» debe tener el formato AAAA-MM-DD")
        if r["cita"] and n_frases(r["cita"]) > MAX_FRASES_CITA:
            err(f"{donde}: la cita tiene más de {MAX_FRASES_CITA} frases")
        if r["url"] and not r["fuente"]:
            err(f"{donde}: hay «url» pero falta el nombre de la «fuente»")
        if r["url"] and not r["fecha_consulta"]:
            err(f"{donde}: hay «url» pero falta la «fecha_consulta»")
        if dominio_descartado(r["url"]):
            err(f"{donde}: {dominio_descartado(r['url'])} es una fuente descartada; usa el programa oficial o un medio de referencia")
        if r["estado"] == "provisional" and not r["url"]:
            avisos.append(f"{donde}: casilla «provisional» sin «fuente» ni «url»; cópialas de su propuesta en propuestas.csv")

        # Regla central: nada se da por definitivo sin evidencia comprobable.
        if r["estado"] == "validado":
            for campo in ("cita", "fuente", "url", "fecha_consulta"):
                if not r[campo]:
                    err(f"{donde}: una casilla «validado» necesita «{campo}»")
            # Basta una firma: quien comprueba la cita en la fuente (metodología del 24-N).
            if n_codificadores(r["codificadores"]) < 1 or r["codificadores"].strip().lower() == "v0":
                err(f"{donde}: una casilla «validado» necesita en «codificadores» quién ha comprobado la cita")
        if r["estado"] == "estimado" and not r["nota"]:
            err(f"{donde}: una casilla «estimado» necesita una «nota» que explique la deducción")
        if r["estado"] == "estimado" and (r["cita"] or r["url"]):
            avisos.append(f"{donde}: está como «estimado» pero tiene cita o url; ¿debería ser «provisional»?")

    for p in ids_partido:
        for t in ids_tema:
            if (p, t) not in vistas:
                err(f"codificacion.csv: falta la casilla {p} · {t}")

    # Regla del codebook: una casilla estimada no se aleja más de un paso
    # de la posición documentada más próxima del mismo partido (aviso, no error).
    por_partido = {}
    for r in filas:
        if r.get("nivel", "").strip() in {"1", "2", "3", "4", "5"}:
            por_partido.setdefault(r["partido"].strip(), []).append((r["tema"].strip(), int(r["nivel"]), r["estado"].strip()))
    for p, celdas in por_partido.items():
        documentadas = [nv for _, nv, est in celdas if est != "estimado"]
        for tema, nv, est in celdas:
            if est == "estimado" and documentadas and min(abs(nv - d) for d in documentadas) > 1:
                avisos.append(f"codificacion.csv ({p} · {tema}): casilla estimada a más de un paso de cualquier posición documentada del partido")

    propuestas = []
    ruta_prop = carpeta / "propuestas.csv"
    if ruta_prop.exists():
        with open(ruta_prop, encoding="utf-8-sig", newline="") as f:
            lector = csv.DictReader(f)
            if lector.fieldnames != CABECERA_PROPUESTAS:
                err(f"propuestas.csv: la cabecera debe ser exactamente {','.join(CABECERA_PROPUESTAS)}")
            else:
                for n, r in enumerate(lector, start=2):
                    donde = f"propuestas.csv línea {n}"
                    if r["partido"] not in ids_partido:
                        err(f"{donde}: partido desconocido «{r['partido']}»")
                    if r["tema"] not in ids_tema:
                        err(f"{donde}: tema desconocido «{r['tema']}»")
                    if r["etiqueta"] not in ETIQUETAS:
                        err(f"{donde}: «etiqueta» debe ser Programa, Campaña o Antes del 29-N")
                    if not (r["texto"] or "").strip():
                        err(f"{donde}: falta el «texto»")
                    if r["url"] and not r["url"].startswith("https://"):
                        err(f"{donde}: «url» debe empezar por https://")
                    # Toda propuesta que se muestra lleva su origen y un enlace.
                    if not (r["fuente"] or "").strip() or not (r["url"] or "").strip():
                        err(f"{donde}: una propuesta necesita «fuente» y «url»")
                    if not FECHA.match((r["fecha_consulta"] or "").strip()):
                        err(f"{donde}: «fecha_consulta» es obligatoria, con el formato AAAA-MM-DD")
                    if dominio_descartado(r["url"]):
                        err(f"{donde}: {dominio_descartado(r['url'])} es una fuente descartada; usa el programa oficial o un medio de referencia")
                    propuestas.append((r["partido"], r["tema"], r["etiqueta"]))

    validar_euskera(carpeta / "i18n", temas, propuestas, err)
    validar_recursos_y_partidos_eu(carpeta, partidos, err, avisos)
    validar_candidaturas(partidos, err)
    validar_claves_eu(carpeta, err)
    pendientes_de_publicar(carpeta, err, avisos)
    meta = json.loads((carpeta / "meta.json").read_text(encoding="utf-8"))
    gc = (meta.get("goatcounter") or "").strip()
    if gc and not re.match(r"^https://[a-z0-9-]+\.goatcounter\.com/count$", gc):
        err("meta.json: «goatcounter» debe ser https://<código>.goatcounter.com/count")

    total = len(ids_partido) * len(ids_tema)
    con_cita = sum(1 for r in filas if (r.get("cita") or "").strip() and (r.get("url") or "").strip())
    resumen = {e: sum(1 for r in filas if (r.get("estado") or "").strip() == e) for e in sorted(ESTADOS)}
    prov = [r for r in filas if (r.get("estado") or "").strip() == "provisional"]
    print(f"Casillas: {len(vistas)} de {total} · con cita y url: {con_cita} · " +
          " · ".join(f"{e}: {n}" for e, n in resumen.items()))
    print(f"Provisionales: {len(prov)} · con fuente y url: {sum(1 for r in prov if (r.get('url') or '').strip())} · "
          f"con cita: {sum(1 for r in prov if (r.get('cita') or '').strip())}")
    return errores, avisos


def main():
    carpeta = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "data"
    errores, avisos = validar(carpeta)
    for a in avisos:
        print(f"AVISO  {a}")
    for e in errores:
        print(f"ERROR  {e}")
    if errores:
        print(f"\n{len(errores)} error(es). Corrige los datos antes de publicar.")
        return 1
    print("Datos válidos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
