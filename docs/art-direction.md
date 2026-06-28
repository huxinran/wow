# Art Direction

## Style Goal

The game should feel like an original cute chibi fantasy side-scroller inspired by broad fantasy MMO archetypes. It can borrow the mood of colorful raids, magical classes, loot, monsters, and heroic fantasy teamwork, but it should not copy protected franchise names, logos, faction symbols, exact armor sets, races, or character silhouettes.

The default visual language is Q-version: oversized heads, compact bodies, expressive faces, readable weapons, chunky shapes, soft painterly rendering, clean edges, and bright collectible-game polish.

## Asset Requirements

Characters and enemies should be animated by default. A still concept is useful only as a design reference; gameplay assets need sprite sheets.

Default character/enemy states:

- `idle`: 4 frames
- `walk`: 6 frames
- `attack`: 6 frames
- `hurt`: 3 frames
- `death`: 6 frames

Default projectile states:

- `fly`: 4 frames
- `impact`: 4 frames

Sprite sheets should use transparent backgrounds, equal-sized cells, consistent scale, consistent baseline alignment, and no text or labels inside the image.

## ImageGen Prompt Standard

Every ImageGen prompt should specify:

- original cute chibi high-fantasy game art
- side-scrolling action game readability
- orthographic side view for gameplay sprites
- transparent background for sprites, projectiles, VFX, icons, and equipment
- exact frame count and grid layout for animations
- same design repeated across all frames
- no text, no watermark, no logo, no frame labels

The reusable prompt workflow lives in:

`tools/wow-cute-fantasy-assets/SKILL.md`
