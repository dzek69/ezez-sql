All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [UNRELEASED]
(nothing yet)

## [0.0.3] - 2022-12-06
### Changed
- SELECT WHERE skips condition if undefined is given as a value
### Fixed
- SELECT producing invalid syntax ("and"/"or" without a condition before/after) when empty values given
- underscore considered invalid character for a table name

## [0.0.2] - 2022-12-05
### Fixed
- INSERT query producing empty WHERE sometimes

## [0.0.1] - 2022-12-05
### Added
- first version, basic SELECT and INSERT queries supported
