import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WeightSparkline } from "../../components/dashboard/DashboardCharts";
import { getJson, postJsonAuth } from "../../lib/api";
import { clearToken, getToken } from "../../lib/auth";
import { localYmd } from "../../lib/date";
import type { NoteItem, WeightItem } from "../../types/dashboard";

export function LifestylePage() {
  const navigate = useNavigate();
  const token = getToken()!;
  const today = localYmd();
  const [weights, setWeights] = useState<WeightItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [wVal, setWVal] = useState(75);
  const [wDate, setWDate] = useState(today);
  const [wSaving, setWSaving] = useState(false);
  const [wErr, setWErr] = useState<string | null>(null);

  const [nDate, setNDate] = useState(today);
  const [nContent, setNContent] = useState("");
  const [nSaving, setNSaving] = useState(false);
  const [nErr, setNErr] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [wt, n] = await Promise.all([
        getJson<{ items: WeightItem[] }>("/weight", token),
        getJson<{ items: NoteItem[] }>("/notes", token),
      ]);
      setWeights(wt.items);
      setNotes(n.items);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        clearToken();
        navigate("/login", { replace: true });
        return;
      }
      setLoadError(err.message || "Kunde inte hämta data");
    }
  }, [token, navigate]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const weightSeries = useMemo(() => {
    const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-14).map((w) => ({ date: w.date, weight: w.weight }));
  }, [weights]);

  async function saveWeight(e: FormEvent) {
    e.preventDefault();
    setWErr(null);
    setWSaving(true);
    try {
      await postJsonAuth("/weight", { weight: Number(wVal), date: wDate }, token);
      await loadAll();
    } catch (err) {
      setWErr(err instanceof Error ? err.message : "Kunde inte spara");
    } finally {
      setWSaving(false);
    }
  }

  async function saveNote(e: FormEvent) {
    e.preventDefault();
    setNErr(null);
    if (!nContent.trim()) {
      setNErr("Skriv en anteckning.");
      return;
    }
    setNSaving(true);
    try {
      await postJsonAuth("/notes", { date: nDate, content: nContent.trim() }, token);
      setNContent("");
      await loadAll();
    } catch (err) {
      setNErr(err instanceof Error ? err.message : "Kunde inte spara");
    } finally {
      setNSaving(false);
    }
  }

  return (
    <section className="dashboard-content">
      {loadError ? <p className="dashboard-banner-error">{loadError}</p> : null}

      <div className="dashboard-page-head">
        <div>
          <h1>Livsstil</h1>
          <p className="dashboard-page-sub">Logga vikt och dagliga noteringar</p>
        </div>
      </div>

      <div className="lifestyle-grid">
        <article className="dashboard-section-card lifestyle-card">
          <header className="dashboard-section-card-title">⚖ Logga vikt</header>
          <form className="lifestyle-form" onSubmit={saveWeight}>
            <label className="dashboard-field">
              <span>Vikt (kg)</span>
              <input type="number" min={1} max={500} step={0.1} value={wVal} onChange={(e) => setWVal(Number(e.target.value))} required />
            </label>
            <label className="dashboard-field">
              <span>Datum</span>
              <input type="date" value={wDate} onChange={(e) => setWDate(e.target.value)} required />
            </label>
            {wErr ? <p className="dashboard-modal-error">{wErr}</p> : null}
            <button type="submit" className="dashboard-lifestyle-submit" disabled={wSaving}>
              {wSaving ? "Sparar…" : "Spara vikt"}
            </button>
          </form>
        </article>

        <article className="dashboard-section-card lifestyle-card">
          <header className="dashboard-section-card-title">📝 Ny anteckning</header>
          <form className="lifestyle-form" onSubmit={saveNote}>
            <label className="dashboard-field">
              <span>Datum</span>
              <input type="date" value={nDate} onChange={(e) => setNDate(e.target.value)} required />
            </label>
            <label className="dashboard-field">
              <span>Anteckning</span>
              <textarea
                rows={4}
                placeholder="Sov bra, känner mig energisk..."
                value={nContent}
                onChange={(e) => setNContent(e.target.value)}
              />
            </label>
            {nErr ? <p className="dashboard-modal-error">{nErr}</p> : null}
            <button type="submit" className="dashboard-lifestyle-submit-secondary" disabled={nSaving}>
              {nSaving ? "Sparar…" : "Spara anteckning"}
            </button>
          </form>
        </article>
      </div>

      <article className="dashboard-section-card lifestyle-wide">
        <header className="dashboard-section-card-title">Viktutveckling</header>
        <div className="dashboard-section-card-body dashboard-panel-chart">
          {weightSeries.length < 2 ? (
            <p className="dashboard-muted">Logga minst 2 vikter för att se diagram</p>
          ) : (
            <WeightSparkline points={weightSeries} />
          )}
        </div>
      </article>

      {notes.length > 0 ? (
        <>
          <h2 className="dashboard-history-title">Anteckningar</h2>
          <ul className="notes-list">
            {notes.map((n) => (
              <li key={n.id} className="notes-item">
                <span className="notes-date">{n.date}</span>
                <p>{n.content}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
