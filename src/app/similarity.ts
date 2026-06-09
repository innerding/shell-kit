// poi-circus-kinship (B1) — die „Verwandtschafts-Nummer" des POI-Dompteurs:
// reine Kategorie-Logik (kein DOM/Leaflet). Bewusst DESKRIPTIV gehalten
// (bucketOf/similarityTier), damit die Helfer für sich lesbar bleiben.
//
// Jeder POI trägt eine `subcategory` (z. B. "Points_historical", "Square_Move",
// "Transport_Parking"). Die HAUPTKATEGORIE (Bucket) ist der Präfix vor dem "_"
// (Points, Square, Regenerate, Service, Transport) — kein eigenes Feld nötig.
//
// Ähnlichkeitsstufen (höher = ähnlicher): 3 gleiche Subkategorie · 2 gleiche
// Hauptkategorie (zwei Subs einer Hauptkat) · 1 äquivalente Hauptkategorie ·
// 0 unähnlich. NUR direkte Äquivalenz-Paare (keine Transitivität).

export type SimilarityTier = 0 | 1 | 2 | 3;

/** Hauptkategorie (Bucket) = Präfix vor dem ersten "_"; sonst die Subkategorie selbst. */
export function bucketOf(subcategory: string): string {
  const i = subcategory.indexOf('_');
  return i < 0 ? subcategory : subcategory.slice(0, i);
}

// Äquivalente Hauptkategorien (symmetrisch, NUR direkte Paare — erweiterbar):
// Points≡Square · Square≡Regenerate · Transport≡Service.
export const BUCKET_EQUIVALENCE: Record<string, readonly string[]> = {
  Points: ['Square'],
  Square: ['Points', 'Regenerate'],
  Regenerate: ['Square'],
  Transport: ['Service'],
  Service: ['Transport'],
};

/** Sind zwei Hauptkategorien gleich oder direkt äquivalent? */
export function bucketsSimilar(a: string, b: string): boolean {
  return a === b || (BUCKET_EQUIVALENCE[a]?.includes(b) ?? false);
}

/** Ähnlichkeitsstufe zweier Subkategorien (0..3). */
export function similarityTier(subA: string, subB: string): SimilarityTier {
  if (subA === subB) return 3;
  const ba = bucketOf(subA), bb = bucketOf(subB);
  if (ba === bb) return 2;
  if (BUCKET_EQUIVALENCE[ba]?.includes(bb)) return 1;
  return 0;
}
