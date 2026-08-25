// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../main';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const dispatch = (target: EventTarget, event: Event) => target.dispatchEvent(event);

async function renderApp() {
  await act(async () => { root = createRoot(container); root.render(<App />); await flush(); });
}

async function click(target: Element) {
  await act(async () => { dispatch(target, new MouseEvent('click', { bubbles: true })); await flush(); });
}

async function change(target: HTMLInputElement | HTMLSelectElement, value: string) {
  await act(async () => { const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), 'value')?.set; setter?.call(target, value); dispatch(target, new Event('input', { bubbles: true })); dispatch(target, new Event('change', { bubbles: true })); await flush(); });
}

describe('editor browser-style flow', () => {
  beforeEach(() => { localStorage.clear(); container = document.createElement('div'); document.body.append(container); });
  afterEach(async () => { await act(async () => { root.unmount(); await flush(); }); container.remove(); });

  it('covers pointer editing, assignment, beats, save, replay, and refresh persistence', async () => {
    await renderApp();
    await change(document.querySelector('select[aria-label="Offense formation"]') as HTMLSelectElement, 'bunch');
    await change(document.querySelector('input[aria-label="Play name"]') as HTMLInputElement, 'Pointer Mesh');

    const field = document.querySelector('#editor svg.field') as SVGSVGElement;
    Object.defineProperty(field, 'getBoundingClientRect', { value: () => ({ left: 0, top: 0, width: 640, height: 1280 }) });
    await act(async () => { dispatch(field, new MouseEvent('pointerdown', { bubbles: true, clientX: 320, clientY: 640 })); await flush(); });
    expect(document.querySelectorAll('#editor circle.waypoint-handle').length).toBe(15);

    await change(document.querySelector('select[aria-label="Route trail"]') as HTMLSelectElement, 'dashed');
    await change(document.querySelector('input[aria-label="Beat 1 title"]') as HTMLInputElement, 'Release');
    await click(Array.from(document.querySelectorAll('#editor button')).find((button) => button.textContent === 'Save play')!);

    const stored = JSON.parse(localStorage.getItem('film-lab.playbook')!);
    expect(stored.plays.find((play: { id: string }) => play.id === 'edited-play').name).toBe('Pointer Mesh');
    expect(document.querySelector('#film-room h2')?.textContent).toBe('Pointer Mesh');

    await act(async () => { root.unmount(); await flush(); });
    await renderApp();
    expect((document.querySelector('input[aria-label="Play name"]') as HTMLInputElement).value).toBe('Pointer Mesh');
  });

  it('supports keyboard marker selection and rejects invalid edits before save', async () => {
    await renderApp();
    const marker = document.querySelector('#editor circle.marker') as SVGCircleElement;
    marker.focus();
    await act(async () => { dispatch(marker, new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' })); await flush(); });
    expect(document.querySelector('#editor button[aria-pressed="true"]')?.textContent).toContain('qb');

    await change(document.querySelector('input[aria-label="Waypoint x"]') as HTMLInputElement, '999');
    expect(document.querySelector('#editor [role="alert"]')?.textContent ?? '').toContain('outside the field');
    expect(Array.from(document.querySelectorAll('#editor button')).find((button) => button.textContent === 'Save play')).toHaveProperty('disabled', true);
  });

  it('plays an ordered sequence in Film Room', async () => {
    const stored = { schemaVersion: 4, plays: [starterPlay('seq-a', 'Sequence A'), starterPlay('seq-b', 'Sequence B')], sequence: [{ playId: 'seq-b' }, { playId: 'seq-a' }], roster: [] };
    localStorage.setItem('film-lab.playbook', JSON.stringify(stored));
    await renderApp();
    expect(document.querySelector('#film-room h2')?.textContent).toBe('Sequence B');
    expect(document.querySelector('[aria-label="Sequence position"]')?.textContent).toBe('1 of 2');
    await act(async () => { root.unmount(); await flush(); });
    await renderApp();
    expect(document.querySelector('#film-room h2')?.textContent).toBe('Sequence B');
  });

  it('authoring: adds, reorders, and removes plays in the sequence, then plays it', async () => {
    await renderApp();
    const addA = Array.from(document.querySelectorAll('#playbook button')).find((button) => button.getAttribute('aria-label') === 'Add Mesh to sequence');
    const addB = Array.from(document.querySelectorAll('#playbook button')).find((button) => button.getAttribute('aria-label') === 'Add Shallow to sequence');
    expect(addA).toBeDefined();
    await click(addA!);
    await click(addB!);
    await click(Array.from(document.querySelectorAll('#playbook button')).find((button) => button.getAttribute('aria-label') === 'Move Shallow earlier in sequence')!);
    const entries = Array.from(document.querySelectorAll('[aria-label="Sequence plays"] li')).map((li) => li.textContent?.split('↑')[0]);
    expect(entries).toEqual(['Shallow', 'Mesh']);
    const stored = JSON.parse(localStorage.getItem('film-lab.playbook')!);
    expect(stored.sequence).toEqual([{ playId: 'starter-3' }, { playId: 'starter-1' }]);
    await click(Array.from(document.querySelectorAll('#playbook button')).find((button) => button.getAttribute('aria-label') === 'Remove Shallow from sequence')!);
    expect(JSON.parse(localStorage.getItem('film-lab.playbook')!).sequence).toEqual([{ playId: 'starter-1' }]);
  });

  it('groups: assigns a group tag, persists it across refresh, and filters by it', async () => {
    await renderApp();
    const originalPrompt = window.prompt;
    window.prompt = () => 'Red zone';
    try {
      await click(Array.from(document.querySelectorAll('#playbook button')).find((button) => button.getAttribute('aria-label') === 'Add Mesh to group')!);
      const stored = JSON.parse(localStorage.getItem('film-lab.playbook')!);
      expect(stored.plays.find((play: { id: string }) => play.id === 'starter-1').tags).toContain('Red zone');
      await act(async () => { root.unmount(); await flush(); });
      await renderApp();
      await change(document.querySelector('#playbook select[aria-label="Filter by group"]') as HTMLSelectElement, 'Red zone');
      const names = Array.from(document.querySelectorAll('#playbook .card h3')).map((heading) => heading.textContent);
      expect(names).toContain('Mesh');
      expect(names).not.toContain('Shallow');
    } finally { window.prompt = originalPrompt; }
  });

  it('compare: renders two plays on a shared clock with synced timeline', async () => {
    await renderApp();
    const selects = Array.from(document.querySelectorAll('#compare select'));
    expect(selects).toHaveLength(2);
    await change(selects[1] as HTMLSelectElement, 'starter-2');
    const fields = document.querySelectorAll('#compare svg.field');
    expect(fields).toHaveLength(2);
    const timeline = document.querySelector('#compare input[aria-label="Comparison timeline"]') as HTMLInputElement;
    await act(async () => { const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(timeline), 'value')?.set; setter?.call(timeline, '0.5'); dispatch(timeline, new Event('input', { bubbles: true })); dispatch(timeline, new Event('change', { bubbles: true })); await flush(); });
    expect(document.querySelector('#compare [aria-live="polite"]')?.textContent).toContain('0:00.5');
  });

  it('speed and branch: sets playback rate and replays from a beat', async () => {
    await renderApp();
    await click(Array.from(document.querySelectorAll('#film-room button')).find((button) => button.getAttribute('aria-label') === 'Playback speed 0.5×')!);
    expect(Array.from(document.querySelectorAll('#film-room button')).find((button) => button.getAttribute('aria-label') === 'Playback speed 0.5×')?.getAttribute('aria-pressed')).toBe('true');
    await click(Array.from(document.querySelectorAll('#film-room button')).find((button) => button.getAttribute('aria-label') === 'Branch to Crossers')!);
    const timeline = document.querySelector('#film-room input[aria-label="Playback timeline"]') as HTMLInputElement;
    expect(Number(timeline.value)).toBeCloseTo(.45, 1);
  });
});

function starterPlay(id: string, name: string) {
  return { id, name, duration: 1, category: 'pass', defenseLook: 'Cover 2', tags: [], notes: '', tracks: [], beats: [{ t: 0, title: 'Snap', focus: ['qb'] }], summary: { motive: '', keyDefender: '', whyItWorks: '', counter: '' } };
}
