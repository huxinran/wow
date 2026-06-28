# WoW Side-Scroller Demo

## English Requirement Translation

I want to create a new game in this `WoW` directory. The game is a side-scrolling stage-based action game. The player controls a small squad, potentially made up of several characters inspired by World of Warcraft-style fantasy archetypes. Each level should be short. Before or during a level, the player can choose several characters to bring into battle. The main view is a horizontal side-scrolling scene, where the squad appears to move forward through an environment.

Each level randomly spawns enemies. Defeating enemies rewards the player with items or gear. After a level ends, the player can upgrade equipment or use dropped materials to craft new equipment.

For the first simple demo, I only want to see one player character and one enemy standing on opposite sides of the screen and fighting. All characters, including enemies, must be animated. They should be able to move on the screen and perform animated attack actions. The attack should fire a projectile with its own visible model and flight animation. When the projectile hits the enemy, the enemy should lose health.

## Current Demo

- One animated hero and one animated enemy.
- `A` / `D` moves the hero.
- `Space` plays an attack animation and fires a projectile.
- Projectiles have their own animated model.
- Enemy loses health when hit.
- `R` resets the encounter.

Open `index.html` in a browser to run the demo.

## Art Direction and ImageGen

The project art direction is documented in `docs/art-direction.md`.

Reusable ImageGen prompt rules for cute animated fantasy assets live in `tools/wow-cute-fantasy-assets/SKILL.md`, with prompt templates in `tools/wow-cute-fantasy-assets/references/prompt-cookbook.md`.
