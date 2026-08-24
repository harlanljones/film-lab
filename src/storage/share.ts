import type { Play } from '../engine/types';
import { isValidPlay } from '../engine/validate';
import { SCHEMA_VERSION } from './playbookStore';

export const SHARE_PREFIX = '#share=';
export const MAX_SHARE_PAYLOAD = 8_192;

const encodeUtf8 = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};

const decodeUtf8 = (value: string): string => {
  const binary = atob(value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4));
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export function encodeShareHash(play: Play): string {
  if (!isValidPlay(play)) throw new Error('Share rejected: play failed validation');
  const encoded = encodeUtf8(JSON.stringify({ schemaVersion: SCHEMA_VERSION, play }));
  if (encoded.length > MAX_SHARE_PAYLOAD) throw new Error(`Share rejected: payload exceeds ${MAX_SHARE_PAYLOAD} characters`);
  return `${SHARE_PREFIX}${encoded}`;
}

export function decodeShareHash(hash: string): Play {
  if (!hash.startsWith(SHARE_PREFIX)) throw new Error('Share link is missing a Film Lab payload');
  const encoded = hash.slice(SHARE_PREFIX.length);
  if (!encoded || encoded.length > MAX_SHARE_PAYLOAD) throw new Error('Share link is too large or empty');
  let parsed: unknown;
  try { parsed = JSON.parse(decodeUtf8(encoded)); } catch { throw new Error('Share link is corrupted or not valid JSON'); }
  if (!parsed || typeof parsed !== 'object' || (parsed as {schemaVersion?: unknown}).schemaVersion !== SCHEMA_VERSION) throw new Error(`Share rejected: expected schemaVersion ${SCHEMA_VERSION}`);
  const play = (parsed as {play?: unknown}).play;
  if (!play || typeof play !== 'object' || !isValidPlay(play as Play)) throw new Error('Share rejected: play failed validation');
  return play as Play;
}

export function createShareUrl(play: Play, currentUrl: string): string {
  const url = new URL(currentUrl);
  url.hash = encodeShareHash(play).slice(1);
  return url.toString();
}
