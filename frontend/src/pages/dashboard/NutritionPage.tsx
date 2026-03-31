import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalorieLineChart } from "../../components/dashboard/DashboardCharts";
import { MealModalForm } from "../../components/dashboard/DashboardModals";
import { getJson } from "../../lib/api";
import { clearToken, getToken } from "../../lib/auth";
import { formatShortDate, last14DaysYmd, localYmd } from "../../lib/date";
import type { MealItem } from "../../types/dashboard";

// Kalorimål sparas lokalt.
// Ingen backend-endpoint i detta projekt.
const GOAL_KEY = "myfit_calorie_goal";

export function NutritionPage() {
  const navigate = useNavigate();
  const token = getToken()!;
  const today = localYmd();
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [goal, setGoal] = useState(() => {
    const s = localStorage.getItem(GOAL_KEY);
    return s ? Number(s) : 2500;
  });
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadMeals = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await getJson<{ items: MealItem[] }>("/meals", token);
      setMeals(res.items);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        clearToken();
        navigate("/login", { replace: true });
        return;
      }
      setLoadError(err.message || "Kunde inte hämta måltider");
    }
  }, [token, navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMeals();
  }, [loadMeals]);

  // Synka mål till localStorage när användaren ändrar siffran
  useEffect(() => {
    localStorage.setItem(GOAL_KEY, String(goal));
  }, [goal]);

  const caloriesToday = useMemo(
    () => meals.filter((m) => m.date === today).reduce((s, m) => s + m.calories, 0),
    [meals, today]
  );

  const progressPct = Math.min(100, goal > 0 ? (caloriesToday / goal) * 100 : 0);

  // Samlar kcal per datum för 14 dagar.
  const series14 = useMemo(() => {
    const days = last14DaysYmd();
    const byDay = new Map<string, number>();
    days.forEach((d) => byDay.set(d, 0));
    meals.forEach((m) => {
      if (byDay.has(m.date)) byDay.set(m.date, (byDay.get(m.date) ?? 0) + m.calories);
    });
    return days.map((d) => ({ date: d, calories: byDay.get(d) ?? 0 }));
  }, [meals]);

  return (
    <section className="dashboard-content">
      {loadError ? <p className="dashboard-banner-error">{loadError}</p> : null}

      <div className="dashboard-page-head">
        <div>
          <h1>Kost</h1>
          <p className="dashboard-page-sub">Logga måltider och följ kalorier</p>
        </div>
        <button
          type="button"
          className="dashboard-head-btn"
          onClick={() => {
            setSubmitError(null);
            setShowModal(true);
          }}
        >
          + Logga måltid
        </button>
      </div>

      <article className="dashboard-section-card dashboard-goal-card">
        <div className="dashboard-goal-row">
          <span className="dashboard-goal-label">
            <span className="dashboard-goal-flame">🔥</span> Kalorimål idag
          </span>
          <div className="dashboard-goal-input-wrap">
            <input
              type="number"
              min={500}
              max={10000}
              step={50}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              className="dashboard-goal-input"
            />
            <span className="dashboard-goal-suffix">kcal</span>
          </div>
        </div>
        <div className="dashboard-progress-track">
          <div className="dashboard-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="dashboard-progress-text">
          {caloriesToday} / {goal} kcal
        </p>
      </article>

      <article className="dashboard-section-card">
        <header className="dashboard-section-card-title">Kalorier per dag (14 dagar)</header>
        <div className="dashboard-section-card-body dashboard-nutrition-chart">
          <CalorieLineChart points={series14} />
          <div className="dashboard-axis-labels">
            {series14.map((p) => (
              <span key={p.date} className="dashboard-axis-tick">
                {formatShortDate(p.date)}
              </span>
            ))}
          </div>
        </div>
      </article>

      <h2 className="dashboard-history-title">Kosthistorik</h2>
      <ul className="meal-history">
        {[...meals]
          .sort((a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id))
          .map((m) => (
            <li key={m.id} className="meal-history-item">
              <span className="meal-history-date">{m.date}</span>
              <div className="meal-history-main">
                <span className="meal-history-type">{m.mealType}</span>
                {m.foodLabel ? (
                  <span className="meal-history-food" title={m.foodLabel}>
                    {m.foodLabel}
                  </span>
                ) : null}
              </div>
              <span className="meal-history-cal">{m.calories} kcal</span>
            </li>
          ))}
      </ul>
      {meals.length === 0 ? <p className="dashboard-muted dashboard-history-empty">Inga måltider loggade ännu.</p> : null}

      {showModal ? (
        <MealModalForm
          token={token}
          defaultDate={today}
          onClose={() => {
            setShowModal(false);
            setSubmitError(null);
          }}
          onSuccess={async () => {
            setShowModal(false);
            setSubmitError(null);
            await loadMeals();
          }}
          submitting={submitting}
          setSubmitting={setSubmitting}
          submitError={submitError}
          setSubmitError={setSubmitError}
        />
      ) : null}
    </section>
  );
}
