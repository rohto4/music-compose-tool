# Third-party notices

Runtime dependency license summaries are recorded here for the local Phase 1 build. The package license files in `node_modules/` remain the detailed source during development; distributable notices must be regenerated from `package-lock.json` before a public release.

| Package | Pinned version | License | Purpose |
| --- | --- | --- | --- |
| React / React DOM | 19.2.7 | MIT | UI runtime |
| `@spotify/basic-pitch` | 1.0.1 | Apache-2.0 | Browser audio-to-note transcription and bundled model |
| `idb` | 8.0.3 | ISC | IndexedDB adapter |
| JSZip | 3.10.1 | MIT or GPL-3.0 | `.mctproj` project bundle; this project uses the MIT option |

Development-only dependencies are pinned in `package-lock.json` and are not application runtime content.
