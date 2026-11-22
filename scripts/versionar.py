#!/usr/bin/env python3
"""Pone una versión en la URL de cada CSS y JS que carga index.html (css/kurba.css?v=1a2b3c4d).

La versión son los 8 primeros caracteres del SHA-1 del contenido del fichero. Así, cada vez que
cambia un fichero cambia su URL y ningún navegador mezcla el HTML nuevo con un CSS o un JS
antiguo guardado en caché (Cloudflare los cachea 4 horas).

    python3 scripts/versionar.py              # actualiza index.html
    python3 scripts/versionar.py --comprobar  # falla si alguna versión no coincide (CI)
"""
import hashlib
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PAGINAS = [RAIZ / "index.html"]
# href="css/x.css" o src="js/x.js", con o sin ?v=… detrás
PATRON = re.compile(r'(?P<attr>(?:href|src)=")(?P<ruta>(?:css|js)/[^"?#]+\.(?:css|js))(?:\?v=[0-9a-f]*)?"')


def version(ruta):
    return hashlib.sha1((RAIZ / ruta).read_bytes()).hexdigest()[:8]


def main(comprobar):
    malos = []
    for pagina in PAGINAS:
        texto = pagina.read_text(encoding="utf-8")

        def poner(m):
            ruta = m.group("ruta")
            if not (RAIZ / ruta).exists():
                malos.append(f"{pagina.name}: {ruta} no existe")
                return m.group(0)
            return f'{m.group("attr")}{ruta}?v={version(ruta)}"'

        nuevo = PATRON.sub(poner, texto)
        if nuevo != texto:
            if comprobar:
                malos.append(f"{pagina.name}: versiones desactualizadas; ejecuta python3 scripts/versionar.py")
            else:
                pagina.write_text(nuevo, encoding="utf-8")
                print(f"{pagina.name}: versiones actualizadas")
        elif not comprobar:
            print(f"{pagina.name}: ya estaba al día")
    for m in malos:
        print("ERROR ", m)
    return 1 if malos else 0


if __name__ == "__main__":
    sys.exit(main("--comprobar" in sys.argv[1:]))
