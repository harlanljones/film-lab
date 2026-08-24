import { describe, expect, it } from 'vitest';
import { FIELD_DEPTH, FIELD_WIDTH } from '../../engine/geometry';
import { FIELD_HEIGHT, toFieldPoint, trailDash } from '../Field7';

describe('Field7 primitives', () => {
  it('maps engine coordinates into the SVG field without changing dimensions', () => {
    expect(FIELD_WIDTH).toBe(40);
    expect(FIELD_HEIGHT).toBe(FIELD_DEPTH * 2);
    expect(toFieldPoint({ x: 0, y: -FIELD_DEPTH })).toEqual({ x: 0, y: FIELD_HEIGHT });
    expect(toFieldPoint({ x: FIELD_WIDTH, y: FIELD_DEPTH })).toEqual({ x: FIELD_WIDTH, y: 0 });
  });

  it('uses deterministic trail styles', () => {
    expect(trailDash('solid')).toBeUndefined();
    expect(trailDash('dashed')).toBe('1.5 1');
    expect(trailDash('dotted')).toBe('.25 1');
  });
});
