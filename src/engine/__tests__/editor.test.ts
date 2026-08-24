import { describe, expect, it } from 'vitest';
import { addBeat, duplicatePlay, mirrorPlay, moveWaypoint, removeBeat, removeWaypoint, undoSnapshot, updateBeat, updateWaypoint, updateWaypointPoint } from '../editor';
import { seededPlay } from '../../data/seededPlay';
import { isValidPlay } from '../validate';

describe('editor operations', () => {
  it('mirrors twice and remains valid', () => expect(mirrorPlay(mirrorPlay(seededPlay))).toEqual(seededPlay));
  it('adds beats and keeps time order', () => { const next = addBeat(seededPlay, { t: .2, title: 'Read' }); expect(next.beats).toHaveLength(3); expect(next.beats[1].t).toBe(.2); });
  it('updates and removes beats while retaining a valid beat list', () => { const updated = updateBeat(seededPlay, 1, { title: 'Updated', t: .1 }); expect(updated.beats[0].t).toBe(0); expect(updated.beats[1].title).toBe('Updated'); expect(removeBeat(updated, 0).beats).toHaveLength(1); expect(removeBeat(updated, 1).beats).toHaveLength(1); });
  it('edits waypoint timing and protects the t=0 anchor', () => { const next = updateWaypoint(seededPlay, 'wr1', 1, 0); expect(next.tracks[0].waypoints[0].t).toBe(0); expect(isValidPlay(next)).toBe(true); const anchor = updateWaypointPoint(seededPlay, 'wr1', 0, { t: .8, x: 8 }); expect(anchor.tracks[0].waypoints[0]).toMatchObject({ t: 0, x: 8 }); });
  it('supports point movement and removal without removing the anchor', () => { const moved = moveWaypoint(seededPlay, 'wr1', 1, -1); expect(moved.tracks[0].waypoints).toHaveLength(2); expect(removeWaypoint(moved, 'wr1', 0)).toEqual(moved); const removed = removeWaypoint(seededPlay, 'wr1', 1); expect(removed.tracks[0].waypoints).toHaveLength(1); });
  it('duplicates with new identity and undoes a snapshot', () => { const copy = duplicatePlay(seededPlay, 'copy'); expect(copy.id).toBe('copy'); expect(undoSnapshot(copy, seededPlay)).toEqual(seededPlay); });
});
