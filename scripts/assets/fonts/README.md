# PDF fonts

Noto Sans Regular and Bold from [notofonts/noto-fonts](https://github.com/notofonts/noto-fonts/tree/main/hinted/ttf/NotoSans), under the accompanying SIL Open Font License.

Embedded during PDF generation only. Full Cyrillic and Kazakh coverage keeps rendering and searchable text independent of operating-system fallback fonts.

The website also uses small WOFF2 subsets in `public/fonts/` for ӘәҒғҚқҢңҰұ, which Manrope does not contain. They were produced from these TTFs with FontTools subset (text=ӘәҒғҚқҢңҰұ, flavor=woff2); the license accompanies the public files. Other body glyphs remain Manrope and headings remain Oswald.
