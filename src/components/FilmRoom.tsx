import { useEffect } from 'react';
import { activeBeatIndex } from '../engine/beats';
import { usePlayback, formatTimecode } from '../engine/playback';
import { seededPlay } from '../data/seededPlay';
import { resolveSelectedPlay, usePlaybook } from '../storage/playbookStore';
import { Field7 } from './Field7';

export function FilmRoom() {
  const store = usePlaybook();
  const play = resolveSelectedPlay(store.plays, store.selectedPlayId, seededPlay);
  const playback = usePlayback(play.duration);
  const beat = play.beats[activeBeatIndex(play.beats, playback.t)];
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
  return <section aria-label="Film Room"><h2>{play.name}</h2><Field7 tracks={play.tracks} time={playback.t} aria-label="Film Room play field" /><p aria-live="polite">{beat?.title ?? 'Before snap'} · {formatTimecode(playback.t)}</p><input aria-label="Playback timeline" type="range" min="0" max={play.duration} step=".01" value={playback.t} onChange={(event) => playback.seek(Number(event.target.value))} /><div className="controls"><button aria-label={playback.playing ? 'Pause play' : 'Play play'} onClick={playback.toggle}>{playback.playing ? 'Pause' : 'Play'}</button><button aria-label="Step back" onClick={() => playback.seek(playback.t - .1)}>J −0.1</button><button aria-label="Step forward" onClick={() => playback.seek(playback.t + .1)}>L +0.1</button><button aria-label="Reset playback" onClick={playback.reset}>Reset</button></div></section>;
}
