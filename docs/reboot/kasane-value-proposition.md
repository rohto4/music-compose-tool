# KASANE Value Proposition

> 2026-08-01 V2 decision: 鼻歌と生成AIを主価値から外す。現在のappeal pointは、調律済みHero Kit、洗練された1画面UI、予測できるScene Move、同位置A/B、DAWへ続く編集可能な出口である。

Status: V2 direction adopted

## One-line pitch

**KASANEは、曲を聴きながら変えたい場所を指し、AI・鼻歌・手操作の音付き差分を選んで、自分の曲を編集可能なまま育てるWeb composerです。**

## Why this is compelling

### 1. 白紙から始めない

track追加や音源browserではなく、最初から鳴るLiving Scoreを触る。最初の判断は「何を作るか」ではなく「今の流れをどうしたいか」になる。

### 2. AIに奪われない

AIは完成曲を上書きしない。変える場所と残すものをユーザーが決め、before / A / B / Cを聴いて採用する。自作感はpromptの文面でなく、commitした判断の積み重ねに宿る。

### 3. 初心者用と上級者用を分けない

同じ音楽objectをSONG → PHRASE → NOTEへzoomする。初めは曲の流れだけを触り、必要になった瞬間だけnoteまで開く。

### 4. Webの強さだけを使う

instant open、phone capture、proposal比較、local-first、portable snapshotをWebへ置く。精密な音源・plugin・mixは、MIDI / stems / DAWprojectでStudio Oneへ引き継ぐ。

### 5. 候補数で迷わせない

数百presetから選ばせず、現在の曲に合う少数の候補を同じ条件でA/Bする。音色名ではなく、曲の中の役割と差を聴いて決める。

## Old experience → KASANE

| 旧Phase 1 | KASANE |
| --- | --- |
| 3つの開始routeを選ぶ | どのinputも1つのIntent Seed |
| 3つの制作stageを移動 | 1つのLiving Scoreをsemantic zoom |
| 5つのsource tabから素材を探す | selectionに合うChange Deck |
| AI / Hummingが別surface | text / humming / tapが同じproposal |
| catalog数を増やす | 現在曲に合う少数候補をA/B |
| browser内DAWの完成を目指す | 作曲判断を完成し、DAWへ持ち出す |
| test / matrixが完成度の主証拠 | 初見の実演と実耳比較がgate |

## Memorable product moments

### Same-point audition

playheadを戻さず、同じ場所からbefore / A / B / Cを切り替える。変更の良し悪しが説明ではなく耳で分かる。

### Preserve locks

`メロディを守る`、`リズムを守る`、`手編集を守る`をselection横で固定する。AIの賢さより、壊さない安心を先に見せる。

### Fold-open detail

sceneを開くとphrase、phraseを開くとnoteがその場へ展開する。別画面へ飛ばず、曲のどこを直しているか見失わない。

### Branch, not regret

候補を採用してもbeforeは消えない。別案をbranchとして残し、曲の流れごと比較できる。

### DAW handoff

`仕上げる`でMIDI、stems、DAWproject candidateを同じsnapshotから作る。Webから出ることが失敗ではなく、完成workflowの一部になる。

## Honest boundaries

- 最終音質は実音源、browser latency、実speakerで検証が必要。
- DAWprojectはsupport範囲がDAWごとに異なり、unsupported dataのflatten / omit判断が必要。
- OPFSは高速なworking setに向くが、site data消去に備えportable snapshotが必要。
- remote AIはprivacy、retention、cost、licenseを確認するまで標準routeにしない。
- 初版でvocal、social feed、marketplace、full masteringは扱わない。

## Decision requested after presentation

1. KASANEの「Living Score + Change Proposal」を次の正本候補にするか。
2. Webの完成線を「DAW replacement」ではなく「composition + handoff」に置くか。
3. 旧Phase 1のproduction codeを保持したまま、別entrypointでProof Aを作るか。
