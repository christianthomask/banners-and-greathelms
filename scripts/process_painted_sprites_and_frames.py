#!/usr/bin/env python3
"""
Process painted Codex sprite sheets & UI frame sheets into alpha-keyed WebP
miniature sprites and 9-slice border-image textures for Banners & Greathelms.
"""
import os
from PIL import Image, ImageChops, ImageFilter

ASSETS_DIR = "/home/ctk/Projects/banners-and-greathelms/public/assets"


def chroma_key_magenta(img: Image.Image) -> Image.Image:
    """
    Remove #FF00FF magenta background with smooth edge anti-aliasing and
    magenta spill suppression so miniature edges have zero pink halo.
    """
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # Magenta metric: high R, high B, low G, and R/B balanced near each other
            rb_min = min(r, b)
            magenta_strength = rb_min - g
            rb_diff = abs(r - b)

            if magenta_strength > 115 and rb_diff < 65 and g < 135:
                # Pure or near-pure magenta background -> transparent
                px[x, y] = (0, 0, 0, 0)
            elif magenta_strength > 45 and rb_diff < 85 and g < 175:
                # Edge transition pixel -> compute smooth alpha and despill
                t = (magenta_strength - 45) / 70.0
                new_a = int(round(255 * (1.0 - min(1.0, max(0.0, t)))))
                # Despill magenta by pulling R and B toward G / neutral steel
                clean_r = min(r, int(g * 1.15 + 18))
                clean_b = min(b, int(g * 1.10 + 18))
                px[x, y] = (clean_r, g, clean_b, new_a)

    # Tight crop to non-zero alpha bounding box + 4px padding
    bbox = rgba.getbbox()
    if bbox:
        x0, y0, x1, y1 = bbox
        pad = 4
        x0 = max(0, x0 - pad)
        y0 = max(0, y0 - pad)
        x1 = min(w, x1 + pad)
        y1 = min(h, y1 + pad)
        rgba = rgba.crop((x0, y0, x1, y1))

    return rgba


def extract_knight_sheet(sheet_path: str, names: list[str]):
    if not os.path.exists(sheet_path):
        print("Skipping missing", sheet_path)
        return
    sheet = Image.open(sheet_path).convert("RGBA")
    w, h = sheet.size
    hw, hh = w // 2, h // 2
    quadrants = [
        (0, 0, hw, hh),
        (hw, 0, w, hh),
        (0, hh, hw, h),
        (hw, hh, w, h),
    ]
    for (x0, y0, x1, y1), out_name in zip(quadrants, names):
        crop = sheet.crop((x0, y0, x1, y1))
        sprite = chroma_key_magenta(crop)
        # Resize proportionally so max height is 360px (crisp retina miniature)
        sw, sh = sprite.size
        max_dim = 360
        if max(sw, sh) > max_dim:
            scale = max_dim / float(max(sw, sh))
            sprite = sprite.resize(
                (int(round(sw * scale)), int(round(sh * scale))),
                Image.Resampling.LANCZOS,
            )
        out_path = os.path.join(ASSETS_DIR, out_name)
        sprite.save(out_path, "WEBP", quality=92)
        os.chmod(out_path, 0o644)
        print(f"Saved {out_name}: {sprite.size}")


def process_ui_frames_sheet():
    sheet_path = os.path.join(ASSETS_DIR, "ui-medieval-frames-sheet.png")
    if not os.path.exists(sheet_path):
        return
    sheet = Image.open(sheet_path).convert("RGBA")
    w, h = sheet.size  # 1536 x 1024

    # 1. Extract the rich painted Tudor oak war-table center (x=220..1316, y=200..824)
    oak_center = sheet.crop((220, 200, 1316, 824)).resize(
        (768, 512), Image.Resampling.LANCZOS
    )
    oak_path = os.path.join(ASSETS_DIR, "bg-war-table-oak.webp")
    oak_center.save(oak_path, "WEBP", quality=88)
    os.chmod(oak_path, 0o644)
    print("Saved painted bg-war-table-oak.webp")

    # 2. Extract the 4 ornate gothic fleur-de-lis iron corner bosses (160x160 -> 112x112)
    c_src = 160
    c_dst = 112
    corners = {
        "corner-boss-tl.webp": (0, 0, c_src, c_src),
        "corner-boss-tr.webp": (w - c_src, 0, w, c_src),
        "corner-boss-bl.webp": (0, h - c_src, c_src, h),
        "corner-boss-br.webp": (w - c_src, h - c_src, w, h),
    }
    for cname, box in corners.items():
        c_img = sheet.crop(box).resize((c_dst, c_dst), Image.Resampling.LANCZOS)
        c_path = os.path.join(ASSETS_DIR, cname)
        c_img.save(c_path, "WEBP", quality=92)
        os.chmod(c_path, 0o644)
        print("Saved", cname)

    # 3. Assemble a 512x512 9-slice asset (slice = 128) directly from the painted sheet!
    # Corners: 160x160 scaled to 128x128
    # Top/Bottom rails: (160..w-160, 0..160) and (160..w-160, h-160..h) scaled to 256x128
    # Left/Right rails: (0..160, 160..h-160) and (w-160..w, 160..h-160) scaled to 128x256
    # Center fill: (220..w-220, 200..h-200) scaled to 256x256
    nine = Image.new("RGBA", (512, 512))
    s = 128
    mid = 256

    tl = sheet.crop((0, 0, c_src, c_src)).resize((s, s), Image.Resampling.LANCZOS)
    tr = sheet.crop((w - c_src, 0, w, c_src)).resize((s, s), Image.Resampling.LANCZOS)
    bl = sheet.crop((0, h - c_src, c_src, h)).resize((s, s), Image.Resampling.LANCZOS)
    br = sheet.crop((w - c_src, h - c_src, w, h)).resize((s, s), Image.Resampling.LANCZOS)

    top_rail = sheet.crop((c_src, 0, w - c_src, c_src)).resize((mid, s), Image.Resampling.LANCZOS)
    bot_rail = sheet.crop((c_src, h - c_src, w - c_src, h)).resize((mid, s), Image.Resampling.LANCZOS)
    left_rail = sheet.crop((0, c_src, c_src, h - c_src)).resize((s, mid), Image.Resampling.LANCZOS)
    right_rail = sheet.crop((w - c_src, c_src, w, h - c_src)).resize((s, mid), Image.Resampling.LANCZOS)
    center_fill = sheet.crop((220, 200, w - 220, h - 200)).resize((mid, mid), Image.Resampling.LANCZOS)

    nine.paste(tl, (0, 0))
    nine.paste(top_rail, (s, 0))
    nine.paste(tr, (s + mid, 0))
    nine.paste(left_rail, (0, s))
    nine.paste(center_fill, (s, s))
    nine.paste(right_rail, (s + mid, s))
    nine.paste(bl, (0, s + mid))
    nine.paste(bot_rail, (s, s + mid))
    nine.paste(br, (s + mid, s + mid))

    nine_path = os.path.join(ASSETS_DIR, "frame-forged-iron-9slice.webp")
    nine.save(nine_path, "WEBP", quality=92)
    os.chmod(nine_path, 0o644)
    print("Saved painted 9-slice:", nine_path)

    # 4. Also create a hollow version (transparent center) for framing the 2.5D map & bridge diorama!
    hollow = nine.copy()
    hpx = hollow.load()
    for y in range(512):
        for x in range(512):
            min_edge = min(x, 511 - x, y, 511 - y)
            if min_edge > 108:
                hpx[x, y] = (0, 0, 0, 0)
            elif min_edge > 88:
                # Smooth shadow feather into the map canvas
                t = (min_edge - 88) / 20.0
                r, g, b, a = hpx[x, y]
                hpx[x, y] = (int(r * (1 - t)), int(g * (1 - t)), int(b * (1 - t)), int(255 * (1 - t * 0.85)))

    hollow_path = os.path.join(ASSETS_DIR, "frame-hollow-viewport-9slice.webp")
    hollow.save(hollow_path, "WEBP", quality=92)
    os.chmod(hollow_path, 0o644)
    print("Saved hollow viewport 9-slice:", hollow_path)


def process_parchment_sheet():
    sheet_path = os.path.join(ASSETS_DIR, "ui-parchment-and-brass-sheet.png")
    if not os.path.exists(sheet_path):
        return
    sheet = Image.open(sheet_path).convert("RGBA")
    w, h = sheet.size

    c_src = 160
    s = 128
    mid = 256
    nine = Image.new("RGBA", (512, 512))

    tl = sheet.crop((0, 0, c_src, c_src)).resize((s, s), Image.Resampling.LANCZOS)
    tr = sheet.crop((w - c_src, 0, w, c_src)).resize((s, s), Image.Resampling.LANCZOS)
    bl = sheet.crop((0, h - c_src, c_src, h)).resize((s, s), Image.Resampling.LANCZOS)
    br = sheet.crop((w - c_src, h - c_src, w, h)).resize((s, s), Image.Resampling.LANCZOS)

    top_rail = sheet.crop((c_src, 0, w - c_src, c_src)).resize((mid, s), Image.Resampling.LANCZOS)
    bot_rail = sheet.crop((c_src, h - c_src, w - c_src, h)).resize((mid, s), Image.Resampling.LANCZOS)
    left_rail = sheet.crop((0, c_src, c_src, h - c_src)).resize((s, mid), Image.Resampling.LANCZOS)
    right_rail = sheet.crop((w - c_src, c_src, w, h - c_src)).resize((s, mid), Image.Resampling.LANCZOS)
    center_fill = sheet.crop((240, 220, w - 240, h - 220)).resize((mid, mid), Image.Resampling.LANCZOS)

    nine.paste(tl, (0, 0))
    nine.paste(top_rail, (s, 0))
    nine.paste(tr, (s + mid, 0))
    nine.paste(left_rail, (0, s))
    nine.paste(center_fill, (s, s))
    nine.paste(right_rail, (s + mid, s))
    nine.paste(bl, (0, s + mid))
    nine.paste(bot_rail, (s, s + mid))
    nine.paste(br, (s + mid, s + mid))

    out_path = os.path.join(ASSETS_DIR, "frame-parchment-deckle-9slice.webp")
    nine.save(out_path, "WEBP", quality=92)
    os.chmod(out_path, 0o644)
    print("Saved painted parchment 9-slice:", out_path)


if __name__ == "__main__":
    extract_knight_sheet(
        os.path.join(ASSETS_DIR, "knight-puppets-sheet.png"),
        [
            "sprite-captain-iron-vultures.webp",
            "sprite-captain-red-lance.webp",
            "sprite-knight-iron-vultures-1.webp",
            "sprite-knight-red-lance-1.webp",
        ],
    )
    extract_knight_sheet(
        os.path.join(ASSETS_DIR, "knight-puppets-sheet-2.png"),
        [
            "sprite-knight-iron-vultures-2.webp",
            "sprite-knight-red-lance-2.webp",
            "sprite-knight-iron-vultures-3.webp",
            "sprite-knight-red-lance-3.webp",
        ],
    )
    process_ui_frames_sheet()
    process_parchment_sheet()
