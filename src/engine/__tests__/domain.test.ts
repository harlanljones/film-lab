import { describe, expect, it } from 'vitest';
import { flip, mirror, FIELD_WIDTH } from '../geometry';
import { isValidPlay, validatePlay } from '../validate';
import type { Play, PlayerTrack } from '../types';

const track = (side: 'offense' | 'defense', i: number): PlayerTrack => ({ id: `${side}-${i}`, side, role: side === 'offense' ? 'wr' : 'db', waypoints: [{ x: i, y: 0, t: 0 }, { x: i + 1, y: 5, t: 1 }], trail: 'solid' });
const play = (): Play => ({ id: 'test', name: 'Test', duration: 1, category: 'pass', defenseLook: 'Cover 2', tags: [], notes: '', tracks: [...Array.from({ length: 7 }, (_, i) => track('offense', i)), ...Array.from({ length: 7 }, (_, i) => track('defense', i))], beats: [], summary: { motive: '', keyDefender: '', whyItWorks: '', counter: '' } });

describe('7v7 domain', () => {
  it('accepts a valid play', () => expect(isValidPlay(play())).toBe(true));
  it('rejects anchors, ordering, and trails', () => { const p = play(); p.tracks[0].waypoints[0].t = 1; p.tracks[1].waypoints.reverse(); p.tracks[2].trail = 'zigzag' as never; expect(validatePlay(p)).toHaveLength(4); });
it('allows shorthanded sides down to the minimum', () => { const p = play(); const offense = p.tracks.filter((t) => t.side === 'offense'); const defense = p.tracks.filter((t) => t.side === 'defense'); p.tracks = [...offense.slice(0, 4), ...defense.slice(0, 4)]; expect(validatePlay(p)).toHaveLength(0); p.tracks = [...offense.slice(0, 3), ...defense.slice(0, 4)]; expect(validatePlay(p).some((problem) => problem.includes('at least 4 offensive'))).toBe(true); });
  it('rejects more than 7 per side', () => { const p = play(); p.tracks.push(p.tracks[0]); expect(validatePlay(p).some((problem) => problem.includes('no more than 7'))).toBe(true); });
  it('rejects sides below a configured minimum', () => { const p = play(); p.tracks = p.tracks.filter((t) => t.side === 'offense').slice(0, 3).map((t) => ({ ...t, side: 'defense' as const })); expect(validatePlay(p, { minPerSide: 4 }).some((problem) => problem.includes('at least 4 defensive'))).toBe(true); });
  it('rejects waypoints outside the field', () => { const p = play(); p.tracks[0].waypoints[1].x = FIELD_WIDTH + 1; expect(validatePlay(p).some((problem) => problem.includes('outside the field'))).toBe(true); });
  it('rejects rushers inside 7 yards of the line of scrimmage', () => { const p = play(); p.tracks.find((t) => t.side === 'defense')!.role = 'rusher'; p.tracks.find((t) => t.side === 'defense')!.waypoints[0].y = 4; expect(validatePlay(p).some((problem) => problem.includes('less than 7 yards'))).toBe(true); });
  it('mirror and flip are involutions', () => { const p = { x: 7, y: -3 }; expect(mirror(mirror(p))).toEqual(p); expect(flip(flip(p))).toEqual(p); expect(mirror({ x: 0, y: 0 }).x).toBe(FIELD_WIDTH); });
});
