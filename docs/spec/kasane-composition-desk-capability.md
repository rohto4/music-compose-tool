# KASANE Composition Desk Capability Contract

Status: adopted local Proof A

Decision: `JUDGE-023`

Entry point: `/kasane`

## 1. Product outcome

音楽理論やDAW操作を熟知していない個人制作者が、白紙、prompt、録音から始めず、調律済みの1曲を聴きながらscene単位の変化を選び、10分以内に自分の展開を持つ短いinstrumental draftへ到達できる。

Core loopは`KIT → PLAY → SHAPE → KEEP`。入力精度や生成AIの当たり外れを成功条件にしない。

## 2. Proof A scope

### Actor

- PCまたはsmartphone browserを使う個人制作者。
- 和声、sound design、mixの専門語を知らなくても操作できる。

### Trigger

- `/kasane`を開き、3つのHero Kitから1つを選ぶ。

### Observable outcome

1. 選んだKitのsceneと5 roleが1枚の制作面に現れる。
2. 現在曲または選択sceneをuser gesture後のWeb Audioで試聴できる。
3. sceneを選び、`LIFT / STRIP / BOUNCE / ANSWER / BREAK`から1つを選ぶと、beforeとvariationを同じ開始位置で比較できる。
4. variationはpreview中にProjectを変更しない。
5. `KEEP CHANGE`で1 atomic commitになり、`UNDO`1回でbeforeへ戻る。
6. Kit、scene、moveの現在値と操作結果を、色だけに依存せず文字・形・状態で読める。

### Explicit non-goals

- microphone、humming transcription、speech command。
- generative music AI、外部provider、home inference gateway。
- license未確認sample、loop pack、画像、fontの追加。
- full DAW replacement、plugin host、account、cloud sync、公開、課金。
- asset件数やpreset件数による完成度の主張。

## 3. Domain model

### HeroKit

Versioned catalog item。Proof Aは次の3件だけを持つ。

| ID | Identity | Tempo / key | Sound promise |
| --- | --- | --- | --- |
| `candy-skyline` | Candy Skyline | 142 / D major | glass lead、open harmony、elastic offbeat、candy impact |
| `prism-rush` | Prism Rush | 176 / F# minor | needle lead、power stack、drive bass、prism fill |
| `moon-soda` | Moon Soda | 128 / A major | music-box lead、suspended pad、round sub、reverse bloom |

各Kitはscene、role pattern、voicing、timbre profile、mix基準を一式で持つ。別Kitの一部を暗黙混在させない。

### Scene

曲の時間範囲とenergy intentを持つ。Proof Aの既定flowは`Intro → Lift → Drop → Air → Final`。各sceneは固定の開始beatと長さを持ち、selectionの境界になる。

### Role

`Lead / Harmony / Bass / Rhythm / Texture`の5つ。見た目のlaneとaudio planを同じrole IDから導く。

### SceneMoveRecipe

| Move | Primary effect | Preserve |
| --- | --- | --- |
| `LIFT` | top note、bass octave、transitionを上げる | scene長、chord identity、lead motif |
| `STRIP` | rhythmをhalf-time、harmony / textureを薄くする | chord identity、scene boundary |
| `BOUNCE` | bass / rhythmをoffbeat recipeへ替える | lead identity、scene長 |
| `ANSWER` | scene後半へ短いlead responseを置く | 前半motif、harmony、他scene |
| `BREAK` | transientを減らし、空白とreverse transitionを作る | key、scene長、次sceneの頭 |

Recipeはversion、対象scene、変更するrole、保持条件を持つ。乱数、時刻、network応答を参照しない。

### CompositionState

- active kit ID
- active scene ID
- active move IDまたは`KEEP`
- committed move per scene
- revision number

preview stateとcommitted stateを分離する。previewの選択だけではrevisionを増やさない。

## 4. Invariants

1. 同じHero Kit、scene、move、versionから同じ結果を得る。
2. Scene Moveはtarget scene外を変更しない。
3. `KEEP`は現在のcommitted stateであり、新しいcommandを作らない。
4. commit前のstateは履歴へ残り、undo 1回で完全に戻る。
5. Kit切替は未commit previewを破棄し、新Kitの基準状態へ移る。
6. user gesture前にAudioContextを自動開始しない。stop後にfuture sourceを残さない。
7. 音が利用できなくてもUI操作とstateは壊れず、具体的なerrorを表示する。
8. primary UIのaccessible nameに`AI`、`鼻歌`、`humming`、`microphone`を操作入口として出さない。
9. 旧Phase 1の`/`、Project schema、保存dataを変更しない。

## 5. UI contract

最初のviewportで次を同時に理解できる。

- product / project identity、BPM、key、local-only境界。
- PLAY / STOP、全体 / scene preview、現在の再生状態。
- 3 Hero Kitと現在Kit。
- 5 sceneのenergy curveと現在scene。
- 5 roleのweaveと現在のpattern / sound identity。
- Move Deck、before / variation、`KEEP CHANGE`、`REJECT`、`UNDO`。

desktopは制作面を横に分断しない。small viewportではdocument横overflowを出さず、role weaveだけを内部scrollまたは縦積みにする。pointer、keyboard、focus-visible、reduced motionを持つ。

## 6. Failure states

| Failure | Required behavior |
| --- | --- |
| Web Audio unsupported | 再生だけをdisabledにし、編集stateを維持する |
| AudioContext resume / schedule failure | transportを停止状態へ戻し、errorをstatusへ出す |
| unknown Kit / scene / move | domainで拒否し、既存stateを変更しない |
| duplicate commit | 同じrevisionへ重複commandを作らない |
| undo without history | disabled。stateを変更しない |

## 7. Acceptance evidence

### Automated

- catalog 3件、ID一意、scene 5、role 5、recipe 5を固定する。
- 全Kit × 全scene × 全moveでdeterminism、scope、preserve、non-mutationを確認する。
- previewはrevision不変、commitは+1、undoは元stateへ戻る。
- componentでKit / scene / move、commit / reject / undo、audio success / failure、AI / microphone primary control 0を確認する。
- `npm.cmd run check`をpassする。

### Browser observation

- system Chromeで2560×1440、1440×900、375×812。
- play / stop、Kit切替、scene選択、全5 moveのpreview、commit、reject、undo。
- document横overflow 0、unnamed button 0、console error 0、page error 0、request failure 0。

### Evidence boundary

自動testとvisual QAは「正しく動く」「意図どおり見える」の証拠であり、Hero Kitの音楽的魅力、長時間制作の快適さ、Studio One実import、完全なWCAG適合の証拠ではない。
