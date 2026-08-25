import { useEffect, useMemo, useRef, useState } from 'react';
import { exportPlaybook, importPlaybook, planImport, usePlaybook, type ImportBucket, type ImportCandidate, type ImportPlan } from '../storage/playbookStore';
import { starterLibrary } from '../data/library';
import type { Play } from '../engine/types';
import { Field7 } from './Field7';
import { createShareUrl, decodeShareHash } from '../storage/share';
import { RosterPanel } from './RosterPanel';
import { AssignmentPicker } from './AssignmentPicker';

type SortKey = 'name' | 'defenseLook' | 'category';

const BUCKET_LABELS: Record<ImportBucket, string> = { new: 'New', updated: 'Updated', unchanged: 'Unchanged', invalid: 'Invalid' };
const entryKey = (entry: ImportCandidate, index: number) => entry.bucket === 'invalid' ? `invalid-${entry.id}-${index}` : `${entry.play.id}-${index}`;
const entryName = (entry: ImportCandidate) => entry.bucket === 'invalid' ? (entry.name || entry.id || 'Unnamed play') : entry.play.name;

const SYSTEM_TAGS = new Set(starterLibrary.flatMap((play) => play.tags));
const groupsOf = (play: Play) => play.tags.filter((value) => !SYSTEM_TAGS.has(value));

export function PlaybookView() {
  const store = usePlaybook();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [look, setLook] = useState('all');
  const [tag, setTag] = useState('all');
  const [group, setGroup] = useState('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash.startsWith('#share=')) return;
    try {
      const shared = decodeShareHash(window.location.hash);
      store.add(shared);
      store.select(shared);
      setShareMessage(`Shared play received: ${shared.name}`);
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Share link rejected');
    }
  }, [store.add, store.select]);
  const plays = useMemo(() => {
    const byId = new Map(starterLibrary.map((play) => [play.id, play]));
    for (const play of store.plays) byId.set(play.id, play);
    return [...byId.values()].filter((play) => !hiddenIds.includes(play.id));
  }, [hiddenIds, store.plays]);
  const options = useMemo(() => ({
    categories: [...new Set(plays.map((play) => play.category))].sort(),
    looks: [...new Set(plays.map((play) => play.defenseLook))].sort(),
    tags: [...new Set(plays.flatMap((play) => play.tags))].sort(),
    groups: [...new Set(plays.flatMap(groupsOf))].sort(),
  }), [plays]);
  const filtered = useMemo(() => plays.filter((play) => {
    const text = `${play.name} ${play.category} ${play.defenseLook} ${play.tags.join(' ')}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (category === 'all' || play.category === category) && (look === 'all' || play.defenseLook === look) && (tag === 'all' || play.tags.includes(tag)) && (group === 'all' || groupsOf(play).includes(group));
  }).sort((a, b) => a[sort].localeCompare(b[sort]) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id)), [category, group, look, plays, query, sort, tag]);
  const download = (content: string, name: string) => {
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url);
  };
  const openImport = async (file: File) => {
    try {
      const nextPlan = planImport(await file.text(), store.plays);
      setPlan(nextPlan); setError(null);
      setPicked(nextPlan.entries.flatMap((entry, index) => entry.bucket === 'new' || entry.bucket === 'updated' ? [index] : []));
    } catch (cause) { setPlan(null); setPicked([]); setError(cause instanceof Error ? cause.message : 'Import rejected'); }
  };
  const closePreview = () => { setPlan(null); setPicked([]); };
  const togglePick = (index: number, checked: boolean) => setPicked((current) => checked ? [...current, index] : current.filter((value) => value !== index));
  const selectedPlays = useMemo(() => plan ? [...picked].sort((a, b) => a - b).flatMap((index) => {
    const entry = plan.entries[index];
    return entry && entry.bucket !== 'invalid' ? [entry.play] : [];
  }) : [], [picked, plan]);
  const duplicate = (play: Play) => {
    let suffix = 1; let id = `${play.id}-copy-${suffix}`;
    while (plays.some((candidate) => candidate.id === id)) id = `${play.id}-copy-${++suffix}`;
    store.add({ ...play, id, name: `${play.name} copy`, tags: [...play.tags] });
  };
  const rename = (play: Play) => {
    const next = typeof window !== 'undefined' ? window.prompt('Rename play', play.name) : null;
    if (next?.trim()) store.upsert({ ...play, name: next.trim() });
  };
  const addToGroup = (play: Play) => {
    const next = typeof window !== 'undefined' ? window.prompt('Add to group(s), comma-separated', groupsOf(play).join(', ')) : null;
    const groups = next?.split(',').map((value) => value.trim()).filter(Boolean) ?? [];
    if (groups.length) store.upsert({ ...play, tags: [...new Set([...play.tags, ...groups])] });
  };
  const removeFromGroup = (play: Play, group: string) => store.upsert({ ...play, tags: play.tags.filter((value) => value !== group) });
  const share = async (play: Play) => {
    try {
      const url = createShareUrl(play, window.location.href);
      if (navigator.clipboard) await navigator.clipboard.writeText(url);
      setShareMessage(navigator.clipboard ? 'Share link copied to clipboard.' : url);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create share link'); }
  };
  const remove = (play: Play) => {
    if (deleteId !== play.id) { setDeleteId(play.id); return; }
    store.remove(play.id); setHiddenIds((ids) => ids.includes(play.id) ? ids : [...ids, play.id]); setDeleteId(null);
  };
  const byId = useMemo(() => new Map(plays.map((play) => [play.id, play])), [plays]);
  const sequencePlays = store.sequence.map((item) => byId.get(item.playId)).filter((play): play is Play => Boolean(play));
  const inSequence = (id: string) => store.sequence.some((item) => item.playId === id);
  const addToSequence = (play: Play) => store.setSequence(inSequence(play.id) ? store.sequence : [...store.sequence, { playId: play.id }]);
  const removeFromSequence = (id: string) => store.setSequence(store.sequence.filter((item) => item.playId !== id));
  const moveSequence = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= store.sequence.length) return;
    const next = [...store.sequence];
    [next[index], next[target]] = [next[target], next[index]];
    store.setSequence(next);
  };
  return <section aria-label="Playbook">
    <h2>Playbook</h2>
    <div className="controls playbook-filters">
      <input aria-label="Search plays" placeholder="Search plays" value={query} onChange={(event) => setQuery(event.target.value)} />
      <label>Category <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{options.categories.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Defense <select aria-label="Filter by defensive look" value={look} onChange={(event) => setLook(event.target.value)}><option value="all">All looks</option>{options.looks.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Tag <select aria-label="Filter by tag" value={tag} onChange={(event) => setTag(event.target.value)}><option value="all">All tags</option>{options.tags.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Group <select aria-label="Filter by group" value={group} onChange={(event) => setGroup(event.target.value)}><option value="all">All groups</option>{options.groups.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Sort <select aria-label="Sort plays" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}><option value="name">Name</option><option value="defenseLook">Defense</option><option value="category">Category</option></select></label>
    </div>
    <div className="controls">
      <button onClick={() => download(exportPlaybook(filtered), 'film-lab-playbook.json')}>Export filtered ({filtered.length})</button>
      <button onClick={() => fileInput.current?.click()}>Import JSON</button>
      <input ref={fileInput} hidden aria-label="Import JSON file" type="file" accept="application/json" onChange={async (event) => { const file = event.target.files?.[0]; if (file) await openImport(file); event.target.value = ''; }} />
    </div>
    {error && <p role="alert">{error}</p>}
    {shareMessage && <p role="status">{shareMessage}</p>}
    {plan && <aside role="dialog" aria-label="Import preview"><h3>Import preview</h3><p role="status">{plan.counts.new} new · {plan.counts.updated} updated · {plan.counts.unchanged} unchanged · {plan.counts.invalid} invalid.</p><ul aria-label="Import plan">{plan.entries.map((entry, index) => entry.bucket === 'invalid' ? <li key={entryKey(entry, index)}><span>{entryName(entry)}</span> <span>{BUCKET_LABELS[entry.bucket]}</span><ul aria-label={`Problems for ${entryName(entry)}`}>{entry.problems.map((problem) => <li key={problem}>{problem}</li>)}</ul></li> : <li className="controls" key={entryKey(entry, index)}><input type="checkbox" checked={picked.includes(index)} onChange={(event) => togglePick(index, event.target.checked)} aria-label={`${BUCKET_LABELS[entry.bucket]}: ${entry.play.name}`} /><span>{BUCKET_LABELS[entry.bucket]}</span><span>{entry.play.name}</span></li>)}</ul><div className="controls"><button disabled={selectedPlays.length === 0} onClick={() => { store.save(importPlaybook(exportPlaybook(selectedPlays), store.plays)); closePreview(); }}>Apply selected ({selectedPlays.length})</button><button disabled={selectedPlays.length === 0} onClick={() => { store.save(selectedPlays); closePreview(); }}>Replace with selected</button><button onClick={closePreview}>Cancel</button></div></aside>}
    <div className="roster-and-assignments"><RosterPanel /><AssignmentPicker /></div>
    <aside aria-label="Film sequence editor"><h3>Film sequence</h3>{sequencePlays.length === 0 ? <p role="status">No plays in the sequence. Add plays below to build a scripted Film Room session.</p> : <ol aria-label="Sequence plays">{sequencePlays.map((play, index) => <li key={play.id}>{play.name}<div className="controls"><button aria-label={`Move ${play.name} earlier in sequence`} onClick={() => moveSequence(index, -1)} disabled={index === 0}>↑</button><button aria-label={`Move ${play.name} later in sequence`} onClick={() => moveSequence(index, 1)} disabled={index === sequencePlays.length - 1}>↓</button><button aria-label={`Remove ${play.name} from sequence`} onClick={() => removeFromSequence(play.id)}>Remove</button></div></li>)}</ol>}<div className="controls"><button aria-label="Clear the film sequence" onClick={() => store.setSequence([])}>Clear sequence</button><a href="#film-room" aria-label="Watch the sequence in Film Room">Watch sequence in Film Room</a></div></aside>
    {filtered.length === 0 ? <p role="status">No plays match these filters. Try clearing the search or filters.</p> : <div className="cards">{filtered.map((play) => <article className="card" key={play.id}><Field7 tracks={play.tracks} className="thumb-field" aria-label={`${play.name} thumbnail`} /><h3>{play.name}</h3><p>{play.category} · {play.defenseLook}</p><p>{play.tags.join(' · ')}</p><div className="controls">{groupsOf(play).map((value) => <button key={value} aria-label={`Remove ${play.name} from group ${value}`} onClick={() => removeFromGroup(play, value)}>{value} ✕</button>)}<button aria-label={`Add ${play.name} to group`} onClick={() => addToGroup(play)}>+ Group</button></div><div className="controls"><a href="#editor" onClick={() => store.select(play)}>Open in Editor</a><a href="#film-room" onClick={() => store.select(play)}>Watch in Film Room</a><button onClick={() => share(play)}>Share link</button><button onClick={() => rename(play)}>Rename</button><button onClick={() => duplicate(play)}>Duplicate</button><button onClick={() => download(exportPlaybook([play]), `${play.id}.json`)}>Export</button><button aria-pressed={inSequence(play.id)} aria-label={inSequence(play.id) ? `Remove ${play.name} from sequence` : `Add ${play.name} to sequence`} onClick={() => addToSequence(play)}>{inSequence(play.id) ? 'In sequence' : 'Add to sequence'}</button><button onClick={() => remove(play)}>{deleteId === play.id ? 'Confirm delete' : 'Delete'}</button></div></article>)}</div>}
  </section>;
}
