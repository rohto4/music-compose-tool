# 次sessionへ貼るprompt

> 2026-07-24実行済み。HOME-003、SHORTCUT-002、FLOW-002、DAW-012 / 013、INTEROP-001、HARMONY-001とbrowser QAを完了し、結果と次の順序は`docs/diary/2026-07-24-autonomous-session-handoff.md`へ移した。次sessionはこの古い実行順を再実行せず、最新handoffと`docs/imp/imp-tasks.md`を読む。

`G:\devwork\music-compose-tool`のMusic Compose Tool Phase 1を、最大4時間を目安に自律的に継続してください。現在の最優先は`パッチボードで組む`の完成度向上です。これまでの指摘を閉じる前にAI / 鼻歌を主作業へ切り替えないでください。

これはsession移動・コンテキスト圧縮からの復帰です。通常回答、編集、外部書き込みより前に、次をUTF-8のfile実体から順に読み直してください。

1. `AGENTS.md`
2. `PROJECT.md`
3. `tech-stack.md`
4. `README.md`
5. `docs/imp/user-tasks.md`
6. `docs/guide/implementation-context-reading-guide.md`
7. `docs/imp/imp-tasks.md`
8. `docs/imp/user-judge.md`
9. `docs/imp/imp-comp.md`
10. `docs/diary/2026-07-24-session-handoff.md`

会話要約だけを正本にせず、設計を最初からやり直さないでください。ユーザー変更をreset / checkout / 削除しないでください。非自明な追加作業は先に`docs/imp/imp-tasks.md`へ記録し、完了unitは`docs/imp/imp-comp.md`へ証拠とともに移してください。

採用済みの開始経路は次の3つです。

1. `パッチボードで組む` — 現在のprimary
2. `AIで土台を作る → 鼻歌でメロディを追加する` — Patchboard後
3. `鼻歌をもとに曲を作る` — 最後のexperimental route

3入口は同じProject / Track / Lane / NoteEventへ合流させます。入口選択前は不要fieldを表示せず、選択後に必要項目だけを縦へ滑らかに展開します。AI routeは将来、Mood、Key、BPM、曲の流れ、主音色、伴奏密度等から具体的なinstrumental promptを内部生成し、送信内容を確認可能にします。外部AI送信は別承認gateです。

最初に次を実行してbaselineを確認してください。

```powershell
npm.cmd run typecheck -- --pretty false
npm.cmd run test -- src/domain/audio/audio-plan.test.ts src/features/melody/DawMelodyEditor.test.tsx src/features/settings/ShortcutSettingsModal.test.tsx src/App.test.tsx
```

2026-07-24時点のbaselineはtypecheck pass、4 files / 35 tests passです。

作業順はhandoffの「最大4時間の推奨実行順」に従ってください。要約すると次です。

1. `HOME-003 / START-002`: Project Home preview player、入口段階表示のCSS / test、starter適用前試聴、`.mctproj専用`表示を閉じる。
2. `SHORTCUT-002`: `ArrowUp`等を表示上だけ矢印glyphにし、`Ctrl + S`形式へ整え、同じ割当button再clickで`キーを入力…`を中止できるようにする。
3. `DAW-012 / DAW-013`: WQHD first viewportでpiano rollを主役にし、途中位置再生・playhead・compact controlsを実browserで仕上げる。guided helpの追加作り込みは後回しでよい。
4. 残時間で`FLOW-002 → HARMONY-001 → ASSET-004`の順に一つのPatchboard unitをtestまで深く閉じる。
5. `INTEROP-001`: Studio One native `.song`直接importは初期対象にせず、現行`.mctproj` + Standard MIDI Type 1 + WAV / stems、将来`.dawproject`候補という調査結果をresearch documentへ残す。
6. full check、WQHD / smartphone screenshot、progress matrix、imp docsを同期する。ユーザー確認前に★4へ上げない。

UI作業では`frontend-design`の既存方針を継続し、genericなcard列へ戻さず、dark pastel、全幅、楽譜主役、少ない常設文章を守ってください。browser確認時はbrowser QAの手順を読み、実際のscreenshotと操作結果を証拠にしてください。

外部AI、実microphone、secret、課金、Cloudflare resource / deploy、license未確認音源、commit / pushは別の明示承認なしに行いません。`.song`完全互換や実音源品質を未検証で表現しないでください。
