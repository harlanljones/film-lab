import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Play } from '../engine/types';
import { isValidPlay } from '../engine/validate';

export const SCHEMA_VERSION = 2;
export const PLAYBOOK_KEY = 'film-lab.playbook';
export const BACKUP_KEY = 'film-lab.playbook.backup';
export const SELECTED_PLAY_KEY = 'film-lab.selected-play';

export type PlaybookDocument = { schemaVersion: number; plays: Play[] };
type StorageLike = { getItem(key: string): string | null; setItem(key: string, value: string): void };
const memory = new Map<string, string>();

function storage(): StorageLike {
  if (typeof localStorage !== 'undefined') return localStorage;
  return { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
}

export function migrateDocument(input: unknown): PlaybookDocument {
  if (!input || typeof input !== 'object') return { schemaVersion: SCHEMA_VERSION, plays: [] };
  const value = input as { schemaVersion?: unknown; plays?: unknown };
  const plays = Array.isArray(value.plays) ? (value.plays as Play[]) : [];
  if (value.schemaVersion === 1) {
    return { schemaVersion: SCHEMA_VERSION, plays: plays.map((play) => ({ ...play, notes: play.notes ?? '' })) };
  }
  if (value.schemaVersion === SCHEMA_VERSION) return { schemaVersion: SCHEMA_VERSION, plays };
  return { schemaVersion: SCHEMA_VERSION, plays: [] };
}

export function loadPlaybook(): PlaybookDocument {
  const raw = storage().getItem(PLAYBOOK_KEY);
  if (!raw) return { schemaVersion: SCHEMA_VERSION, plays: [] };
  try { return migrateDocument(JSON.parse(raw)); } catch { return { schemaVersion: SCHEMA_VERSION, plays: [] }; }
}

export function savePlaybook(document: PlaybookDocument): void {
  const next = JSON.stringify({ ...document, schemaVersion: SCHEMA_VERSION });
  const store = storage();
  const previous = store.getItem(PLAYBOOK_KEY);
  try {
    if (previous) store.setItem(BACKUP_KEY, previous);
    store.setItem(PLAYBOOK_KEY, next);
  } catch (error) {
    if (previous) store.setItem(PLAYBOOK_KEY, previous);
    throw new Error('Unable to save playbook: storage quota exceeded', { cause: error });
  }
}

export function upsertPlay(plays: Play[], play: Play): Play[] {
  const index = plays.findIndex((existing) => existing.id === play.id);
  if (index < 0) return [...plays, play];
  return plays.map((existing, currentIndex) => currentIndex === index ? play : existing);
}

export function resolveSelectedPlay(plays: Play[], selectedPlayId: string | null, fallback: Play): Play {
  return plays.find((play) => play.id === selectedPlayId) ?? plays[0] ?? fallback;
}

export function exportPlaybook(plays: Play[]): string {
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, plays }, null, 2);
}

export function importPlaybook(raw: string, current: Play[] = []): Play[] {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Import rejected: invalid JSON'); }
  if (!parsed || typeof parsed !== 'object' || (parsed as { schemaVersion?: unknown }).schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Import rejected: expected schemaVersion ${SCHEMA_VERSION}`);
  }
  const incoming = (parsed as { plays?: unknown }).plays;
  if (!Array.isArray(incoming) || incoming.some((play) => !play || typeof play !== 'object' || !('id' in play) || !isValidPlay(play as Play))) {
    throw new Error('Import rejected: one or more plays failed validation');
  }
  return (incoming as Play[]).reduce(upsertPlay, [...current]);
}

export type PlaybookStore = {
  plays: Play[];
  selectedPlayId: string | null;
  save: (plays: Play[]) => void;
  upsert: (play: Play) => void;
  select: (play: Play) => void;
  add: (play: Play) => void;
  remove: (id: string) => void;
  error: string | null;
};

const PlaybookContext = createContext<PlaybookStore | null>(null);

export function PlaybookProvider({ children }: { children: ReactNode }) {
  const [document, setDocument] = useState<PlaybookDocument>(() => loadPlaybook());
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(() => storage().getItem(SELECTED_PLAY_KEY));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    try { savePlaybook(document); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save playbook'); }
  }, [document]);
  const save = useCallback((plays: Play[]) => setDocument({ schemaVersion: SCHEMA_VERSION, plays }), []);
  const upsert = useCallback((play: Play) => setDocument((current) => ({ schemaVersion: SCHEMA_VERSION, plays: upsertPlay(current.plays, play) })), []);
  const select = useCallback((play: Play) => {
    setSelectedPlayId(play.id);
    storage().setItem(SELECTED_PLAY_KEY, play.id);
    setDocument((current) => ({ schemaVersion: SCHEMA_VERSION, plays: upsertPlay(current.plays, play) }));
  }, []);
  const add = useCallback((play: Play) => setDocument((current) => ({ schemaVersion: SCHEMA_VERSION, plays: upsertPlay(current.plays, play) })), []);
  const remove = useCallback((id: string) => setDocument((current) => ({ schemaVersion: SCHEMA_VERSION, plays: current.plays.filter((play) => play.id !== id) })), []);
  return createElement(PlaybookContext.Provider, { value: { plays: document.plays, selectedPlayId, save, upsert, select, add, remove, error } }, children);
}

export function usePlaybook(): PlaybookStore {
  const context = useContext(PlaybookContext);
  if (!context) throw new Error('usePlaybook must be used within PlaybookProvider');
  return context;
}
