// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { PreviewBanner } from '../PreviewBanner';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  root?.unmount();
  container?.remove();
  window.history.replaceState({}, '', '/');
});

async function renderBanner() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(<PreviewBanner />);
    await flush();
  });
}

describe('PreviewBanner', () => {
  it('renders nothing when there is no ?preview param', async () => {
    window.history.replaceState({}, '', '/');
    await renderBanner();
    expect(container.querySelector('.preview-banner')).toBeNull();
  });

  it('renders a visible banner when ?preview=<sha> is present', async () => {
    window.history.replaceState({}, '', '/?preview=abcdef1234567890');
    await renderBanner();
    const banner = container.querySelector('.preview-banner');
    expect(banner).not.toBeNull();
    expect(banner?.getAttribute('role')).toBe('status');
    expect(banner?.textContent).toContain('not production');
    expect(banner?.textContent).toContain('abcdef1');
  });
});
