/** Situational install tags — no schema change, just taxonomy presets for `Play.tags`. */
export const SITUATION_PRESETS = [
  'red zone',
  'goal line',
  '3rd-and-long',
  '3rd-and-short',
  '4th-and-short',
  '2-minute',
  'backed-up',
] as const;

export type SituationPreset = (typeof SITUATION_PRESETS)[number];
