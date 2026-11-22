#!/usr/bin/env python3
"""Escribe las URL de las fuentes de data/, una por línea, para comprobarlas con lychee.

Uso:  python3 scripts/extraer_enlaces.py [salida]   (por defecto, enlaces.txt)

lychee lee los CSV como texto y, si la URL va seguida de otra columna (url,fecha_consulta),
la toma como parte del enlace. Aquí se leen las columnas y claves de verdad.
"""
import csv
import json
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
CLAVES = {"url", "web"}
# No son fuentes: el contador de visitas solo acepta peticiones de la propia web.
IGNORAR = ("https://kurba29n.goatcounter.com/",)


def de_json(x):
    if isinstance(x, dict):
        for k, v in x.items():
            if k in CLAVES and isinstance(v, str):
                yield v
            else:
                yield from de_json(v)
    elif isinstance(x, list):
        for v in x:
            yield from de_json(v)


def enlaces():
    for ruta in sorted(DATA.rglob("*")):
        if ruta.suffix == ".csv":
            with open(ruta, encoding="utf-8-sig", newline="") as f:
                for fila in csv.DictReader(f):
                    yield from (fila[k] for k in CLAVES if fila.get(k))
        elif ruta.suffix == ".json":
            yield from de_json(json.loads(ruta.read_text(encoding="utf-8")))


def main():
    salida = Path(sys.argv[1] if len(sys.argv) > 1 else "enlaces.txt")
    urls = sorted({u.strip() for u in enlaces() if u.strip().startswith("http") and not u.startswith(IGNORAR)})
    salida.write_text("\n".join(urls) + "\n", encoding="utf-8")
    print(f"{len(urls)} enlaces en {salida}")


if __name__ == "__main__":
    main()
