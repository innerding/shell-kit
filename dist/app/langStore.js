// langStore — der globale, reaktive Sprach-Store (de/en) der ausgelieferten Shell.
// Generische Mechanik (localStorage 'scim-lang' + useSyncExternalStore); jede Komponente
// liest per useLang() und re-rendert beim Umschalten. Die TEXT-INHALTE (Strings) leben
// app-seitig (Runtime) und bleiben dort editierbar — nur die Mechanik wohnt hier.
import { useSyncExternalStore } from 'react';
const KEY = 'scim-lang';
let current = (() => { try {
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'de';
}
catch {
    return 'de';
} })();
const subs = new Set();
export function getLang() { return current; }
export function setLang(l) {
    if (l === current)
        return;
    current = l;
    try {
        localStorage.setItem(KEY, l);
    }
    catch { /* ignore */ }
    subs.forEach((f) => f());
}
export function useLang() {
    return useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => current, () => current);
}
