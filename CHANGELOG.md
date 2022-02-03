# Changelog

## [3.2.0](https://github.com/google/eme_logger/compare/v3.1.3...v3.2.0) (2022-02-03)


### Features

* Log more HTMLMediaElement events ([#30](https://github.com/google/eme_logger/issues/30)) ([fb5a90d](https://github.com/google/eme_logger/commit/fb5a90dca86a5575333d9a5a07dda76130b66f09))


### Bug Fixes

* Fix missing fields in message events ([63e6d5f](https://github.com/google/eme_logger/commit/63e6d5f6acd69e780566363f28ab61e055da6f44)), closes [#27](https://github.com/google/eme_logger/issues/27)

## [3.1.3](https://github.com/joeyparrish/eme_logger/compare/v3.1.2...v3.1.3) (2021-11-15)

### Bug Fixes

* Fix build to always install the latest deps ([2893bc7](https://github.com/joeyparrish/eme_logger/commit/2893bc77ae8b99481f83c94085e798b69534c8d2))


## [3.1.2](https://github.com/joeyparrish/eme_logger/compare/v3.1.1...v3.1.2) (2021-11-15)

### Bug Fixes

* Add missing instance ID in text logs ([e746391](https://github.com/joeyparrish/eme_logger/commit/e746391299536b6610f7d16b43ec0889e21948a1)), closes [#26](https://github.com/joeyparrish/eme_logger/issues/26)
* Fix window pollution in browser ([c9906cf](https://github.com/joeyparrish/eme_logger/commit/c9906cfb1229b71358d636793d3af9d310fb9cdf)), closes [#25](https://github.com/joeyparrish/eme_logger/issues/25)


## [3.1.1](https://github.com/joeyparrish/eme_logger/compare/v3.1.0...v3.1.1) (2021-11-11)

### Bug Fixes

* Exclude gulpfile from the distribution ([8ca1395](https://github.com/joeyparrish/eme_logger/commit/8ca139573535fbff69092db9a122aca6196dc50e)), closes [#24](https://github.com/joeyparrish/eme_logger/issues/24)
* Fix log window focus ([8d09fea](https://github.com/joeyparrish/eme_logger/commit/8d09fea648cd41e410878d6acb25081d39f41c7a)), closes [#23](https://github.com/joeyparrish/eme_logger/issues/23)
* Fix download of log file ([86c72c0](https://github.com/joeyparrish/eme_logger/commit/86c72c061b7f2d58a49a459b030a0fcb8e12f0a5)), closes [#22](https://github.com/joeyparrish/eme_logger/issues/22)


## [3.1.0](https://github.com/joeyparrish/eme_logger/compare/v3.0.1...v3.1.0) (2021-11-10)

### Features

* New formatter API ([a3a183d](https://github.com/joeyparrish/eme_logger/commit/a3a183da5e238eb11b39fc43b9d8efba6a96533f))

### Bug Fixes

* Format timestamps in local time zone and locale ([4b3ae95](https://github.com/joeyparrish/eme_logger/commit/4b3ae95a6babb0bdf3ced31ce393b4b31a85f1b7))
* Format Date objects as readable strings ([dd02f48](https://github.com/joeyparrish/eme_logger/commit/dd02f48a4d220b255fd328cfc2726f77ec2ca0b4))
* Fix constness of local id var ([625fd3d](https://github.com/joeyparrish/eme_logger/commit/625fd3da81207da2dd561a508d15228ff907e9c1))


## [3.0.1](https://github.com/joeyparrish/eme_logger/compare/v3.0.0...v3.0.1) (2021-11-09)

### Bug Fixes

* Fix unnecessary permissions ([bb9acb9](https://github.com/joeyparrish/eme_logger/commit/bb9acb97b545d45a664a23c7087e837165c7ffe0))


## [3.0.0](https://github.com/joeyparrish/eme_logger/compare/v2...v3.0.0) (2021-10-26)

### ⚠ BREAKING CHANGES

* Drop support for prefixed EME ([ce9f970](https://github.com/joeyparrish/eme_logger/commit/ce9f970f1a8ba1ddb9694f2843eb0944c92af6ba))

### Features

* Add configurable mapping of event names to associated properties ([d4007cf](https://github.com/joeyparrish/eme_logger/commit/d4007cf63e1987a84eec61abe569de3c184fb49d))
* Add duration to logs ([6fe1aa6](https://github.com/joeyparrish/eme_logger/commit/6fe1aa6a5779b2063bfebea1d1a3464a6d0c0ea7))
* Add TraceAnything, a new generic tracing engine ([09260ee](https://github.com/joeyparrish/eme_logger/commit/09260ee0677cc3e89d74c44970428179e48693e5))
* Discover more events dynamically ([698770d](https://github.com/joeyparrish/eme_logger/commit/698770d8828c77d376b3829ae852a2d1764a9e51))
* Instance ID tracking ([8d3beb1](https://github.com/joeyparrish/eme_logger/commit/8d3beb1f7a0f3edbaff4a951b6451c9b36bc2b92))
* Log more HTMLMediaElement events ([#30](https://github.com/joeyparrish/eme_logger/issues/30)) ([fb5a90d](https://github.com/joeyparrish/eme_logger/commit/fb5a90dca86a5575333d9a5a07dda76130b66f09))
* More compact formatting for 1-item arrays and 1-key objects ([bc0014d](https://github.com/joeyparrish/eme_logger/commit/bc0014d25d4c00acb908b4325e5ef5493d60588e))
* Move all UI to the log window ([0f16417](https://github.com/joeyparrish/eme_logger/commit/0f16417d79e24d388a244bf9ec662fc7fa5ebf50))
* Replace the tracing and log window implementations ([ec0b4aa](https://github.com/joeyparrish/eme_logger/commit/ec0b4aa55abcecfbb1f8a27fcdea4b46fee904ca))
* Trace mediaCapabilities.decodingInfo ([0efdef6](https://github.com/joeyparrish/eme_logger/commit/0efdef688233973e1dc63bf15eaf55dc13a62452))

### Bug Fixes

* Add missing instances in logs, document instance field ([45cf349](https://github.com/joeyparrish/eme_logger/commit/45cf34950c64bd392b5f9599dd4ce0eb58f2d746))
* Attempt to update manifest.json, attach zip ([6e4d133](https://github.com/joeyparrish/eme_logger/commit/6e4d133cac1c884322ff8f5e4464ed4d0e586834))
* Fix formatting of events and their values ([0b30146](https://github.com/joeyparrish/eme_logger/commit/0b3014681adb9ef8e64da757ee16e00d8c71855b))
* Fix missing fields in message events ([63e6d5f](https://github.com/joeyparrish/eme_logger/commit/63e6d5f6acd69e780566363f28ab61e055da6f44)), closes [#27](https://github.com/joeyparrish/eme_logger/issues/27)
* Hook into the formatter interface ([c39f9a0](https://github.com/joeyparrish/eme_logger/commit/c39f9a0a90de7cf5b045d1b110fc869ffae18a2a))
* Skip additional noisy properties ([16ae0f5](https://github.com/joeyparrish/eme_logger/commit/16ae0f50d91483eef276a812676944ca06289176))
