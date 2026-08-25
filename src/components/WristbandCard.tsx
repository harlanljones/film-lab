import { useMemo, useState } from 'react';
import { Field7 } from './Field7';
import { resolveAssignment, summarizeAssignment, type Assignment } from '../engine/assignments';
import { FIELD_WIDTH, FIELD_DEPTH, LINE_OF_SCRIMMAGE_Y } from '../engine/geometry';
import type { Play, Point, RosterPlayer } from '../engine/types';
import { usePlaybook } from '../storage/playbookStore';
import { useSelection } from './SelectionContext';

const ROLE_LABELS: Record<string, string> = {
  qb: 'Quarterback',
  c: 'Center',
  rb: 'Running back',
  wr: 'Wide receiver',
  slot: 'Slot receiver',
  rusher: 'Rusher',
  lb: 'Linebacker',
  db: 'Defensive back',
  s: 'Safety',
};

const VIA_LABELS: Record<Assignment['via'], string> = {
  explicit: 'Assigned',
  role: 'By role',
  position: 'By position',
};

const xRegion = (x: number): string => {
  if (x < FIELD_WIDTH / 3) return 'left';
  if (x < (FIELD_WIDTH * 2) / 3) return 'middle';
  return 'right';
};

const yRegion = (y: number): string => {
  if (y < LINE_OF_SCRIMMAGE_Y - 1) return 'backfield';
  if (y <= LINE_OF_SCRIMMAGE_Y + 1) return 'LOS';
  if (y < FIELD_DEPTH / 3) return 'short';
  if (y < (FIELD_DEPTH * 2) / 3) return 'mid';
  return 'deep';
};

const position = (point: Point): string => `${yRegion(point.y)} ${xRegion(point.x)}`;

function describeRoute(play: Play, assignment: Assignment | null): string {
  if (!assignment) return 'No route on file for this play.';
  const track = play.tracks.find((candidate) => candidate.id === assignment.trackId);
  if (!track || track.waypoints.length === 0) return 'No route on file for this play.';
  const role = ROLE_LABELS[track.role] ?? track.role;
  if (track.waypoints.length === 1) return `${role}. Set up at ${position(track.waypoints[0])}.`;
  const start = track.waypoints[0];
  const end = track.waypoints[track.waypoints.length - 1];
  return `${role}. Line up ${position(start)}, finish ${position(end)}.`;
}

export type WristbandCardProps = {
  play: Play;
  player: RosterPlayer;
};

export function WristbandCard({ play, player }: WristbandCardProps) {
  const assignment = useMemo(() => resolveAssignment(play, player), [play, player]);
  const summary = useMemo(() => summarizeAssignment(play, assignment?.trackId ?? null), [play, assignment]);
  const numberLabel = player.number ? `#${player.number} ` : '';
  return (
    <article className="wristband-card" aria-label={`Wristband card for ${player.name}, play ${play.name}`}>
      <header className="wristband-card-head">
        <span className="wristband-number">{numberLabel}{player.name}</span>
        <span className="wristband-play">{play.name}</span>
      </header>
      <Field7
        tracks={play.tracks}
        time={0}
        highlightTrackIds={assignment ? [assignment.trackId] : undefined}
        className="thumb-field wristband-field"
        aria-label={`${player.name} route on ${play.name}`}
      />
      <p className="wristband-assignment" aria-label={`${player.name} assignment`}>
        {describeRoute(play, assignment)}
      </p>
      <p className="wristband-meta">{summary.role ?? 'unbound'} · {assignment ? VIA_LABELS[assignment.via] : 'none'} · {summary.waypointCount} stops</p>
    </article>
  );
}

type Mode = 'player' | 'play';

type CardEntry = { play: Play; player: RosterPlayer };

export function WristbandView() {
  const store = usePlaybook();
  const selection = useSelection();
  const [mode, setMode] = useState<Mode>('player');

  const player = useMemo(
    () => store.roster.find((candidate) => candidate.id === selection.playerId) ?? null,
    [selection.playerId, store.roster],
  );
  const selectedPlay = useMemo(
    () => store.plays.find((play) => play.id === store.selectedPlayId) ?? store.plays[0] ?? null,
    [store.plays, store.selectedPlayId],
  );

  const cards = useMemo<CardEntry[]>(() => {
    if (mode === 'player') {
      if (!player) return [];
      return store.plays.flatMap((play) => {
        const assignment = resolveAssignment(play, player);
        return assignment ? [{ play, player }] : [];
      });
    }
    if (!selectedPlay) return [];
    return store.roster.flatMap((rosterPlayer) => {
      const assignment = resolveAssignment(selectedPlay, rosterPlayer);
      return assignment ? [{ play: selectedPlay, player: rosterPlayer }] : [];
    });
  }, [mode, player, selectedPlay, store.plays, store.roster]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const guidance = (() => {
    if (mode === 'player') {
      if (store.roster.length === 0) return 'Add players to the roster to print their assignment cards.';
      if (!player) return 'Select a player from the roster (Playbook) to print their cards.';
      return `No plays assign a track to ${player.name}. Bind a track in the Editor or match by role.`;
    }
    if (store.plays.length === 0) return 'No plays yet. Save a play in the Editor to print roster cards.';
    if (!selectedPlay) return 'Select a play to print its roster cards.';
    return `No roster players are bound to ${selectedPlay.name}. Assign tracks in the Editor or match by role.`;
  })();

  return (
    <section aria-label="Wristband cards">
      <h2>Wristband cards</h2>
      <p className="lede">Printable per-player assignment cards. Use File → Print to get a cut-out sheet.</p>
      <div className="controls wristband-controls">
        <button type="button" aria-pressed={mode === 'player'} aria-label="Show cards for the selected player" onClick={() => setMode('player')}>My player</button>
        <button type="button" aria-pressed={mode === 'play'} aria-label="Show cards for the selected play roster" onClick={() => setMode('play')}>Play roster</button>
        <button type="button" aria-label="Print wristband sheet" onClick={handlePrint} disabled={cards.length === 0}>Print</button>
      </div>
      {cards.length === 0 ? (
        <p role="status">{guidance}</p>
      ) : (
        <div className="wristband-grid" aria-label="Wristband cards">
          {cards.map(({ play, player: rosterPlayer }) => (
            <WristbandCard key={`${play.id}-${rosterPlayer.id}`} play={play} player={rosterPlayer} />
          ))}
        </div>
      )}
    </section>
  );
}
