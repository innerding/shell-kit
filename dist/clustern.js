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
export const ICON = 30;
export const SCHLUCKEN = ICON;
export const ANKUENDIGEN = ICON * 2;
export const STERN_MIN = 34;
export const STERN_MAX = 56;
/** SCIM3 mergeOverlapping: verschmelzen, solange zwei näher als `schlucken` stehen; die Lage nach der Zahl gewichtet. */
export function verschmelzen(start, schlucken) {
    let gruppen = start;
    let verschmolzen = true;
    while (verschmolzen) {
        verschmolzen = false;
        aussen: for (let i = 0; i < gruppen.length; i++) {
            for (let j = i + 1; j < gruppen.length; j++) {
                const d = Math.hypot(gruppen[i].x - gruppen[j].x, gruppen[i].y - gruppen[j].y);
                if (d < schlucken) {
                    const a = gruppen[i];
                    const b = gruppen[j];
                    const na = a.mitglieder.length;
                    const nb = b.mitglieder.length;
                    const neu = { x: (a.x * na + b.x * nb) / (na + nb), y: (a.y * na + b.y * nb) / (na + nb), mitglieder: [...a.mitglieder, ...b.mitglieder] };
                    gruppen = gruppen.filter((_, k) => k !== i && k !== j);
                    gruppen.push(neu);
                    verschmolzen = true;
                    break aussen;
                }
            }
        }
    }
    return gruppen;
}
/**
 * ⚠ STUFE FÜR STUFE (Blatt 125, Schritt drei, sein „2. b" und „1. a"): von der tiefsten Stufe hinauf. Eine Stufe sammelt ihre
 * eigenen Punkte ein und die Zeichen ihrer Töchter, die schon eingesammelt haben; was mit einem zweiten verschmilzt, steht an
 * ihrem Fixstern, und ihr Zeichen geht eine Stufe höher. Gezeichnet wird nur das oberste Zeichen, sein Wort: „die darunter
 * könnten technisch weggelassen werden". Was allein bleibt, steht, wo es steht.
 */
export function clusternStufen(mitglieder, stufen) {
    const bei = new Map(stufen.map((x) => [x.token, x]));
    const tiefe = (t) => {
        let n = 0;
        for (let x = bei.get(t); x?.mutter && n < 64; x = bei.get(x.mutter))
            n++;
        return n;
    };
    const teile = new Map();
    const dazu = (stufe, t) => {
        const liste = teile.get(stufe);
        if (liste)
            liste.push(t);
        else
            teile.set(stufe, [t]);
    };
    // Was unter einer zugeklappten Stufe liegt, rechnet nicht mit (Schritt vier): ihre Töchter und Punkte.
    const unterZu = (t) => {
        let n = 0;
        for (let x = bei.get(bei.get(t)?.mutter ?? ""); x && n < 64; x = bei.get(x.mutter ?? ""), n++)
            if (x.zu !== undefined)
                return true;
        return false;
    };
    for (const m of mitglieder)
        if (m.cluster && bei.has(m.cluster) && bei.get(m.cluster).zu === undefined && !unterZu(m.cluster))
            dazu(m.cluster, { x: m.x, y: m.y, tokens: [m.token], zahl: 1 });
    const raus = { eingesammelt: new Set(), sterne: [], ringe: [] };
    const verborgen = new Set();
    for (const st of [...stufen].sort((a, b) => tiefe(b.token) - tiefe(a.token))) {
        if (unterZu(st.token))
            continue;
        // Zugeklappt: das Zeichen mit der Zahl vom Haus, an ihrem Fixstern; es geht in ihre Mutter ein wie jedes andere.
        if (st.zu !== undefined) {
            if (st.zu > 0 && st.stern) {
                raus.sterne.push({ cluster: st.token, x: st.stern.x, y: st.stern.y, zahl: st.zu, tokens: [], groesse: Math.min(STERN_MAX, STERN_MIN + (st.zu - 2) * 5) });
                if (st.mutter && bei.has(st.mutter))
                    dazu(st.mutter, { x: st.stern.x, y: st.stern.y, tokens: [], zahl: st.zu, tochter: st.token });
            }
            continue;
        }
        const hier = teile.get(st.token) ?? [];
        if (!hier.length)
            continue;
        const sammelt = !st.offen && st.stern;
        const ballungen = sammelt ? verschmelzen(hier.map((t) => ({ x: t.x, y: t.y, mitglieder: [t] })), SCHLUCKEN) : hier.map((t) => ({ x: t.x, y: t.y, mitglieder: [t] }));
        // ⚠ AUCH EIN EINZELNER GEHT AN DEN FIXSTERN (28.10.2026, o-o-o-o.app Blatt 131, sein „1. ja 2. ja, bau es"): Kommt eine
        // Ballung — das Zeichen einer Tochter oder ein Punkt — dem Fixstern dieser Stufe näher als ein Icon, sammelt sie ein, auch
        // allein. Sonst stand bei einem Haus mit nur einer Ausdehnung das Haus nie am Fixstern seines Initials (Blatt 125, SINN).
        const amStern = (b) => Boolean(st.stern) && Math.hypot(b.x - st.stern.x, b.y - st.stern.y) < SCHLUCKEN;
        const viele = sammelt ? ballungen.filter((b) => b.mitglieder.length >= 2 || amStern(b)) : [];
        if (viele.length && st.stern) {
            const darin = viele.flatMap((b) => b.mitglieder);
            const tokens = darin.flatMap((t) => t.tokens);
            const zahl = darin.reduce((n, t) => n + t.zahl, 0);
            for (const t of darin) {
                if (t.tochter)
                    verborgen.add(t.tochter);
                else
                    for (const k of t.tokens)
                        raus.eingesammelt.add(k);
            }
            raus.sterne.push({ cluster: st.token, x: st.stern.x, y: st.stern.y, zahl, tokens, groesse: Math.min(STERN_MAX, STERN_MIN + (zahl - 2) * 5) });
            if (st.mutter && bei.has(st.mutter))
                dazu(st.mutter, { x: st.stern.x, y: st.stern.y, tokens, zahl, tochter: st.token });
        }
        // Die Ankündigung zwischen allem, was hier steht, wie in SCIM3; wo nicht eingesammelt wird, auch zwischen dem, was überlappt.
        for (let i = 0; i < ballungen.length; i++)
            for (let j = i + 1; j < ballungen.length; j++) {
                const d = Math.hypot(ballungen[i].x - ballungen[j].x, ballungen[i].y - ballungen[j].y);
                if ((sammelt ? d >= SCHLUCKEN : true) && d < ANKUENDIGEN)
                    raus.ringe.push({ x: (ballungen[i].x + ballungen[j].x) / 2, y: (ballungen[i].y + ballungen[j].y) / 2, groesse: Math.min(STERN_MAX + 18, d + ICON) });
            }
    }
    raus.sterne = raus.sterne.filter((x) => !verborgen.has(x.cluster));
    return raus;
}
