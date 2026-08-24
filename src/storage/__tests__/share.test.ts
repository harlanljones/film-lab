import {describe, expect, it} from 'vitest';
import {starterLibrary} from '../../data/library';
import {decodeShareHash, encodeShareHash, createShareUrl, MAX_SHARE_PAYLOAD} from '../share';

describe('URL-hash sharing', () => {
  it('round trips one validated play through a share URL', () => {
    const play = starterLibrary[0];
    const hash = encodeShareHash(play);
    expect(decodeShareHash(hash)).toEqual(play);
    expect(createShareUrl(play, 'https://film-lab.test/#editor')).toContain('#share=');
  });

  it('rejects corrupted and oversized payloads safely', () => {
    expect(() => decodeShareHash('#share=not-json')).toThrow(/corrupted|JSON/);
    expect(() => decodeShareHash(`#share=${'a'.repeat(MAX_SHARE_PAYLOAD + 1)}`)).toThrow(/large/);
  });
});
