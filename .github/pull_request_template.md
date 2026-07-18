## Obiettivo

Descrivi in 2-4 righe lo scopo della PR.

## Tipo di modifica

- [ ] Feature
- [ ] Bugfix
- [ ] Refactor
- [ ] Documentazione
- [ ] Accessibilita

## Checklist tecnica

- [ ] Ho eseguito `npm run lint`
- [ ] Ho eseguito `npm run test`
- [ ] Ho eseguito `npm run build`
- [ ] Ho aggiornato la documentazione necessaria

## Checklist WCAG 2.2 AA (obbligatoria)

Riferimento: `docs/WCAG_QA_CHECKLIST.md`

- [ ] Ho compilato/validato la checklist WCAG
- [ ] Nessuna informazione e comunicata solo con il colore
- [ ] Focus visibile e navigazione completa da tastiera
- [ ] Label/ruoli ARIA corretti per i nuovi controlli
- [ ] Errori mostrati con icona + testo + colore
- [ ] `prefers-reduced-motion` rispettato dove applicabile
- [ ] Lighthouse Accessibility >= 95 (CI)
- [ ] Nessun errore critico in `axe-core`

## Evidenze QA

- Link run CI:
- Screenshot/GIF (se UI):
- Note test manuali (screen reader/tastiera/zoom 200%):

## Rischi e impatti

Indica eventuali aree sensibili, regressioni potenziali o fallback.

