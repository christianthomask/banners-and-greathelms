#!/usr/bin/env python3
"""
Generate authentic 9-slice medieval UI frame textures (Forged Iron, Carved Tudor Oak,
Torn Deckle-Edge Illuminated Parchment, and Seamless War-Table Oak Planks) for
Banners & Greathelms so UI panels use real textured border-image assets instead of CSS borders.
"""
import math
import os
import random
from PIL import Image, ImageDraw, ImageFilter

OUT_DIR = "/home/ctk/Projects/banners-and-greathelms/public/assets"
os.makedirs(OUT_DIR, exist_ok=True)


def clamp(v: float, lo=0, hi=255) -> int:
    return max(lo, min(hi, int(round(v))))


def build_war_table_oak_bg():
    """512x512 dark candlelit oak war-table plank background."""
    w, h = 512, 512
    img = Image.new("RGBA", (w, h), (16, 12, 9, 255))
    px = img.load()
    rng = random.Random(1401)

    plank_h = 128
    for y in range(h):
        plank_idx = y // plank_h
        local_y = y % plank_h
        seam_dist = min(local_y, plank_h - 1 - local_y)
        plank_tint = (-4, 2, -2, 3)[plank_idx % 4]

        for x in range(w):
            # Woodgrain wave
            grain = (
                math.sin((y * 0.24) + math.sin(x * 0.035 + plank_idx * 1.7) * 2.5) * 6.0
                + math.sin(y * 0.65 + x * 0.015) * 3.0
                + (rng.random() - 0.5) * 4.5
            )
            base_r = 28 + plank_tint + grain * 0.9
            base_g = 20 + plank_tint * 0.7 + grain * 0.65
            base_b = 14 + plank_tint * 0.4 + grain * 0.45

            # Plank seam darkening
            if seam_dist < 3:
                factor = 0.35 + (seam_dist / 3.0) * 0.65
                base_r *= factor
                base_g *= factor
                base_b *= factor

            # Vertical joint every plank
            joint_x = ((plank_idx * 173) + 96) % w
            if abs(x - joint_x) < 2:
                base_r *= 0.45
                base_g *= 0.45
                base_b *= 0.45

            px[x, y] = (clamp(base_r), clamp(base_g), clamp(base_b), 255)

    # Draw subtle iron nail heads near plank joints
    draw = ImageDraw.Draw(img)
    for plank_idx in range(4):
        joint_x = ((plank_idx * 173) + 96) % w
        for ny in (plank_idx * plank_h + 22, plank_idx * plank_h + plank_h - 22):
            for nx in (joint_x - 12, joint_x + 12):
                draw.ellipse((nx - 4, ny - 4, nx + 4, ny + 4), fill=(12, 10, 8, 255))
                draw.ellipse((nx - 3, ny - 3, nx + 3, ny + 3), fill=(58, 50, 42, 255))
                draw.ellipse((nx - 1, ny - 2, nx + 1, ny), fill=(120, 105, 85, 255))

    out_path = os.path.join(OUT_DIR, "bg-war-table-oak.webp")
    img.save(out_path, "WEBP", quality=90)
    os.chmod(out_path, 0o644)
    print("Saved", out_path)


def build_forged_iron_9slice():
    """
    384x384 RGBA 9-slice forged-iron & brass-riveted frame (slice = 96).
    Outer 6px has organic hand-hammered iron silhouette + gothic corner bosses.
    """
    size = 384
    slice_w = 54
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()
    rng = random.Random(1402)

    for y in range(size):
        for x in range(size):
            # Distance from outer edge
            dist_left = x
            dist_right = size - 1 - x
            dist_top = y
            dist_bot = size - 1 - y
            min_edge = min(dist_left, dist_right, dist_top, dist_bot)

            # Hand-hammered outer edge wobble
            wobble = int(
                round(
                    math.sin(x * 0.19) * 1.2
                    + math.cos(y * 0.19) * 1.2
                    + (rng.random() - 0.5) * 0.8
                )
            )
            if min_edge < 4 + wobble:
                continue

            # Inside fill vs frame border
            if min_edge >= slice_w:
                # Dark forged iron / oiled slate interior fill
                noise = (rng.random() - 0.5) * 6
                hammer = math.sin(x * 0.11) * math.cos(y * 0.11) * 4
                r = 21 + noise + hammer
                g = 18 + noise + hammer * 0.85
                b = 15 + noise + hammer * 0.7
                px[x, y] = (clamp(r), clamp(g), clamp(b), 248)
            else:
                # Frame border (min_edge in 4 .. slice_w)
                hammer = (
                    math.sin(x * 0.28 + y * 0.17) * 7
                    + math.cos(x * 0.13 - y * 0.31) * 5
                    + (rng.random() - 0.5) * 8
                )
                # Outer bevel (dark iron), mid band (hammered steel), inner lip (aged brass/gold trim)
                if min_edge < 10:
                    r, g, b = 18 + hammer * 0.4, 16 + hammer * 0.4, 15 + hammer * 0.4
                elif min_edge < 15:
                    # Specular steel ridge
                    r, g, b = 96 + hammer, 88 + hammer, 78 + hammer
                elif min_edge < slice_w - 10:
                    # Hammered dark gunmetal plate
                    r, g, b = 46 + hammer, 43 + hammer, 39 + hammer
                elif min_edge < slice_w - 5:
                    # Inset tarnished brass molding
                    r, g, b = 158 + hammer, 118 + hammer * 0.7, 52 + hammer * 0.4
                else:
                    # Deep inner shadow groove
                    r, g, b = 12, 10, 8
                px[x, y] = (clamp(r), clamp(g), clamp(b), 255)

    draw = ImageDraw.Draw(img)

    # Ornate Gothic Corner Plates (top-left, top-right, bottom-left, bottom-right)
    corner_size = 86
    for cx, cy in [(0, 0), (size - corner_size, 0), (0, size - corner_size), (size - corner_size, size - corner_size)]:
        # Heavy corner iron bracket plate
        draw.rectangle(
            [cx + 6, cy + 6, cx + corner_size - 6, cy + corner_size - 6],
            fill=(56, 51, 45, 255),
            outline=(168, 128, 60, 255),
            width=2,
        )
        draw.rectangle(
            [cx + 12, cy + 12, cx + corner_size - 12, cy + corner_size - 12],
            fill=(36, 32, 28, 255),
            outline=(92, 82, 70, 255),
            width=2,
        )
        # Central brass rosette / boss in each corner
        bx = cx + corner_size // 2
        by = cy + corner_size // 2
        draw.ellipse((bx - 14, by - 14, bx + 14, by + 14), fill=(22, 18, 14, 255))
        draw.ellipse((bx - 11, by - 11, bx + 11, by + 11), fill=(184, 134, 48, 255), outline=(245, 208, 120, 255), width=2)
        draw.polygon([(bx, by - 7), (bx + 7, by), (bx, by + 7), (bx - 7, by)], fill=(92, 62, 18, 255))
        draw.ellipse((bx - 3, by - 3, bx + 3, by + 3), fill=(252, 225, 150, 255))

    # Rivet studs along top, bottom, left, right rails
    def draw_rivet(rx: int, ry: int, brass=False):
        draw.ellipse((rx - 6, ry - 6, rx + 6, ry + 6), fill=(15, 13, 11, 255))
        if brass:
            draw.ellipse((rx - 4, ry - 4, rx + 4, ry + 4), fill=(195, 145, 58, 255))
            draw.ellipse((rx - 2, ry - 3, rx + 1, ry), fill=(250, 224, 150, 255))
        else:
            draw.ellipse((rx - 4, ry - 4, rx + 4, ry + 4), fill=(105, 98, 88, 255))
            draw.ellipse((rx - 2, ry - 3, rx + 1, ry), fill=(175, 168, 155, 255))

    for pos in range(108, size - 96, 34):
        draw_rivet(pos, 27, brass=(pos % 68 == 0))
        draw_rivet(pos, size - 27, brass=(pos % 68 == 0))
        draw_rivet(27, pos, brass=(pos % 68 == 0))
        draw_rivet(size - 27, pos, brass=(pos % 68 == 0))

    out_path = os.path.join(OUT_DIR, "frame-forged-iron-9slice.webp")
    img.save(out_path, "WEBP", quality=92)
    os.chmod(out_path, 0o644)
    print("Saved", out_path)


def build_carved_oak_9slice():
    """
    384x384 RGBA 9-slice Carved Tudor Oak & Iron-Strapped Frame (slice = 96).
    """
    size = 384
    slice_w = 48
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()
    rng = random.Random(1403)

    for y in range(size):
        for x in range(size):
            min_edge = min(x, size - 1 - x, y, size - 1 - y)
            wobble = int(round(math.sin(x * 0.25) * 0.8 + math.cos(y * 0.25) * 0.8))
            if min_edge < 3 + wobble:
                continue

            if min_edge >= slice_w:
                # Warm dark Tudor oak interior panel
                grain = math.sin(y * 0.22 + math.sin(x * 0.04) * 2.0) * 5.0 + (rng.random() - 0.5) * 4.0
                r = 31 + grain * 0.9
                g = 23 + grain * 0.65
                b = 16 + grain * 0.45
                px[x, y] = (clamp(r), clamp(g), clamp(b), 248)
            else:
                # Carved oak molding along top/bottom (horizontal grain) vs left/right (vertical grain)
                horiz = min(y, size - 1 - y) < min(x, size - 1 - x)
                coord = x if horiz else y
                grain = math.sin(coord * 0.25) * 8.0 + (rng.random() - 0.5) * 6.0

                if min_edge < 8:
                    r, g, b = 22, 15, 10
                elif min_edge < 14:
                    # Outer carved oak ridge
                    r, g, b = 92 + grain, 62 + grain * 0.7, 36 + grain * 0.4
                elif min_edge < 22:
                    # Recessed cove
                    r, g, b = 48 + grain * 0.5, 32 + grain * 0.4, 19 + grain * 0.3
                elif min_edge < slice_w - 8:
                    # Raised inner timber molding
                    r, g, b = 78 + grain, 52 + grain * 0.7, 30 + grain * 0.4
                elif min_edge < slice_w - 4:
                    # Subtle brass inlay fillet
                    r, g, b = 164 + grain, 120 + grain * 0.6, 52 + grain * 0.3
                else:
                    r, g, b = 16, 11, 7
                px[x, y] = (clamp(r), clamp(g), clamp(b), 255)

    draw = ImageDraw.Draw(img)
    # Forged iron L-straps on the 4 corners
    strap_len = 84
    strap_thick = 28
    for cx, cy, dx, dy in [
        (4, 4, 1, 1),
        (size - 4, 4, -1, 1),
        (4, size - 4, 1, -1),
        (size - 4, size - 4, -1, -1),
    ]:
        # Horizontal arm
        x0 = min(cx, cx + dx * strap_len)
        x1 = max(cx, cx + dx * strap_len)
        y0 = min(cy, cy + dy * strap_thick)
        y1 = max(cy, cy + dy * strap_thick)
        draw.rectangle([x0, y0, x1, y1], fill=(42, 39, 36, 255), outline=(145, 110, 52, 255), width=2)
        # Vertical arm
        vx0 = min(cx, cx + dx * strap_thick)
        vx1 = max(cx, cx + dx * strap_thick)
        vy0 = min(cy, cy + dy * strap_len)
        vy1 = max(cy, cy + dy * strap_len)
        draw.rectangle([vx0, vy0, vx1, vy1], fill=(42, 39, 36, 255), outline=(145, 110, 52, 255), width=2)

        # Brass studs on the L-strap
        for step in (18, 46, 70):
            rx = cx + dx * step
            ry = cy + dy * 14
            draw.ellipse((rx - 4, ry - 4, rx + 4, ry + 4), fill=(202, 152, 62, 255), outline=(24, 18, 12, 255))
            rx2 = cx + dx * 14
            ry2 = cy + dy * step
            draw.ellipse((rx2 - 4, ry2 - 4, rx2 + 4, ry2 + 4), fill=(202, 152, 62, 255), outline=(24, 18, 12, 255))

    out_path = os.path.join(OUT_DIR, "frame-carved-oak-9slice.webp")
    img.save(out_path, "WEBP", quality=92)
    os.chmod(out_path, 0o644)
    print("Saved", out_path)


def build_parchment_deckle_9slice():
    """
    384x384 RGBA 9-slice Torn Deckle-Edge Illuminated Manuscript Parchment.
    Features organic irregular torn outer edges, burnt-umber age shading,
    double scribal ink marginalia lines, and rubricated corner flourishes.
    """
    size = 384
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()
    rng = random.Random(1404)

    for y in range(size):
        for x in range(size):
            min_edge = min(x, size - 1 - x, y, size - 1 - y)
            # Organic torn deckle edge profile
            deckle = (
                math.sin(x * 0.17 + y * 0.07) * 3.2
                + math.cos(y * 0.21 - x * 0.09) * 2.8
                + math.sin((x + y) * 0.43) * 1.6
                + (rng.random() - 0.5) * 2.2
            )
            edge_cutoff = 9 + deckle
            if min_edge < edge_cutoff:
                continue

            # Paper fiber & age mottling
            fiber = (
                math.sin(x * 0.09) * math.cos(y * 0.09) * 6.0
                + math.sin(x * 0.31 + y * 0.27) * 3.0
                + (rng.random() - 0.5) * 7.0
            )
            r = 236 + fiber
            g = 219 + fiber * 0.85
            b = 184 + fiber * 0.65

            # Burnt-umber foxing near deckle edge
            edge_depth = min_edge - edge_cutoff
            if edge_depth < 28:
                t = edge_depth / 28.0
                # Darken warm sepia near torn edge
                r = r * (0.62 + 0.38 * t)
                g = g * (0.52 + 0.48 * t)
                b = b * (0.38 + 0.62 * t)

            px[x, y] = (clamp(r), clamp(g), clamp(b), 255)

    draw = ImageDraw.Draw(img)
    # Double scribal marginalia lines (outer rubricated crimson, inner iron-gall ink)
    m1 = 26
    m2 = 32
    draw.rectangle([m1, m1, size - m1, size - m1], outline=(136, 38, 28, 195), width=2)
    draw.rectangle([m2, m2, size - m2, size - m2], outline=(78, 52, 28, 175), width=1)

    # Illuminated manuscript corner flourishes
    for cx, cy in [(m1, m1), (size - m1, m1), (m1, size - m1), (size - m1, size - m1)]:
        draw.rectangle([cx - 6, cy - 6, cx + 6, cy + 6], fill=(158, 36, 26, 235), outline=(92, 58, 22, 255), width=1)
        draw.polygon([(cx, cy - 10), (cx + 10, cy), (cx, cy + 10), (cx - 10, cy)], outline=(180, 128, 38, 220))
        draw.ellipse((cx - 3, cy - 3, cx + 3, cy + 3), fill=(235, 188, 76, 255))

    out_path = os.path.join(OUT_DIR, "frame-parchment-deckle-9slice.webp")
    img.save(out_path, "WEBP", quality=92)
    os.chmod(out_path, 0o644)
    print("Saved", out_path)


if __name__ == "__main__":
    build_war_table_oak_bg()
    build_forged_iron_9slice()
    build_carved_oak_9slice()
    build_parchment_deckle_9slice()
