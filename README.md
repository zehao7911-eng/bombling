# BOMBLING

A mobile-friendly bomb puzzle platformer based on the core traversal ideas and pixel-cave presentation of [Öoo](https://store.steampowered.com/app/2721890/ooo/).

Move left and right, PLACE a seed, then POP to launch yourself. Two seeds can be placed. Nearby seeds chain together. There is no ordinary jump. Cracked blocks shatter, movable crates latch gates, spikes return you to the room entry, and optional flowers add a completion stamp. Clear the glowing bloom to open the next chamber.

Twelve original chambers span Violet Roots, Tidal Garden and Rose Afterglow. All graphics and synthesized audio are created by this project. The maps, code and assets are original, and this is an independent browser interpretation of the reference mechanics. It is not the original commercial campaign or an official port.

Keyboard controls are arrow keys or A/D for movement, Z or Space to PLACE, and X to POP. Phone controls use large held direction buttons and two action buttons. Pause, restart and chamber selection are always available. The Gentle flashes setting reduces blast flashes and camera motion.

Open index.html or standalone.html directly in a browser. They are identical compiled entries with no runtime CDN dependencies. Use index-source.html through a local HTTP server to work on the individual modules. Run python build.py to rebuild the two compiled entries and BOMBLING.zip.

Progress belongs to bombling-v1. The game stores its own full local checkpoint, room clears, flowers and settings. Active saved play resumes through a pause menu so an unattended character does not fall. Best awards merge without lowering an earlier result.

Run node tests.mjs for authored-route and checkpoint regression checks. Run node sdk-tests.mjs for the optional host adapter.
