# Guida Mappa Colori Temi - Favole Magiche

## 📋 Struttura della Mappa Colori

L'applicazione usa una **doppia mappa di colori** per garantire leggibilità e coerenza in tutti i temi:

### 1. THEME_MAP (Tema Diurno)
Definito in `PhoneMockup.tsx`, contiene i colori per il giorno:

```typescript
{
  bg: string;           // Background colore chiaro
  border: string;       // Border colore coerente con il tema
  accentText: string;   // Colore di accento (titoli, enfasi)
}
```

**Temi diurni disponibili:**
- 🌸 **Giardino delle Fate**: Rosa pastello (`#FEF9F0`) + Bordeaux (`#880E4F`)
- 🌲 **Bosco delle Meraviglie**: Verde chiaro (`#F1F8E9`) + Verde scuro (`#2E7D32`)
- 🌊 **Oceano Incantato**: Azzurro chiaro (`#E1F5FE`) + Azzurro scuro (`#0277BD`)
- ✨ **Isola del Sole Dorato**: Giallo chiaro (`#FFFDE7`) + Arancione scuro (`#E65100`)
- 🦄 **Prateria degli Unicorni**: Lavanda chiara (`#F3E5F5`) + Viola scuro (`#6A1B9A`)

### 2. NIGHT_THEME_MAP (Tema Notturno)
Definito in `PhoneMockup.tsx`, contiene i colori per la notte:

```typescript
{
  bg: string;           // Sempre bg-slate-900 (sfondo scuro)
  border: string;       // Colore scuro coerente (es: border-pink-900)
  accentText: string;   // Colore chiaro coerente (es: text-pink-300)
  textColor: string;    // Colore testo generale (es: text-pink-50)
}
```

**Temi notturni disponibili:**
- 🌸 **Giardino delle Fate**: Sfondo scuro + Testi rosa chiaro (`text-pink-300/50`)
- 🌲 **Bosco delle Meraviglie**: Sfondo scuro + Testi verde chiaro (`text-green-300/50`)
- 🌊 **Oceano Incantato**: Sfondo scuro + Testi azzurro chiaro (`text-blue-300/50`)
- ✨ **Isola del Sole Dorato**: Sfondo scuro + Testi ambra chiaro (`text-amber-300/50`)
- 🦄 **Prateria degli Unicorni**: Sfondo scuro + Testi viola chiaro (`text-purple-300/50`)

## 🎨 Principi di Design

### Contrasto WCAG
Tutti i colori sono scelti per rispettare lo **standard WCAG AA**:
- Testi chiari su sfondo scuro: rapporto di contrasto ≥ 4.5:1
- Testi scuri su sfondo chiaro: rapporto di contrasto ≥ 4.5:1

### Coerenza Tematica
Ogni tema mantiene la stessa "famiglia di colore" tra giorno e notte:
- **Giardino delle Fate**: Rosa/Bordeaux (giorno) → Rosa/Bordeaux (notte)
- **Bosco**: Verde (giorno) → Verde (notte)
- **Oceano**: Azzurro (giorno) → Azzurro (notte)
- **Sole**: Giallo/Arancione (giorno) → Ambra (notte)
- **Unicorni**: Lavanda/Viola (giorno) → Viola (notte)

## 🔧 Override CSS Night Mode
Nel file `src/index.css` sono definiti i seguenti override per `.night-theme`:

1. **Background**: Conversione colori chiari → `#1e293b`
2. **Text**: Conversione testi scuri → `#f1f5f9` (bianco morbido)
3. **Borders**: Conversione bordi chiari → `#475569` (grigio scuro)
4. **Accents**: Mantengono visibilità con toni chiari specifici per tema

## 📝 Come Aggiungere un Nuovo Tema

Per aggiungere un nuovo tema visivo:

1. **Aggiungi a THEME_MAP** (giorno):
```typescript
"🎯 Nuovo Tema": { 
  bg: "bg-[#COLORE_FONDO]", 
  border: "border-[#COLORE_BORDO]", 
  accentText: "text-[#COLORE_ACCENTO]" 
}
```

2. **Aggiungi a NIGHT_THEME_MAP** (notte):
```typescript
"🎯 Nuovo Tema": { 
  bg: "bg-slate-900",
  border: "border-[COLORE_FAMIGLIA]-900",
  accentText: "text-[COLORE_FAMIGLIA]-300",
  textColor: "text-[COLORE_FAMIGLIA]-50"
}
```

3. **Aggiungi override CSS** in `src/index.css` se necessario:
```css
.night-theme .border-[#COLORE_BORDO] {
  border-color: #475569 !important;
}
```

## ⏰ Quando Si Applica il Tema Notturno?

Il tema notturno si applica automaticamente quando:
- **Ora >= 18:00** (6 PM)
- **Ora < 06:00** (6 AM)

Questa logica è in `src/utils/theme.ts` nella funzione `shouldApplyNightTheme()`.

## 🧪 Test di Leggibilità

Per testare la leggibilità:

1. Apri l'app in tarda sera o modifica l'ora di sistema
2. Verifica che tutti i testi sono leggibili
3. Controlla che gli accenti mantengono visibilità
4. Usa uno strumento di contrasto (es: WebAIM Contrast Checker)


