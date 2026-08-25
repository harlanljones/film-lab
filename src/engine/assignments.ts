import type { Play, PlayerTrack, RosterPlayer } from './types';
import { isFocused } from './beats';

export type Assignment = { trackId: string; playId: string; via: 'explicit' | 'role' | 'position' };

export function resolveAssignment(play: Play, player: RosterPlayer): Assignment | null {
  if (play.tracks.length === 0) return null;
  for (const [trackId, assignedId] of Object.entries(play.assignments ?? {})) {
    if (assignedId !== player.id) continue;
    const target = play.tracks.find((track) => track.id === trackId && track.side === 'offense');
    if (target) return { trackId: target.id, playId: play.id, via: 'explicit' };
  }
  if (player.role) {
    const roleMatch = play.tracks.find((track) => track.side === 'offense' && track.role === player.role);
    if (roleMatch) return { trackId: roleMatch.id, playId: play.id, via: 'role' };
  }
  const positionMatch = play.tracks.find((track) => track.side === 'offense' && track.id === player.id);
  if (positionMatch) return { trackId: positionMatch.id, playId: play.id, via: 'position' };
  return null;
}

export function resolveAssignmentFor(plays: Play[], player: RosterPlayer): Array<{ play: Play; assignment: Assignment }> {
  return plays.flatMap((play) => {
    const assignment = resolveAssignment(play, player);
    return assignment ? [{ play, assignment }] : [];
  });
}

export function playerBeats(beats: Play['beats'], trackId: string | null): Play['beats'] {
  if (!trackId) return [];
  return beats.filter((beat) => !beat.focus || beat.focus.length === 0 || isFocused(beat, trackId));
}

export function summarizeAssignment(play: Play, trackId: string | null): { waypointCount: number; role: PlayerTrack['role'] | null } {
  if (!trackId) return { waypointCount: 0, role: null };
  const track = play.tracks.find((candidate) => candidate.id === trackId);
  if (!track) return { waypointCount: 0, role: null };
  return { waypointCount: track.waypoints.length, role: track.role };
}
