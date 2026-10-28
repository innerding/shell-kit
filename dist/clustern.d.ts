/**
 * ── DAS CLUSTERN AUF DEN FIXSTERN (25.10.2026, border-mesh-point Blatt 125, Schritt zwei, sein „ja, bau es") ──
 *
 * Hierher gezogen am 28.10.2026 aus o-o-o-o.app src/cluster.ts, wörtlich (Blatt 131, sein „1. ja 2. ja 3. ja, bau es"): eine
 * Rechnung für o-o-o-o.app und SCIM4. Das alte shell-kit/cluster bleibt für die alte Ziel-App.
 *
 * Die Rechnung aus SCIM3, fast wörtlich (shell-kit src/app/render.ts mergeOverlapping, src/app/cluster.ts renderClusterPois),
 * ohne Zeichnen: in Pixeln, bei jedem Zeichnen der Karte neu. Je Cluster seine Mitglieder; näher als ein Icon verschmelzen sie,
 * nach ihrer Zahl gewichtet; näher als zwei Icons kündigt ein Ring es an, in der Mitte zwischen beiden.
 *
 * ⚠ ABGEWANDELT, sein Wort: „Der Ghost hat die coord gespendet, heute soll genau das der Fixstern machen." Es gibt keinen Ghost
 * als eigenen Punkt. Was verschmilzt, steht am Fixstern seiner Ausdehnung, als ihr Cluster-Icon; in SCIM3 stand der Ghost an
 * der dichtesten Ballung. Ein Cluster ohne Fixstern, und der Cluster der gewählten Ausdehnung, sammelt nicht ein — sein Wort zur
 * gewählten: „auch in diesem Fall könnte es noch Vor-cluster geben, die dann aber nicht mehr den Fokus triggern, sondern normal
 * sind" —; dort steht nur die Ankündigung.
 */
/** Wie in SCIM3: das Icon 30 Pixel, verschluckt unter einem Icon, angekündigt unter zweien; das Zeichen am Fixstern 34 bis 56. */
export declare const ICON = 30;
export declare const SCHLUCKEN = 30;
export declare const ANKUENDIGEN: number;
export declare const STERN_MIN = 34;
export declare const STERN_MAX = 56;
export interface Ballung<T> {
    x: number;
    y: number;
    mitglieder: T[];
}
/** SCIM3 mergeOverlapping: verschmelzen, solange zwei näher als `schlucken` stehen; die Lage nach der Zahl gewichtet. */
export declare function verschmelzen<T>(start: Ballung<T>[], schlucken: number): Ballung<T>[];
export interface Mitglied {
    token: string;
    x: number;
    y: number;
    /** Der Cluster, die Ausdehnung des Punkts; ohne steht er einzeln. */
    cluster?: string;
}
export interface Geclustert {
    /** Die Tokens der Punkte, die eingesammelt sind und nicht einzeln stehen. */
    eingesammelt: Set<string>;
    /** Die Zeichen, die stehen: je Cluster sein Ort, wie viele Punkte darin sind, und welche — nur das oberste, sein Wort. */
    sterne: {
        cluster: string;
        x: number;
        y: number;
        zahl: number;
        tokens: string[];
        groesse: number;
    }[];
    /** Die Ringe der Ankündigung: die Mitte zwischen zwei, die sich nähern, und ihre Grösse. */
    ringe: {
        x: number;
        y: number;
        groesse: number;
    }[];
}
/**
 * Eine Stufe: eine Ausdehnung, oder das Initial. `mutter` ist die Stufe darüber, null ganz oben; `stern` der Ort ihres Fixsterns
 * in Pixeln, ohne keinen; `offen` sammelt nicht ein, die gewählte.
 */
export interface Stufe {
    token: string;
    mutter: string | null;
    stern: {
        x: number;
        y: number;
    } | null;
    offen: boolean;
    /**
     * Zu (Blatt 125, Schritt vier): Ihr Umriss ist kleiner als ihr Zeichen, ihre Punkte sind nicht geladen. Dann steht ihr Zeichen
     * mit dieser Zahl, der Zahl ihrer öffentlichen Punkte vom Haus, und was unter ihr liegt, rechnet nicht mit.
     */
    zu?: number;
}
/**
 * ⚠ STUFE FÜR STUFE (Blatt 125, Schritt drei, sein „2. b" und „1. a"): von der tiefsten Stufe hinauf. Eine Stufe sammelt ihre
 * eigenen Punkte ein und die Zeichen ihrer Töchter, die schon eingesammelt haben; was mit einem zweiten verschmilzt, steht an
 * ihrem Fixstern, und ihr Zeichen geht eine Stufe höher. Gezeichnet wird nur das oberste Zeichen, sein Wort: „die darunter
 * könnten technisch weggelassen werden". Was allein bleibt, steht, wo es steht.
 */
export declare function clusternStufen(mitglieder: readonly Mitglied[], stufen: readonly Stufe[]): Geclustert;
