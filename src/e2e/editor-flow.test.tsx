// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../main';
import { seededPlay } from '../data/seededPlay';
import { encodeShareHash } from '../storage/share';

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

async function goTo(route: string) {
  await act(async () => { window.location.hash = `#${route}`; window.dispatchEvent(new Event('hashchange')); await flush(); });
}

// Deterministic playback clock: replaces requestAnimationFrame + performance.now so
// the Film Room runner advances exactly one known number of game-seconds per pump()
// instead of drifting on real wall-clock timers (jsdom has no stable rAF).
type Clock = { start: () => void; pump: (frames: number, msPerFrame?: number) => void; frames: () => number; stop: () => void };

function rafClock(): Clock {
  let elapsed = 0;
  let queue: FrameRequestCallback[] = [];
  let spy: ReturnType<typeof vi.spyOn> | null = null;
  let originalRaf: typeof window.requestAnimationFrame | null = null;
  let originalCancel: typeof window.cancelAnimationFrame | null = null;
  return {
    start() {
      originalRaf = window.requestAnimationFrame;
      originalCancel = window.cancelAnimationFrame;
      spy = vi.spyOn(performance, 'now').mockImplementation(() => elapsed);
      window.requestAnimationFrame = (callback) => { queue.push(callback); return queue.length; };
      window.cancelAnimationFrame = () => {};
    },
    pump(frames, msPerFrame = 50) {
      for (let i = 0; i < frames; i++) {
        elapsed += msPerFrame;
        const callbacks = queue.splice(0, queue.length);
        for (const callback of callbacks) callback(elapsed);
      }
    },
    frames() { return queue.length; },
    stop() {
      spy?.mockRestore();
      if (originalRaf) window.requestAnimationFrame = originalRaf;
      if (originalCancel) window.cancelAnimationFrame = originalCancel;
      queue = [];
    },
  };
}

describe('editor browser-style flow', () => {
  beforeEach(() => { localStorage.clear(); window.history.replaceState({}, '', '/'); container = document.createElement('div'); document.body.append(container); });
  afterEach(async () => { await act(async () => { root.unmount(); await flush(); }); container.remove(); });

  it('covers pointer editing, assignment, beats, save, replay, and refresh persistence', async () => {
    await renderApp();
    await goTo('editor');
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
    await goTo('film-room');
    expect(document.querySelector('#film-room h2')?.textContent).toBe('Pointer Mesh');

    await act(async () => { root.unmount(); await flush(); });
    await renderApp();
    await goTo('editor');
    expect((document.querySelector('input[aria-label="Play name"]') as HTMLInputElement).value).toBe('Pointer Mesh');
  });

  it('supports keyboard marker selection and rejects invalid edits before save', async () => {
    await renderApp();
    await goTo('editor');
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
    await goTo('film-room');
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

  it('HJ-447: the card sequence toggle removes an in-sequence play and re-adds it', async () => {
    await renderApp();
    const toggle = (label: string) => Array.from(document.querySelectorAll('#playbook .card-secondary .btn-secondary')).find((button) => button.getAttribute('aria-label') === label);

    const addMesh = toggle('Add Mesh to sequence');
    expect(addMesh).toBeDefined();
    await click(addMesh!);
    expect(JSON.parse(localStorage.getItem('film-lab.playbook')!).sequence).toEqual([{ playId: 'starter-1' }]);

    const removeMesh = toggle('Remove Mesh from sequence');
    expect(removeMesh).toBeDefined();
    expect(removeMesh!.getAttribute('aria-pressed')).toBe('true');
    expect(removeMesh!.textContent).toContain('Remove from sequence');
    await click(removeMesh!);
    expect(JSON.parse(localStorage.getItem('film-lab.playbook')!).sequence).toEqual([]);

    const reAdd = toggle('Add Mesh to sequence');
    expect(reAdd).toBeDefined();
    expect(reAdd!.getAttribute('aria-pressed')).toBe('false');
    expect(reAdd!.textContent).toContain('Add to sequence');
    await click(reAdd!);
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
    await goTo('compare');
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
    await goTo('film-room');
    await click(Array.from(document.querySelectorAll('#film-room button')).find((button) => button.getAttribute('aria-label') === 'Playback speed 0.5×')!);
    expect(Array.from(document.querySelectorAll('#film-room button')).find((button) => button.getAttribute('aria-label') === 'Playback speed 0.5×')?.getAttribute('aria-pressed')).toBe('true');
    await click(Array.from(document.querySelectorAll('#film-room button')).find((button) => button.getAttribute('aria-label') === 'Branch to Crossers')!);
    const timeline = document.querySelector('#film-room input[aria-label="Playback timeline"]') as HTMLInputElement;
    expect(Number(timeline.value)).toBeCloseTo(.45, 1);
  });

  it('assignments: roster add → role binding → film room highlights that player and filters beats', async () => {
    const mesh = { ...seededPlay, id: 'mesh-play', name: 'Mesh One' };
    localStorage.setItem('film-lab.playbook', JSON.stringify({ schemaVersion: 4, plays: [mesh], sequence: [], roster: [] }));
    await renderApp();
    const nameInput = document.querySelector('#playbook input[aria-label="New player name"]') as HTMLInputElement;
    const numberInput = document.querySelector('#playbook input[aria-label="New player number"]') as HTMLInputElement;
    const roleSelect = document.querySelector('#playbook select[aria-label="New player role"]') as HTMLSelectElement;
    await change(nameInput, 'Quinn');
    await change(numberInput, '7');
    await change(roleSelect, 'qb');
    await click(document.querySelector('#playbook aside[aria-label="Roster"] button[type="submit"]')!);
    const myAssignmentButton = Array.from(document.querySelectorAll('#playbook button')).find((button) => button.getAttribute('aria-label') === 'Select Quinn for my assignments');
    expect(myAssignmentButton).toBeDefined();
    await click(myAssignmentButton!);
    const assignmentsList = document.querySelector('#playbook ol[aria-label="Quinn assignments"]');
    expect(assignmentsList?.textContent ?? '').toContain('Mesh One');
    await goTo('film-room');
    const following = document.querySelector('#film-room p[aria-label="Following player"]')?.textContent;
    expect(following ?? '').toContain('Quinn');
    const dimmed = document.querySelectorAll('#film-room svg.field g.dim').length;
    expect(dimmed).toBeGreaterThan(0);
  });

  it('routes a #share=… URL to Playbook, receives the play, persists it, and clears the hash', async () => {
    const shared = { ...seededPlay, id: 'shared-play', name: 'Shared Mesh' };
    window.location.hash = encodeShareHash(shared);
    await renderApp();
    const statuses = Array.from(document.querySelectorAll('#playbook [role="status"]'));
    expect(statuses.some((element) => (element.textContent ?? '').includes('Shared play received'))).toBe(true);
    const stored = JSON.parse(localStorage.getItem('film-lab.playbook')!);
    const received = stored.plays.find((play: { id: string; name: string }) => play.id === 'shared-play');
    expect(received?.name).toBe('Shared Mesh');
    expect(window.location.hash).toBe('');
  });

  it('HJ-437 build · run · persist: set reps, replay each entry, and survive a re-mount', async () => {
    const clock = rafClock();
    try {
      // ---- BUILD the script through the playbook UI (add → reps → reorder → remove). ----
      await renderApp();
      await click(Array.from(document.querySelectorAll('#playbook button')).find((button) => button.getAttribute('aria-label') === 'Add Mesh to sequence')!);
      await click(Array.from(document.querySelectorAll('#playbook button')).find((button) => button.getAttribute('aria-label') === 'Add Shallow to sequence')!);
      await change(document.querySelector('input[aria-label="Replays for Mesh"]') as HTMLInputElement, '2');
      await click(Array.from(document.querySelectorAll('#playbook button')).find((button) => button.getAttribute('aria-label') === 'Move Shallow earlier in sequence')!);
      expect(Array.from(document.querySelectorAll('[aria-label="Sequence plays"] li')).map((li) => li.textContent?.split('↑')[0])).toEqual(['Shallow', 'Mesh']);
      await click(Array.from(document.querySelectorAll('#playbook button')).find((button) => button.getAttribute('aria-label') === 'Move Shallow later in sequence')!);
      await click(Array.from(document.querySelectorAll('#playbook button')).find((button) => button.getAttribute('aria-label') === 'Remove Shallow from sequence')!);
      expect(Array.from(document.querySelectorAll('[aria-label="Sequence plays"] li')).map((li) => li.textContent?.split('↑')[0])).toEqual(['Mesh']);
      await click(Array.from(document.querySelectorAll('#playbook button')).find((button) => button.getAttribute('aria-label') === 'Add Shallow to sequence')!);
      const stored = JSON.parse(localStorage.getItem('film-lab.playbook')!);
      expect(stored.sequence).toEqual([{ playId: 'starter-1', reps: 2 }, { playId: 'starter-3' }]);

      // ---- RUN in Film Room: the 2-rep Mesh must replay before advancing to Shallow. ----
      await goTo('film-room');
      expect(document.querySelector('#film-room h2')?.textContent).toBe('Mesh');
      expect(document.querySelector('[aria-label="Sequence position"]')?.textContent).toBe('1 of 2');
      clock.start();
      await click(Array.from(document.querySelectorAll('#film-room button')).find((button) => button.getAttribute('aria-label') === 'Play play')!);
      expect(clock.frames()).toBeGreaterThan(0);
      await act(async () => { clock.pump(25, 50); await flush(); });
      expect(document.querySelector('[aria-label="Sequence position"]')?.textContent).toBe('1 of 2');
      expect(document.querySelector('#film-room h2')?.textContent).toBe('Mesh');
      await act(async () => { clock.pump(25, 50); await flush(); });
      expect(document.querySelector('[aria-label="Sequence position"]')?.textContent).toBe('2 of 2');
      expect(document.querySelector('#film-room h2')?.textContent).toBe('Shallow');

      // ---- PERSIST: re-mount and confirm the script (entries + reps) survived. ----
      await act(async () => { root.unmount(); await flush(); });
      await renderApp();
      await goTo('playbook');
      expect(Array.from(document.querySelectorAll('[aria-label="Sequence plays"] li')).map((li) => li.textContent?.split('↑')[0])).toEqual(['Mesh', 'Shallow']);
      expect((document.querySelector('input[aria-label="Replays for Mesh"]') as HTMLInputElement).value).toBe('2');
    } finally {
      clock.stop();
    }
  });
});

function starterPlay(id: string, name: string) {
  return { id, name, duration: 1, category: 'pass', defenseLook: 'Cover 2', tags: [], notes: '', tracks: [], beats: [{ t: 0, title: 'Snap', focus: ['qb'] }], summary: { motive: '', keyDefender: '', whyItWorks: '', counter: '' } };
}
