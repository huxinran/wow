# Image Asset Index

Last indexed: 2026-06-28

## Active Game Assets

| Asset | Size | Alpha | Layout | Current use |
| --- | ---: | :---: | --- | --- |
| `assets/characters/hero-ember-archer-run-6f-transparent.png` | 2172 x 724 | yes | 6 frames, 1 row, 362 x 724 cells | Main hero run/idle loop |
| `assets/animations/hero-ember-archer-attack-6f-transparent.png` | 2172 x 724 | yes | 6 frames, 1 row, 362 x 724 cells | Main hero attack animation |
| `assets/animations/enemy-horned-grunt-walk-hurt-death-transparent.png` | 1536 x 1024 | yes | 6 columns x 3 rows, 256 x 341 cells | Enemy animation sheet: walk, hurt, death |

## Alternate Or Source Variants

| Asset | Size | Alpha | Layout | Notes |
| --- | ---: | :---: | --- | --- |
| `assets/animations/hero-ember-archer-attack-6f.png` | 2172 x 724 | no | 6 frames, 1 row, 362 x 724 cells | Opaque/RGB variant of active hero attack sheet |
| `assets/animations/enemy-horned-grunt-walk-hurt-death.png` | 1536 x 1024 | no | 6 columns x 3 rows, 256 x 341 cells | Opaque/RGB variant of active enemy sheet |
| `assets/characters/hero-warrior-walk-6f.png` | 2172 x 724 | yes | 6 frames, 1 row, 362 x 724 cells | Older non-pixel-art warrior walk sheet; not current main hero |

## Concepts

| Asset | Size | Alpha | Notes |
| --- | ---: | :---: | --- |
| `assets/concepts/auto-battle-pixel-sprite-sheet-v1-transparent.png` | 1536 x 1024 | yes | Concept sprite sheet with transparent background |
| `assets/concepts/auto-battle-pixel-sprite-sheet-v1.png` | 1536 x 1024 | no | Opaque/RGB concept variant |

## Runtime Conventions

- Main hero sprite sheets use 6 horizontal frames.
- Main hero active pixel-art assets should stay visually consistent with the ember archer design.
- Enemy sheet rows are interpreted as:
  - Row 1: walk
  - Row 2: hurt
  - Row 3: death
- Transparent PNG assets are preferred for runtime rendering.
