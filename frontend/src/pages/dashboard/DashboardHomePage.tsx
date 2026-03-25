import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WeightSparkline } from "../../components/dashboard/DashboardCharts";
import { getJson } from "../../lib/api";
import { clearToken, getToken } from "../../lib/auth";
import { last7DaysYmd, localYmd, shortWeekdaySv } from "../../lib/date";
import type { MealItem, WeightItem, WorkoutItem } from "../../types/dashboard";

// Räknar dagar i rad bakåt från idag.
// Stoppar när det inte finns ett pass.
function computeWorkoutStreak(workouts: { date: string }[]): number {
  const byDate = new Set(workouts.map((w) => w.date));
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    if (byDate.has(localYmd(dt))) streak++;
    else break;
  }
  return streak;
}

export function DashboardHomePage() {
  const navigate = useNavigate();
  const token = getToken()!;
  const today = localYmd();
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [weights, setWeights] = useState<WeightItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Hämta allt samtidigt (Promise.all).
  // Ett anrop per resurs.
  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [wRes, mRes, wtRes] = await Promise.all([
        getJson<{ items: WorkoutItem[] }>("/workouts", token),
        getJson<{ items: MealItem[] }>("/meals", token),
        getJson<{ items: WeightItem[] }>("/weight", token),
      ]);
      setWorkouts(wRes.items);
      setMeals(mRes.items);
      setWeights(wtRes.items);
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

  const workoutsToday = useMemo(() => workouts.filter((w) => w.date === today).length, [workouts, today]);
  // Summera alla meal-rader för dagens datum (kan vara flera efter batch-loggning)
  const caloriesToday = useMemo(
    () => meals.filter((m) => m.date === today).reduce((s, m) => s + m.calories, 0),
    [meals, today]
  );
  const latestWeight = weights[0]?.weight;
  const streak = useMemo(() => computeWorkoutStreak(workouts), [workouts]);

  // Antal pass per dag de senaste 7 dagarna.
  // Används i stapeldiagram.
  const freqByDay = useMemo(() => {
    const last7 = last7DaysYmd();
    const counts = new Map<string, number>();
    last7.forEach((d) => counts.set(d, 0));
    workouts.forEach((w) => {
      if (counts.has(w.date)) counts.set(w.date, (counts.get(w.date) ?? 0) + 1);
    });
    return last7.map((d) => ({ date: d, count: counts.get(d) ?? 0, label: shortWeekdaySv(d) }));
  }, [workouts]);

  const maxFreq = Math.max(1, ...freqByDay.map((f) => f.count));

  // Senaste 14 viktloggar i ordning (för sparkline).
  const weightSeries = useMemo(() => {
    const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-14).map((w) => ({ date: w.date, weight: w.weight }));
  }, [weights]);

  return (
    <section className="dashboard-content">
      {loadError ? <p className="dashboard-banner-error">{loadError}</p> : null}

      <header className="dashboard-headline">
        <h1>Dashboard</h1>
        <p>Dagens sammanfattning</p>
      </header>

      <section className="dashboard-stats-grid">
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-icon">🏋</span>
          <div>
            <h3>{workoutsToday}</h3>
            <p>Träningspass idag</p>
          </div>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-icon">🔥</span>
          <div>
            <h3>{caloriesToday}</h3>
            <p>Kalorier idag</p>
          </div>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-icon">⚖</span>
          <div>
            <h3>{latestWeight != null ? `${latestWeight} kg` : "–"}</h3>
            <p>Kroppsvikt</p>
          </div>
        </article>
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-icon">📈</span>
          <div>
            <h3>{streak}</h3>
            <p>Dagars streak</p>
          </div>
        </article>
      </section>

      <section className="dashboard-actions">
        <Link to="/dashboard/training" className="dashboard-action-btn is-primary">
          Logga träning
        </Link>
        <Link to="/dashboard/nutrition" className="dashboard-action-btn">
          Logga måltid
        </Link>
        <Link to="/dashboard/lifestyle" className="dashboard-action-btn">
          Logga vikt
        </Link>
      </section>

      <section className="dashboard-panels">
        <article className="dashboard-panel">
          <header>⚖ Viktutveckling</header>
          <div className="dashboard-panel-body dashboard-panel-chart">
            {weightSeries.length === 0 ? (
              <span className="dashboard-chart-empty">Logga vikt för att se trenden</span>
            ) : (
              <>
                <WeightSparkline points={weightSeries} />
                <p className="dashboard-chart-meta">
                  {weightSeries.length} loggar · senast {weightSeries[weightSeries.length - 1]?.weight} kg (
                  {weightSeries[weightSeries.length - 1]?.date})
                </p>
              </>
            )}
          </div>
        </article>
        <article className="dashboard-panel">
          <header>📅 Träningsfrekvens (7 dagar)</header>
          <div className="dashboard-panel-body dashboard-panel-bars">
            <div className="dashboard-bar-chart">
              {freqByDay.map((d) => (
                <div key={d.date} className="dashboard-bar-col">
                  <div
                    className="dashboard-bar-fill"
                    style={{ height: `${(d.count / maxFreq) * 100}%` }}
                    title={`${d.date}: ${d.count} pass`}
                  />
                  <span className="dashboard-bar-label">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}
