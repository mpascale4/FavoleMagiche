# WCAG 2.2 AA - QA Checklist Operativa

Usa questa checklist prima del merge su `develop`.

Legenda:
- [ ] Da verificare
- [x] Conforme
- [~] Parziale / da migliorare
- [!] Non conforme (bloccante)

Compila per ogni vista: `Home`, `Settings`, `Profiles`, `NewStory`, `Reader`, `Archive`, `Albero`.

---

## 0) Metadati test

- Data test:
- Tester:
- Branch:
- Commit:
- Browser/Versione:
- OS:
- Screen reader usato (NVDA/VoiceOver/TalkBack):
- Modalita tema testata: `Light` / `Dark`

---

## 1) Gate automatici (obbligatori)

- [ ] `npm run lint` passa
- [ ] `npm run test` passa (incluso `axe`)
- [ ] `npm run build` passa
- [ ] `npm run test:lighthouse` passa in CI
- [ ] Lighthouse Accessibility >= 95

Evidenze (log/link run CI):
- 

---

## 2) Struttura semantica e landmark

Per ogni vista:
- [ ] Presenza landmark coerenti (`header`, `nav`, `main`, `footer`, eventuale `aside`)
- [ ] Un solo `main` attivo
- [ ] Heading gerarchici (`h1 -> h2 -> h3`) senza salti illogici
- [ ] Nessun elemento decorativo letto inutilmente (`aria-hidden` dove necessario)

Note:
- 

---

## 3) Navigazione tastiera

Per ogni vista:
- [ ] Tutte le azioni raggiungibili con `Tab`
- [ ] Ordine di tabulazione logico
- [ ] Focus sempre visibile (outline ben contrastato)
- [ ] Nessun keyboard trap
- [ ] `Enter/Space` attivano i controlli
- [ ] `Esc` chiude modali/dialog
- [ ] Presente skip link funzionante verso il contenuto principale

Note:
- 

---

## 4) Form, input e validazioni

Per ogni form:
- [ ] Ogni campo ha `label` associata
- [ ] Hint/istruzioni disponibili (non solo placeholder)
- [ ] Errori associati al campo (`aria-describedby`/`aria-invalid`)
- [ ] Errore comunicato con icona + testo + colore (mai solo rosso)
- [ ] Messaggi chiari e azionabili (es. formato email)

Note:
- 

---

## 5) Screen reader e ARIA

Per ogni vista:
- [ ] Controlli con nome accessibile corretto
- [ ] `aria-live` usato per aggiornamenti dinamici (toast/stato)
- [ ] Dialog con `role="dialog"`, `aria-modal`, titolo/descrizione leggibili
- [ ] Tab con pattern corretto (`tablist`/`tab`/`tabpanel`)
- [ ] Switch con `role="switch"` e stato (`aria-checked`)

Note:
- 

---

## 6) Contrasto e colore

- [ ] Testo normale >= 4.5:1
- [ ] Testo grande >= 3:1
- [ ] Componenti UI/focus/bordi >= 3:1
- [ ] Informazione mai solo cromatica
- [ ] UI comprensibile in scala di grigi
- [ ] Pattern/marker/testo presenti nei grafici (non solo colore)

Strumenti usati:
- 

Note:
- 

---

## 7) Motion, fotosensibilita, comfort visivo

- [ ] Nessun flash/strobo > 3/s
- [ ] `prefers-reduced-motion` riduce/disattiva animazioni
- [ ] Nessun effetto aggressivo (zoom/parallax/transizioni eccessive)
- [ ] Interfaccia non sovraccarica (densita visiva controllata)

Note:
- 

---

## 8) Zoom, responsive e leggibilita

Verifica a 320px, smartphone, tablet, desktop, 4K:
- [ ] Nessuna rottura critica layout
- [ ] Nessuna perdita di contenuto/funzionalita a zoom 200%
- [ ] Font base >= 16px e line-height >= 1.5
- [ ] Touch target sufficienti e distanziati

Note:
- 

---

## 9) Componenti UI richiesti (stato conformita)

Compila `OK / Parziale / KO` per ogni componente.

- Button:
- Input:
- Select:
- Checkbox:
- Radio:
- Switch:
- Modal:
- Toast:
- Alert:
- Tabs:
- DataGrid:
- Charts:
- Navigation Menu:

Azioni correttive aperte:
- 

---

## 10) Report finale

Esito generale:
- [ ] Conforme WCAG 2.2 AA
- [ ] Conforme con eccezioni minori
- [ ] Non conforme (blocco rilascio)

Issue aperte (con priorita):
1. 
2. 
3. 

Decisione merge:
- [ ] Go
- [ ] No-Go

