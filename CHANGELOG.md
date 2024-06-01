# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.11.1](https://github.com/MichaelMakesGames/stellarmaps/compare/stellarmaps-v0.11.0...stellarmaps-v0.11.1) (2024-06-01)

### Features

- **ui:** add Japanese translation from karokaro and Traditional Chinese translation from HYA ([2a9ebed](https://github.com/MichaelMakesGames/stellarmaps/commit/2a9ebed2cc28f70f2e52ed9c09a641d3f2fb8c5a))

### Bug Fixes

- **ui:** fix icon group names not localized ([018f130](https://github.com/MichaelMakesGames/stellarmaps/commit/018f130ce87ff9a18d190784bc82b2bd0af28f32))
- **ui:** remove test ENGLISH locale and automatically reset invalid locale settings ([3a8ae2e](https://github.com/MichaelMakesGames/stellarmaps/commit/3a8ae2eb447cd715df2691d8ede38191369a64e9))

## [0.11.0](https://github.com/MichaelMakesGames/stellarmaps/compare/stellarmaps-v0.10.0...stellarmaps-v0.11.0) (2024-05-14)

### Features

- **map:** add system labels ([918cb83](https://github.com/MichaelMakesGames/stellarmaps/commit/918cb83ccb3b508edf9261b6549953e6260c8f71))
- **map:** add union border color settings, separate from sector border color ([3447f22](https://github.com/MichaelMakesGames/stellarmaps/commit/3447f22ead3aeb59b8f155131f3863e3852c7cfb))
- **map:** separate union settings for hegemony and non-hegemony federations ([51556b8](https://github.com/MichaelMakesGames/stellarmaps/commit/51556b81e44c005f859a06746e8a4e9dba5e340b))
- **map:** implemented Stellaris language setting, changing which loc files are loaded ([46830c2](https://github.com/MichaelMakesGames/stellarmaps/commit/46830c20781ec27fb9f345335c53e87112e35037))
- **ui:** add app settings screen and refactor map settings ([0973558](https://github.com/MichaelMakesGames/stellarmaps/commit/09735585d3f0df62747b45f9732ed5afb0385693))
- **ui:** add link to GitHub ([fad5fb6](https://github.com/MichaelMakesGames/stellarmaps/commit/fad5fb685ea7f4a510861d14eac5c145a101ca0e))
- **ui:** add tooltips for dash pattern, border fill fade, and name/emblem min/max size ([59647b8](https://github.com/MichaelMakesGames/stellarmaps/commit/59647b898da08d387a0c2e93b7f7b5b017080bd5))
- **ui:** implement translator mode, with reports and dynamic message loading for translators ([836f47a](https://github.com/MichaelMakesGames/stellarmaps/commit/836f47afdac276000aee9262e9171b98be5a122c))
- **ui:** make the app translatable ([a7d1782](https://github.com/MichaelMakesGames/stellarmaps/commit/a7d17821fc6016771297aed1b8bbe51053049725))

### Bug Fixes

- **map:** fix wormhole icons and paths for a certain Astral Planes system ([a2e69e6](https://github.com/MichaelMakesGames/stellarmaps/commit/a2e69e653f756d822f59bb24540ff0e3dc2a481c))
- **ui:** fix error messages displayed beneath export modal ([6e93812](https://github.com/MichaelMakesGames/stellarmaps/commit/6e9381256ebca04002e1a751bc3e8d51cecbab1b))
- **ui:** fix export button displayed even when there's no map to export yet ([0df12da](https://github.com/MichaelMakesGames/stellarmaps/commit/0df12da5647534a1eddeaab172cf315f7e9ac635))

## [0.10.3](https://github.com/MichaelMakesGames/stellarmaps/compare/stellarmaps-v0.10.2...stellarmaps-v0.10.3) (2024-04-16)

### Bug Fixes

- **parser:** increase maximum nested object depth when skipping a value ([2f754e1](https://github.com/MichaelMakesGames/stellarmaps/commit/2f754e129c3387c9a9c5c2b0f1aae22e6f64295c)), closes [#7](https://github.com/MichaelMakesGames/stellarmaps/issues/7)
- **parser:** provide default for value UNKNOWN if name is missing ([cc76cdd](https://github.com/MichaelMakesGames/stellarmaps/commit/cc76cdd97b2483a8893891a8ce7b988d11a3ec18))

## [0.10.2](https://github.com/MichaelMakesGames/stellarmaps/compare/stellarmaps-v0.10.1...stellarmaps-v0.10.2) (2024-03-20)

### Bug Fixes

- **parser:** fix localization files that start with comments are not loaded ([b9157c2](https://github.com/MichaelMakesGames/stellarmaps/commit/b9157c241f22513eb576f8654b05cff16c892131))

## [0.10.1](https://github.com/MichaelMakesGames/stellarmaps/compare/stellarmaps-v0.10.0...stellarmaps-v0.10.1) (2024-03-19)

### Features

- **ui:** add button to manually select save ([0d81501](https://github.com/MichaelMakesGames/stellarmaps/commit/0d8150169498b60b2ff57d19043041443e927058))

### Bug Fixes

- **export:** handle errors finding default export path ([d91092f](https://github.com/MichaelMakesGames/stellarmaps/commit/d91092f47d0fc64a1e3193fcd9b5c748e0c4bcd0))
- **parser:** fix validation error if player name contains only numbers ([7a1f4d1](https://github.com/MichaelMakesGames/stellarmaps/commit/7a1f4d1646df311b93dfc1a06e78082f6a5e0a52))
- **parser:** handle invalid utf-8 in gamestate ([7b3e250](https://github.com/MichaelMakesGames/stellarmaps/commit/7b3e250c2ab46d8b58658543c87584d8a47bdeeb))

## 0.10.0 (2024-03-15)

### Features

- **parser:** new save file parser for drastically improved load times
- **data:** automatic data validation and correction for improved stability
- **map, data:** add ability for border to claim neighboring patches of void ([5a9f43e](https://github.com/MichaelMakesGames/stellarmaps/commit/5a9f43e4ddbd8cf4da59002662e25d874caa0938))
- **map, data:** add option for hyperlane-sensitive borders ([1e36be1](https://github.com/MichaelMakesGames/stellarmaps/commit/1e36be11f3ff96ac715283dc94df3305ea5b6fad))
- **map, data:** add option to display player names in addition to or instead of country names ([8dd09db](https://github.com/MichaelMakesGames/stellarmaps/commit/8dd09dba0478194cb9c18ee7403c069dd557518a))
- **map, data:** connect circular outlier borders along their hyperlanes ([ea9c74f](https://github.com/MichaelMakesGames/stellarmaps/commit/ea9c74fdaee5ee0ff504abbbfd633162a18cb0a2))
- **map, data:** detect and reassign country border fragments created by circular galaxy borders ([9ca7490](https://github.com/MichaelMakesGames/stellarmaps/commit/9ca749047f7749f32d55be22d4886dfa0f5fc749))
- **map, ui, data:** metro-style enables align to grid, align to grid disables hyperlane-sensitivity ([672d7c2](https://github.com/MichaelMakesGames/stellarmaps/commit/672d7c2a765f96726b8e2b9c948bb849b204adc7))
- **map:** add country fill fade map setting ([02e74ed](https://github.com/MichaelMakesGames/stellarmaps/commit/02e74eddfb5ff1b6f4048d6741eff52dd36b1064))
- **map:** add customizable background starscapes ([73c6bef](https://github.com/MichaelMakesGames/stellarmaps/commit/73c6befc2dd43b673c3e4bc2da4808ad26aedd91))
- **map:** add icon options for various polygons and stars ([15b21f3](https://github.com/MichaelMakesGames/stellarmaps/commit/15b21f3668f9c5c61b23a3ba1c144582209f6cdd))
- **ui:** add discord link ([9f82555](https://github.com/MichaelMakesGames/stellarmaps/commit/9f82555e6afa07ab267f7c8073cdda6d61d382e7))
- **ui:** add more vertical spacing to map settings ([4b0e11e](https://github.com/MichaelMakesGames/stellarmaps/commit/4b0e11e3e77ed8b206d09713658af4747d54d987))
- **ui:** add tight, starry gold, and starry blue presets ([88030c8](https://github.com/MichaelMakesGames/stellarmaps/commit/88030c86ad7ebca885ef14bfc6faf4704318ecbb))
- **ui:** add tooltip to "Metro-style Hyperlanes" ([385d389](https://github.com/MichaelMakesGames/stellarmaps/commit/385d3893b4f502f4e0edc01df3c152ebc0d03a74))
- **ui:** add tooltips to the various Advanced Border Settings ([5b115ca](https://github.com/MichaelMakesGames/stellarmaps/commit/5b115ca56d6371c3d05ff06feeb8fecb00e46fea))
- **ui:** improved tooltip behavior ([925a90d](https://github.com/MichaelMakesGames/stellarmaps/commit/925a90d23a06e020913366e406c0fe665d255f63))
- **ui:** show error if map fails to process ([9c00a9c](https://github.com/MichaelMakesGames/stellarmaps/commit/9c00a9ce4524336b85c9fba089459daee58e1f66))
- **ui:** show setting validation and prevent application of invalid settings ([0804dd7](https://github.com/MichaelMakesGames/stellarmaps/commit/0804dd7ad1016ca1ce94349ebefb440f2a2c7a33))

### Bug Fixes

- fail to load colors when some mods are active ([6336f02](https://github.com/MichaelMakesGames/stellarmaps/commit/6336f02e6625affea56a32d869b047ba777a99ca))
- **map, ui:** tooltip is misplaced when 'Align Solar Systems to Grid' is enabled ([b7f9375](https://github.com/MichaelMakesGames/stellarmaps/commit/b7f9375cb682fa44fe3d3547e42b0fccd41511d1))
- **map, data:** fix Formless country has no borders
- **map, data:** fix country labels not bound by galaxy border circles ([a013614](https://github.com/MichaelMakesGames/stellarmaps/commit/a01361427f70154741d6ddf3254dbc14cefbbf93))
- **map, data:** fix crash when border width == 0 ([9ffc45c](https://github.com/MichaelMakesGames/stellarmaps/commit/9ffc45c98f9a4a3dca9e78e9799d79de18e1732a))
- **map, data:** fix outlier systems considered when finding cluster centers ([5a96dab](https://github.com/MichaelMakesGames/stellarmaps/commit/5a96dab68246dfd348688b888870b35374046a94))
- **map, data:** fix systems with multiple hyperlanes considered outliers ([d1fa070](https://github.com/MichaelMakesGames/stellarmaps/commit/d1fa07030d6838ff703b3a2d366126cecc3b12b9))
- **map:** union leader symbol 'None' displays text 'none' ([4d7204d](https://github.com/MichaelMakesGames/stellarmaps/commit/4d7204d3f1e41633755372bc5d4ee43194b9d29a)), closes [#3](https://github.com/MichaelMakesGames/stellarmaps/issues/3)
- **ui:** fix 'Dynamic Colors' option group is shown even when empty ([ca15d63](https://github.com/MichaelMakesGames/stellarmaps/commit/ca15d63891a8fa66885091f517d13d5c0d1eb31b))
- **ui:** fix invalid default value for Unowned Hyperlane Color ([1e64927](https://github.com/MichaelMakesGames/stellarmaps/commit/1e649275a9fe15b24d6db704a7c3708fbdda74ef))
- **ui:** loaded preset settings are not validated and reset ([793c631](https://github.com/MichaelMakesGames/stellarmaps/commit/793c631963f245583757db3317121b66e0381554))
