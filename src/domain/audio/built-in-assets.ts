import type { BuiltInAudioAsset, BuiltInAssetCategory, OscillatorShape, SynthesisLayer, SynthesisProfile } from './types';
import type { TrackRole } from '../music';

type Character = BuiltInAudioAsset['character'];

function layer(waveform: OscillatorShape, octave: number, detuneCents: number, gain: number, pan: number): SynthesisLayer {
  return { waveform, octave, detuneCents, gain, pan };
}

function tonal(
  id: string, category: BuiltInAssetCategory, trackRole: TrackRole, name: string, description: string,
  color: string, waveform: OscillatorShape, brightness: number, character: Character,
  layers: readonly SynthesisLayer[], envelope: readonly [number, number, number],
  filter: readonly [number, number, number], roleTags: readonly string[],
): BuiltInAudioAsset {
  const synthesis: SynthesisProfile = {
    id: `${id}-v1`, layers,
    attackSeconds: envelope[0], releaseSeconds: envelope[1], sustain: envelope[2],
    filterBaseHz: filter[0], filterEnvelopeHz: filter[1], resonance: filter[2], roleTags,
  };
  return { id, category, trackRole, name, description, color, waveform, brightness, character, synthesis };
}

const chord: BuiltInAudioAsset[] = [
  tonal('chord-bright-supersaw', 'chord', 'chord', 'Bright Supersaw Stack', 'Drop前面へ張り出す5層のFuture Bassコード', '#f0c48d', 'sawtooth', .82, 'wide', [layer('sawtooth', 0, -17, .2, -.7), layer('sawtooth', 0, -7, .22, -.32), layer('sawtooth', 0, 0, .24, 0), layer('sawtooth', 0, 7, .22, .32), layer('sawtooth', 0, 17, .2, .7)], [.018, .28, .76], [2400, 5600, 1.35], ['foreground', 'supersaw', 'drop']),
  tonal('chord-hyper-prism', 'chord', 'chord', 'Hyper Prism Saw', '7層の強いdetuneと高域で大きなDropを作る', '#f4a9b8', 'sawtooth', .94, 'wide', [-24, -14, -6, 0, 6, 14, 24].map((detune, index) => layer('sawtooth', index === 3 ? -1 : 0, detune, index === 3 ? .12 : .15, (index - 3) / 3)), [.008, .22, .68], [3200, 8200, 1.8], ['foreground', 'aggressive', 'drop']),
  tonal('chord-candy-stab', 'chord', 'chord', 'Candy Stab', '短い3層attackで裏拍を跳ねさせる', '#ffd08a', 'square', .86, 'punchy', [layer('square', 0, -5, .42, -.35), layer('triangle', 0, 0, .38, 0), layer('sine', 1, 7, .2, .35)], [.003, .11, .16], [2900, 6800, 3.2], ['foreground', 'stab', 'rhythmic']),
  tonal('chord-glass-pluck', 'chord', 'chord', 'Glass Pluck Chords', '透明な倍音で細かく刻む2層コード', '#efb5ae', 'triangle', .92, 'sparkling', [layer('triangle', 0, -3, .7, -.22), layer('sine', 1, 4, .3, .22)], [.004, .16, .28], [3600, 7000, 2.8], ['foreground', 'pluck', 'rhythmic']),
  tonal('chord-chip-bloom', 'chord', 'chord', 'Chip Bloom', '8bitの芯から柔らかく広がるchiptuneコード', '#d8e99e', 'square', .78, 'tiny', [layer('square', 0, -2, .48, -.3), layer('square', 1, 3, .18, .3), layer('sine', -1, 0, .34, 0)], [.012, .26, .56], [2100, 4200, 2.1], ['foreground', 'chip', 'cute']),
  tonal('chord-velvet-reese', 'chord', 'chord', 'Velvet Reese Chords', '中低域を厚くする暗い4層Reeseコード', '#c8b9e8', 'sawtooth', .42, 'wide', [layer('sawtooth', -1, -11, .28, -.55), layer('square', -1, 9, .22, .55), layer('triangle', 0, -4, .26, -.2), layer('triangle', 0, 4, .26, .2)], [.035, .48, .84], [760, 1500, 1.45], ['support', 'reese', 'dark']),
  tonal('chord-soft-wide-pad', 'chord', 'chord', 'Soft Wide Pad Chords', '奥行きと余韻を補う柔らかな3層コード', '#b9d3ef', 'sine', .34, 'soft', [layer('triangle', -1, -5, .22, -.52), layer('sine', 0, 0, .56, 0), layer('triangle', 0, 6, .22, .52)], [.24, .72, .9], [880, 1100, .72], ['support', 'pad', 'wide']),
  tonal('chord-moon-sus', 'chord', 'chord', 'Moon Sus Pad', '遅いattackと長いreleaseで浮遊感を残す', '#aebfe8', 'triangle', .48, 'soft', [layer('sine', -1, 0, .28, 0), layer('triangle', 0, -8, .28, -.65), layer('triangle', 0, 8, .28, .65), layer('sine', 1, 2, .16, .18)], [.42, 1.15, .94], [1200, 1800, .62], ['support', 'ambient', 'sustain']),
  tonal('chord-soft-supersaw', 'chord', 'chord', 'Soft Supersaw (Legacy)', '既存project互換用の丸いFuture Bassコード', '#d9bd95', 'sawtooth', .52, 'wide', [layer('sawtooth', 0, -9, .32, -.36), layer('triangle', 0, 0, .38, 0), layer('sawtooth', 0, 9, .32, .36)], [.045, .42, .82], [1500, 2600, .9], ['support', 'supersaw', 'legacy']),
  tonal('chord-pizzicato-ensemble', 'chord', 'chord', 'Pizzicato Ensemble', '複数の短い弦を重ねた軽いpizzicatoコード', '#eec59b', 'triangle', .68, 'punchy', [layer('triangle', 0, -4, .42, -.38), layer('triangle', 0, 5, .38, .38), layer('sine', 1, 0, .16, 0)], [.002, .18, .08], [2100, 5200, 3.8], ['chord', 'pizzicato', 'pluck']),
  tonal('chord-chorus-keys', 'chord', 'chord', 'Chorus Keys', '微小detuneと左右の遅れを感じる厚いpoly keys', '#d6c0e9', 'triangle', .5, 'wide', [layer('triangle', 0, -11, .25, -.72), layer('triangle', 0, -4, .24, -.28), layer('sine', 0, 0, .3, 0), layer('triangle', 0, 5, .24, .28), layer('triangle', 0, 12, .25, .72)], [.035, .62, .82], [1450, 3100, 1.05], ['chord', 'chorus', 'keys']),
];

const bass: BuiltInAudioAsset[] = [
  tonal('bass-round-sub', 'bass', 'bass', 'Round Sub', 'コードを揺らさず支える深いsine低音', '#aee6c2', 'sine', .18, 'soft', [layer('sine', -1, 0, .82, 0), layer('triangle', 0, 0, .18, 0)], [.014, .2, .9], [260, 160, .45], ['sub', 'support', 'clean']),
  tonal('bass-bubble-pluck', 'bass', 'bass', 'Bubble Pluck Bass', '丸いattackが跳ねるFuture Bass向け短音', '#9ee2cf', 'triangle', .5, 'punchy', [layer('triangle', -1, -4, .55, -.12), layer('square', 0, 5, .2, .12), layer('sine', -2, 0, .3, 0)], [.003, .12, .2], [520, 1500, 2.5], ['bass', 'pluck', 'bounce']),
  tonal('bass-reese-growl', 'bass', 'bass', 'Reese Growl', '左右にうねるdetuned sawの太い中低域', '#83d1b8', 'sawtooth', .58, 'wide', [layer('sawtooth', -1, -13, .36, -.65), layer('sawtooth', -1, 13, .36, .65), layer('sine', -2, 0, .4, 0)], [.01, .3, .72], [480, 2100, 2.2], ['bass', 'reese', 'foreground']),
  tonal('bass-octave-bounce', 'bass', 'bass', 'Octave Bounce', 'subと上octaveを混ぜて小型speakerでも輪郭を出す', '#b4e39d', 'square', .62, 'punchy', [layer('sine', -2, 0, .48, 0), layer('square', -1, -3, .28, -.2), layer('square', 0, 4, .14, .2)], [.005, .16, .38], [700, 2400, 1.8], ['bass', 'octave', 'rhythmic']),
  tonal('bass-core-drive', 'bass', 'bass', 'Core Drive Bass', 'Future Coreの速いkick間を埋める硬いbass', '#79cfa4', 'sawtooth', .72, 'punchy', [layer('sine', -2, 0, .42, 0), layer('sawtooth', -1, -7, .3, -.3), layer('sawtooth', -1, 7, .3, .3)], [.002, .09, .25], [900, 3600, 2.8], ['bass', 'core', 'driving']),
];

const lead: BuiltInAudioAsset[] = [
  tonal('lead-pearl', 'lead', 'lead', 'Pearl Lead', '鼻歌に重なる透明なtriangle / sine lead', '#d2b9ef', 'triangle', .66, 'sparkling', [layer('triangle', 0, -3, .62, -.18), layer('sine', 1, 5, .22, .18), layer('sine', -1, 0, .2, 0)], [.018, .28, .74], [2300, 4600, 1.2], ['lead', 'clear', 'melody']),
  tonal('lead-candy-whistle', 'lead', 'lead', 'Candy Whistle', '高いsine倍音で甘い輪郭を作る', '#e8b9dc', 'sine', .78, 'sparkling', [layer('sine', 0, 0, .58, 0), layer('sine', 1, 3, .27, .25), layer('triangle', 0, -5, .2, -.25)], [.028, .42, .8], [3100, 5200, 1.7], ['lead', 'whistle', 'cute']),
  tonal('lead-laser-ribbon', 'lead', 'lead', 'Laser Ribbon', '細いsawとsquareが前へ飛ぶ強いlead', '#d6a6ef', 'sawtooth', .92, 'wide', [layer('sawtooth', 0, -8, .4, -.5), layer('square', 0, 7, .34, .5), layer('sine', -1, 0, .22, 0)], [.004, .2, .64], [3900, 7800, 2.3], ['lead', 'bright', 'foreground']),
  tonal('lead-vocal-square', 'lead', 'lead', 'Vocal Square', '丸いsquareと倍音でvocal chopのように刻む', '#ef9fc6', 'square', .7, 'punchy', [layer('square', 0, -4, .46, -.25), layer('triangle', 0, 5, .34, .25), layer('sine', 1, 0, .16, 0)], [.006, .15, .32], [1800, 4800, 3.4], ['lead', 'vocal-like', 'rhythmic']),
  tonal('lead-neon-glide', 'lead', 'lead', 'Neon Glide', 'sawの芯と柔らかいsubで滑らかにつながるmono lead', '#dba7f1', 'sawtooth', .74, 'wide', [layer('sawtooth', 0, -6, .38, -.42), layer('triangle', 0, 6, .34, .42), layer('sine', -1, 0, .28, 0)], [.014, .34, .78], [2100, 5100, 1.45], ['lead', 'glide', 'wide']),
  tonal('lead-ribbon-pluck', 'lead', 'lead', 'Ribbon Pluck Lead', '短いpluckと細い高域で高速melodyを読みやすくする', '#efacd9', 'triangle', .88, 'sparkling', [layer('triangle', 0, -3, .52, -.28), layer('square', 0, 4, .25, .28), layer('sine', 1, 0, .18, 0)], [.002, .12, .16], [3700, 7600, 3], ['lead', 'pluck', 'fast']),
  tonal('lead-starlight-mono', 'lead', 'lead', 'Starlight Mono', '倍音を抑えた芯のあるtriangleで主旋律を前へ出す', '#c6b5f0', 'triangle', .55, 'soft', [layer('triangle', 0, 0, .62, 0), layer('sine', -1, 0, .26, 0), layer('sine', 1, 2, .12, .18)], [.01, .24, .82], [1700, 2800, .9], ['lead', 'mono', 'clear']),
  tonal('lead-bloom-brass', 'lead', 'lead', 'Bloom Brass Lead', 'attack後にfilterが開く太いbrass-like lead', '#ed9fb4', 'sawtooth', .68, 'punchy', [layer('sawtooth', 0, -9, .36, -.36), layer('sawtooth', 0, 9, .36, .36), layer('square', -1, 0, .25, 0)], [.035, .28, .7], [1250, 5600, 2.6], ['lead', 'brass-like', 'anthem']),
  tonal('lead-pizzicato-pop', 'lead', 'lead', 'Pizzicato Pop Lead', '弦を弾く短いattackで主旋律を軽快にする', '#eab6d3', 'triangle', .74, 'punchy', [layer('triangle', 0, 0, .48, 0), layer('square', 1, -7, .15, -.25), layer('sine', -1, 4, .3, .25)], [.001, .14, .06], [2700, 6500, 4.1], ['lead', 'pizzicato', 'melody']),
  tonal('lead-celesta-star', 'lead', 'lead', 'Celesta Star', 'celesta風の丸い倍音と長い星形の余韻', '#d7c5f2', 'sine', .76, 'sparkling', [layer('sine', 0, 0, .44, 0), layer('sine', 1, 3, .28, -.3), layer('triangle', 2, -6, .1, .3), layer('sine', -1, 0, .18, 0)], [.002, .72, .12], [3100, 5700, 2.05], ['lead', 'celesta', 'music-box']),
];

const synth: BuiltInAudioAsset[] = [
  tonal('synth-glass-pluck', 'synth', 'synth', 'Glass Pluck', '短く光るplucked synth', '#efb5ae', 'triangle', .82, 'sparkling', [layer('triangle', 0, -4, .58, -.25), layer('sine', 1, 6, .32, .25), layer('square', 0, 0, .12, 0)], [.002, .13, .18], [3400, 7200, 3.1], ['synth', 'pluck', 'sparkle']),
  tonal('synth-rubber-pulse', 'synth', 'synth', 'Rubber Pulse', '弾力のあるsquareでbeat間を埋める', '#f2a995', 'square', .58, 'punchy', [layer('square', 0, -6, .42, -.32), layer('triangle', -1, 0, .38, 0), layer('square', 0, 7, .26, .32)], [.008, .24, .48], [1300, 3600, 2.7], ['synth', 'pulse', 'bounce']),
  tonal('synth-aurora-keys', 'synth', 'synth', 'Aurora Keys', '柔らかな鍵盤attackから明るく開くpoly synth', '#efc2b5', 'triangle', .62, 'soft', [layer('triangle', 0, -2, .5, -.25), layer('sine', 1, 3, .22, .25), layer('sine', -1, 0, .28, 0)], [.025, .46, .72], [1700, 4300, 1.1], ['synth', 'keys', 'support']),
  tonal('synth-comet-stab', 'synth', 'synth', 'Comet Stab', '速い展開で存在感を出す硬い短音', '#ffae9d', 'sawtooth', .9, 'punchy', [layer('sawtooth', 0, -9, .36, -.45), layer('sawtooth', 0, 9, .36, .45), layer('square', 1, 0, .2, 0)], [.002, .08, .12], [4100, 8500, 3.8], ['synth', 'stab', 'core']),
  tonal('synth-lush-pulse-keys', 'synth', 'synth', 'Lush Pulse Keys', '丸いpulseとsubでコードの隙間を埋めるpoly keys', '#efb6a2', 'square', .48, 'soft', [layer('square', 0, -3, .36, -.3), layer('triangle', 0, 4, .38, .3), layer('sine', -1, 0, .3, 0)], [.02, .38, .76], [1450, 3000, 1.15], ['synth', 'keys', 'lush']),
  tonal('synth-arcade-bell', 'synth', 'synth', 'Arcade Bell', 'sine倍音と短いsquareでgame-likeなbellを作る', '#f3c09d', 'sine', .84, 'tiny', [layer('sine', 0, 0, .5, 0), layer('sine', 1, 7, .24, -.25), layer('square', 2, -4, .08, .25)], [.001, .58, .08], [3200, 6200, 2.2], ['synth', 'bell', 'arcade']),
  tonal('synth-sidechain-cloud', 'synth', 'synth', 'Sidechain Cloud', '広いdetuneと長いreleaseでpumpする背景synth', '#e7b7c8', 'sawtooth', .52, 'wide', [layer('sawtooth', -1, -12, .27, -.7), layer('triangle', 0, -4, .25, -.3), layer('triangle', 0, 4, .25, .3), layer('sawtooth', 0, 12, .27, .7)], [.08, .8, .88], [1050, 2600, .72], ['synth', 'cloud', 'sidechain']),
  tonal('synth-prism-mallet', 'synth', 'synth', 'Prism Mallet', '硬いattackと木質triangleの短いmallet', '#f2ad9e', 'triangle', .76, 'punchy', [layer('triangle', 0, 0, .52, 0), layer('square', 1, -5, .17, -.2), layer('sine', -1, 0, .28, .2)], [.001, .18, .12], [2600, 5900, 3.6], ['synth', 'mallet', 'rhythmic']),
  tonal('synth-pizzicato-silk', 'synth', 'synth', 'Silk Pizzicato', '柔らかいpizzicato stringsを模した短いpluck', '#f1bcae', 'triangle', .58, 'soft', [layer('triangle', 0, -2, .52, -.18), layer('sine', 1, 5, .18, .18), layer('sine', -1, 0, .3, 0)], [.001, .22, .05], [1800, 4200, 3.2], ['synth', 'pizzicato', 'soft']),
  tonal('synth-music-box', 'synth', 'synth', 'Pastel Music Box', 'オルゴール風の金属倍音と小さな余韻', '#f3c8b6', 'sine', .82, 'tiny', [layer('sine', 0, 0, .42, 0), layer('sine', 2, 4, .17, -.22), layer('triangle', 1, -3, .22, .22), layer('sine', 3, 7, .05, 0)], [.001, .88, .04], [3600, 6900, 2.7], ['synth', 'music-box', 'cute']),
  tonal('synth-juno-chorus', 'synth', 'synth', 'Juno Chorus', '左右へ揺れるdetuned sawで80s系の厚みを作る', '#edb8c8', 'sawtooth', .6, 'wide', [layer('sawtooth', 0, -15, .26, -.75), layer('triangle', 0, -5, .25, -.3), layer('sine', -1, 0, .24, 0), layer('triangle', 0, 6, .25, .3), layer('sawtooth', 0, 16, .26, .75)], [.06, .78, .86], [1250, 3400, .88], ['synth', 'chorus', 'vintage']),
];

const pad: BuiltInAudioAsset[] = [
  tonal('pad-pastel-air', 'pad', 'pad', 'Pastel Air', 'sectionの奥行きを作る明るいair pad', '#b9d3ef', 'sine', .38, 'wide', [layer('sine', -1, 0, .35, 0), layer('triangle', 0, -7, .34, -.62), layer('triangle', 0, 7, .34, .62)], [.32, .9, .93], [1000, 1700, .6], ['pad', 'air', 'support']),
  tonal('pad-cloud-chorus', 'pad', 'pad', 'Cloud Chorus', '5層の微細detuneで雲のように広がる', '#a8caeb', 'triangle', .46, 'wide', [-12, -5, 0, 5, 12].map((detune, index) => layer(index === 2 ? 'sine' : 'triangle', index === 2 ? -1 : 0, detune, .22, (index - 2) / 2)), [.45, 1.25, .95], [1250, 2100, .82], ['pad', 'chorus', 'wide']),
  tonal('pad-frozen-glass', 'pad', 'pad', 'Frozen Glass', '高い倍音をゆっくり開く冷たい透明pad', '#b8dcef', 'sine', .72, 'sparkling', [layer('sine', 0, 0, .42, 0), layer('sine', 1, -4, .24, -.5), layer('triangle', 1, 5, .24, .5)], [.55, 1.05, .88], [2300, 6200, 1.9], ['pad', 'glass', 'ambient']),
  tonal('pad-warm-horizon', 'pad', 'pad', 'Warm Horizon', '低いtriangleでbreakを温かく支える', '#d5c5e8', 'triangle', .28, 'soft', [layer('triangle', -1, -3, .42, -.35), layer('sine', -1, 3, .4, .35), layer('triangle', 0, 0, .2, 0)], [.38, 1.35, .96], [680, 950, .48], ['pad', 'warm', 'break']),
  tonal('pad-dusk-choir', 'pad', 'pad', 'Dusk Choir', 'squareの薄い倍音で声のような中域を作る', '#c8bde7', 'square', .5, 'soft', [layer('triangle', -1, 0, .36, 0), layer('square', 0, -6, .2, -.58), layer('square', 0, 6, .2, .58), layer('sine', 1, 0, .12, 0)], [.5, 1.4, .92], [1150, 2400, 2.2], ['pad', 'choir-like', 'dark']),
  tonal('pad-mint-mist', 'pad', 'pad', 'Mint Mist', '高域noise感をsine倍音で表現した軽いair layer', '#afe2d2', 'sine', .58, 'wide', [layer('sine', -1, 0, .3, 0), layer('sine', 0, -10, .3, -.72), layer('sine', 1, 11, .2, .72)], [.62, 1.6, .96], [1500, 3600, .52], ['pad', 'mist', 'air']),
  tonal('pad-violet-tape', 'pad', 'pad', 'Violet Tape Pad', '少し揺れるdetuneで古いtapeのような温度を足す', '#c8b0df', 'triangle', .32, 'soft', [layer('triangle', -1, -9, .3, -.55), layer('triangle', -1, 8, .3, .55), layer('sine', 0, 0, .36, 0)], [.48, 1.5, .94], [720, 1300, .65], ['pad', 'tape', 'warm']),
  tonal('pad-sunrise-saw', 'pad', 'pad', 'Sunrise Saw Pad', '低いcutoffから明るく開く広いsaw pad', '#efc2cf', 'sawtooth', .64, 'wide', [layer('sawtooth', -1, -14, .24, -.75), layer('sawtooth', 0, -5, .24, -.3), layer('triangle', 0, 5, .28, .3), layer('sawtooth', 0, 14, .24, .75)], [.7, 1.25, .91], [820, 5200, 1.1], ['pad', 'saw', 'build']),
  tonal('pad-ocean-grain', 'pad', 'pad', 'Ocean Grain Pad', '細かなsquare倍音を薄く混ぜた揺れる背景層', '#a9d4e8', 'square', .44, 'wide', [layer('triangle', -1, 0, .4, 0), layer('square', 0, -13, .16, -.68), layer('square', 0, 13, .16, .68), layer('sine', 1, 0, .12, 0)], [.55, 1.75, .95], [960, 2100, 1.7], ['pad', 'grain', 'ambient']),
  tonal('pad-night-veil', 'pad', 'pad', 'Night Veil', '暗いlow-passと長いreleaseでbreakを包む', '#aaa8d8', 'triangle', .2, 'soft', [layer('sine', -2, 0, .28, 0), layer('triangle', -1, -5, .34, -.42), layer('triangle', -1, 5, .34, .42)], [.8, 2, .97], [440, 620, .42], ['pad', 'dark', 'break']),
  tonal('pad-velvet-chorus', 'pad', 'pad', 'Velvet Chorus Pad', '7層の微細detuneで柔らかく揺れるchorus pad', '#beaeda', 'triangle', .36, 'wide', [-18, -11, -5, 0, 6, 12, 19].map((detune, index) => layer(index === 3 ? 'sine' : 'triangle', index < 2 ? -1 : 0, detune, index === 3 ? .24 : .14, (index - 3) / 3)), [.52, 1.65, .96], [820, 1650, .58], ['pad', 'chorus', 'velvet']),
];

const arp: BuiltInAudioAsset[] = [
  tonal('arp-pixel-drop', 'arp', 'arp', 'Pixel Drop', 'dropを細かく動かすsquare arp', '#d8e99e', 'square', .76, 'tiny', [layer('square', 0, -3, .54, -.25), layer('sine', 1, 4, .25, .25), layer('triangle', -1, 0, .2, 0)], [.002, .09, .12], [2800, 6100, 2.6], ['arp', 'pixel', 'fast']),
  tonal('arp-crystal-step', 'arp', 'arp', 'Crystal Step', '透明な高域が16分で転がる', '#c9e9a7', 'sine', .91, 'sparkling', [layer('sine', 0, 0, .5, 0), layer('triangle', 1, -4, .3, -.35), layer('sine', 2, 5, .12, .35)], [.001, .12, .1], [4200, 8800, 3.3], ['arp', 'crystal', 'sparkle']),
  tonal('arp-pulse-ladder', 'arp', 'arp', 'Pulse Ladder', 'squareの芯で速いFuture Coreを刻む', '#badf91', 'square', .84, 'punchy', [layer('square', 0, -6, .48, -.32), layer('square', 0, 6, .48, .32), layer('sine', -1, 0, .18, 0)], [.001, .06, .08], [3300, 7400, 3.6], ['arp', 'pulse', 'core']),
  tonal('arp-moon-bell', 'arp', 'arp', 'Moon Bell', '余韻のあるsine倍音で静かなsectionを動かす', '#d2e5aa', 'sine', .65, 'soft', [layer('sine', 0, 0, .45, 0), layer('sine', 1, 2, .3, -.25), layer('sine', 2, -3, .12, .25)], [.004, .5, .18], [2500, 4800, 2.4], ['arp', 'bell', 'break']),
  tonal('arp-candy-ladder', 'arp', 'arp', 'Candy Ladder', 'triangleとsquareを交互に感じる軽いascending arp', '#e2eb9f', 'triangle', .8, 'tiny', [layer('triangle', 0, -4, .5, -.28), layer('square', 1, 5, .22, .28), layer('sine', -1, 0, .22, 0)], [.001, .1, .1], [3300, 6600, 2.8], ['arp', 'ladder', 'cute']),
  tonal('arp-neon-echo', 'arp', 'arp', 'Neon Echo Arp', '中域のsawを短く切って左右へ飛ばす', '#c4e9a6', 'sawtooth', .72, 'wide', [layer('sawtooth', 0, -7, .36, -.5), layer('sawtooth', 0, 7, .36, .5), layer('sine', -1, 0, .24, 0)], [.002, .16, .18], [2400, 5200, 2.2], ['arp', 'echo', 'wide']),
  tonal('arp-rain-drops', 'arp', 'arp', 'Rain Drops', '丸いsineの粒を低めの音域で静かに転がす', '#bce0b0', 'sine', .46, 'soft', [layer('sine', 0, 0, .54, 0), layer('triangle', 1, -2, .22, -.25), layer('sine', -1, 0, .24, .25)], [.003, .32, .14], [1800, 3100, 1.35], ['arp', 'drops', 'ambient']),
  tonal('arp-core-ratchet', 'arp', 'arp', 'Core Ratchet', '硬いsquare attackで高速16分を明瞭に刻む', '#b5db80', 'square', .96, 'punchy', [layer('square', 0, -9, .4, -.35), layer('square', 0, 9, .4, .35), layer('sawtooth', 1, 0, .16, 0)], [.001, .045, .05], [4600, 9200, 4.2], ['arp', 'ratchet', 'core']),
  tonal('arp-silver-harp', 'arp', 'arp', 'Silver Harp', '明るいharp pluckが高域で粒立つ', '#d7e8a6', 'triangle', .8, 'sparkling', [layer('triangle', 0, 0, .46, 0), layer('sine', 1, 2, .28, -.24), layer('sine', 2, -5, .1, .24), layer('sine', -1, 0, .18, 0)], [.001, .58, .05], [3000, 6200, 2.9], ['arp', 'harp', 'bright']),
  tonal('synth-warm-harp', 'synth', 'synth', 'Warm Harp', '低めのharpを丸い余韻で静かな和音層にする', '#dce3b3', 'triangle', .48, 'soft', [layer('triangle', 0, -2, .5, -.16), layer('sine', 1, 4, .18, .16), layer('sine', -1, 0, .34, 0)], [.002, .76, .08], [1500, 2900, 1.55], ['synth', 'harp', 'warm']),
  tonal('arp-cloud-harp', 'arp', 'arp', 'Cloud Harp', '左右のharp倍音を広げて幻想的な上昇を作る', '#cbe6af', 'sine', .68, 'wide', [layer('triangle', 0, -6, .34, -.62), layer('sine', 1, -1, .24, -.2), layer('sine', 1, 5, .24, .2), layer('triangle', 0, 8, .34, .62)], [.003, .92, .1], [2400, 5100, 1.8], ['arp', 'harp', 'wide']),
  tonal('arp-music-box-rain', 'arp', 'arp', 'Music Box Rain', 'オルゴールの粒が雨のように短く連なる', '#d9e9ba', 'sine', .88, 'tiny', [layer('sine', 0, 0, .38, 0), layer('sine', 2, -3, .18, -.3), layer('triangle', 1, 6, .22, .3), layer('sine', 3, 2, .06, 0)], [.001, .66, .03], [3900, 7600, 3.05], ['arp', 'music-box', 'rain']),
];

const rhythmicAndFx: BuiltInAudioAsset[] = [
  { id: 'drum-candy-kit', category: 'drum', trackRole: 'drum', name: 'Candy Kit', description: '軽いkickと弾けるclap', color: '#9ed9ef', waveform: 'sine', brightness: .7, character: 'punchy' },
  { id: 'drum-core-impact', category: 'drum', trackRole: 'drum', name: 'Core Impact Kit', description: '速い4つ打ち向けの硬いkickと短いclap', color: '#7fcde9', waveform: 'square', brightness: .82, character: 'punchy' },
  { id: 'perc-tiny-pop', category: 'percussion', trackRole: 'percussion', name: 'Tiny Pop', description: '隙間を彩る小さなpercussion', color: '#e7c3a6', waveform: 'triangle', brightness: .72, character: 'tiny' },
  { id: 'perc-soda-clicks', category: 'percussion', trackRole: 'percussion', name: 'Soda Clicks', description: '左右に跳ねる短いclick layer', color: '#e9b999', waveform: 'square', brightness: .86, character: 'tiny' },
  { id: 'fx-sparkle-dust', category: 'fx', trackRole: 'fx', name: 'Sparkle Dust', description: '区切りを光らせる短いFX', color: '#c5c7ed', waveform: 'sine', brightness: .92, character: 'sparkling' },
  { id: 'fx-pixel-burst', category: 'fx', trackRole: 'fx', name: 'Pixel Burst', description: 'drop頭を強調する短いdigital burst', color: '#b9bceb', waveform: 'square', brightness: .96, character: 'tiny' },
  { id: 'fx-soft-fall', category: 'fx', trackRole: 'fx', name: 'Soft Fall', description: 'breakへの着地を柔らかくするdown FX', color: '#d0c7ed', waveform: 'triangle', brightness: .52, character: 'soft' },
  { id: 'transition-soft-rise', category: 'transition', trackRole: 'transition', name: 'Soft Rise', description: 'buildからdropへつなぐ穏やかなrise', color: '#b5dddd', waveform: 'sawtooth', brightness: .8, character: 'wide' },
  { id: 'transition-core-riser', category: 'transition', trackRole: 'transition', name: 'Core Riser', description: 'Future Coreの加速を強調する鋭いrise', color: '#9ed5d5', waveform: 'square', brightness: .95, character: 'punchy' },
  { id: 'transition-air-swell', category: 'transition', trackRole: 'transition', name: 'Air Swell', description: '静かなsection間をつなぐ長いair', color: '#c0e4e4', waveform: 'sine', brightness: .48, character: 'soft' },
  { id: 'drum-velvet-punch', category: 'drum', trackRole: 'drum', name: 'Velvet Punch Kit', description: '丸いkickと乾いたsnareの柔らかなmain kit', color: '#98d7e8', waveform: 'triangle', brightness: .5, character: 'soft' },
  { id: 'drum-hyper-candy', category: 'drum', trackRole: 'drum', name: 'Hyper Candy Kit', description: '短いkickと明るいclapを細かく刻む', color: '#78c9ed', waveform: 'square', brightness: .94, character: 'tiny' },
  { id: 'drum-airy-house', category: 'drum', trackRole: 'drum', name: 'Airy House Kit', description: '4つ打ちkickと広いhatで軽く進める', color: '#a4deed', waveform: 'sine', brightness: .76, character: 'wide' },
  { id: 'drum-breakbeat-pop', category: 'drum', trackRole: 'drum', name: 'Breakbeat Pop Kit', description: 'syncopated kickとsnareでbreakを作る', color: '#87c2e1', waveform: 'sawtooth', brightness: .65, character: 'punchy' },
  { id: 'drum-tiny-core', category: 'drum', trackRole: 'drum', name: 'Tiny Core Kit', description: '高速tempoでも濁らない短いkick / hat', color: '#65bee2', waveform: 'square', brightness: .98, character: 'punchy' },
  { id: 'drum-dusk-garage', category: 'drum', trackRole: 'drum', name: 'Dusk Garage Kit', description: '暗いkickと遅れたclapの2-step kit', color: '#9fb8d7', waveform: 'triangle', brightness: .38, character: 'wide' },
  { id: 'drum-trap-glass', category: 'drum', trackRole: 'drum', name: 'Trap Glass Kit', description: '深いkickと細いhat rollを分離したhalf-time kit', color: '#82d5ea', waveform: 'sine', brightness: .88, character: 'sparkling' },
  { id: 'drum-half-time-weight', category: 'drum', trackRole: 'drum', name: 'Half-time Weight Kit', description: '長いsub kickと太い3拍目snareで重心を落とす', color: '#809fca', waveform: 'triangle', brightness: .24, character: 'punchy' },
  { id: 'drum-house-backbeat', category: 'drum', trackRole: 'drum', name: 'House Backbeat Kit', description: '4つ打ちkickと明るい2・4拍clapを前へ出す', color: '#71d2df', waveform: 'sawtooth', brightness: .74, character: 'wide' },
  { id: 'drum-lofi-paper', category: 'drum', trackRole: 'drum', name: 'Lo-fi Paper Kit', description: '紙のように乾いたsnareと丸い短いkick', color: '#b7b6c9', waveform: 'triangle', brightness: .22, character: 'tiny' },
  { id: 'drum-metallic-core', category: 'drum', trackRole: 'drum', name: 'Metallic Core Kit', description: '硬いtransientと金属hatで高速Coreを切り分ける', color: '#58c8e8', waveform: 'square', brightness: 1, character: 'sparkling' },
  { id: 'drum-neon-breaks', category: 'drum', trackRole: 'drum', name: 'Neon Breaks Kit', description: '中域kickと鋭いsnareでbreakbeatを刻む', color: '#75b9dc', waveform: 'sawtooth', brightness: .68, character: 'punchy' },
  { id: 'drum-pillow-pop', category: 'drum', trackRole: 'drum', name: 'Pillow Pop Kit', description: '柔らかいkickと短いclapでVerseの余白を守る', color: '#acd9e4', waveform: 'sine', brightness: .36, character: 'soft' },
  { id: 'drum-rim-garage', category: 'drum', trackRole: 'drum', name: 'Rim Garage Kit', description: '短いrimとskipping kickで2-stepを軽くする', color: '#89bad5', waveform: 'square', brightness: .61, character: 'tiny' },
  { id: 'drum-sub-club', category: 'drum', trackRole: 'drum', name: 'Sub Club Kit', description: '低いsine kickと暗いclapで低域の余韻を残す', color: '#778ebd', waveform: 'sine', brightness: .12, character: 'punchy' },
  { id: 'drum-chip-party', category: 'drum', trackRole: 'drum', name: 'Chip Party Kit', description: 'square clickと短いdigital kickの8bit kit', color: '#63d4dd', waveform: 'square', brightness: .92, character: 'tiny' },
  { id: 'drum-wide-arena', category: 'drum', trackRole: 'drum', name: 'Wide Arena Kit', description: '左右へ広いclapと長めのtomで大きく展開する', color: '#8bc4dc', waveform: 'sawtooth', brightness: .56, character: 'wide' },
  { id: 'drum-wood-snap', category: 'drum', trackRole: 'drum', name: 'Wood Snap Kit', description: '木質rimと短いkickでorganicな跳ねを足す', color: '#a9c5cd', waveform: 'triangle', brightness: .47, character: 'punchy' },
  { id: 'perc-bubble-shaker', category: 'percussion', trackRole: 'percussion', name: 'Bubble Shaker', description: '細かく左右へ揺れる明るいshaker', color: '#efc39b', waveform: 'sine', brightness: .88, character: 'tiny' },
  { id: 'perc-ribbon-clap', category: 'percussion', trackRole: 'percussion', name: 'Ribbon Clap', description: '広がりのある薄いclap layer', color: '#eeb4a8', waveform: 'triangle', brightness: .72, character: 'wide' },
  { id: 'perc-glass-rim', category: 'percussion', trackRole: 'percussion', name: 'Glass Rim', description: '高く短いrim clickで隙間を強調', color: '#f0cfaa', waveform: 'square', brightness: .96, character: 'tiny' },
  { id: 'perc-soft-toms', category: 'percussion', trackRole: 'percussion', name: 'Soft Toms', description: 'section終端へ低いtomの動きを足す', color: '#d9b5a0', waveform: 'sine', brightness: .34, character: 'soft' },
  { id: 'perc-neon-blocks', category: 'percussion', trackRole: 'percussion', name: 'Neon Blocks', description: '木質のような中域clickを交互に配置', color: '#e3aa8d', waveform: 'triangle', brightness: .6, character: 'punchy' },
  { id: 'perc-core-ticks', category: 'percussion', trackRole: 'percussion', name: 'Core Ticks', description: '高速build用の極短digital tick', color: '#f2a77e', waveform: 'square', brightness: 1, character: 'punchy' },
  { id: 'fx-soda-pop', category: 'fx', trackRole: 'fx', name: 'Soda Pop', description: '泡が弾けるような短いpop FX', color: '#d7c9f2', waveform: 'sine', brightness: .9, character: 'tiny' },
  { id: 'fx-candy-impact', category: 'fx', trackRole: 'fx', name: 'Candy Impact', description: 'drop頭へ明るいimpactを置く', color: '#d2b9ec', waveform: 'square', brightness: .78, character: 'punchy' },
  { id: 'fx-air-wash', category: 'fx', trackRole: 'fx', name: 'Air Wash', description: 'シュワーと広がる高域noise wash', color: '#c8d5f0', waveform: 'sawtooth', brightness: .82, character: 'wide' },
  { id: 'fx-reverse-bloom', category: 'fx', trackRole: 'fx', name: 'Reverse Bloom', description: '次の音へ吸い込まれる短いreverse swell', color: '#c0c2ee', waveform: 'triangle', brightness: .62, character: 'wide' },
  { id: 'fx-star-chime', category: 'fx', trackRole: 'fx', name: 'Star Chime', description: '高域の粒が散る短いchime FX', color: '#d9d0f5', waveform: 'sine', brightness: 1, character: 'sparkling' },
  { id: 'fx-sub-drop', category: 'fx', trackRole: 'fx', name: 'Sub Drop', description: '低域へ急降下してsectionを締める', color: '#aeb3dc', waveform: 'sine', brightness: .18, character: 'punchy' },
  { id: 'fx-prism-zap', category: 'fx', trackRole: 'fx', name: 'Prism Zap', description: '短いdigital laserで転換点を示す', color: '#b8a9ea', waveform: 'square', brightness: .98, character: 'tiny' },
  { id: 'fx-velvet-boom', category: 'fx', trackRole: 'fx', name: 'Velvet Boom', description: '柔らかい低域impactでbreakへ着地', color: '#b6afd8', waveform: 'triangle', brightness: .28, character: 'soft' },
  { id: 'fx-glitter-trail', category: 'fx', trackRole: 'fx', name: 'Glitter Trail', description: '左右へ細かな光が流れるtail FX', color: '#e0c9f3', waveform: 'sine', brightness: .94, character: 'sparkling' },
  { id: 'fx-reverse-cymbal', category: 'fx', trackRole: 'fx', name: 'Reverse Cymbal', description: '次の頭へ吸い込んで短いcrashへ接続する', color: '#ced1f0', waveform: 'triangle', brightness: .82, character: 'wide' },
  { id: 'fx-noise-stutter', category: 'fx', trackRole: 'fx', name: 'Noise Stutter', description: '細切れnoise gateでbuildの密度を上げる', color: '#bbb9ed', waveform: 'square', brightness: .9, character: 'tiny' },
  { id: 'fx-glass-shatter', category: 'fx', trackRole: 'fx', name: 'Glass Shatter', description: '高域の粒を左右へ弾く短いshatter', color: '#d9d9f6', waveform: 'sine', brightness: 1, character: 'sparkling' },
  { id: 'fx-crash-kick-impact', category: 'fx', trackRole: 'fx', name: 'Crash Kick Impact', description: 'crashと低いkickを重ねてsection頭を固定する', color: '#b9b5e0', waveform: 'sawtooth', brightness: .58, character: 'punchy' },
  { id: 'fx-bubble-rain', category: 'fx', trackRole: 'fx', name: 'Bubble Rain', description: '小さなpopが降るように広がるtexture', color: '#d6c8f2', waveform: 'sine', brightness: .86, character: 'tiny' },
  { id: 'fx-digital-alarm', category: 'fx', trackRole: 'fx', name: 'Digital Alarm', description: '転換直前へ短いdigital合図を置く', color: '#c4b0ed', waveform: 'square', brightness: .99, character: 'punchy' },
  { id: 'fx-reverb-suction', category: 'fx', trackRole: 'fx', name: 'Reverb Suction', description: '広いtailを逆向きに吸い込み次の音へ渡す', color: '#c2cbe9', waveform: 'triangle', brightness: .5, character: 'wide' },
  { id: 'fx-low-end-slam', category: 'fx', trackRole: 'fx', name: 'Low-end Slam', description: '暗いsub impactでDropの床を強調する', color: '#999fcf', waveform: 'sine', brightness: .14, character: 'punchy' },
  { id: 'fx-bitcrush-spray', category: 'fx', trackRole: 'fx', name: 'Bitcrush Spray', description: '粗いdigital粒を短く噴き上げる', color: '#c1b1ef', waveform: 'square', brightness: .95, character: 'tiny' },
  { id: 'fx-vinyl-brake', category: 'fx', trackRole: 'fx', name: 'Vinyl Brake', description: 'pitchと明るさを急降下させて一度止める', color: '#aaa8d0', waveform: 'sawtooth', brightness: .3, character: 'soft' },
  { id: 'fx-orbit-whoosh', category: 'fx', trackRole: 'fx', name: 'Orbit Whoosh', description: '左右を横切る中域whooshで場面を切り替える', color: '#b6d0ec', waveform: 'sawtooth', brightness: .67, character: 'wide' },
  { id: 'fx-gate-cut-cue', category: 'fx', trackRole: 'fx', name: 'Gate Cut Cue', description: '短いclick burstで無音直前の切断点を示す', color: '#b9a9db', waveform: 'square', brightness: .73, character: 'punchy' },
  { id: 'transition-soda-riser', category: 'transition', trackRole: 'transition', name: 'Soda Riser', description: '泡が増えて最後に弾ける上昇transition', color: '#a6e0df', waveform: 'sine', brightness: .88, character: 'tiny' },
  { id: 'transition-prism-sweep', category: 'transition', trackRole: 'transition', name: 'Prism Sweep', description: '左右へ広がる明るいシュワーsweep', color: '#9fd4e5', waveform: 'sawtooth', brightness: .86, character: 'wide' },
  { id: 'transition-night-downlifter', category: 'transition', trackRole: 'transition', name: 'Night Downlifter', description: 'drop後を暗く落とす下降sweep', color: '#a9b9d8', waveform: 'triangle', brightness: .3, character: 'soft' },
  { id: 'transition-pixel-lift', category: 'transition', trackRole: 'transition', name: 'Pixel Lift', description: '段階的digital toneでbuildを加速', color: '#8fd9ce', waveform: 'square', brightness: .98, character: 'tiny' },
  { id: 'transition-velvet-reverse', category: 'transition', trackRole: 'transition', name: 'Velvet Reverse', description: '柔らかく吸い込むreverse transition', color: '#b7c9df', waveform: 'triangle', brightness: .42, character: 'soft' },
  { id: 'transition-core-impact-rise', category: 'transition', trackRole: 'transition', name: 'Core Impact Rise', description: '鋭い上昇からimpactへ接続する', color: '#80cfd5', waveform: 'square', brightness: 1, character: 'punchy' },
  { id: 'transition-cloud-fall', category: 'transition', trackRole: 'transition', name: 'Cloud Fall', description: '広いnoiseがゆっくり下降する', color: '#b0d6df', waveform: 'sawtooth', brightness: .56, character: 'wide' },
  { id: 'transition-tape-stop', category: 'transition', trackRole: 'transition', name: 'Tape Stop', description: 'pitchが急に落ちてsectionを止める', color: '#b7c1d2', waveform: 'sawtooth', brightness: .36, character: 'punchy' },
  { id: 'transition-star-launch', category: 'transition', trackRole: 'transition', name: 'Star Launch', description: '高域sparkleを伴う短いlaunch riser', color: '#a8e4e1', waveform: 'sine', brightness: .96, character: 'sparkling' },
  { id: 'transition-white-noise-riser', category: 'transition', trackRole: 'transition', name: 'White Noise Riser', description: 'filter帯域と音量が広がる定番の長い上昇', color: '#b8e5e2', waveform: 'sawtooth', brightness: .84, character: 'wide' },
  { id: 'transition-filter-climb', category: 'transition', trackRole: 'transition', name: 'Filter Climb', description: '低域から高域へcutoffを開いて緊張を作る', color: '#9dd9d8', waveform: 'triangle', brightness: .76, character: 'wide' },
  { id: 'transition-reverse-cymbal-impact', category: 'transition', trackRole: 'transition', name: 'Reverse Cymbal Impact', description: 'reverse cymbalの吸込みからcrashへ着地する', color: '#a9d3e2', waveform: 'triangle', brightness: .78, character: 'punchy' },
  { id: 'transition-sub-fall', category: 'transition', trackRole: 'transition', name: 'Sub Fall', description: '低域を長く下降させDrop後の余韻を締める', color: '#91aeca', waveform: 'sine', brightness: .12, character: 'soft' },
  { id: 'transition-glitch-stutter', category: 'transition', trackRole: 'transition', name: 'Glitch Stutter', description: '短いdigital断片の密度を上げて境界へ送る', color: '#89d2cf', waveform: 'square', brightness: .97, character: 'tiny' },
  { id: 'transition-double-swell', category: 'transition', trackRole: 'transition', name: 'Double Swell', description: '二段の強弱で一度引いてから大きく上昇する', color: '#addfdf', waveform: 'sine', brightness: .62, character: 'wide' },
  { id: 'transition-impact-silence', category: 'transition', trackRole: 'transition', name: 'Impact & Air Gap', description: '強いimpactの後へ短い空白感を残す', color: '#79c2cf', waveform: 'square', brightness: .7, character: 'punchy' },
  { id: 'transition-prism-downsweep', category: 'transition', trackRole: 'transition', name: 'Prism Downsweep', description: '明るい帯域を左右へ広げながら下降する', color: '#9fc5dc', waveform: 'sawtooth', brightness: .7, character: 'wide' },
  { id: 'transition-pitch-spiral', category: 'transition', trackRole: 'transition', name: 'Pitch Spiral', description: 'digital toneが回り込みながら上昇する', color: '#8edbd7', waveform: 'square', brightness: .92, character: 'sparkling' },
  { id: 'transition-crash-release', category: 'transition', trackRole: 'transition', name: 'Crash Release', description: 'section頭のcrashから長いnoise tailを下ろす', color: '#a4cad9', waveform: 'triangle', brightness: .58, character: 'soft' },
  { id: 'transition-short-whoosh', category: 'transition', trackRole: 'transition', name: 'Short Whoosh', description: '半小節で素早く横切る短い切替音', color: '#a5dfdc', waveform: 'sawtooth', brightness: .82, character: 'tiny' },
  { id: 'transition-long-wash', category: 'transition', trackRole: 'transition', name: 'Long Wash', description: '4小節を満たす広いairとnoiseのうねり', color: '#badeda', waveform: 'sine', brightness: .45, character: 'soft' },
];

export const BUILT_IN_AUDIO_ASSETS: readonly BuiltInAudioAsset[] = [
  ...chord, ...bass, ...lead, ...synth, ...pad, ...arp, ...rhythmicAndFx,
];

export const BUILT_IN_TONAL_ASSETS: readonly BuiltInAudioAsset[] = BUILT_IN_AUDIO_ASSETS.filter((asset) => asset.synthesis !== undefined);

export function findBuiltInAudioAsset(assetId: string): BuiltInAudioAsset | undefined {
  return BUILT_IN_AUDIO_ASSETS.find((asset) => asset.id === assetId);
}
