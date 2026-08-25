// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PlaybookView } from '../PlaybookView';
import { PLAYBOOK_KEY, PlaybookProvider, SCHEMA_VERSION, savePlaybook } from '../../storage/playbookStore';
import { seededPlay } from '../../data/seededPlay';
import { validatePlay } from '../../engine/validate';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

async function renderView() {
  await act(async () => { root = createRoot(container); root.render(<PlaybookProvider><PlaybookView /></PlaybookProvider>); await flush(); });
}

async function importFile(raw: string) {
  const input = container.querySelector<HTMLInputElement>('input[aria-label="Import JSON file"]')!;
  const file = new File([raw], 'plan.json', { type: 'application/json' });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); await flush(); });
}

const checkbox = (label: string) => container.querySelector<HTMLInputElement>(`input[type="checkbox"][aria-label="${label}"]`);
const buttonByText = (prefix: string) => [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent?.startsWith(prefix));

describe('Import preview plan', () => {
  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.append(container);
  });
  afterEach(async () => {
    await act(async () => { root.unmount(); await flush(); });
    container.remove();
  });

  it('renders bucket badges, per-row labels, defaults, and applies only selected plays', async () => {
    const alpha = { ...seededPlay, id: 'alpha', name: 'Alpha' };
    savePlaybook({ schemaVersion: SCHEMA_VERSION, plays: [alpha], sequence: [] });
    const beta = { ...seededPlay, id: 'beta', name: 'Beta' };
    const alphaV2 = { ...alpha, notes: 'Alpha v2 scouting note.' };
    const broken = { ...seededPlay, id: 'broken', name: 'Broken', tracks: [] };
    const brokenProblems = validatePlay(broken);
    const raw = JSON.stringify({ schemaVersion: SCHEMA_VERSION, plays: [beta, alphaV2, { ...alpha }, broken] });
    await renderView();
    await importFile(raw);

    const dialog = container.querySelector('[role="dialog"][aria-label="Import preview"]');
    expect(dialog).not.toBeNull();
    expect(dialog!.textContent).toContain('1 new · 1 updated · 1 unchanged · 1 invalid.');
    expect(dialog!.textContent).toContain('Unchanged');
    expect(dialog!.textContent).toContain('Invalid');
    for (const problem of brokenProblems) expect(dialog!.textContent).toContain(problem);

    const newBox = checkbox('New: Beta');
    const updatedBox = checkbox('Updated: Alpha');
    const unchangedBox = checkbox('Unchanged: Alpha');
    expect(newBox).not.toBeNull();
    expect(updatedBox).not.toBeNull();
    expect(unchangedBox).not.toBeNull();
    expect(newBox!.checked).toBe(true);
    expect(updatedBox!.checked).toBe(true);
    expect(unchangedBox!.checked).toBe(false);

    const apply = buttonByText('Apply selected');
    const replace = buttonByText('Replace with selected');
    expect(apply!.disabled).toBe(false);
    expect(replace!.disabled).toBe(false);

    await act(async () => { newBox!.click(); await flush(); });
    expect(checkbox('New: Beta')!.checked).toBe(false);
    expect(apply!.disabled).toBe(false);

    await act(async () => { checkbox('Updated: Alpha')!.click(); await flush(); });
    expect(apply!.disabled).toBe(true);
    expect(replace!.disabled).toBe(true);

    await act(async () => { checkbox('Updated: Alpha')!.click(); await flush(); });
    expect(apply!.disabled).toBe(false);
    await act(async () => { apply!.click(); await flush(); });

    expect(container.querySelector('[role="dialog"][aria-label="Import preview"]')).toBeNull();
    const stored = JSON.parse(localStorage.getItem(PLAYBOOK_KEY)!) as { plays: Array<{ id: string }> };
    expect(stored.plays.map((play) => play.id)).toEqual(['alpha']);
    expect(stored.plays[0]).toMatchObject({ id: 'alpha', notes: 'Alpha v2 scouting note.' });
    expect(stored.plays.some((play) => play.id === 'beta')).toBe(false);
  });
});
