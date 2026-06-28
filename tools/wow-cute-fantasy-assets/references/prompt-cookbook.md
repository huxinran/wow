# Prompt Cookbook

Use these templates to write ImageGen prompts for this project. Keep prompts specific, visual, and production-minded.

## Global Style Block

Append this style block to most prompts:

```text
Original cute chibi high-fantasy game art, inspired by broad fantasy MMO archetypes but not copying any existing franchise. Oversized expressive head, compact body, readable silhouette, bright collectible-game polish, soft painterly rendering, clean crisp edges, saturated but balanced colors, side-scrolling action game readability, orthographic side view, transparent background, no text, no logo, no watermark, no frame labels.
```

## Negative Constraint Block

Append or adapt this block:

```text
Do not include copyrighted franchise logos, faction emblems, exact character likenesses, exact armor sets, readable text, watermark, UI frame, photorealism, horror realism, messy sketch lines, inconsistent character design between frames, cropped limbs, inconsistent scale, perspective camera rotation, or labels.
```

## Character Sprite Sheet

Use when generating a playable hero or squad member.

```text
Create a sprite sheet for a playable [archetype] hero: [specific visual description]. The character should feel cute, brave, and toy-like, with a large expressive head, small body, clear hands and feet, and a strong side-view silhouette. Outfit: [robe/armor/materials/colors]. Weapon or focus: [staff/sword/bow/totem/etc.]. Personality: [confident, gentle, mischievous, stoic].

Animation: [state name], [frame count] frames in one horizontal row, equal-sized cells, transparent background. Keep the same character design, proportions, colors, and equipment in every frame. Align the feet to the same baseline. Show readable motion from left-facing or right-facing side-view: [motion breakdown].

Original cute chibi high-fantasy game art, inspired by broad fantasy MMO archetypes but not copying any existing franchise. Oversized expressive head, compact body, readable silhouette, bright collectible-game polish, soft painterly rendering, clean crisp edges, saturated but balanced colors, side-scrolling action game readability, orthographic side view, transparent background, no text, no logo, no watermark, no frame labels.

Do not include copyrighted franchise logos, faction emblems, exact character likenesses, exact armor sets, readable text, watermark, UI frame, photorealism, horror realism, messy sketch lines, inconsistent character design between frames, cropped limbs, inconsistent scale, perspective camera rotation, or labels.
```

### Character Motion Breakdowns

`idle, 4 frames`: subtle breathing, tiny head bob, cloth and hair moving slightly, weapon glow pulsing.

`walk, 6 frames`: side-view walk cycle with alternating feet, gentle body bob, arms counter-swinging, weapon staying readable.

`attack, 6 frames`: anticipation pose, weapon/focus draws energy, strong release pose, projectile leaves hand or weapon, follow-through, recover pose.

`hurt, 3 frames`: impact flash pose, recoil backward, recovery with small stars or sparks.

`death, 6 frames`: stagger, knees buckle, soft collapse or magical dissolve, final small puff; keep cute and non-graphic.

## Enemy Sprite Sheet

Use for monsters, bosses, and minions.

```text
Create a sprite sheet for a cute enemy: [enemy archetype and gameplay role]. It should look readable as a side-scroller opponent, slightly threatening but still adorable. Shape language: [round/spiky/squat/tall]. Materials and colors: [details]. Attack method: [claws/spell/fireball/arrow/etc.].

Animation: [state name], [frame count] frames in one horizontal row, equal-sized cells, transparent background. Keep one consistent enemy design across all frames. Align the feet or body base to the same baseline. Motion breakdown: [specific frame action].

[Global Style Block]

[Negative Constraint Block]
```

## Projectile

Use for bullets, spells, arrows, bolts, thrown weapons, and magical shots.

```text
Create a game projectile sprite sheet: [projectile name], fired by [caster/weapon]. Shape: [orb/bolt/arrow/rune shard/etc.]. Color palette: [colors]. It should be small but readable during fast side-scroller combat, with a clear leading edge and trailing motion.

Animation: fly loop, 4 frames in one horizontal row, equal-sized cells, transparent background. Show spin, pulsing glow, and a short trailing smear while keeping the projectile centered and consistent in size.

Also include or separately generate an impact burst: 4 frames in one horizontal row, expanding spark ring and fading particles, transparent background.

[Global Style Block]

[Negative Constraint Block]
```

## VFX

Use for hit effects, healing, buffs, casting circles, shield pops, and death dissolves.

```text
Create a transparent VFX sprite sheet for [effect name]. It should be readable over a side-scroller fantasy battlefield and match cute polished chibi game art. Colors: [palette]. Shape language: [sparkles/runes/smoke/puffs/shards].

Animation: [frame count] frames in one horizontal row, equal-sized cells. Frame motion: [expansion/fade/pulse/burst]. Keep the effect centered with clean alpha edges and no background.

No text, no labels, no watermark, no UI frame.
```

## Equipment or Loot Icon

Use for inventory items, crafting drops, upgrades, and rewards.

```text
Create a square game inventory icon for [item name]. Object: [clear description]. Mood and rarity: [common/rare/epic/legendary]. Use a cute high-fantasy collectible style with chunky readable shapes, polished highlights, and a transparent background. Center the item, show the entire object, leave padding around the silhouette.

No text, no numbers, no border frame unless requested, no logo, no watermark.
```

## Environment Background

Use for stage backgrounds rather than transparent sprites.

```text
Create a horizontal side-scroller game background for [zone theme]. Cute high-fantasy MMO-inspired environment, original design. Layered parallax composition with foreground ground strip, midground landmarks, and distant background silhouettes. Bright readable colors, soft painterly style, no characters, no UI, no text. Designed for a 16:9 canvas with enough open combat space along the ground.
```

## Naming Examples

- `hero-frost-mage-idle-4f.png`
- `hero-frost-mage-attack-6f.png`
- `enemy-fire-imp-walk-6f.png`
- `projectile-arcane-bolt-fly-4f.png`
- `vfx-arcane-bolt-impact-4f.png`
- `icon-ember-cloth-rare.png`
