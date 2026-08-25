import { useMemo, useState } from 'react';
import { activeBeatIndex } from '../engine/beats';
import { usePlayback, formatTimecode } from './usePlayback';
import { seededPlay } from '../data/seededPlay';
import { usePlaybook } from '../storage/playbookStore';
import { Field7 } from './Field7';

export function CompareView() {
  const store = usePlaybook();
  const plays = store.plays.length ? store.plays : [seededPlay];
  const [leftId, setLeftId] = useState(() => plays[0]?.id ?? '');
  const [rightId, setRightId] = useState(() => plays[1]?.id ?? plays[0]?.id ?? '');
  const left = plays.find((play) => play.id === leftId) ?? plays[0];
  const right = plays.find((play) => play.id === rightId) ?? plays[0] ?? left;
  const duration = Math.max(left?.duration ?? 0, right?.duration ?? 0, 0.1);
  const playback = usePlayback(duration);
  const leftBeat = left?.beats[activeBeatIndex(left?.beats ?? [], playback.t)];
  const rightBeat = right?.beats[activeBeatIndex(right?.beats ?? [], playback.t)];
  const selectOptions = useMemo(() => plays.map((play) => <option key={play.id} value={play.id}>{play.name}</option>), [plays]);
  return <section aria-label="Side-by-side compare">
    <h2>Compare</h2>
    <div className="controls">
      <label>Left play <select aria-label="Left play to compare" value={leftId} onChange={(event) => setLeftId(event.target.value)}>{selectOptions}</select></label>
      <label>Right play <select aria-label="Right play to compare" value={rightId} onChange={(event) => setRightId(event.target.value)}>{selectOptions}</select></label>
    </div>
    <div className="compare-fields">
      <div><Field7 tracks={left?.tracks ?? []} time={playback.t} aria-label={`${left?.name} comparison drill field`} /><p>{left?.name} · {leftBeat?.title ?? 'Before snap'}</p></div>
      <div><Field7 tracks={right?.tracks ?? []} time={playback.t} aria-label={`${right?.name} comparison drill field`} /><p>{right?.name} · {rightBeat?.title ?? 'Before snap'}</p></div>
    </div>
    <p aria-live="polite">{formatTimecode(playback.t)}</p>
    <input aria-label="Comparison timeline" type="range" min="0" max={duration} step=".01" value={playback.t} onChange={(event) => playback.seek(Number(event.target.value))} />
    <div className="controls"><button aria-label={playback.playing ? 'Pause comparison' : 'Play comparison'} onClick={playback.toggle}>{playback.playing ? 'Pause' : 'Play'}</button><button aria-label="Step back comparison" onClick={() => playback.seek(playback.t - .1)}>J −0.1</button><button aria-label="Step forward comparison" onClick={() => playback.seek(playback.t + .1)}>L +0.1</button><button aria-label="Reset comparison" onClick={playback.reset}>Reset</button></div>
  </section>;
}