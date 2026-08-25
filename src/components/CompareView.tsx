import { useMemo, useState } from 'react';
import { activeBeatIndex } from '../engine/beats';
import { usePlayback, formatTimecode } from './usePlayback';
import { seededPlay } from '../data/seededPlay';
import { starterLibrary } from '../data/library';
import { findLooksForConcept } from '../data/conceptHelpers';
import { usePlaybook } from '../storage/playbookStore';
import { Field7 } from './Field7';
import { resolveAssignment } from '../engine/assignments';
import { useSelection } from './SelectionContext';

export function CompareView() {
  const store = usePlaybook();
  const selection = useSelection();
  const allPlays = useMemo(() => {
    const byId = new Map(starterLibrary.map((play) => [play.id, play] as const));
    for (const play of store.plays) byId.set(play.id, play);
    const combined = [...byId.values()];
    return combined.length ? combined : [seededPlay];
  }, [store.plays]);
  const plays = allPlays;
  const [leftId, setLeftId] = useState(() => plays[0]?.id ?? '');
  const [rightId, setRightId] = useState(() => plays[1]?.id ?? plays[0]?.id ?? '');
  const left = plays.find((play) => play.id === leftId) ?? plays[0];
  const right = plays.find((play) => play.id === rightId) ?? plays[0] ?? left;
  const leftLooks = useMemo(() => findLooksForConcept(plays, left?.concept), [left?.concept, plays]);
  const rightLooks = useMemo(() => findLooksForConcept(plays, right?.concept), [plays, right?.concept]);
  const player = useMemo(() => store.roster.find((candidate) => candidate.id === selection.playerId) ?? null, [selection.playerId, store.roster]);
  const leftTrackId = player && left ? resolveAssignment(left, player)?.trackId ?? null : null;
  const rightTrackId = player && right ? resolveAssignment(right, player)?.trackId ?? null : null;
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
    {(leftLooks.length > 1 || rightLooks.length > 1) && <div className="controls" role="group" aria-label="Switch defensive look for same concept in compare">
      {leftLooks.length > 1 && <div role="group" aria-label="Left play defensive look options"><span>Left: {left?.concept} — </span>{leftLooks.map((sibling) => <button key={sibling.id} type="button" aria-label={`Switch left to ${sibling.defenseLook} look`} aria-pressed={sibling.id === left?.id} onClick={() => setLeftId(sibling.id)}>{sibling.defenseLook}</button>)}</div>}
      {rightLooks.length > 1 && <div role="group" aria-label="Right play defensive look options"><span>Right: {right?.concept} — </span>{rightLooks.map((sibling) => <button key={sibling.id} type="button" aria-label={`Switch right to ${sibling.defenseLook} look`} aria-pressed={sibling.id === right?.id} onClick={() => setRightId(sibling.id)}>{sibling.defenseLook}</button>)}</div>}
    </div>}
    {player && <p role="status" aria-label="Following player">{player.name}'s view highlighted on both fields.</p>}
    <div className="compare-fields">
      <div><Field7 tracks={left?.tracks ?? []} time={playback.t} highlightTrackIds={leftTrackId ? [leftTrackId] : undefined} aria-label={`${left?.name} comparison drill field`} /><p>{left?.name} · {leftBeat?.title ?? 'Before snap'}{leftBeat?.description ? ` · ${leftBeat.description}` : ''}</p></div>
      <div><Field7 tracks={right?.tracks ?? []} time={playback.t} highlightTrackIds={rightTrackId ? [rightTrackId] : undefined} aria-label={`${right?.name} comparison drill field`} /><p>{right?.name} · {rightBeat?.title ?? 'Before snap'}{rightBeat?.description ? ` · ${rightBeat.description}` : ''}</p></div>
    </div>
    <p aria-live="polite">{leftBeat?.title ?? 'Before snap'}{leftBeat?.description ? ` · ${leftBeat.description}` : ''} · {rightBeat?.title ?? 'Before snap'}{rightBeat?.description ? ` · ${rightBeat.description}` : ''} · {formatTimecode(playback.t)}</p>
    <input aria-label="Comparison timeline" type="range" min="0" max={duration} step=".01" value={playback.t} onChange={(event) => playback.seek(Number(event.target.value))} />
    <div className="controls"><button aria-label={playback.playing ? 'Pause comparison' : 'Play comparison'} onClick={playback.toggle}>{playback.playing ? 'Pause' : 'Play'}</button><button aria-label="Step back comparison" onClick={() => playback.seek(playback.t - .1)}>J −0.1</button><button aria-label="Step forward comparison" onClick={() => playback.seek(playback.t + .1)}>L +0.1</button><button aria-label="Reset comparison" onClick={playback.reset}>Reset</button></div>
  </section>;
}