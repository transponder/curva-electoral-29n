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
FECHA = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MAX_FRASES_CITA = 2


def n_frases(texto):
    """Cuenta frases de forma aproximada: trozos separados por . ! ? seguidos de espacio."""
    return len([t for t in re.split(r"(?<=[.!?…])\s+", texto.strip()) if t])


def n_codificadores(valor):
    return len([c for c in re.split(r"[;,+/]", valor) if c.strip()])


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
        for campo in ("id", "nombre", "corto", "pregunta"):
            if not t.get(campo):
                err(f"temas.json: el tema «{t.get('id')}» no tiene «{campo}»")
        if len(t.get("opciones", [])) != 5 or not all(isinstance(o, str) and o.strip() for o in t.get("opciones", [])):
            err(f"temas.json: el tema «{t.get('id')}» debe tener exactamente 5 opciones con texto")
    for p in partidos.get("codificados", []):
        for campo in ("id", "siglas", "nombre", "color"):
            if not p.get(campo):
                err(f"partidos.json: el partido «{p.get('id')}» no tiene «{campo}»")
        if p.get("color") and not re.match(r"^#[0-9A-Fa-f]{6}$", p["color"]):
            err(f"partidos.json: el color de «{p.get('id')}» debe tener el formato #RRGGBB")

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

        # Regla central: nada se da por definitivo sin evidencia comprobable.
        if r["estado"] == "validado":
            for campo in ("cita", "fuente", "url", "fecha_consulta"):
                if not r[campo]:
                    err(f"{donde}: una casilla «validado» necesita «{campo}»")
            if n_codificadores(r["codificadores"]) < 2:
                err(f"{donde}: una casilla «validado» necesita dos codificadores en «codificadores» (separados por ;)")
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

    total = len(ids_partido) * len(ids_tema)
    con_cita = sum(1 for r in filas if (r.get("cita") or "").strip() and (r.get("url") or "").strip())
    resumen = {e: sum(1 for r in filas if (r.get("estado") or "").strip() == e) for e in sorted(ESTADOS)}
    print(f"Casillas: {len(vistas)} de {total} · con cita y url: {con_cita} · " +
          " · ".join(f"{e}: {n}" for e, n in resumen.items()))
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
