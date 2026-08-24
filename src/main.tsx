import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FilmRoom } from './components/FilmRoom';
import { PlaybookView } from './components/PlaybookView';
import { EditorView } from './components/EditorView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PlaybookProvider } from './storage/playbookStore';
import './style.css';

export function App() {
  return <PlaybookProvider><main><a className="skip" href="#editor">Skip to editor</a><nav aria-label="Primary"><a href="#editor">Editor</a><a href="#playbook">Playbook</a><a href="#film-room">Film Room</a></nav><p className="eyebrow">FILM LAB</p><h1>Draw the play.<br />See the picture.</h1><p className="lede">A local-first 7-on-7 playbook for coaches.</p><div id="editor"><ErrorBoundary><EditorView /></ErrorBoundary></div><div id="playbook"><ErrorBoundary><PlaybookView /></ErrorBoundary></div><div id="film-room"><ErrorBoundary><FilmRoom /></ErrorBoundary></div></main></PlaybookProvider>;
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<StrictMode><App /></StrictMode>);
