// @vitest-environment jsdom
import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { QuizView } from '../QuizView';
import { PlaybookProvider, SCHEMA_VERSION, savePlaybook } from '../../storage/playbookStore';
import { SelectionProvider, useSelection } from '../SelectionContext';
import { seededPlay } from '../../data/seededPlay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const dispatch = (target: EventTarget, event: Event) => target.dispatchEvent(event);

async function renderView(node: React.ReactNode) {
  await act(async () => { root = createRoot(container); root.render(<PlaybookProvider><SelectionProvider>{node}</SelectionProvider></PlaybookProvider>); await flush(); });
}

async function click(target: Element) {
  await act(async () => { dispatch(target, new MouseEvent('click', { bubbles: true })); await flush(); });
}

async function selectOption(selector: string, value: string) {
  const el = container.querySelector<HTMLSelectElement>(selector)!;
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')?.set;
    setter?.call(el, value);
    dispatch(el, new Event('input', { bubbles: true }));
    dispatch(el, new Event('change', { bubbles: true }));
    await flush();
  });
}

const trails = () => [...container.querySelectorAll('polyline.route-trail')];
const truncatedCount = () => trails().filter((trail) => !(trail.getAttribute('points') ?? '').includes(' ')).length;

function PickPlayer({ id }: { id: string }) {
  const selection = useSelection();
  useEffect(() => { selection.select(id); }, [id, selection.select]);
  return null;
}

describe('QuizView', () => {
  beforeAll(() => {
    globalThis.requestAnimationFrame = (() => 0) as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = (() => {}) as typeof cancelAnimationFrame;
  });
  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.append(container);
  });
  afterEach(async () => {
    await act(async () => { root.unmount(); await flush(); });
    container.remove();
  });

  it('freezes the field at the snap and hides only the guessed route until reveal', async () => {
    savePlaybook({ schemaVersion: SCHEMA_VERSION, plays: [seededPlay], sequence: [], roster: [] });
    await renderView(<QuizView />);
    expect(container.querySelector('section[aria-label="Quiz"]')).not.toBeNull();
    const revealButton = container.querySelector('button[aria-label="Reveal route and play animation"]');
    expect(revealButton).not.toBeNull();
    expect(trails().length).toBe(seededPlay.tracks.length);
    expect(truncatedCount()).toBe(1);
    await click(revealButton!);
    expect(truncatedCount()).toBe(0);
    expect(container.querySelector('button[aria-label="Hide route and try again"]')).not.toBeNull();
  });

  it('re-hides the route when the guessed track changes', async () => {
    savePlaybook({ schemaVersion: SCHEMA_VERSION, plays: [seededPlay], sequence: [], roster: [] });
    await renderView(<QuizView />);
    await click(container.querySelector('button[aria-label="Reveal route and play animation"]')!);
    expect(truncatedCount()).toBe(0);
    await selectOption('select[aria-label="Route to guess"]', 'wr2');
    expect(truncatedCount()).toBe(1);
    expect(container.querySelector('button[aria-label="Reveal route and play animation"]')).not.toBeNull();
  });

  it('keeps an optional running self-score after reveal', async () => {
    savePlaybook({ schemaVersion: SCHEMA_VERSION, plays: [seededPlay], sequence: [], roster: [] });
    await renderView(<QuizView />);
    await click(container.querySelector('button[aria-label="Reveal route and play animation"]')!);
    await click(container.querySelector('button[aria-label="Mark route correct"]')!);
    expect(container.querySelector('[aria-label="Self-score"]')?.textContent).toContain('Score: 1/1');
    await click(container.querySelector('button[aria-label="Mark route missed"]')!);
    expect(container.querySelector('[aria-label="Self-score"]')?.textContent).toContain('Score: 1/2');
  });

  it('defaults the guessed route to the selected player via the v4 role assignment', async () => {
    savePlaybook({ schemaVersion: SCHEMA_VERSION, plays: [seededPlay], sequence: [], roster: [{ id: 'parker', name: 'Parker', number: 12, role: 'qb' }] });
    await renderView(<><PickPlayer id="parker" /><QuizView /></>);
    const select = container.querySelector<HTMLSelectElement>('select[aria-label="Route to guess"]')!;
    expect(select.value).toBe('qb');
    expect(container.querySelector('p[aria-label="Assignment status"]')?.textContent).toContain("Parker's assignment · role");
  });
});
