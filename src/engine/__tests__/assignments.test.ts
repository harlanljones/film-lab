import { describe, expect, it } from 'vitest';
import { playerBeats, resolveAssignment, resolveAssignmentFor, summarizeAssignment } from '../assignments';
import type { Play, RosterPlayer } from '../types';

const qb: RosterPlayer = { id: 'qb', name: 'Quinn', number: 7, role: 'qb' };
const wr: RosterPlayer = { id: 'wr1', name: 'Wren', number: 11, role: 'wr' };

const makePlay = (overrides: Partial<Play> = {}): Play => ({
  id: 'p1',
  name: 'Mesh',
  duration: 1,
  category: 'pass',
  defenseLook: 'Cover 2',
  tags: [],
  notes: '',
  tracks: [
    { id: 'qb', side: 'offense', role: 'qb', trail: 'dashed', waypoints: [{ x: 20, y: -5, t: 0 }, { x: 20, y: -3, t: 1 }] },
    { id: 'wr1', side: 'offense', role: 'wr', trail: 'solid', waypoints: [{ x: 4, y: 0, t: 0 }, { x: 12, y: 6, t: 1 }] },
    { id: 'rusher', side: 'defense', role: 'rusher', trail: 'dashed', waypoints: [{ x: 20, y: 7, t: 0 }, { x: 20, y: 1, t: 1 }] },
  ],
  beats: [
    { t: 0, title: 'Snap' },
    { t: .45, title: 'Crossers', focus: ['wr1'] },
    { t: .9, title: 'Throw', focus: ['qb'] },
  ],
  summary: { motive: '', keyDefender: '', whyItWorks: '', counter: '' },
  ...overrides,
});

describe('resolveAssignment', () => {
  it('uses explicit assignments map when present', () => {
    const play = makePlay({ assignments: { wr1: 'wren-id' } });
    const player: RosterPlayer = { id: 'wren-id', name: 'Wren', number: 11, role: 'wr' };
    expect(resolveAssignment(play, player)).toEqual({ trackId: 'wr1', playId: 'p1', via: 'explicit' });
  });

  it('prefers explicit over role match', () => {
    const play = makePlay({ assignments: { wr1: 'mover' } });
    const player: RosterPlayer = { id: 'mover', name: 'Mover', role: 'wr' };
    expect(resolveAssignment(play, player)?.via).toBe('explicit');
  });

  it('falls back to role match when assignments omit the player', () => {
    expect(resolveAssignment(makePlay(), qb)?.via).toBe('role');
    expect(resolveAssignment(makePlay(), wr)?.via).toBe('role');
  });

  it('falls back to position label (player id matches track id) when role absent', () => {
    const labelOnly: RosterPlayer = { id: 'wr1', name: 'Wren' };
    expect(resolveAssignment(makePlay(), labelOnly)?.via).toBe('position');
  });

  it('returns null when no offense track matches and no explicit binding', () => {
    const stranger: RosterPlayer = { id: 'unknown', name: 'X' };
    expect(resolveAssignment(makePlay(), stranger)).toBeNull();
  });

  it('skips defensive tracks even when their id matches the player id', () => {
    const rusher: RosterPlayer = { id: 'rusher', name: 'Rushee' };
    expect(resolveAssignment(makePlay(), rusher)).toBeNull();
  });

  it('returns null for a play with no tracks', () => {
    expect(resolveAssignment(makePlay({ tracks: [] }), qb)).toBeNull();
  });
});

describe('resolveAssignmentFor', () => {
  it('lists every play the player has an assignment in', () => {
    const plays = [makePlay({ id: 'a' }), makePlay({ id: 'b' })];
    const result = resolveAssignmentFor(plays, qb);
    expect(result).toHaveLength(2);
    expect(result.every((entry) => entry.assignment.trackId === 'qb')).toBe(true);
  });

  it('skips plays where the player has no binding', () => {
    const plays = [makePlay({ id: 'a' }), makePlay({ id: 'b', tracks: [{ id: 'rb', side: 'offense', role: 'rb', waypoints: [{ x: 15, y: -5, t: 0 }] }] })];
    expect(resolveAssignmentFor(plays, qb)).toHaveLength(1);
  });
});

describe('playerBeats', () => {
  it('returns an empty list when no track is bound', () => {
    expect(playerBeats(makePlay().beats, null)).toEqual([]);
  });

  it('keeps beats with no focus plus those that focus the bound track', () => {
    const beats = makePlay().beats;
    const filtered = playerBeats(beats, 'wr1');
    expect(filtered.map((beat) => beat.title)).toEqual(['Snap', 'Crossers']);
  });

  it('omits beats focused on other tracks', () => {
    const beats = makePlay().beats;
    expect(playerBeats(beats, 'qb').map((beat) => beat.title)).toEqual(['Snap', 'Throw']);
  });
});

describe('summarizeAssignment', () => {
  it('reports waypoint count and role for a bound track', () => {
    expect(summarizeAssignment(makePlay(), 'qb')).toEqual({ waypointCount: 2, role: 'qb' });
  });
  it('returns zeros when no track is bound', () => {
    expect(summarizeAssignment(makePlay(), null)).toEqual({ waypointCount: 0, role: null });
  });
});
