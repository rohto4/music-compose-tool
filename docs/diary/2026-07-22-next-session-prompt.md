# 次sessionへ貼るprompt

`G:\devwork\music-compose-tool`のMusic Compose Tool Phase 1 / PIVOT-001を継続してください。

最初にコンテキスト圧縮・session移動復帰として、次をUTF-8のfile実体から順に読み直してください。

1. `AGENTS.md`
2. `PROJECT.md`
3. `tech-stack.md`
4. `README.md`
5. `docs/imp/user-tasks.md`
6. `docs/guide/implementation-context-reading-guide.md`
7. `docs/imp/imp-tasks.md`
8. `docs/imp/user-judge.md`
9. `docs/imp/imp-comp.md`
10. `docs/diary/2026-07-23-chord-score-theme-handoff.md`

設計を最初からやり直さず、handoffの現在地を使ってください。2026-07-23に次をlocal実装・AI自律確認済みです。

- 無制限4小節phrase、8分音符AUTO、desktop 8小節／行、smartphone 4小節／段
- Chord Padの長押しsustain、全14 chord、31 tonal voice
- 人向けコード譜、ABC、Instrumental-only Creative Brief Markdown、JSON、`.mctproj`
- `ラフ制作` / `カスタマイズ`の2 mode、保持したsection editor / DAW
- DAW矩形範囲選択、Shift追加、複数note move、ghost / delta
- Dark Pastel Studio / Vanilla Pastel / Friendly Signalの3 theme
- Bass / Arp / Drum各5種、合計15のharmony追従pattern browser。試聴、phrase適用、undo / redo、chord再追従、save / reload、Drum MIDIを含む

proofは`npm.cmd run check`（23 files / 95 tests、matrix 32 rows / 77 local links）、Chromium E2E 11/11、dark QA、PWA QA、WQHD～375px visual QAです。機能別マトリクスのrole-follow-patternsを含む実装済み行は★3。ユーザーがブラッシュアップ完了と明示するまで★4へ上げず、既存DAWとHumming / ACEを削除・置換しません。

次は実画面・実耳reviewの指摘反映を優先します。特に15 role patternの使い分け、Chord Score、3 theme、既存DAWを★3の部品単位で確認します。外部credential、実SNS投稿、Cloudflare resource / deploy、license未確認音源、commit / pushは別承認なしに行いません。
