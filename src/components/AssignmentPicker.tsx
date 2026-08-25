import { useMemo } from 'react';
import { usePlaybook } from '../storage/playbookStore';
import { resolveAssignmentFor, summarizeAssignment } from '../engine/assignments';
import { useSelection } from './SelectionContext';

export function AssignmentPicker() {
  const store = usePlaybook();
  const selection = useSelection();
  const player = useMemo(() => store.roster.find((candidate) => candidate.id === selection.playerId) ?? null, [selection.playerId, store.roster]);
  const assignments = useMemo(() => player ? resolveAssignmentFor(store.plays, player) : [], [player, store.plays]);
  if (store.roster.length === 0) {
    return <aside aria-label="My assignments"><h3>My assignments</h3><p role="status">Add a player to the roster to see personal assignments.</p></aside>;
  }
  if (!player) {
    return <aside aria-label="My assignments"><h3>My assignments</h3><p role="status">Select a player from the roster to see their assignments across the playbook.</p></aside>;
  }
  return <aside aria-label="My assignments"><h3>My assignments · {player.name}</h3>{assignments.length === 0 ? <p role="status">No plays assign a track to {player.name} yet. Open a play in the editor and bind a track to this player, or match by role/position label.</p> : <ol aria-label={`${player.name} assignments`}>{assignments.map(({ play, assignment }) => { const summary = summarizeAssignment(play, assignment.trackId); return <li key={play.id}><div><strong>{play.name}</strong> · <span aria-label="Binding source">{assignment.via}</span> · {summary.role ?? 'unknown role'} · {summary.waypointCount} waypoints</div><div className="controls"><a href="#film-room" onClick={() => store.select(play)}>Watch in Film Room</a><a href="#editor" onClick={() => store.select(play)}>Open in Editor</a></div></li>; })}</ol>}<div className="controls"><button type="button" onClick={() => selection.select(null)}>Clear selection</button></div></aside>;
}
