import type { Play } from '../engine/types';

export const UNCATEGORIZED = 'Uncategorized';

export function getConceptLabel(play: Play): string {
  const raw = play.concept?.trim();
  return raw ? raw : UNCATEGORIZED;
}

export function groupByConcept(plays: Play[]): { concept: string; plays: Play[] }[] {
  const map = new Map<string, Play[]>();
  for (const play of plays) {
    const label = getConceptLabel(play);
    const bucket = map.get(label);
    if (bucket) bucket.push(play);
    else map.set(label, [play]);
  }
  const entries = [...map.entries()].map(([concept, groupPlays]) => ({ concept, plays: groupPlays }));
  entries.sort((a, b) => {
    if (a.concept === UNCATEGORIZED) return 1;
    if (b.concept === UNCATEGORIZED) return -1;
    return a.concept.localeCompare(b.concept);
  });
  return entries;
}

export function findLooksForConcept(plays: Play[], concept: string | undefined): Play[] {
  const trimmed = concept?.trim();
  if (!trimmed) return [];
  return plays
    .filter((play) => play.concept?.trim() === trimmed)
    .sort((a, b) => a.defenseLook.localeCompare(b.defenseLook) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}
