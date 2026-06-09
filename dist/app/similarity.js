// POI-Ähnlichkeit (B1, Stufe-3-Tausch) — reine Kategorie-Logik, kein DOM/Leaflet.
//
// Jeder POI trägt eine `subcategory` (z. B. "Points_historical", "Square_Move",
// "Transport_Parking"). Die HAUPTKATEGORIE (Bucket) ist der Präfix vor dem "_"
// (Points, Square, Regenerate, Service, Transport) — kein eigenes Feld nötig.
//
// Ähnlichkeitsstufen (höher = ähnlicher): 3 gleiche Subkategorie · 2 gleiche
// Hauptkategorie (zwei Subs einer Hauptkat) · 1 äquivalente Hauptkategorie ·
// 0 unähnlich. NUR direkte Äquivalenz-Paare (keine Transitivität).
/** Hauptkategorie (Bucket) = Präfix vor dem ersten "_"; sonst die Subkategorie selbst. */
export function bucketOf(subcategory) {
    const i = subcategory.indexOf('_');
    return i < 0 ? subcategory : subcategory.slice(0, i);
}
// Äquivalente Hauptkategorien (symmetrisch, NUR direkte Paare — erweiterbar):
// Points≡Square · Square≡Regenerate · Transport≡Service.
export const BUCKET_EQUIVALENCE = {
    Points: ['Square'],
    Square: ['Points', 'Regenerate'],
    Regenerate: ['Square'],
    Transport: ['Service'],
    Service: ['Transport'],
};
/** Sind zwei Hauptkategorien gleich oder direkt äquivalent? */
export function bucketsSimilar(a, b) {
    return a === b || (BUCKET_EQUIVALENCE[a]?.includes(b) ?? false);
}
/** Ähnlichkeitsstufe zweier Subkategorien (0..3). */
export function similarityTier(subA, subB) {
    if (subA === subB)
        return 3;
    const ba = bucketOf(subA), bb = bucketOf(subB);
    if (ba === bb)
        return 2;
    if (BUCKET_EQUIVALENCE[ba]?.includes(bb))
        return 1;
    return 0;
}
