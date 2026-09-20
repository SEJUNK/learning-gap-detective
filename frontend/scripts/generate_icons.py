"""One-off script to generate placeholder PWA icons. Run with:
    python scripts/generate_icons.py
Replace public/icons/*.png with real brand assets before shipping.
"""

from pathlib import Path

from PIL import Image, ImageDraw

ACCENT = (67, 56, 202, 255)
WHITE = (255, 255, 255, 255)
OUT_DIR = Path(__file__).parent.parent / "public" / "icons"


def draw_mark(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    radius = int(size * 0.22)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=ACCENT)

    stroke = max(2, int(size * 0.055))
    circle_r = int(size * 0.17)
    cx, cy = int(size * 0.4), int(size * 0.4)
    draw.ellipse(
        [cx - circle_r, cy - circle_r, cx + circle_r, cy + circle_r],
        outline=WHITE,
        width=stroke,
    )

    handle_len = int(size * 0.26)
    start = (cx + int(circle_r * 0.75), cy + int(circle_r * 0.75))
    end = (start[0] + handle_len, start[1] + handle_len)
    draw.line([start, end], fill=WHITE, width=stroke)

    return img


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        icon = draw_mark(size)
        icon.save(OUT_DIR / f"icon-{size}.png")
    print(f"Generated icons in {OUT_DIR}")


if __name__ == "__main__":
    main()
