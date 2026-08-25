import { useEffect, useMemo } from 'react';
import { activeBeatIndex } from '../engine/beats';
import { formatTimecode, useSequencePlayback } from './usePlayback';
import { seededPlay } from '../data/seededPlay';
import { resolveSelectedPlay, resolveSequence, usePlaybook } from '../storage/playbookStore';
import { Field7 } from './Field7';
import { playerBeats, resolveAssignment } from '../engine/assignments';
import { useSelection } from './SelectionContext';

export function FilmRoom() {
  const store = usePlaybook();
  const selection = useSelection();
  const play = resolveSelectedPlay(store.plays, store.selectedPlayId, seededPlay);
  const sequence = useMemo(() => {
    const resolved = resolveSequence(store.plays, store.sequence);
    return resolved.length ? resolved : [play];
  }, [store.plays, store.sequence, play]);
  const playback = useSequencePlayback(sequence);
  const current = sequence[Math.min(playback.index, sequence.length - 1)] ?? play;
  const player = useMemo(() => store.roster.find((candidate) => candidate.id === selection.playerId) ?? null, [selection.playerId, store.roster]);
  const assignment = useMemo(() => player ? resolveAssignment(current, player) : null, [current, player]);
  const playerTrackId = assignment?.trackId ?? null;
  const visibleBeats = useMemo(() => playerBeats(current.beats, playerTrackId), [current.beats, playerTrackId]);
  const beat = visibleBeats[activeBeatIndex(visibleBeats, playback.t)];
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === ' ' || event.key.toLowerCase() === 'k') playback.toggle();
      if (event.key.toLowerCase() === 'j') playback.seek(playback.t - .1);
      if (event.key.toLowerCase() === 'l') playback.seek(playback.t + .1);
      if (event.key.toLowerCase() === 'r') playback.reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playback]);
  return <section aria-label="Film Room"><h2>{current.name}</h2>{sequence.length > 1 && <p aria-label="Sequence position">{playback.index + 1} of {sequence.length}</p>}{player && <p role="status" aria-label="Following player">{player.name}'s view · {assignment ? `${assignment.via} assignment` : 'no assignment in this play'}</p>}<Field7 tracks={current.tracks} time={playback.t} highlightTrackIds={playerTrackId ? [playerTrackId] : undefined} aria-label="Film Room drill field" /><p aria-live="polite">{beat?.title ?? 'Before snap'}{beat?.description ? ` · ${beat.description}` : ''} · {formatTimecode(playback.t)}</p><input aria-label="Playback timeline" type="range" min="0" max={current.duration} step=".01" value={playback.t} onChange={(event) => playback.seek(Number(event.target.value))} /><div className="controls"><button aria-label={playback.playing ? 'Pause play' : 'Play play'} onClick={playback.toggle}>{playback.playing ? 'Pause' : 'Play'}</button><button aria-label="Step back" onClick={() => playback.seek(playback.t - .1)}>J −0.1</button><button aria-label="Step forward" onClick={() => playback.seek(playback.t + .1)}>L +0.1</button><button aria-label="Reset playback" onClick={playback.reset}>Reset</button></div><div className="controls" role="group" aria-label="Playback speed">{[.25, .5, 1, 1.5].map((speed) => <button key={speed} aria-label={`Playback speed ${speed}×`} aria-pressed={playback.speed === speed} onClick={() => playback.setSpeed(speed)}>{speed}×</button>)}</div><div className="controls" role="group" aria-label="Branch to beat">{(player ? visibleBeats : current.beats).map((branch) => <button key={branch.t} aria-label={`Branch to ${branch.title}`} onClick={() => { playback.seek(branch.t); playback.play(); }}>Branch: {branch.title}</button>)}</div></section>;
}
