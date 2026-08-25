// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../../main';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

async function renderApp() {
  await act(async () => { root = createRoot(container); root.render(<App />); await flush(); });
}

describe('StorageAlert', () => {
  beforeEach(() => { localStorage.clear(); container = document.createElement('div'); document.body.append(container); });
  afterEach(async () => { await act(async () => { root.unmount(); await flush(); }); container.remove(); });

  it('surfaces no error or reminder on an empty playbook', async () => {
    await renderApp();
    expect(document.querySelector('[role="alert"]')?.textContent ?? '').not.toContain('Unable to save');
    expect(document.querySelector('[aria-label="Storage status"]')?.textContent ?? '').not.toContain('stored locally');
  });
});