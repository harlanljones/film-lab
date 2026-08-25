import {describe, expect, it} from 'vitest';
import {starterLibrary} from '..';
import {isValidPlay} from '../../../engine/validate';

describe('starter library integrity', () => {
  it('contains the target roster', () => expect(starterLibrary).toHaveLength(22));

  it('validates every play with beats and complete summaries', () => {
    for (const play of starterLibrary) {
      expect(isValidPlay(play), play.name).toBe(true);
      expect(play.beats.length, play.name).toBeGreaterThan(0);
      expect(Object.values(play.summary).every(value => value.trim().length > 0), play.name).toBe(true);
    }
  });

  it('keeps every starter track set distinct', () => {
    const signatures = starterLibrary.map(play => JSON.stringify(play.tracks));
    expect(new Set(signatures).size).toBe(starterLibrary.length);
  });
});
