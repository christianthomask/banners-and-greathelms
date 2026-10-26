#!/usr/bin/env python3
"""
Technical Art Pipeline — Asset Slicer & Color-Grading Normalizer for Banners & Greathelms.
Extracts woodcut engravings, circular order medallions, wax seals, knight portraits, and
woodcut doctrine cards directly from the 1536x1024 concept sheets and optimizes to WebP.
"""
from pathlib import Path
from PIL import Image, ImageEnhance

ROOT = Path("/home/ctk/Projects/banners-and-greathelms")
CONCEPTS = ROOT / "public" / "concepts"
ASSETS = ROOT / "public" / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)


def apply_master_lut(img: Image.Image) -> Image.Image:
    """Applies a subtle warm strategy contrast/sharpness pass so all sliced assets match."""
    img = ImageEnhance.Contrast(img).enhance(1.05)
    img = ImageEnhance.Sharpness(img).enhance(1.12)
    return img


def crop_and_save(src_name: str, box: tuple[int, int, int, int], out_name: str):
    src_path = CONCEPTS / src_name
    if not src_path.exists():
        print(f"Skipping {src_name} (not found)")
        return
    with Image.open(src_path) as im:
        cropped = apply_master_lut(im.crop(box))
        out_path = ASSETS / out_name
        cropped.save(out_path, "WEBP", quality=90)
        print(f"Saved {out_path.name} ({cropped.size[0]}x{cropped.size[1]})")


def main():
    # 1. From 01-dawn-broadsheet-menu.png (1536x1024)
    crop_and_save("01-dawn-broadsheet-menu.png", (278, 430, 536, 584), "woodcut-alliance.webp")
    crop_and_save("01-dawn-broadsheet-menu.png", (552, 405, 825, 565), "woodcut-skirmish.webp")
    crop_and_save("01-dawn-broadsheet-menu.png", (832, 392, 1085, 540), "woodcut-fields.webp")

    crop_and_save("01-dawn-broadsheet-menu.png", (1156, 276, 1278, 412), "medallion-march.webp")
    crop_and_save("01-dawn-broadsheet-menu.png", (1156, 436, 1278, 574), "medallion-company.webp")
    crop_and_save("01-dawn-broadsheet-menu.png", (1156, 602, 1278, 742), "medallion-shadow.webp")

    crop_and_save("01-dawn-broadsheet-menu.png", (350, 888, 452, 992), "wax-seal-amber.webp")
    crop_and_save("01-dawn-broadsheet-menu.png", (726, 892, 828, 998), "wax-seal-crimson.webp")

    # 2. From 04-company-roster-and-ransom.png (1536x1024)
    crop_and_save("04-company-roster-and-ransom.png", (75, 202, 280, 358), "portrait-k1.webp")
    crop_and_save("04-company-roster-and-ransom.png", (294, 202, 498, 358), "portrait-k2.webp")
    crop_and_save("04-company-roster-and-ransom.png", (75, 382, 280, 538), "portrait-k3.webp")
    crop_and_save("04-company-roster-and-ransom.png", (294, 382, 498, 538), "portrait-k4.webp")
    crop_and_save("04-company-roster-and-ransom.png", (75, 560, 280, 718), "portrait-k5.webp")
    crop_and_save("04-company-roster-and-ransom.png", (294, 560, 498, 718), "portrait-k6.webp")
    crop_and_save(
        "04-company-roster-and-ransom.png", (1012, 482, 1180, 636), "portrait-captured-rival.webp"
    )

    # 3. From 03-greathelm-bridge-clash.png (1536x1024)
    crop_and_save(
        "03-greathelm-bridge-clash.png", (1058, 752, 1300, 985), "doctrine-shieldwall-card.webp"
    )
    crop_and_save(
        "03-greathelm-bridge-clash.png", (1306, 752, 1528, 985), "doctrine-wedge-card.webp"
    )


if __name__ == "__main__":
    main()
