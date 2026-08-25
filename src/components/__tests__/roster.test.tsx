// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PlaybookView } from '../PlaybookView';
import { PLAYBOOK_KEY, PlaybookProvider, SCHEMA_VERSION, savePlaybook } from '../../storage/playbookStore';
import { SelectionProvider } from '../SelectionContext';
import { seededPlay } from '../../data/seededPlay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const dispatch = (target: EventTarget, event: Event) => target.dispatchEvent(event);

async function renderView() {
  await act(async () => { root = createRoot(container); root.render(<PlaybookProvider><SelectionProvider><PlaybookView /></SelectionProvider></PlaybookProvider>); await flush(); });
}

const valueOf = (selector: string) => container.querySelector<HTMLInputElement | HTMLSelectElement>(selector);

async function setValue(selector: string, value: string) {
  const el = valueOf(selector)!;
  await act(async () => { const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')?.set; setter?.call(el, value); dispatch(el, new Event('input', { bubbles: true })); dispatch(el, new Event('change', { bubbles: true })); await flush(); });
}

async function click(target: Element) {
  await act(async () => { dispatch(target, new MouseEvent('click', { bubbles: true })); await flush(); });
}

describe('Roster panel', () => {
  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.append(container);
  });
  afterEach(async () => {
    await act(async () => { root.unmount(); await flush(); });
    container.remove();
  });

  it('shows the empty-roster guidance before any player is added', async () => {
    await renderView();
    expect(container.querySelector('aside[aria-label="Roster"]')?.textContent).toContain('No players yet');
    expect(container.querySelector('aside[aria-label="My assignments"]')?.textContent).toContain('Add a player to the roster');
  });

  it('adds a player, persists, and lists them in the roster and assignments', async () => {
    savePlaybook({ schemaVersion: SCHEMA_VERSION, plays: [seededPlay], sequence: [], roster: [] });
    await renderView();
    await setValue('input[aria-label="New player name"]', 'Quinn');
    await setValue('input[aria-label="New player number"]', '7');
    await setValue('select[aria-label="New player role"]', 'qb');
    await click(container.querySelector('aside[aria-label="Roster"] button[type="submit"]')!);
    const stored = JSON.parse(localStorage.getItem(PLAYBOOK_KEY)!);
    expect(stored.roster).toEqual([{ id: expect.stringMatching(/^player-\d+$/), name: 'Quinn', number: 7, role: 'qb' }]);
    const list = container.querySelector('ul[aria-label="Roster players"]');
    expect(list?.textContent).toContain('Quinn');
  });

  it('selecting a player filters the assignment list to that player and clears on demand', async () => {
    savePlaybook({ schemaVersion: SCHEMA_VERSION, plays: [seededPlay], sequence: [], roster: [{ id: 'maya', name: 'Maya', number: 7, role: 'wr' }] });
    await renderView();
    await click(container.querySelector('button[aria-label="Select Maya for my assignments"]')!);
    const assignmentList = container.querySelector('ol[aria-label="Maya assignments"]');
    expect(assignmentList?.textContent ?? '').toContain('Mesh');
    await click(container.querySelector('aside[aria-label="My assignments"] button')!);
    expect(container.querySelector('aside[aria-label="My assignments"]')?.textContent).toContain('Select a player');
  });

  it('edits and removes a player', async () => {
    savePlaybook({ schemaVersion: SCHEMA_VERSION, plays: [], sequence: [], roster: [{ id: 'maya', name: 'Maya', number: 7, role: 'wr' }] });
    await renderView();
    await click(container.querySelector('button[aria-label="Edit Maya"]')!);
    await setValue('input[aria-label="Edit name for Maya"]', 'Maya R.');
    await click(container.querySelector('form.roster-edit button[type="submit"]')!);
    let stored = JSON.parse(localStorage.getItem(PLAYBOOK_KEY)!);
    expect(stored.roster[0].name).toBe('Maya R.');
    await click(container.querySelector('button[aria-label="Remove Maya R."]')!);
    stored = JSON.parse(localStorage.getItem(PLAYBOOK_KEY)!);
    expect(stored.roster).toEqual([]);
  });
});
