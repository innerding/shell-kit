// langStore — der globale, reaktive Sprach-Store (de/en) der ausgelieferten Shell.
// Generische Mechanik (localStorage 'scim-lang' + useSyncExternalStore); jede Komponente
// liest per useLang() und re-rendert beim Umschalten. Die TEXT-INHALTE (Strings) leben
// app-seitig (Runtime) und bleiben dort editierbar — nur die Mechanik wohnt hier.
import { useSyncExternalStore } from 'react';

export type Lang = 'de' | 'en';

const KEY = 'scim-lang';
let current: Lang = (() => { try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'de'; } catch { return 'de'; } })();
const subs = new Set<() => void>();

export function getLang(): Lang { return current; }
export function setLang(l: Lang): void {
  if (l === current) return;
  current = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  subs.forEach((f) => f());
}
export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => { subs.delete(cb); }; },
    () => current, () => current,
  );
}
