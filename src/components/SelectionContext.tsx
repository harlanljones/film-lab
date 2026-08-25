import { createContext, createElement, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type SelectionStore = { playerId: string | null; select: (id: string | null) => void };

const SelectionContext = createContext<SelectionStore | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const select = useCallback((id: string | null) => setPlayerId(id), []);
  const value = useMemo(() => ({ playerId, select }), [playerId, select]);
  return createElement(SelectionContext.Provider, { value }, children);
}

export function useSelection(): SelectionStore {
  const context = useContext(SelectionContext);
  if (!context) throw new Error('useSelection must be used within SelectionProvider');
  return context;
}
