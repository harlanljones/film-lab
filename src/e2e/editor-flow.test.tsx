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
});
