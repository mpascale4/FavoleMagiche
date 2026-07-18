import { FormEvent, KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';

type ThemeMode = 'light' | 'dark';
type TabId = 'overview' | 'forms' | 'data';
type Toast = { id: number; message: string };

type DataPoint = {
  id: string;
  channel: string;
  users: number;
  trend: 'up' | 'down' | 'stable';
  tone: 'success' | 'warning' | 'error';
};

const chartData: DataPoint[] = [
  { id: 'd1', channel: 'Ricerca', users: 148, trend: 'up', tone: 'success' },
  { id: 'd2', channel: 'Menu rapido', users: 121, trend: 'stable', tone: 'warning' },
  { id: 'd3', channel: 'Assistenza', users: 64, trend: 'down', tone: 'error' },
];

const iconByTone = {
  success: '[+]',
  warning: '[!]',
  error: '[x]',
  info: '[i]',
};

const toneLabel = {
  success: 'Successo',
  warning: 'Attenzione',
  error: 'Errore',
};

function usePrefersReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return reducedMotion;
}

function Modal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !modalRef.current) {
      return;
    }

    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key !== 'Tab' || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown as unknown as EventListener);
    return () => document.removeEventListener('keydown', onKeyDown as unknown as EventListener);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="a11y-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="a11y-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        ref={modalRef}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="dialog-title">Conferma azione</h3>
        <p id="dialog-description">
          [i] Questa finestra modale e completamente gestibile via tastiera. Premi Esc per chiudere.
        </p>
        <div className="a11y-inline-actions">
          <button type="button" className="a11y-btn a11y-btn-primary" onClick={onClose}>
            [+] Conferma
          </button>
          <button type="button" className="a11y-btn" onClick={onClose}>
            [x] Annulla
          </button>
        </div>
      </div>
    </div>
  );
}

function Tabs({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (tab: TabId) => void }) {
  const tabs: Array<{ id: TabId; title: string; panel: string }> = [
    { id: 'overview', title: 'Panoramica', panel: 'Stato accessibilita e policy visive.' },
    { id: 'forms', title: 'Form', panel: 'Pattern per validazioni, aiuti e messaggi di errore.' },
    { id: 'data', title: 'Dati', panel: 'DataGrid, grafici con pattern e alternativa tabellare.' },
  ];

  return (
    <section aria-labelledby="tabs-heading" className="a11y-card">
      <h2 id="tabs-heading">Tabs accessibili</h2>
      <div role="tablist" aria-label="Sezioni del pannello" className="a11y-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className="a11y-tab"
            onClick={() => onTabChange(tab.id)}
          >
            [i] {tab.title}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          className="a11y-panel"
        >
          <p>{tab.panel}</p>
        </div>
      ))}
    </section>
  );
}

function ChartSection() {
  const maxUsers = Math.max(...chartData.map((point) => point.users));

  return (
    <section id="dashboard" aria-labelledby="chart-heading" className="a11y-card">
      <h2 id="chart-heading">Grafico con pattern + tabella accessibile</h2>
      <p>
        Ogni serie usa marker, pattern e testo, non solo colore. La tabella sotto e l&apos;alternativa equivalente per screen reader.
      </p>
      <svg viewBox="0 0 600 280" role="img" aria-labelledby="chart-title chart-desc" className="a11y-chart">
        <title id="chart-title">Accessi settimanali per canale</title>
        <desc id="chart-desc">
          Tre barre: Ricerca in crescita, Menu rapido stabile, Assistenza in calo.
        </desc>
        <defs>
          <pattern id="pattern-lines" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M 0 6 L 6 0" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <pattern id="pattern-dots" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="currentColor" />
          </pattern>
          <pattern id="pattern-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 0 0 L 0 10 M 0 0 L 10 0" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        {chartData.map((point, index) => {
          const height = (point.users / maxUsers) * 180;
          const x = 80 + index * 160;
          const y = 220 - height;
          const marker = point.trend === 'up' ? '[+]' : point.trend === 'down' ? '[-]' : '[=]';
          const fillPattern = index === 0 ? 'url(#pattern-lines)' : index === 1 ? 'url(#pattern-dots)' : 'url(#pattern-grid)';

          return (
            <g key={point.id} className={`tone-${point.tone}`}>
              <rect x={x} y={y} width={80} height={height} fill={fillPattern} stroke="currentColor" strokeWidth="2" />
              <text x={x + 40} y={240} textAnchor="middle" className="a11y-chart-label">
                {point.channel}
              </text>
              <text x={x + 40} y={y - 8} textAnchor="middle" className="a11y-chart-label">
                {marker} {point.users}
              </text>
            </g>
          );
        })}
      </svg>

      <table className="a11y-table" aria-label="Dati equivalenti del grafico">
        <caption>Tabella alternativa del grafico</caption>
        <thead>
          <tr>
            <th scope="col">Canale</th>
            <th scope="col">Utenti</th>
            <th scope="col">Trend</th>
            <th scope="col">Stato</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((point) => (
            <tr key={`row-${point.id}`}>
              <th scope="row">{point.channel}</th>
              <td>{point.users}</td>
              <td>{point.trend}</td>
              <td>
                {iconByTone[point.tone]} {toneLabel[point.tone]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function AccessibleApp() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showModal, setShowModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState('email');
  const [priority, setPriority] = useState('normal');
  const [consent, setConsent] = useState(false);
  const [updates, setUpdates] = useState(true);
  const [viewMode, setViewMode] = useState<'compact' | 'extended'>('extended');
  const [submitted, setSubmitted] = useState(false);
  const emailId = useId();
  const hintId = `${emailId}-hint`;
  const errorId = `${emailId}-error`;
  const reducedMotion = usePrefersReducedMotion();

  const emailError = useMemo(() => {
    if (!submitted) {
      return '';
    }

    if (!email) {
      return 'Email obbligatoria. Inserire un indirizzo nel formato nome@dominio.com';
    }

    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValid) {
      return 'Email non valida. Inserire un indirizzo email nel formato nome@dominio.com';
    }

    return '';
  }, [email, submitted]);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
  }, [theme, reducedMotion]);

  const pushToast = (message: string) => {
    setToasts((current) => [...current, { id: Date.now(), message }]);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    if (emailError) {
      return;
    }

    pushToast('Invio completato. Form valido e accessibile.');
  };

  const onTabListKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const order: TabId[] = ['overview', 'forms', 'data'];
    const currentIndex = order.indexOf(activeTab);

    if (event.key === 'ArrowRight') {
      const next = order[(currentIndex + 1) % order.length];
      setActiveTab(next);
      event.preventDefault();
    }

    if (event.key === 'ArrowLeft') {
      const next = order[(currentIndex - 1 + order.length) % order.length];
      setActiveTab(next);
      event.preventDefault();
    }
  };

  return (
    <div className="a11y-app">
      <a className="a11y-skip-link" href="#main-content">
        Salta al contenuto principale
      </a>

      <header className="a11y-header" role="banner">
        <div>
          <p className="a11y-eyebrow">WCAG 2.2 AA</p>
          <h1>Dashboard accessibile multi-esigenza visiva</h1>
        </div>
        <nav aria-label="Menu principale" className="a11y-nav">
          <a href="#componenti">Componenti</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#checklist">Checklist</a>
        </nav>
      </header>

      <main id="main-content" className="a11y-main" role="main">
        <section className="a11y-grid" aria-label="Preferenze utente">
          <article className="a11y-card">
            <h2>Preferenze visive</h2>
            <p>
              Puoi cambiare tema e densita della vista con controlli semplici. Ogni stato usa icona, testo chiaro e colore di supporto.
            </p>
            <div className="a11y-inline-actions">
              <button
                type="button"
                className="a11y-btn a11y-btn-primary"
                aria-pressed={theme === 'dark'}
                onClick={() => setTheme((value) => (value === 'light' ? 'dark' : 'light'))}
              >
                [i] Tema: {theme === 'light' ? 'Chiaro' : 'Scuro'}
              </button>
              <button type="button" className="a11y-btn" aria-pressed={viewMode === 'compact'} onClick={() => setViewMode(viewMode === 'compact' ? 'extended' : 'compact')}>
                [=] Vista: {viewMode === 'compact' ? 'Compatta' : 'Estesa'}
              </button>
            </div>
            <p role="status" aria-live="polite">
              Movimento ridotto {reducedMotion ? 'attivo dal sistema operativo.' : 'non attivo, ma disponibile.'}
            </p>
          </article>
        </section>

        <section id="componenti" className="a11y-grid-2" aria-label="Componenti riutilizzabili">
          <article className="a11y-card">
            <h2>Form controls</h2>
            <form noValidate onSubmit={onSubmit} aria-describedby={emailError ? errorId : undefined}>
              <div className="a11y-field">
                <label htmlFor={emailId}>Email</label>
                <input
                  id={emailId}
                  name="email"
                  type="email"
                  value={email}
                  aria-invalid={emailError ? 'true' : 'false'}
                  aria-describedby={emailError ? `${hintId} ${errorId}` : hintId}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <p id={hintId} className="a11y-hint">
                  [i] Esempio valido: nome@dominio.com
                </p>
                {emailError && (
                  <p id={errorId} className="a11y-error" role="alert">
                    [x] {emailError}
                  </p>
                )}
              </div>

              <div className="a11y-field">
                <label htmlFor="channel">Canale preferito</label>
                <select id="channel" value={channel} onChange={(event) => setChannel(event.target.value)}>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="phone">Telefono</option>
                </select>
              </div>

              <fieldset className="a11y-fieldset">
                <legend>Priorita richiesta (radio)</legend>
                <label>
                  <input
                    type="radio"
                    name="priority"
                    value="normal"
                    checked={priority === 'normal'}
                    onChange={(event) => setPriority(event.target.value)}
                  />
                  [=] Normale
                </label>
                <label>
                  <input
                    type="radio"
                    name="priority"
                    value="urgent"
                    checked={priority === 'urgent'}
                    onChange={(event) => setPriority(event.target.value)}
                  />
                  [!] Urgente
                </label>
              </fieldset>

              <label className="a11y-toggle-row">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
                [+] Confermo il consenso privacy
              </label>

              <label className="a11y-switch" htmlFor="updates-switch">
                <input
                  id="updates-switch"
                  type="checkbox"
                  role="switch"
                  checked={updates}
                  aria-checked={updates}
                  onChange={(event) => setUpdates(event.target.checked)}
                />
                <span>{updates ? '[+] Aggiornamenti attivi' : '[x] Aggiornamenti disattivi'}</span>
              </label>

              <p className="a11y-hint" role="note">
                [i] Tutti i campi sono utilizzabili da tastiera: Tab per passare al campo successivo, Invio per confermare.
              </p>

              <div className="a11y-inline-actions">
                <button type="submit" className="a11y-btn a11y-btn-primary">
                  [+] Invia richiesta
                </button>
                <button type="button" className="a11y-btn" onClick={() => setShowModal(true)}>
                  [i] Apri modal
                </button>
              </div>
            </form>
          </article>

          <article className="a11y-card">
            <h2>Alert e Toast</h2>
            <div className="a11y-alert tone-warning" role="alert">
              <strong>[!] Attenzione:</strong> i filtri attivi riducono la quantita di risultati.
            </div>
            <div className="a11y-alert tone-success" role="status">
              <strong>[+] Stato:</strong> sincronizzazione completata senza errori.
            </div>
            <button type="button" className="a11y-btn" onClick={() => pushToast('Notifica salvata. Nessuna informazione e solo cromatica.') }>
              [i] Mostra toast
            </button>
            <div className="a11y-toast-region" aria-live="polite" aria-atomic="true">
              {toasts.map((toast) => (
                <div key={toast.id} className="a11y-toast" role="status">
                  [i] {toast.message}
                </div>
              ))}
            </div>
          </article>
        </section>

        <div onKeyDown={onTabListKeyDown}>
          <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <section aria-labelledby="datagrid-heading" className="a11y-card">
          <h2 id="datagrid-heading">DataGrid accessibile</h2>
          <div role="region" aria-label="Elenco performance canali" tabIndex={0} className="a11y-grid-region">
            <table className="a11y-table">
              <caption>Stato canali con icone, testo e colore di supporto</caption>
              <thead>
                <tr>
                  <th scope="col">Canale</th>
                  <th scope="col">Utenti</th>
                  <th scope="col">Trend</th>
                  <th scope="col">Stato</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((item) => (
                  <tr key={item.id} className={`tone-${item.tone}`}>
                    <th scope="row">{item.channel}</th>
                    <td>{item.users}</td>
                    <td>{item.trend === 'up' ? '[+] Crescita' : item.trend === 'down' ? '[-] Calo' : '[=] Stabile'}</td>
                    <td>{iconByTone[item.tone]} {toneLabel[item.tone]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <ChartSection />

        <section id="checklist" className="a11y-card" aria-labelledby="checklist-title">
          <h2 id="checklist-title">Checklist WCAG 2.2 AA</h2>
          <ul>
            <li>[+] Landmark semantici: header, nav, main, section, article, aside, footer</li>
            <li>[+] Focus visibile e contrastato su tutti i controlli</li>
            <li>[+] Stati con icona + testo + colore</li>
            <li>[+] Form con etichette, hint e errori associati via ARIA</li>
            <li>[+] Modal con gestione focus e chiusura Esc</li>
            <li>[+] Riduzione movimento via prefers-reduced-motion</li>
          </ul>
          <p className="a11y-hint">
            [i] Interfaccia progettata per daltonismo, ipovisione, sensibilita al contrasto e utenti con ridotta tolleranza agli stimoli visivi.
          </p>
        </section>
      </main>

      <aside className="a11y-header a11y-card" aria-label="Aiuto alla navigazione">
        <div>
          <h2>Supporto tastiera e screen reader</h2>
          <p className="a11y-hint">[i] Suggerimento rapido: premi prima Tab per vedere il focus evidenziato.</p>
          <ul>
            <li>Tab / Shift+Tab: navigazione tra controlli</li>
            <li>Enter/Spazio: attiva pulsanti e switch</li>
            <li>Esc: chiude modali</li>
            <li>Frecce sinistra/destra: cambio tab</li>
          </ul>
        </div>
      </aside>

      <footer className="a11y-footer" role="contentinfo">
        <p>Accessibile by design: contrasto, tastiera, screen reader e riduzione stimoli visivi.</p>
      </footer>

      <Modal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}


