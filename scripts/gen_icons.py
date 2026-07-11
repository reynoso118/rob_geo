#!/usr/bin/env python3
"""Generate app icons as raw PNGs without third-party libraries.

Draws a simple pine/mountain emblem in the trip's brand palette.
Run: python3 scripts/gen_icons.py
"""
import struct
import zlib
import os

PINE_DEEP = (15, 31, 24)
PINE = (31, 58, 46)
GOLD = (200, 146, 42)
GOLD_LIGHT = (232, 200, 106)
RUST = (184, 82, 31)
CREAM = (244, 236, 220)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "icons")


def new_canvas(w, h, color):
    return [[color for _ in range(w)] for _ in range(h)]


def blend(dst, src, alpha):
    return tuple(round(dst[i] * (1 - alpha) + src[i] * alpha) for i in range(3))


def fill_circle(canvas, cx, cy, r, color, alpha=1.0):
    h = len(canvas)
    w = len(canvas[0])
    for y in range(max(0, cy - r), min(h, cy + r + 1)):
        for x in range(max(0, cx - r), min(w, cx + r + 1)):
            dx, dy = x - cx, y - cy
            d = (dx * dx + dy * dy) ** 0.5
            if d <= r:
                edge = max(0.0, min(1.0, (r - d)))
                a = alpha if edge > 1 else alpha * edge
                canvas[y][x] = blend(canvas[y][x], color, a)


def fill_triangle(canvas, p1, p2, p3, color, alpha=1.0):
    h = len(canvas)
    w = len(canvas[0])
    minx = max(0, min(p1[0], p2[0], p3[0]))
    maxx = min(w - 1, max(p1[0], p2[0], p3[0]))
    miny = max(0, min(p1[1], p2[1], p3[1]))
    maxy = min(h - 1, max(p1[1], p2[1], p3[1]))

    def sign(a, b, c):
        return (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1])

    for y in range(miny, maxy + 1):
        for x in range(minx, maxx + 1):
            pt = (x, y)
            d1 = sign(pt, p1, p2)
            d2 = sign(pt, p2, p3)
            d3 = sign(pt, p3, p1)
            has_neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
            has_pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
            if not (has_neg and has_pos):
                canvas[y][x] = blend(canvas[y][x], color, alpha)


def fill_rect(canvas, x0, y0, x1, y1, color, alpha=1.0):
    h = len(canvas)
    w = len(canvas[0])
    for y in range(max(0, y0), min(h, y1)):
        for x in range(max(0, x0), min(w, x1)):
            canvas[y][x] = blend(canvas[y][x], color, alpha)


def draw_emblem(size, padding_ratio=0.0):
    """padding_ratio adds a safe-zone margin (for maskable icons)."""
    canvas = new_canvas(size, size, PINE)

    # subtle radial deepening toward the edges
    cx, cy = size // 2, size // 2
    for y in range(size):
        for x in range(size):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 / (size * 0.75)
            if d > 0.55:
                a = min(0.35, (d - 0.55))
                canvas[y][x] = blend(canvas[y][x], PINE_DEEP, a)

    pad = int(size * padding_ratio)
    usable = size - pad * 2
    base_y = int(size * 0.70) - pad // 2

    # sun / gold circle
    fill_circle(canvas, cx + int(usable * 0.10), int(size * 0.30), max(2, int(usable * 0.09)), GOLD_LIGHT, 0.9)

    # back rust ridge
    fill_triangle(
        canvas,
        (pad + int(usable * 0.05), base_y),
        (cx + int(usable * 0.08), int(size * 0.34)),
        (pad + usable - int(usable * 0.02), base_y),
        RUST,
        0.85,
    )

    # front gold mountain
    fill_triangle(
        canvas,
        (pad - int(usable * 0.02), size - pad),
        (cx - int(usable * 0.06), int(size * 0.40)),
        (cx + int(usable * 0.30), size - pad),
        GOLD,
        1.0,
    )
    fill_triangle(
        canvas,
        (cx - int(usable * 0.34), size - pad),
        (cx + int(usable * 0.05), int(size * 0.46)),
        (pad + usable + int(usable * 0.02), size - pad),
        GOLD_LIGHT,
        0.95,
    )

    # horizon line
    fill_rect(canvas, pad, size - pad - max(2, size // 64), pad + usable, size - pad, CREAM, 0.5)

    return canvas


def write_png(path, canvas):
    h = len(canvas)
    w = len(canvas[0])
    raw = bytearray()
    for row in canvas:
        raw.append(0)  # filter type 0
        for (r, g, b) in row:
            raw += bytes((max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b))))

    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    write_png(os.path.join(OUT_DIR, "icon-192.png"), draw_emblem(192))
    write_png(os.path.join(OUT_DIR, "icon-512.png"), draw_emblem(512))
    write_png(os.path.join(OUT_DIR, "icon-512-maskable.png"), draw_emblem(512, padding_ratio=0.16))
    write_png(os.path.join(OUT_DIR, "apple-touch-icon.png"), draw_emblem(180))
    print("Icons written to", OUT_DIR)


if __name__ == "__main__":
    main()
