#!/usr/bin/env python3
"""Rebuild the subset Noto Sans KR webfonts this explainer ships.

Usage (from the project root):
    python3 scripts/subset-fonts.py /path/to/NotoSansKR[wght].ttf

The variable source is the OFL Noto Sans KR from github.com/google/fonts
(ofl/notosanskr). It is NOT committed (10 MB). This script instances the
weights the frames use and keeps only the characters that appear in
index.html + compositions/**/*.html, so the tracked woff2 files stay small.
Re-run it whenever on-screen copy changes, or new glyphs render as fallback.
"""
import pathlib
import re
import sys

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

WEIGHTS = (500, 700, 900)
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "fonts"


def used_text() -> str:
    files = [ROOT / "index.html", *sorted((ROOT / "compositions").rglob("*.html"))]
    chars = set()
    for f in files:
        if not f.exists():
            continue
        raw = f.read_text(encoding="utf-8")
        raw = re.sub(r"&[a-z]+;|&#\d+;", " ", raw)
        chars.update(raw)
    # Always keep printable ASCII and common punctuation so small copy edits still render.
    chars.update(chr(c) for c in range(0x20, 0x7F))
    chars.update("·…‘’“”→←↑↓✓○●—–")
    return "".join(sorted(c for c in chars if c.isprintable()))


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = pathlib.Path(sys.argv[1])
    text = used_text()
    OUT.mkdir(parents=True, exist_ok=True)
    for w in WEIGHTS:
        font = TTFont(src)
        static = instancer.instantiateVariableFont(font, {"wght": w})
        opts = Options()
        opts.flavor = "woff2"
        opts.layout_features = ["*"]
        opts.name_IDs = ["*"]
        opts.notdef_outline = True
        sub = Subsetter(options=opts)
        sub.populate(text=text)
        sub.subset(static)
        dest = OUT / f"NotoSansKR-{w}.woff2"
        static.flavor = "woff2"
        static.save(dest)
        print(f"{dest.relative_to(ROOT)}  {dest.stat().st_size // 1024} KB  ({len(text)} chars)")


if __name__ == "__main__":
    main()
