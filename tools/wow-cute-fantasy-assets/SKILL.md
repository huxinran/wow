---
name: wow-cute-fantasy-assets
description: Create high-quality ImageGen prompts and asset specifications for this WoW project. Use when generating, revising, or planning cute chibi fantasy side-scroller game assets including animated player characters, enemies, projectiles, VFX, UI icons, equipment, loot, environments, sprite sheets, idle/walk/run/attack/hurt/death animation frames, and consistent asset naming or export requirements.
---

# WoW Cute Fantasy Assets

## Core Direction

Create original cute fantasy assets for a side-scrolling action game. The style is inspired by classic high-fantasy MMO archetypes, not copied from any specific franchise. Avoid protected names, exact armor sets, faction symbols, races, silhouettes, logos, or iconic character designs. Use broad archetypes such as "blue-robed frost mage", "tiny tusked forest shaman", "armored fire imp", or "glowing arcane bolt".

The default art direction:

- Chibi/Q-version proportions: oversized head, compact body, readable hands and feet.
- Cozy heroic fantasy mood: playful, bright, collectible, polished.
- Side-view game readability: strong silhouette, clear attack direction, simple shapes.
- Transparent background for individual assets unless an environment/background is requested.
- Consistent soft painterly game-art rendering with clean edges, not photorealistic.
- Prefer sprite sheets for animation requests, with evenly spaced frames on a grid.

## Workflow

1. Identify the asset type: character, enemy, projectile, VFX, equipment, loot, icon, environment, UI, or animation sheet.
2. If the request involves animation or a character/enemy, require animation states unless the user explicitly asks for a still image.
3. Read `references/prompt-cookbook.md` for prompt structures and frame specifications.
4. Produce a complete ImageGen prompt with:
   - subject and gameplay role
   - side-scroller camera/view
   - Q-version fantasy style
   - animation state or sprite sheet layout
   - transparent/background requirements
   - consistency anchors
   - negative constraints
5. If saving files, use lowercase hyphenated names and include the state and frame layout in the filename.

## Animation Standards

Default character/enemy animation set:

- `idle`: 4 frames, breathing/bobbing loop
- `walk`: 6 frames, readable side-view gait
- `attack`: 6 frames, wind-up, release, follow-through
- `hurt`: 3 frames, impact recoil
- `death`: 6 frames, collapse or dissolve

Default projectile animation set:

- `fly`: 4 frames with spin/pulse/trail
- `impact`: 4 frames with burst and fading sparks

For early prototypes, a single sprite sheet may contain one state. For production-ready assets, request separate state sheets to keep frame timing and pivots predictable.

## Prompt Rules

Always ask ImageGen for:

- orthographic or flat side-view presentation for gameplay sprites
- centered subject with consistent scale across frames
- transparent background for sprites, icons, projectiles, and VFX
- no text, watermark, logo, UI chrome, frame labels, or annotations inside the image
- clean alpha edges and sufficient empty padding around animated motion
- a single consistent character design repeated across all frames

When asking for a sprite sheet, specify:

- exact grid such as `6 frames in one horizontal row` or `4 columns x 5 rows`
- equal cell size
- consistent feet/baseline alignment
- no frame numbers or labels
- contact shadows only if useful and consistent

## References

Read `references/prompt-cookbook.md` whenever writing prompts or asset specs.
