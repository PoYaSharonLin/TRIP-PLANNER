#!/usr/bin/env python3
"""產生 PWA 需要的 app 圖示（純標準庫，無相依）。
底色品牌綠 + 置中金色地圖圖釘，全出血（適合 maskable）。"""
import struct
import zlib
import os
import math

OUT = os.path.join(os.path.dirname(__file__), "..", "public")

TEAL = (15, 118, 110)      # #0f766e
GOLD = (233, 179, 86)      # #e9b356
WHITE = (255, 255, 255)


def pin_color(x, y, size):
    cx = size / 2
    # 圖釘圓心稍微偏上
    cy = size * 0.42
    r = size * 0.22
    # 圓形頭部
    d = math.hypot(x - cx, y - cy)
    # 下方三角尖端
    tip_y = size * 0.80
    # 三角形：在 cy..tip_y 之間寬度線性收斂
    in_triangle = False
    if cy <= y <= tip_y:
        half = r * (1 - (y - cy) / (tip_y - cy))
        if abs(x - cx) <= half:
            in_triangle = True
    if d <= r or in_triangle:
        # 內部白點
        if math.hypot(x - cx, y - cy) <= r * 0.42:
            return WHITE
        return GOLD
    return None


def make_png(size, path):
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter type 0
        for x in range(size):
            c = pin_color(x, y, size)
            if c is None:
                c = TEAL
            raw += bytes((c[0], c[1], c[2], 255))

    def chunk(typ, data):
        return (
            struct.pack(">I", len(data))
            + typ
            + data
            + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )
    with open(path, "wb") as f:
        f.write(png)
    print("wrote", path, len(png), "bytes")


os.makedirs(OUT, exist_ok=True)
make_png(192, os.path.join(OUT, "pwa-192x192.png"))
make_png(512, os.path.join(OUT, "pwa-512x512.png"))
make_png(180, os.path.join(OUT, "apple-touch-icon.png"))
make_png(32, os.path.join(OUT, "favicon.png"))
