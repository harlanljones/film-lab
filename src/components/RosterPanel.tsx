import { useEffect, useRef, useState } from 'react';
import { usePlaybook } from '../storage/playbookStore';
import type { OffenseRole, RosterPlayer } from '../engine/types';
import { useSelection } from './SelectionContext';

const OFFENSE_ROLES: OffenseRole[] = ['qb', 'c', 'rb', 'wr', 'slot'];

const newPlayerId = (roster: RosterPlayer[]) => {
  let suffix = roster.length + 1;
  let id = `player-${suffix}`;
  while (roster.some((existing) => existing.id === id)) { suffix += 1; id = `player-${suffix}`; }
  return id;
};

const formatLabel = (player: RosterPlayer) => {
  const number = player.number ? `#${player.number} ` : '';
  return `${number}${player.name}${player.role ? ` · ${player.role}` : ''}`;
};

export function RosterPanel() {
  const store = usePlaybook();
  const selection = useSelection();
  const [draft, setDraft] = useState({ name: '', number: '', role: 'wr' as OffenseRole });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; number: string; role: OffenseRole }>({ name: '', number: '', role: 'wr' });
  const nameInput = useRef<HTMLInputElement>(null);
  useEffect(() => { if (store.roster.length === 0) setDraft((current) => current.name ? current : { name: '', number: '', role: 'wr' }); }, [store.roster.length]);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) return;
    const number = Number(draft.number);
    const player: RosterPlayer = { id: newPlayerId(store.roster), name, role: draft.role, ...(Number.isFinite(number) && draft.number.trim() ? { number } : {}) };
    store.addRosterPlayer(player);
    setDraft({ name: '', number: '', role: draft.role });
    nameInput.current?.focus();
  };
  const beginEdit = (player: RosterPlayer) => { setEditingId(player.id); setEditDraft({ name: player.name, number: player.number?.toString() ?? '', role: player.role ?? 'wr' }); };
  const saveEdit = (id: string) => {
    const name = editDraft.name.trim();
    if (!name) return;
    const number = Number(editDraft.number);
    store.updateRosterPlayer(id, { name, role: editDraft.role, ...(Number.isFinite(number) && editDraft.number.trim() ? { number } : {}) });
    setEditingId(null);
  };
  return <aside aria-label="Roster">
    <h3>Roster</h3>
    {store.roster.length === 0 ? <p role="status">No players yet. Add a player below to enable personal assignments.</p> : (
      <ul aria-label="Roster players">{store.roster.map((player) => <li key={player.id}>
        {editingId === player.id ? (
          <form onSubmit={(event) => { event.preventDefault(); saveEdit(player.id); }} className="roster-edit">
            <label>Name <input aria-label={`Edit name for ${player.name}`} value={editDraft.name} onChange={(event) => setEditDraft((current) => ({ ...current, name: event.target.value }))} /></label>
            <label>Number <input aria-label={`Edit number for ${player.name}`} type="number" inputMode="numeric" value={editDraft.number} onChange={(event) => setEditDraft((current) => ({ ...current, number: event.target.value }))} /></label>
            <label>Role <select aria-label={`Edit role for ${player.name}`} value={editDraft.role} onChange={(event) => setEditDraft((current) => ({ ...current, role: event.target.value as OffenseRole }))}>{OFFENSE_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
            <div className="controls"><button type="submit">Save</button><button type="button" onClick={() => setEditingId(null)}>Cancel</button></div>
          </form>
        ) : (
          <div className="roster-row">
            <span>{formatLabel(player)}</span>
            <div className="controls">
              <button type="button" aria-label={`Select ${player.name} for my assignments`} aria-pressed={selection.playerId === player.id} onClick={() => selection.select(selection.playerId === player.id ? null : player.id)}>{selection.playerId === player.id ? 'Selected' : 'My assignment'}</button>
              <button type="button" aria-label={`Edit ${player.name}`} onClick={() => beginEdit(player)}>Edit</button>
              <button type="button" aria-label={`Remove ${player.name}`} onClick={() => { store.removeRosterPlayer(player.id); if (selection.playerId === player.id) selection.select(null); }}>Remove</button>
            </div>
          </div>
        )}
      </li>)}</ul>
    )}
    <form onSubmit={submit} className="roster-add" aria-label="Add player to roster">
      <label>Name <input ref={nameInput} aria-label="New player name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></label>
      <label>Number <input aria-label="New player number" type="number" inputMode="numeric" value={draft.number} onChange={(event) => setDraft((current) => ({ ...current, number: event.target.value }))} /></label>
      <label>Role <select aria-label="New player role" value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as OffenseRole }))}>{OFFENSE_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
      <button type="submit" disabled={!draft.name.trim()}>Add player</button>
    </form>
  </aside>;
}
