---
name: react-best-practices
description: "Checklist di best practice React 19 + TypeScript + Vite + Tailwind per favole-magiche. Usare prima di creare/rifattorizzare componenti o hook, prima di introdurre state management o side-effect, o come checklist finale prima di proporre una modifica come conclusa."
license: MIT
---

# Skill: React Best Practices (favole-magiche)

Skill di riferimento per applicare best practice React/TypeScript/Vite quando si
scrive o si rifattorizza codice in questo repository. Da invocare esplicitamente
(tool `skill`) quando serve una checklist puntuale prima/dopo un intervento su
componenti, hook o logica applicativa.

Stack reale del progetto (verificato da `package.json`):
React 19, Vite 6, TypeScript 5.8 (`tsc --noEmit` come "lint"), Tailwind CSS 4,
`lucide-react`, `motion`, `canvas-confetti`, `@google/genai` per la generazione
delle storie, Capacitor (Android). Test runner presente: **Vitest + React
Testing Library** (`npm run test`, `npm run test:watch`), oltre a test di
accessibilità (`npm run test:a11y`) e Lighthouse CI (`npm run test:lighthouse`).

## Quando usare questa skill

- Prima di creare un nuovo componente/hook, per verificare pattern coerenti col resto del repo.
- Durante un refactor di componenti React esistenti (specialmente JSX complesso).
- Prima di introdurre state management, side-effect o logica async (es. chiamate a `@google/genai`).
- Come checklist finale prima di proporre una modifica come conclusa.

## Checklist

### Componenti

- Solo componenti a funzione con hook; niente class component.
- Props tipizzate esplicitamente con `type`/`interface`, niente `any`.
- Un componente = una responsabilità; se il JSX cresce troppo, estrarre
  sotto-componenti invece di annidare condizioni profonde (coerente con la
  regola "Strutturare JSX complesso in blocchi piccoli" del progetto).
- Evitare prop drilling eccessivo: usare Context (o uno store dedicato) solo
  quando lo stato è realmente condiviso da più livelli, non di default.

### Hook e stato

- `useState`/`useReducer` per stato locale; `useEffect` solo per veri side-effect
  (subscription, timer, chiamate a `@google/genai`), mai per derivare dati che
  possono essere calcolati in render o con `useMemo`.
- Cleanup esplicito in ogni `useEffect` che registra listener/timer/subscription.
- Estrarre logica riutilizzata (2+ usi) in custom hook dedicati (`useXxx`),
  seguendo il principio DRY già richiesto dalle istruzioni di progetto.
- Mantenere `useCallback`/stable refs per funzioni passate come dipendenze di
  effect critici.

### Tipi ed errori

- TypeScript strict: niente `any` implicito, tipizzare risposte async (incluse
  quelle di `@google/genai`) e stati di errore/loading/empty in modo esplicito.
- Gestire sempre i tre stati di un fetch/async flow: loading, error, success —
  mai lasciare uno stato implicito non gestito.

### Accessibilità (vincolante per questo progetto)

- HTML semantico + ARIA valido; navigazione da tastiera e focus visibile su
  ogni elemento interattivo custom.
- Nessuna informazione veicolata solo dal colore; rispettare
  `prefers-reduced-motion` per animazioni (incluse quelle con `motion`).
- Badge di stato (check/lucchetto) e CTA disabilitate devono seguire
  esattamente i pattern già definiti in `.github/copilot-instructions.md`
  (dimensioni, colori, `aria-hidden`, `disabled`/`aria-disabled`).

### Layout

- Seguire la gerarchia Design System > CSS Grid > Flexbox > HTML semantico già
  definita nelle istruzioni di progetto; usare `grid-cols-[repeat(auto-fit,minmax(...))]`
  per griglie di card, non `grid-cols-1 sm:grid-cols-2 ...`.

### Testing

- Usare **Vitest + React Testing Library** (`npm run test`) per coprire logica
  critica: generazione storie, sblocco achievement, riduttori di stato complessi.
- Coprire happy path + edge case (input vuoto/invalido, errori di rete/API),
  non solo il caso positivo.
- Eseguire `npm run test:a11y` per i test di accessibilità dedicati.

## Buon esempio

```tsx
type StoryCardProps = {
  title: string;
  coverUrl: string;
};

export function StoryCard({ title, coverUrl }: StoryCardProps) {
  return (
    <article className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4">
      <img src={coverUrl} alt="" aria-hidden="true" />
      <span>{title}</span>
    </article>
  );
}
```

## Da evitare

```tsx
export function StoryCard(props: any) {
  const [story, setStory] = useState<any>(null);
  useEffect(() => {
    fetch('/api/story').then((r) => r.json()).then(setStory);
  }); // niente array di dipendenze, niente gestione errori/loading
  return <div>{story.title}</div>; // niente stato loading/error gestito
}
```
