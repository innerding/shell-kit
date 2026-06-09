export type SimilarityTier = 0 | 1 | 2 | 3;
/** Hauptkategorie (Bucket) = Präfix vor dem ersten "_"; sonst die Subkategorie selbst. */
export declare function bucketOf(subcategory: string): string;
export declare const BUCKET_EQUIVALENCE: Record<string, readonly string[]>;
/** Sind zwei Hauptkategorien gleich oder direkt äquivalent? */
export declare function bucketsSimilar(a: string, b: string): boolean;
/** Ähnlichkeitsstufe zweier Subkategorien (0..3). */
export declare function similarityTier(subA: string, subB: string): SimilarityTier;
