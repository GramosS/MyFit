import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WeightSparkline } from "../../components/dashboard/DashboardCharts";
import { WorkoutModalForm } from "../../components/dashboard/DashboardModals";
import { deleteJsonAuth, getJson } from "../../lib/api";
import { clearToken, getToken } from "../../lib/auth";
import { localYmd } from "../../lib/date";
import type { WorkoutItem } from "../../types/dashboard";

export function TrainingPage() {
  const navigate = useNavigate();
  const token = getToken()!;
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editWorkout, setEditWorkout] = useState<WorkoutItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadWorkouts = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await getJson<{ items: WorkoutItem[] }>("/workouts", token);
      setWorkouts(res.items);
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        clearToken();
        navigate("/login", { replace: true });
        return;
      }
      setLoadError(err.message || "Kunde inte hämta pass");
    }
  }, [token, navigate]);

  useEffect(() => {
    void loadWorkouts();
  }, [loadWorkouts]);

  const exerciseNames = useMemo(() => {
    const s = new Set<string>();
    workouts.forEach((w) => w.exercises.forEach((e) => s.add(e.name)));
    return [...s].filter(Boolean).sort();
  }, [workouts]);

  const [selectedExercise, setSelectedExercise] = useState("");

  useEffect(() => {
    if (!selectedExercise && exerciseNames.length > 0) setSelectedExercise(exerciseNames[0]);
  }, [exerciseNames, selectedExercise]);

  const progressionPoints = useMemo(() => {
    if (!selectedExercise) return [];
    const byDate = new Map<string, number>();
    for (const w of workouts) {
      const exs = w.exercises.filter((e) => e.name === selectedExercise);
      if (!exs.length) continue;
      const maxW = Math.max(...exs.map((e) => e.weight));
      byDate.set(w.date, Math.max(byDate.get(w.date) ?? 0, maxW));
    }
    return [...byDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, weight]) => ({ date, weight }));
  }, [workouts, selectedExercise]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function removeWorkout(id: string) {
    if (!confirm("Ta bort detta pass?")) return;
    try {
      await deleteJsonAuth(`/workouts/${id}`, token);
      await loadWorkouts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kunde inte ta bort");
    }
  }

  return (
    <section className="dashboard-content">
      {loadError ? <p className="dashboard-banner-error">{loadError}</p> : null}

      <div className="dashboard-page-head">
        <div>
          <h1>Träning</h1>
          <p className="dashboard-page-sub">Logga och följ dina träningspass</p>
        </div>
        <button
          type="button"
          className="dashboard-head-btn"
          onClick={() => {
            setEditWorkout(null);
            setSubmitError(null);
            setShowModal(true);
          }}
        >
          + Nytt pass
        </button>
      </div>

      <article className="dashboard-section-card">
        <header className="dashboard-section-card-title">Progressionsdiagram</header>
        <div className="dashboard-section-card-body">
          {exerciseNames.length === 0 ? (
            <p className="dashboard-muted">Logga ett pass med övningar för att se progression</p>
          ) : (
            <>
              <div className="dashboard-pill-row">
                {exerciseNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={"dashboard-pill" + (selectedExercise === name ? " is-active" : "")}
                    onClick={() => setSelectedExercise(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className="dashboard-progress-chart">
                {progressionPoints.length < 2 ? (
                  <p className="dashboard-muted">Logga fler pass med denna övning för att se kurvan</p>
                ) : (
                  <WeightSparkline points={progressionPoints} />
                )}
              </div>
            </>
          )}
        </div>
      </article>

      <h2 className="dashboard-history-title">Historik</h2>
      <ul className="training-history">
        {workouts.map((w) => {
          const open = expanded.has(w.id);
          return (
            <li key={w.id} className="training-history-item">
              <div className="training-history-row">
                <button type="button" className="training-chevron" onClick={() => toggleExpand(w.id)} aria-expanded={open}>
                  {open ? "▼" : "▶"}
                </button>
                <div className="training-history-main">
                  <strong>{w.title}</strong>
                  <span className="dashboard-muted">
                    {w.date} · {w.exercises.length} övningar
                  </span>
                </div>
                <div className="training-history-actions">
                  <button
                    type="button"
                    className="training-icon-btn"
                    title="Redigera"
                    onClick={() => {
                      setEditWorkout(w);
                      setSubmitError(null);
                      setShowModal(true);
                    }}
                  >
                    ✎
                  </button>
                  <button type="button" className="training-icon-btn is-danger" title="Ta bort" onClick={() => void removeWorkout(w.id)}>
                    🗑
                  </button>
                </div>
              </div>
              {open ? (
                <ul className="training-exercise-list">
                  {w.exercises.map((ex, i) => (
                    <li key={ex.id ?? i}>
                      {ex.name} — {ex.weight} kg × {ex.sets} × {ex.reps}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
      {workouts.length === 0 ? <p className="dashboard-muted dashboard-history-empty">Inga pass ännu. Tryck &quot;+ Nytt pass&quot;.</p> : null}

      {showModal ? (
        <WorkoutModalForm
          token={token}
          defaultDate={localYmd()}
          mode={editWorkout ? "edit" : "create"}
          workoutId={editWorkout?.id}
          initialWorkout={editWorkout}
          onClose={() => {
            setShowModal(false);
            setEditWorkout(null);
            setSubmitError(null);
          }}
          onSuccess={async () => {
            setShowModal(false);
            setEditWorkout(null);
            setSubmitError(null);
            await loadWorkouts();
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
