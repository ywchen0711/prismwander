# 晶境漫遊 · Prismwander

An original open-world RPG in a 3D world of blocks, in Traditional Chinese and English. It runs in the browser with three.js.

**Play:** https://ywchen0711.github.io/prismwander/

## The idea

Long ago the Prism that crowned the Spire shattered into eight crystals, each holding the craft of a hero of old. Four friends from Hearthvale set out on their village's "wandering year": Lowe, Flora, Bal and Shia. There is no set route. You climb, jump and wander wherever you like, and each crystal you touch teaches the party a new job. With all eight, the gate of the Prism Spire opens.

## How it plays

- **Go anywhere.**
  - You walk up one-block steps on your own and jump two blocks.
  - The Spring Boots let you jump three blocks, and the Glide Cape lets you float down from heights.
  - The world is 432 by 432 blocks: a meadow, a forest, a misty marsh, a grove of giant mushrooms, a coast with a port, a lake with stepping stones, a terraced red mesa, a volcano with a lava crater, the ruins of an old capital, snowy mountains, a frozen plain and the Spire.
  - Six villages: Hearthvale, Fenside, Saltmere, Dunewell, Frostgate and a hermit's hut.
  - All of it is generated from fixed seeds, so everyone gets the same world. The land is built in chunks around you as you walk.
- **Day and night.** A day lasts eight minutes. Nights are dark but the party carries a lantern; ghosts and wisps only come out after dark, and one rare fish only bites at night. Resting at an inn brings the morning.
- **Jobs from crystals.**
  - Twelve jobs. Four come from the village; the other eight are crystals hidden in hard-to-reach places.
  - Each friend has a main job, which sets their stats and weapons, and a sub job, which lends only the abilities it has learned.
  - Battles earn JP that level up jobs, and the sub job earns half.
- **Monsters you can see and dodge.** They roam the land and chase you when you get close. Their strength is fixed by region and never scales with your level. Seven guardians watch over the lands and the hardest crystals.
- **A story to uncover.** A cloaked traveller called Ein turns up in a new place as you find more crystals, and 24 memory shards scattered across the land tell how the Prism broke three hundred years ago. Read them again under Memories in the menu.
- **Requests.** Villagers ask for help: deliver a letter, gather moonherbs in the marsh and glowcaps in the grove, clear the frozen plain, slay the drake of the volcano, catch a golden koi, bring back the memory shards. The menu keeps a request log.
- **Fishing.** The Saltmere fisher gives you a rod. Where rings spread on the water, press E, pull when the "!" shows, then stop the needle on the bright mark. Seven kinds of fish, to eat or sell.
- **Signposts and old tablets** point the way and tell a little of the land's past.
- **Turn-based battles** on a little 3D stage with the party's models in two staggered rows facing the monsters, with the land you were standing on behind them. Commands are Attack, Abilities, Items, Guard and Run. Battles include poison, sleep, stun, slow, buffs, and passives such as counter, cover and pharmacy.
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

- `js/world.js` generates the 432 x 432 world: regions, villages, the ruins, the Spire, crystals, chests, spawns, memory shards, signs, herbs and fishing spots, and builds chunk meshes.
- `js/main.js` streams chunks in around you and covers day and night, walking, jumping, the camera, interaction, roaming monsters, the minimap, the title and the ending.
- `js/battle.js` runs the battles.
- `js/party.js` covers levels, main and sub jobs, JP and saving.
- `js/data.js` holds the jobs, abilities, items and monsters.
- `js/menu.js` has the menus, shops and inns.
- `js/story.js` holds every conversation, the requests, the memory shards and the signposts.
- `js/models.js` loads the Kenney models and builds monsters out of blocks.

There is no build step. Open `index.html` through any static web server. three.js 0.160.0 is loaded from unpkg.

## Credits

See [CREDITS.md](CREDITS.md). The 3D models are by KayKit (Kay Lousberg) and Kenney, and the block textures are by Kenney; all are CC0. The music comes from the Ninja Adventure pack by Pixel-boy and AAA (CC0). The world, story, characters and code are original.
