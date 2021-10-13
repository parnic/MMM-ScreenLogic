# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2021-10-13

### Added

- Can optionally display pH tank level alongside raw pH value now (on by default).

### Fixed

- Better font size scaling with newer MagicMirror versions.

## [1.1.2] - 2020-04-08

### Fixed

- Fixed which property was being read to determine whether heat mode was enabled or not. Previously the state of the heater itself was being used to display on/off status, now the requested mode is used instead (the heater toggles on/off as part of normal operation even while heating is enabled).

## [1.1.1] - 2020-04-07

### Added

- Ability to specify which heat mode to use when enabling heating for a specific body. Previously mode 1 was always sent which means "solar" while most people probably want mode 3 which is "heat pump".

## [1.1.0] - 2020-04-01

### Added

- Ability to show buttons for controlling pool equipment (with a touch screen, for example). NOTE: running `npm install` again is necessary after upgrading to this version if the heat controls are used.

## [1.0.3] - 2018-04-27

### Changed

- Packaged a newer `node-screenlogic` dependency to fix server broadcast in certain environments.

## [1.0.2] - 2018-04-26

### Added

- New option `updateInterval` to control how often the pool data is updated (default 30 minutes).

## [1.0.1] - 2018-04-25

### Added

- New option `showFreezeMode` shows a banner acrosss the top if the pool is currently in freeze-protection mode.

## [1.0.0] - 2018-04-24

- Initial release.
