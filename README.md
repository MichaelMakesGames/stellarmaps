Stylized and customizable Stellaris maps

[Download the latest release here.](https://github.com/MichaelMakesGames/stellarmaps/releases)

<img src="./examples/default.png" alt="Example map">

# Features

- Country borders
- Country names and emblems
- Sector borders
- Capital / sector capital / populated system icons
- Hyperlanes and hyper relays
- Unions mode
- Terra incognita
- PNG and SVG export
- Modded emblem and name support
- Save and load multiple setting profiles

## Planned

- Nebulae
- Gateways and wormholes
- Legend
- Time-lapses

## Known Issues

- Does not work with mod packs using Irony's "Compressed" merge
- Exported SVGs are tested with Inkscape and web browsers. Other viewers/editors may or may not work
- If viewing an SVG with Inkscape, the default Orbitron font will not work unless installed on your computer. [You can download it here.](https://fonts.google.com/specimen/Orbitron)
- Glow effect might only be partially applied when exporting a zoomed-in PNG
- Performance is choppy (but usable) on Linux

# Credits

The app icon is [Orbital](https://game-icons.net/1x1/lorc/orbital.html) by Lorc, licensed under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/).

Map icons are made by me. Basic shapes are released to the public domain, but others (Wormhole, Gateway, L-Gate, etc) are based on icons from the game Stellaris, and should not be used other than for tools or mods for the game.

Other interface icons from [Heroicons](https://heroicons.com), licensed under the [MIT license](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE).

# Local Development

[Follow the tauri prerequisites guide](https://tauri.app/v1/guides/getting-started/prerequisites). Install a recent version of Node.js. Then, in the root directory, run `npm run tauri dev`.
