# Brand assets — Yaycay-Admin (Internal ops)

> **Canonical spec:** the design system's `BRAND-ASSETS.md` (vendored with the brand in
> `Yaycay-FE/vendor/yaycay-ds/`). Admin is an internal, off-domain ops console — wear the brand
> **lightly**: enough to feel like Yaycay, never marketing-loud. **For families making memories.**

Marks live under `public/brand/`; the App-Router favicon/touch-icon live in `src/app/`.

## Which mark, which slot (Admin)

| Slot | File | Notes |
|---|---|---|
| Browser favicon | `src/app/icon.png` (**glyph**) | App Router auto; distinguishes the admin tab |
| Apple touch icon | `src/app/apple-icon.png` (**app icon**) | App Router auto |
| Sign-in screen / sidebar header | `public/brand/yaycay-wordmark.png` or `yaycay-glyph.png` | quiet, single mark — not the full lockup |
| Compact chrome mark | `public/brand/yaycay-glyph.png` | beside a "Yaycay Admin" text label |

Also in `public/brand/`: `yaycay-app-icon.png`.

## The rules that bite here
- Prefer the **wordmark** or **glyph** in admin chrome; reserve the full **lockup** (with ribbon)
  for customer-facing surfaces, not an internal tool.
- Square slot ⇒ glyph/app icon; never the wide lockup.
- Keep using the DS tokens for colour (`--brand-primary-deep`, etc.) — don't hard-code hexes.
- Never recolour, stretch, re-typeset, or reword the tagline. Pull the file; don't redraw it.
