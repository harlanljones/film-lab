import { useEffect, useMemo, useState } from 'react';
import { activeBeatIndex } from '../engine/beats';
import { playerBeats, resolveAssignment } from '../engine/assignments';
import { formatTimecode, usePlayback } from './usePlayback';
import { seededPlay } from '../data/seededPlay';
import { usePlaybook } from '../storage/playbookStore';
import { Field7 } from './Field7';
import { useSelection } from './SelectionContext';

export function QuizView() {
  const store = usePlaybook();
  const selection = useSelection();
  const plays = store.plays.length ? store.plays : [seededPlay];
  const [playId, setPlayId] = useState<string>(() => store.selectedPlayId ?? plays[0]?.id ?? '');
  const play = useMemo(() => plays.find((candidate) => candidate.id === playId) ?? plays[0] ?? seededPlay, [plays, playId]);
  const player = useMemo(() => store.roster.find((candidate) => candidate.id === selection.playerId) ?? null, [selection.playerId, store.roster]);
  const assignment = useMemo(() => (player ? resolveAssignment(play, player) : null), [play, player]);
  const offenseTracks = useMemo(() => play.tracks.filter((track) => track.side === 'offense'), [play]);
  const [guessTrackId, setGuessTrackId] = useState<string>('');
  useEffect(() => { setGuessTrackId(assignment?.trackId ?? offenseTracks[0]?.id ?? ''); }, [assignment?.trackId, offenseTracks]);
  const playback = usePlayback(play.duration);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  useEffect(() => { setRevealed(false); playback.reset(); }, [play.id, guessTrackId]);
  useEffect(() => { setScore({ correct: 0, total: 0 }); }, [play.id]);
  const displayTracks = useMemo(() => {
    if (revealed) return play.tracks;
    const anchor = play.tracks.find((track) => track.id === guessTrackId);
    if (!anchor || anchor.waypoints.length === 0) return play.tracks;
    return play.tracks.map((track) => track.id === guessTrackId ? { ...track, waypoints: [anchor.waypoints[0]] } : track);
  }, [play, revealed, guessTrackId]);
  const visibleBeats = useMemo(() => playerBeats(play.beats, guessTrackId), [play.beats, guessTrackId]);
  const beat = visibleBeats[activeBeatIndex(visibleBeats, playback.t)];
  const reveal = () => { setRevealed(true); playback.seek(0); playback.play(); };
  const hide = () => { setRevealed(false); playback.reset(); };
  const grade = (correct: boolean) => setScore((current) => ({ correct: current.correct + (correct ? 1 : 0), total: current.total + 1 }));
  return <section aria-label="Quiz">
    <h2>Quiz</h2>
    <p className="lede">Self-study: pick a play and your route, read the formation frozen at the snap, guess where you go, then reveal.</p>
    <div className="controls">
      <label>Play <select aria-label="Quiz play" value={playId} onChange={(event) => setPlayId(event.target.value)}>{plays.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></label>
      <label>Route <select aria-label="Route to guess" value={guessTrackId} onChange={(event) => setGuessTrackId(event.target.value)}>{offenseTracks.map((track) => <option key={track.id} value={track.id}>{track.role}{track.id === assignment?.trackId && player ? ` · ${player.name}` : ''}</option>)}</select></label>
    </div>
    {player && <p role="status" aria-label="Assignment status">{assignment ? `${player.name}'s assignment · ${assignment.via}` : `${player.name} has no assignment in this play — pick a route above.`}</p>}
    <Field7 tracks={displayTracks} time={revealed ? playback.t : 0} highlightTrackIds={revealed && guessTrackId ? [guessTrackId] : undefined} aria-label={`Quiz field for ${play.name}`} />
    {!revealed ? (
      <div className="controls">
        <button aria-label="Reveal route and play animation" onClick={reveal}>Reveal route</button>
      </div>
    ) : (
      <>
        <p aria-live="polite">{beat?.title ?? 'Before snap'} · {formatTimecode(playback.t)}</p>
        <input aria-label="Quiz timeline" type="range" min="0" max={play.duration} step=".01" value={playback.t} onChange={(event) => playback.seek(Number(event.target.value))} />
        <div className="controls">
          <button aria-label={playback.playing ? 'Pause play' : 'Play play'} onClick={playback.toggle}>{playback.playing ? 'Pause' : 'Play'}</button>
          <button aria-label="Replay route from snap" onClick={() => { playback.seek(0); playback.play(); }}>Replay</button>
          <button aria-label="Hide route and try again" onClick={hide}>Hide route</button>
        </div>
        <div className="controls" role="group" aria-label="Self-score">
          <span aria-live="polite">Score: {score.correct}/{score.total}</span>
          <button aria-label="Mark route correct" onClick={() => grade(true)}>Got it</button>
          <button aria-label="Mark route missed" onClick={() => grade(false)}>Missed it</button>
        </div>
      </>
    )}
  </section>;
}
