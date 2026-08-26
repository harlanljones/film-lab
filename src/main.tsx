import { StrictMode, useEffect, useState, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { FilmRoom } from './components/FilmRoom';
import { PlaybookView } from './components/PlaybookView';
import { EditorView } from './components/EditorView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StorageAlert } from './components/StorageAlert';
import { CompareView } from './components/CompareView';
import { QuizView } from './components/QuizView';
import { WristbandView } from './components/WristbandCard';
import { PreviewBanner } from './components/PreviewBanner';
import { PlaybookProvider } from './storage/playbookStore';
import { SelectionProvider } from './components/SelectionContext';
import { rolloutOnLoad, initWebAnalyticsBeacon } from './storage/analytics';
import './style.css';

type Route = 'editor' | 'playbook' | 'film-room' | 'compare' | 'quiz' | 'wristband';

const ROUTE_IDS: readonly Route[] = ['editor', 'playbook', 'film-room', 'compare', 'quiz', 'wristband'];

const NAV_ITEMS: readonly { id: Route; label: string }[] = [
  { id: 'editor', label: 'Editor' },
  { id: 'playbook', label: 'Playbook' },
  { id: 'film-room', label: 'Film Room' },
  { id: 'compare', label: 'Compare' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'wristband', label: 'Wristband' },
];

// Hash routing keeps the app local-first and preserves the documented URL-hash
// share/deep-link reload behavior without adding a routing dependency. Unknown,
// empty, or "#share=..." hashes resolve to the default (playbook) route so the
// share-receive handler in PlaybookView still runs.
function parseRoute(hash: string): Route {
  const candidate = hash.replace(/^#/, '');
  return ROUTE_IDS.includes(candidate as Route) ? (candidate as Route) : 'playbook';
}

const VIEWS: Record<Route, () => ReactElement> = {
  editor: () => <ErrorBoundary><EditorView /></ErrorBoundary>,
  playbook: () => <ErrorBoundary><PlaybookView /></ErrorBoundary>,
  'film-room': () => <ErrorBoundary><FilmRoom /></ErrorBoundary>,
  compare: () => <ErrorBoundary><CompareView /></ErrorBoundary>,
  quiz: () => <ErrorBoundary><QuizView /></ErrorBoundary>,
  wristband: () => <ErrorBoundary><WristbandView /></ErrorBoundary>,
};

function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => {
    try { window.scrollTo(0, 0); } catch { /* no-op in test harnesses */ }
  }, [route]);
  return route;
}

export function App() {
  const route = useHashRoute();
  return <PlaybookProvider><SelectionProvider><main><PreviewBanner /><a className="skip" href="#content">Skip to content</a><nav aria-label="Primary">{NAV_ITEMS.map((item) => <a key={item.id} href={`#${item.id}`} aria-current={route === item.id ? 'page' : undefined}>{item.label}</a>)}</nav><StorageAlert /><p className="eyebrow">FILM LAB</p><h1>Draw the play.<br />See the picture.</h1><p className="lede">A local-first 7-on-7 playbook for coaches.</p><div id="content" tabIndex={-1}><div id={route}>{VIEWS[route]()}</div></div></main></SelectionProvider></PlaybookProvider>;
}

const rootElement = document.getElementById('root');
rolloutOnLoad();
initWebAnalyticsBeacon();
if (rootElement) createRoot(rootElement).render(<StrictMode><App /></StrictMode>);
