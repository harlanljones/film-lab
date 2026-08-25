import { useState } from 'react';
import { usePlaybook } from '../storage/playbookStore';

export function StorageAlert() {
  const store = usePlaybook();
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const showReminder = !reminderDismissed && store.plays.length > 0;
  return <aside aria-label="Storage status">
    {store.error && <p role="alert">{store.error}</p>}
    {showReminder && <p role="status">Plays are stored locally in this browser. Export them periodically so they are never lost.</p>}
    {showReminder && <button onClick={() => setReminderDismissed(true)}>Dismiss reminder</button>}
  </aside>;
}