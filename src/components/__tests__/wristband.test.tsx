// @vitest-environment jsdom
import { useEffect } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WristbandCard, WristbandView } from '../WristbandCard';
import { PLAYBOOK_KEY, PlaybookProvider, SCHEMA_VERSION, savePlaybook } from '../../storage/playbookStore';
import { SelectionProvider, useSelection } from '../SelectionContext';
import { seededPlay } from '../../data/seededPlay';
import type { RosterPlayer } from '../../engine/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function SelectPlayer({ playerId }: { playerId: string }) {
  const { playerId: current, select } = useSelection();
  useEffect(() => { if (current !== playerId) select(playerId); }, [current, playerId, select]);
  return null;
}

async function renderView(node: React.ReactNode) {
  await act(async () => { root = createRoot(container); root.render(node); await flush(); });
}

describe('Wristband cards', () => {
  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.append(container);
  });
  afterEach(async () => {
    await act(async () => { root.unmount(); await flush(); });
    container.remove();
  });

  it('renders a single card describing the bound route in words and a field thumbnail', () => {
    const player: RosterPlayer = { id: 'maya', name: 'Maya', number: 7, role: 'wr' };
    root = createRoot(container);
    act(() => { root.render(<WristbandCard play={seededPlay} player={player} />); });
    const card = container.querySelector('article.wristband-card');
    expect(card?.textContent).toContain('Maya');
    expect(card?.textContent).toContain('Mesh');
    expect(card?.textContent).toContain('Wide receiver');
    expect(card?.querySelector('svg.field.thumb-field')).not.toBeNull();
  });

  it('guides the coach when no roster exists', async () => {
    savePlaybook({ schemaVersion: SCHEMA_VERSION, plays: [seededPlay], sequence: [], roster: [] });
    await renderView(<PlaybookProvider><SelectionProvider><WristbandView /></SelectionProvider></PlaybookProvider>);
    expect(container.querySelector('section[aria-label="Wristband cards"]')?.textContent).toContain('Add players');
  });

  it('lists one card per play for the selected player', async () => {
    const player: RosterPlayer = { id: 'maya', name: 'Maya', number: 7, role: 'wr' };
    savePlaybook({ schemaVersion: SCHEMA_VERSION, plays: [seededPlay], sequence: [], roster: [player] });
    await renderView(<PlaybookProvider><SelectionProvider><WristbandView /><SelectPlayer playerId="maya" /></SelectionProvider></PlaybookProvider>);
    const grid = container.querySelector('div.wristband-grid');
    expect(grid?.querySelectorAll('article.wristband-card')).toHaveLength(1);
    expect(grid?.textContent).toContain('Maya');
    expect(grid?.textContent).toContain('Wide receiver');
  });

  it('lists one card per roster player bound to the selected play in play-roster mode', async () => {
    const roster: RosterPlayer[] = [
      { id: 'p-qb', name: 'Quinn', number: 7, role: 'qb' },
      { id: 'p-wr', name: 'Wren', number: 11, role: 'wr' },
      { id: 'p-slot', name: 'Sora', number: 18, role: 'slot' },
      { id: 'p-rb', name: 'River', number: 25, role: 'rb' },
    ];
    savePlaybook({ schemaVersion: SCHEMA_VERSION, plays: [seededPlay], sequence: [], roster });
    await renderView(<PlaybookProvider><SelectionProvider><WristbandView /></SelectionProvider></PlaybookProvider>);
    const rosterButton = container.querySelector('button[aria-label="Show cards for the selected play roster"]')!;
    await act(async () => { rosterButton.dispatchEvent(new MouseEvent('click', { bubbles: true })); await flush(); });
    const cards = container.querySelectorAll('article.wristband-card');
    expect(cards).toHaveLength(4);
    expect(Array.from(cards).some((card) => card.textContent?.includes('Quinn'))).toBe(true);
    expect(Array.from(cards).some((card) => card.textContent?.includes('Wren'))).toBe(true);
    const stored = JSON.parse(localStorage.getItem(PLAYBOOK_KEY)!);
    expect(stored.roster).toHaveLength(4);
  });
});
