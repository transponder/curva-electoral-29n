#!/usr/bin/env python3
"""Análisis de sensibilidad del cálculo de cercanía.

Uso:  python3 scripts/sensibilidad.py [N]

Genera N curvas de respuestas al azar (por defecto 200.000) y mide con qué frecuencia
queda primero cada partido. No predice nada sobre personas reales: sirve para ver si la
fórmula, por sí sola, favorece a algún partido. Con una fórmula neutral y posiciones
repartidas por igual, cada uno de los 7 partidos rondaría el 14 %.
"""
import collections
import csv
import random
import sys
from pathlib import Path

DATOS = Path(__file__).resolve().parent.parent / "data" / "codificacion.csv"


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 200_000
    filas = list(csv.DictReader(open(DATOS, encoding="utf-8")))
    temas = list(dict.fromkeys(f["tema"] for f in filas))
    partidos = sorted(set(f["partido"] for f in filas))
    pos = {p: [0] * len(temas) for p in partidos}
    for f in filas:
        pos[f["partido"]][temas.index(f["tema"])] = int(f["nivel"])
    maximo = 4 * len(temas)

    print("Posición media y casillas en un extremo (1 o 5):")
    for p in partidos:
        lejos = sum(max(v - 1, 5 - v) for v in pos[p])
        print(f"  {p:14} media {sum(pos[p]) / len(temas):.2f} · extremos {sum(v in (1, 5) for v in pos[p]):2d} de {len(temas)}"
              f" · cercanía mínima posible {round(100 * (1 - lejos / maximo))} %")

    random.seed(1)
    primero = collections.Counter()
    empates = cambia = 0
    for _ in range(n):
        u = [random.randint(1, 5) for _ in temas]
        pct = {p: round(100 * (1 - sum(abs(a - b) for a, b in zip(u, pos[p])) / maximo)) for p in partidos}
        mejor = max(pct.values())
        tops = [p for p in partidos if pct[p] == mejor]
        for p in tops:
            primero[p] += 1 / len(tops)          # los empates se reparten a partes iguales
        empates += len(tops) > 1
        i = random.randrange(len(temas))          # ¿mover una respuesta un paso cambia quién va primero?
        u2 = u[:]
        u2[i] = u[i] + 1 if u[i] < 5 else 4
        d2 = {p: sum(abs(a - b) for a, b in zip(u2, pos[p])) for p in partidos}
        tops2 = [p for p in partidos if d2[p] == min(d2.values())]
        cambia += set(tops) != set(tops2)

    print(f"\nPrimer puesto con {n:,} curvas al azar (empates repartidos):".replace(",", "."))
    for p in sorted(partidos, key=lambda p: -primero[p]):
        print(f"  {p:14} {100 * primero[p] / n:5.1f} %")
    print(f"\nEmpate en el primer puesto: {100 * empates / n:.1f} %")
    print(f"Mover un paso una sola respuesta cambia el primer puesto: {100 * cambia / n:.1f} %")


if __name__ == "__main__":
    main()
