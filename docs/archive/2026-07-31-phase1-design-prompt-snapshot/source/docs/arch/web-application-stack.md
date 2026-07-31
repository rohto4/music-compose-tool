# Web Application Stack Decision

## Decision

`Adopted for the first fake vertical slice / exact dependency pins pending scaffold`

最初の実装は、browserだけで完結するsingle-page Web / PWAとして次を使う。

| Concern | Decision | Boundary |
| --- | --- | --- |
| language | TypeScript `strict` | domain contractとadapterを型で分離する |
| UI | React 19.2系 | Pastel Patchboard token / hierarchyを採用。Hallmark tokenは使わない |
| precision note surface | Canvas 2D + Pointer Events | React DOMへ全note / grid cellを展開せず、PPQ dataからvisible viewportだけdraw。property / keyboard操作はsemantic DOM |
| build / dev | Vite | static client build。SSR / server frameworkは入れない |
| package manager | npm + `package-lock.json` | install時にexact dependency graphをlockする |
| unit / contract test | Vitest | pure domain、command、adapter contract、negative fixture |
| browser test | Playwright | Chromium / Firefox / WebKit。media codecはbranded Chrome / Edgeでも確認する |
| PWA | Web App Manifestから開始 | offline / service worker / background syncは初版保証にしない |

2026-07-21にlocal Node `v24.14.0`を確認した。Viteの現行公式guideが要求する
Node `20.19+`または`22.12+`を満たす。dependencyのexact versionはscaffold時に公式releaseと
peer dependencyを再確認して固定し、この文書へ将来のfloating versionを記録しない。

## Why this stack

- melody note、timeline、undo / redo、fake AI state等の局所stateをcomponent単位で分離できる。
- Vite / Vitestでbrowser寄りのTypeScriptとtest設定を共有しやすい。
- PlaywrightはChromium、Firefox、WebKitとmobile device profileを同じjourneyで扱える。
- static clientから開始でき、home inference gatewayやCloudflare transportをUI実装の前提にしない。
- 現在のdependency-free prototypeはinteraction contractとして残し、production appへ直接昇格させない。

## Initial source boundaries

```text
src/
├── domain/          # project、melody、arrangement、asset、command。React / browser API禁止
├── application/     # use case、port、state transition
├── adapters/
│   ├── fake/        # fixed fixtureだけを使うPhase 1既定adapter
│   └── browser/     # file / audio / microphoneは個別gate後に追加
├── ui/              # React。domainへport経由で依存
└── fixtures/        # production dataではない固定入力
tests/
├── contract/
└── browser/
```

`domain`はReact、Web Audio、MediaRecorder、Cloudflare、model runtimeをimportしない。
UIからexternal effectを直接呼ばず、application portを経由する。

## Deferred decisions

- exact package versionsとpackage scripts。
- PWA install criteria、icon、update UX。offline対応は非対象のまま。
- Web Audio graph、scheduler、WAV encoderの実装。
- IndexedDBをworking copyへ使うか。
- Pastel PatchboardをReact componentへ移す具体的なtoken package / CSS構成。
- Canvas 2Dのperformance budget、OffscreenCanvas worker / WebGL 2 / WebGPUへの昇格条件。`../research/precision-music-editor-rendering-architecture-2026-07-21.md`。
- deployment host、Cloudflare resource、home inference transport。

## Rejected for the first slice

- Next.js等のserver framework: 最初のfake sliceにSSR、server action、backend routingが不要。
- Electron / Windows native: Web / PWAが採用済み。
- production UIをprototype HTMLから機械変換: 比較artifactとproduction正本を混同するため。
- service workerを先に入れる: 初版のoffline対応が非対象で、update / cache failureを増やすため。

## Evidence

- [React versions](https://react.dev/versions): 2026-07時点のlatest major/minorは19.2。
- [Vite Getting Started](https://vite.dev/guide/): current Node requirementとbuild / dev serverの責務。
- [Vitest Getting Started](https://vitest.dev/guide/): Vite-native test runner。
- [Playwright browsers](https://playwright.dev/docs/browsers): Chromium / Firefox / WebKit、mobile profile、branded browser testing。
