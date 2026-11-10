# 晶境漫遊 · Prismwander

An original open-world RPG in a 3D world of blocks, in Traditional Chinese and English. It runs in the browser with three.js.

**Play:** https://ywchen0711.github.io/prismwander/

## The idea

Long ago the Prism that crowned the Spire shattered into eight crystals, each holding the craft of a hero of old. Four friends from Hearthvale set out on their village's "wandering year": Lowe, Flora, Bal and Shia. There is no set route. You climb, jump and wander wherever you like, and each crystal you touch teaches the party a new job. With all eight, the gate of the Prism Spire opens.

## How it plays

- **Go anywhere.**
  - You walk up one-block steps on your own and jump two blocks.
  - The Spring Boots let you jump three blocks, and the Glide Cape lets you float down from heights.
  - The world takes in a meadow, a forest, a coast, a lake with stepping stones, a terraced red mesa, snowy mountains and the Spire.
  - All of it is generated from fixed seeds, so everyone gets the same world.
- **Jobs from crystals.**
  - Twelve jobs. Four come from the village; the other eight are crystals hidden in hard-to-reach places.
  - Each friend has a main job, which sets their stats and weapons, and a sub job, which lends only the abilities it has learned.
  - Battles earn JP that level up jobs, and the sub job earns half.
- **Monsters you can see and dodge.** They roam the land and chase you when you get close. Their strength is fixed by region and never scales with your level. Three guardians watch over the hardest crystals.
- **Turn-based battles** on a little 3D stage with the party's blocky models. Commands are Attack, Abilities, Items, Guard and Run. Battles include poison, sleep, stun, slow, buffs, and passives such as counter, cover and pharmacy.
- **Home stones** heal and save the game, and let you warp between any of them you have touched. The Crystal Compass shows the nearest crystal still to find.

## Controls

| | Keyboard / mouse | Touch | Gamepad |
|---|---|---|---|
| Move | WASD / arrow keys (Shift to run) | left stick | stick / d-pad |
| Jump, glide | Space | ⤒ | X |
| Talk, look | E / Z / Enter | A | A |
| Back | X / Backspace | B | B |
| Turn the camera | drag the mouse, Q / R | drag | right stick, LB / RB |
| Zoom | mouse wheel | | |
| Menu | Esc | ≡ | Start / Y |

## Files

- `js/world.js` generates the world, regions, villages, the Spire, crystals, chests and spawns, and builds chunk meshes.
- `js/main.js` covers walking, jumping, the camera, interaction, roaming monsters, the minimap, the title and the ending.
- `js/battle.js` runs the battles.
- `js/party.js` covers levels, main and sub jobs, JP and saving.
- `js/data.js` holds the jobs, abilities, items and monsters.
- `js/menu.js` has the menus, shops and inns.
- `js/story.js` holds every conversation.
- `js/models.js` loads the Kenney models and builds monsters out of blocks.

There is no build step. Open `index.html` through any static web server. three.js 0.160.0 is loaded from unpkg.

## Credits

See [CREDITS.md](CREDITS.md). All 3D models and block textures are by Kenney (CC0). The music comes from the Ninja Adventure pack by Pixel-boy and AAA (CC0). The world, story, characters and code are original.
