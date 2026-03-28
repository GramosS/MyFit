// Modaler för dashboard.
// Träningspass (skapa/redigera) och måltidslogg med OFF-sök + batch-rader.
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { getJson, postJsonAuth, putJsonAuth } from "../../lib/api";
import type { WorkoutExercise, WorkoutItem } from "../../types/dashboard";

// Modal: skapa nytt pass eller redigera (PUT /workouts/:id).
type WorkoutTemplateKey = "custom" | "chest" | "back" | "shoulders" | "legs" | "arms";

const CHEST_TEMPLATE = {
  key: "chest" as const,
  label: "Bröst",
  title: "Bröstpass",
  // Standard när du väljer "Bröst".
  defaultExercises: [
    { name: "Bänkpress", weight: 0, sets: 4, reps: 8 },
    { name: "Lutande hantelpress", weight: 0, sets: 3, reps: 10 },
    { name: "Kabelpress", weight: 0, sets: 3, reps: 12 },
    { name: "Hantelflyes", weight: 0, sets: 3, reps: 12 },
    { name: "Pec deck", weight: 0, sets: 3, reps: 12 },
    { name: "Dips", weight: 0, sets: 3, reps: 8 },
  ] as WorkoutExercise[],
  // Fler förslag att lägga till med ett klick.
  suggestions: [
    { name: "Bänkpress (smal)", weight: 0, sets: 3, reps: 10 },
    { name: "Smith bänkpress", weight: 0, sets: 3, reps: 8 },
    { name: "Sittande hantelpress", weight: 0, sets: 3, reps: 10 },
    { name: "Hantelpress (horisontell)", weight: 0, sets: 3, reps: 10 },
    { name: "Lutande skivstångpress", weight: 0, sets: 3, reps: 8 },
    { name: "Armhävningar", weight: 0, sets: 3, reps: 20 },
    { name: "Pec deck (maskin)", weight: 0, sets: 3, reps: 12 },
    { name: "Kabel-flyes", weight: 0, sets: 3, reps: 12 },
    { name: "Dips (viktad)", weight: 0, sets: 3, reps: 8 },
    { name: "Hantelflyes (lutande)", weight: 0, sets: 3, reps: 12 },
    { name: "Press i maskin", weight: 0, sets: 3, reps: 10 },
    { name: "Pullover (kabel/ hantel)", weight: 0, sets: 3, reps: 12 },
  ] as WorkoutExercise[],
} satisfies {
  key: "chest";
  label: string;
  title: string;
  defaultExercises: WorkoutExercise[];
  suggestions: WorkoutExercise[];
};

const BACK_TEMPLATE = {
  key: "back" as const,
  label: "Rygg",
  title: "Ryggpass",
  // Standardövningar för rygg.
  defaultExercises: [
    { name: "Marklyft", weight: 0, sets: 4, reps: 6 },
    { name: "Latsdrag", weight: 0, sets: 4, reps: 10 },
    { name: "Skivstångsrodd", weight: 0, sets: 4, reps: 8 },
    { name: "Sittande kabelrodd", weight: 0, sets: 3, reps: 12 },
    { name: "Face pulls", weight: 0, sets: 3, reps: 15 },
    { name: "Ryggresningar", weight: 0, sets: 3, reps: 12 },
  ] as WorkoutExercise[],
  // Fler ryggförslag.
  suggestions: [
    { name: "Pull-ups", weight: 0, sets: 4, reps: 8 },
    { name: "Chins", weight: 0, sets: 4, reps: 8 },
    { name: "T-bar row", weight: 0, sets: 4, reps: 10 },
    { name: "Enarms hantelrodd", weight: 0, sets: 3, reps: 12 },
    { name: "Machine row", weight: 0, sets: 3, reps: 10 },
    { name: "Straight-arm pulldown", weight: 0, sets: 3, reps: 12 },
    { name: "Latsdrag (smalt grepp)", weight: 0, sets: 3, reps: 10 },
    { name: "Latsdrag (brett grepp)", weight: 0, sets: 3, reps: 10 },
    { name: "Seal row", weight: 0, sets: 3, reps: 10 },
    { name: "Inverterad rodd", weight: 0, sets: 3, reps: 12 },
    { name: "Shrugs", weight: 0, sets: 3, reps: 12 },
    { name: "Rack pulls", weight: 0, sets: 4, reps: 6 },
  ] as WorkoutExercise[],
} satisfies {
  key: "back";
  label: string;
  title: string;
  defaultExercises: WorkoutExercise[];
  suggestions: WorkoutExercise[];
};

const SHOULDERS_TEMPLATE = {
  key: "shoulders" as const,
  label: "Axlar",
  title: "Axelpass",
  defaultExercises: [
    { name: "Militärpress", weight: 0, sets: 4, reps: 8 },
    { name: "Sidolyft", weight: 0, sets: 3, reps: 12 },
    { name: "Bakre axlar (hantel)", weight: 0, sets: 3, reps: 12 },
    { name: "Arnoldpress", weight: 0, sets: 3, reps: 10 },
    { name: "Face pulls", weight: 0, sets: 3, reps: 15 },
  ] as WorkoutExercise[],
  suggestions: [
    { name: "Smith militärpress", weight: 0, sets: 4, reps: 8 },
    { name: "Sittande hantelpress", weight: 0, sets: 3, reps: 10 },
    { name: "Kabel sidolyft", weight: 0, sets: 3, reps: 15 },
    { name: "Upright row", weight: 0, sets: 3, reps: 10 },
    { name: "Bakre axlar (kabel)", weight: 0, sets: 3, reps: 12 },
    { name: "Bakre axlar (maskin)", weight: 0, sets: 3, reps: 12 },
    { name: "Frontlyft", weight: 0, sets: 3, reps: 12 },
    { name: "Landmine press", weight: 0, sets: 3, reps: 10 },
    { name: "Shrugs", weight: 0, sets: 3, reps: 12 },
    { name: "Plate front raise", weight: 0, sets: 3, reps: 12 },
    { name: "Y-raise", weight: 0, sets: 3, reps: 12 },
    { name: "Reverse pec deck", weight: 0, sets: 3, reps: 12 },
  ] as WorkoutExercise[],
} satisfies {
  key: "shoulders";
  label: string;
  title: string;
  defaultExercises: WorkoutExercise[];
  suggestions: WorkoutExercise[];
};

const LEGS_TEMPLATE = {
  key: "legs" as const,
  label: "Ben",
  title: "Benpass",
  defaultExercises: [
    { name: "Knäböj", weight: 0, sets: 4, reps: 8 },
    { name: "Benspark", weight: 0, sets: 4, reps: 10 },
    { name: "Rumänsk marklyft", weight: 0, sets: 3, reps: 10 },
    { name: "Leg curl", weight: 0, sets: 3, reps: 12 },
    { name: "Vadpress", weight: 0, sets: 4, reps: 12 },
  ] as WorkoutExercise[],
  suggestions: [
    { name: "Frontböj", weight: 0, sets: 4, reps: 8 },
    { name: "Hack squat", weight: 0, sets: 4, reps: 10 },
    { name: "Leg extension", weight: 0, sets: 3, reps: 15 },
    { name: "Utfall", weight: 0, sets: 3, reps: 10 },
    { name: "Bulgarian split squat", weight: 0, sets: 3, reps: 10 },
    { name: "Glute bridge", weight: 0, sets: 3, reps: 12 },
    { name: "Hip thrust", weight: 0, sets: 4, reps: 8 },
    { name: "Goblet squat", weight: 0, sets: 3, reps: 12 },
    { name: "Sissy squat", weight: 0, sets: 3, reps: 12 },
    { name: "Adduktion (maskin)", weight: 0, sets: 3, reps: 15 },
    { name: "Abduktion (maskin)", weight: 0, sets: 3, reps: 15 },
    { name: "Stående vadpress", weight: 0, sets: 4, reps: 12 },
    { name: "Sittande vadpress", weight: 0, sets: 4, reps: 12 },
  ] as WorkoutExercise[],
} satisfies {
  key: "legs";
  label: string;
  title: string;
  defaultExercises: WorkoutExercise[];
  suggestions: WorkoutExercise[];
};

const ARMS_TEMPLATE = {
  key: "arms" as const,
  label: "Biceps / triceps",
  title: "Armpass",
  defaultExercises: [
    { name: "Stående skivstångscurl", weight: 0, sets: 4, reps: 10 },
    { name: "Hammercurl", weight: 0, sets: 3, reps: 12 },
    { name: "Triceps pushdown (rep)", weight: 0, sets: 4, reps: 12 },
    { name: "Överhuvud extension (rep)", weight: 0, sets: 3, reps: 12 },
    { name: "Franskpress", weight: 0, sets: 3, reps: 10 },
  ] as WorkoutExercise[],
  suggestions: [
    { name: "Hantelcurl (växlande)", weight: 0, sets: 3, reps: 12 },
    { name: "Preachercurl", weight: 0, sets: 3, reps: 10 },
    { name: "Kabelcurl", weight: 0, sets: 3, reps: 12 },
    { name: "Koncentrationscurl", weight: 0, sets: 3, reps: 12 },
    { name: "Spider curl", weight: 0, sets: 3, reps: 10 },
    { name: "Incline hantelcurl", weight: 0, sets: 3, reps: 10 },
    { name: "Triceps pushdown (rep)", weight: 0, sets: 4, reps: 12 },
    { name: "Triceps pushdown (snöre)", weight: 0, sets: 3, reps: 15 },
    { name: "Dips (triceps)", weight: 0, sets: 3, reps: 10 },
    { name: "Nära bänkpress", weight: 0, sets: 4, reps: 8 },
    { name: "Triceps kickback", weight: 0, sets: 3, reps: 12 },
    { name: "Överhuvud rep-extension", weight: 0, sets: 3, reps: 12 },
    { name: "Kabel över huvudet", weight: 0, sets: 3, reps: 12 },
    { name: "JM press", weight: 0, sets: 3, reps: 8 },
  ] as WorkoutExercise[],
} satisfies {
  key: "arms";
  label: string;
  title: string;
  defaultExercises: WorkoutExercise[];
  suggestions: WorkoutExercise[];
};

const WORKOUT_TEMPLATES = {
  chest: CHEST_TEMPLATE,
  back: BACK_TEMPLATE,
  shoulders: SHOULDERS_TEMPLATE,
  legs: LEGS_TEMPLATE,
  arms: ARMS_TEMPLATE,
} as const;

export function WorkoutModalForm({
  token,
  defaultDate,
  onClose,
  onSuccess,
  submitting,
  setSubmitting,
  submitError,
  setSubmitError,
  mode = "create",
  workoutId,
  initialWorkout,
}: {
  token: string;
  defaultDate: string;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  submitError: string | null;
  setSubmitError: (v: string | null) => void;
  mode?: "create" | "edit";
  workoutId?: string;
  initialWorkout?: WorkoutItem | null;
}) {
  // Lokalt formulärstate; övningar hålls som array (backend förväntar samma struktur)
  const [title, setTitle] = useState(initialWorkout?.title ?? "Träningspass");
  const [date, setDate] = useState(initialWorkout?.date ?? defaultDate);
  const [template, setTemplate] = useState<WorkoutTemplateKey>(() => (initialWorkout ? "custom" : "custom"));
  const [exercises, setExercises] = useState<WorkoutExercise[]>(() =>
    initialWorkout?.exercises?.length
      ? initialWorkout.exercises.map((e) => ({
          name: e.name,
          weight: e.weight,
          sets: e.sets,
          reps: e.reps,
        }))
      : [{ name: "", weight: 0, sets: 3, reps: 10 }]
  );

  // Synka formulär när man öppnar för redigering eller byter defaultdatum
  useEffect(() => {
    if (initialWorkout) {
      setTitle(initialWorkout.title);
      setDate(initialWorkout.date);
      setExercises(
        initialWorkout.exercises.map((e) => ({
          name: e.name,
          weight: e.weight,
          sets: e.sets,
          reps: e.reps,
        }))
      );
      setTemplate("custom");
    } else {
      setTitle("Träningspass");
      setDate(defaultDate);
      setExercises([{ name: "", weight: 0, sets: 3, reps: 10 }]);
      setTemplate("custom");
    }
  }, [initialWorkout, defaultDate]);

  function applyTemplate(next: WorkoutTemplateKey) {
    setTemplate(next);
    setSubmitError(null);
    if (next !== "custom") {
      const tpl = WORKOUT_TEMPLATES[next];
      setTitle(tpl.title);
      // Visa inte förifyllda övningar direkt.
      // Fyll dem stegvis när användaren klickar på förslag.
      setExercises([{ name: "", weight: 0, sets: 3, reps: 10 }]);
      return;
    }

    setTitle("Träningspass");
    setExercises([{ name: "", weight: 0, sets: 3, reps: 10 }]);
  }

  function addSuggestedExercise(ex: WorkoutExercise) {
    setExercises((prev) => {
      if (prev.some((p) => p.name === ex.name)) return prev;

      const next = [...prev];
      // Fyll första tomma rad (övning 1, sen 2, osv).
      const emptyIndex = next.findIndex((p) => !p.name.trim());
      if (emptyIndex !== -1) next[emptyIndex] = { ...ex };
      else next.push({ ...ex });

      // Se till att det alltid finns en tom rad längst ner.
      const hasEmpty = next.some((p) => !p.name.trim());
      if (!hasEmpty) next.push({ name: "", weight: 0, sets: 3, reps: 10 });

      return next;
    });
  }

  function removeExerciseAt(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  const activeTemplate = template !== "custom" ? WORKOUT_TEMPLATES[template] : null;

  // Skickar övningar till API.
  // Tomma rader filtreras bort.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const cleaned = exercises
      .map((ex) => ({
        name: ex.name.trim(),
        weight: Number(ex.weight),
        sets: Number(ex.sets),
        reps: Number(ex.reps),
      }))
      .filter((ex) => ex.name.length > 0);
    if (cleaned.length === 0) {
      setSubmitError("Lägg till minst en övning med namn.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { title: title.trim() || "Träningspass", date, exercises: cleaned };
      if (mode === "edit" && workoutId) {
        await putJsonAuth(`/workouts/${workoutId}`, payload, token);
      } else {
        await postJsonAuth("/workouts", payload, token);
      }
      await onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Kunde inte spara");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // Klick på backdrop stänger; klick på själva dialogen bubblas inte upp
    <div className="dashboard-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="dashboard-modal" role="dialog" aria-labelledby="modal-workout-title" onClick={(ev) => ev.stopPropagation()}>
        <h2 id="modal-workout-title">{mode === "edit" ? "Redigera pass" : "Nytt träningspass"}</h2>
        <form className="dashboard-modal-form" onSubmit={handleSubmit}>
          <label className="dashboard-field">
            <span>Rubrik / kroppsdel</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="dashboard-field">
            <span>Datum</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="dashboard-field">
            <span>Välj pass</span>
            <select
              value={template}
              disabled={mode === "edit"}
              onChange={(e) => applyTemplate(e.target.value as WorkoutTemplateKey)}
            >
              <option value="custom">Manuellt</option>
              <option value="chest">Bröst</option>
              <option value="back">Rygg</option>
              <option value="shoulders">Axlar</option>
              <option value="legs">Ben</option>
              <option value="arms">Biceps / triceps</option>
            </select>
          </label>

          {activeTemplate ? (
            <div className="dashboard-exercises">
              <span className="dashboard-field-label">Förslag</span>
              <div className="dashboard-pill-row">
                {activeTemplate.suggestions.map((ex) => {
                  const exists = exercises.some((p) => p.name === ex.name);
                  return (
                    <button
                      key={ex.name}
                      type="button"
                      className={"dashboard-pill" + (exists ? " is-active" : "")}
                      disabled={exists}
                      onClick={() => addSuggestedExercise(ex)}
                    >
                      {ex.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="dashboard-exercises">
            <span className="dashboard-field-label">Övningar</span>
            {exercises.map((ex, i) => (
              <div key={i} className="dashboard-exercise-row">
                <input
                  placeholder="Namn"
                  value={ex.name}
                  onChange={(e) => {
                    const next = [...exercises];
                    next[i] = { ...next[i], name: e.target.value };
                    setExercises(next);
                  }}
                />
                <input
                  type="number"
                  placeholder="Vikt"
                  min={0}
                  step={0.5}
                  value={ex.weight || ""}
                  onChange={(e) => {
                    const next = [...exercises];
                    next[i] = { ...next[i], weight: Number(e.target.value) };
                    setExercises(next);
                  }}
                />
                <input
                  type="number"
                  placeholder="Set"
                  min={1}
                  value={ex.sets || ""}
                  onChange={(e) => {
                    const next = [...exercises];
                    next[i] = { ...next[i], sets: Number(e.target.value) };
                    setExercises(next);
                  }}
                />
                <input
                  type="number"
                  placeholder="Reps"
                  min={1}
                  value={ex.reps || ""}
                  onChange={(e) => {
                    const next = [...exercises];
                    next[i] = { ...next[i], reps: Number(e.target.value) };
                    setExercises(next);
                  }}
                />
                {exercises.length > 1 ? (
                  <button type="button" className="dashboard-exercise-remove" onClick={() => removeExerciseAt(i)}>
                    Ta bort
                  </button>
                ) : (
                  <span />
                )}
              </div>
            ))}
            <button
              type="button"
              className="dashboard-modal-secondary"
              onClick={() => setExercises([...exercises, { name: "", weight: 0, sets: 3, reps: 10 }])}
            >
              + Lägg till övning
            </button>
          </div>
          {submitError ? <p className="dashboard-modal-error">{submitError}</p> : null}
          <div className="dashboard-modal-actions">
            <button type="button" className="dashboard-modal-secondary" onClick={onClose}>
              Avbryt
            </button>
            <button type="submit" className="dashboard-modal-primary" disabled={submitting}>
              {submitting ? "Sparar…" : mode === "edit" ? "Spara ändringar" : "Spara pass"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type FoodSearchItem = {
  name: string;
  code: string | null;
  brand: string | null;
  kcalPer100g: number | null;
  kcalPerServing: number | null;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbsPer100g: number | null;
  proteinPerServing: number | null;
  fatPerServing: number | null;
  carbsPerServing: number | null;
};

// Avrunda makron till en decimal för visning.
function roundMacro(n: number): number {
  return Math.round(n * 10) / 10;
}

// Skala protein/fett/kolhydrater för vald vikt.
function scaleMacroPer100g(value: number | null, grams: number): number | null {
  if (value == null || !Number.isFinite(grams) || grams <= 0) return null;
  return roundMacro((value * grams) / 100);
}

// Skala makron när data är per portion.
function scaleMacroServing(value: number | null, portions: number): number | null {
  if (value == null || !Number.isFinite(portions) || portions <= 0) return null;
  return roundMacro(value * portions);
}

function fmtMacroVal(n: number | null): string {
  if (n == null) return "—";
  return String(n);
}

// Rad i kön innan sparning.
// `key` är stabil nyckel (crypto.randomUUID).
type PendingMealLine = { key: string; foodLabel?: string; calories: number };

// Modal: sök mat, flera rader per måltid.
// Sparar med POST /meals/batch.
export function MealModalForm({
  token,
  defaultDate,
  onClose,
  onSuccess,
  submitting,
  setSubmitting,
  submitError,
  setSubmitError,
}: {
  token: string;
  defaultDate: string;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  submitError: string | null;
  setSubmitError: (v: string | null) => void;
}) {
  const [mealType, setMealType] = useState<"frukost" | "lunch" | "middag" | "mellanmål">("lunch");
  const [calories, setCalories] = useState(0);
  const [date, setDate] = useState(defaultDate);
  const [pendingLines, setPendingLines] = useState<PendingMealLine[]>([]);
  // Pågående rad (sök + vald produkt + kalorier)
  const [foodLabel, setFoodLabel] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [swedishOnly, setSwedishOnly] = useState(true);
  const [hits, setHits] = useState<FoodSearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodSearchItem | null>(null);
  const [grams, setGrams] = useState(100);
  const [portions, setPortions] = useState(1);
  // Om true: ändra inte kalorier när gram/portioner ändras.
  const [manualCalories, setManualCalories] = useState(false);

  // Debounce så vi inte anropar API vid varje tangenttryckning
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchQ.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchQ]);

  useEffect(() => {
    if (debouncedQ.length < 2) {
      setHits([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    setSearchError(null);
    const sw = swedishOnly ? "&swedish=1" : "";
    void getJson<{ items: FoodSearchItem[] }>(
      `/foods/search?q=${encodeURIComponent(debouncedQ)}${sw}`,
      token
    )
      .then((res) => {
        if (!cancelled) setHits(res.items ?? []);
      })
      .catch((err: Error & { status?: number }) => {
        if (!cancelled) {
          setHits([]);
          setSearchError(err.message || "Sökning misslyckades");
        }
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, swedishOnly, token]);

  // Uppdatera kalorier från vald produkt så länge användaren inte låst manuellt värde
  useEffect(() => {
    if (manualCalories || !selected) return;
    if (selected.kcalPer100g != null) {
      setCalories(Math.max(0, Math.round((selected.kcalPer100g * grams) / 100)));
    } else if (selected.kcalPerServing != null) {
      setCalories(Math.max(0, Math.round(selected.kcalPerServing * portions)));
    }
  }, [selected, grams, portions, manualCalories]);

  // Välj en träff.
  // Fyll namn och sätt standardvärden, töm söklista.
  function pickFood(item: FoodSearchItem) {
    setSelected(item);
    setFoodLabel(item.brand ? `${item.name} (${item.brand})` : item.name);
    setManualCalories(false);
    if (item.kcalPer100g != null) {
      setGrams(100);
      setCalories(Math.max(0, Math.round(item.kcalPer100g)));
    } else if (item.kcalPerServing != null) {
      setPortions(1);
      setCalories(Math.max(0, Math.round(item.kcalPerServing)));
    }
    setSearchQ("");
    setHits([]);
  }

  function clearSelection() {
    setSelected(null);
    setManualCalories(false);
  }

  // Efter "Lägg till i måltid": rensa byggaren för nästa rätt.
  function resetCurrentLine() {
    clearSelection();
    setFoodLabel("");
    setSearchQ("");
    setHits([]);
    setGrams(100);
    setPortions(1);
    setCalories(0);
    setManualCalories(false);
  }

  // True om raden kan sparas eller läggas i kön.
  const currentLineHasContent =
    selected != null || foodLabel.trim().length > 0 || calories > 0;

  // Flyttar raden till kön och nollställer byggaren.
  function addCurrentLineToPending() {
    setSubmitError(null);
    const c = Math.round(calories);
    if (c < 0 || c > 10000) {
      setSubmitError("Kalorier måste vara 0–10 000 per rad.");
      return;
    }
    if (!currentLineHasContent) {
      setSubmitError("Välj en produkt, skriv ett namn eller ange kalorier innan du lägger till raden.");
      return;
    }
    const label = foodLabel.trim();
    setPendingLines((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        calories: c,
        ...(label ? { foodLabel: label } : {}),
      },
    ]);
    resetCurrentLine();
  }

  // Tar bort en rad ur kön.
  function removePendingLine(key: string) {
    setPendingLines((prev) => prev.filter((l) => l.key !== key));
  }

  // Bygger payload till /meals/batch.
  // pending-rader + ev. pågående rad som inte lagts i kön än.
  // Returnerar null om validering misslyckas.
  function buildBatchItems(): { calories: number; foodLabel?: string }[] | null {
    const items: { calories: number; foodLabel?: string }[] = pendingLines.map((l) => ({
      calories: l.calories,
      ...(l.foodLabel?.trim() ? { foodLabel: l.foodLabel.trim() } : {}),
    }));
    const curCal = Math.round(calories);
    if (curCal < 0 || curCal > 10000) {
      setSubmitError("Kalorier måste vara 0–10 000 per rad.");
      return null;
    }
    if (currentLineHasContent) {
      const lab = foodLabel.trim();
      items.push({
        calories: curCal,
        ...(lab ? { foodLabel: lab } : {}),
      });
    }
    if (items.length === 0) {
      setSubmitError("Lägg till minst en rad (eller fyll i en sista rad och spara).");
      return null;
    }
    return items;
  }

  const pendingTotalKcal = useMemo(
    () => pendingLines.reduce((s, l) => s + l.calories, 0),
    [pendingLines]
  );

  // Minst en rad krävs för att aktivera Spara.
  const canSubmitMeal = pendingLines.length > 0 || currentLineHasContent;

  // Ett API-anrop för hela måltiden.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const items = buildBatchItems();
    if (!items) return;
    setSubmitting(true);
    try {
      await postJsonAuth("/meals/batch", { mealType, date, items }, token);
      await onSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Kunde inte spara");
    } finally {
      setSubmitting(false);
    }
  }

  const showGrams = selected?.kcalPer100g != null;
  // Produkten har bara energi per portion.
  const showPortions = selected != null && selected.kcalPer100g == null && selected.kcalPerServing != null;

  // P/F/Kh skalat för valt gram eller antal portioner.
  const macroForPortion = useMemo(() => {
    if (!selected) return null;
    if (showGrams) {
      return {
        protein: scaleMacroPer100g(selected.proteinPer100g, grams),
        fat: scaleMacroPer100g(selected.fatPer100g, grams),
        carbs: scaleMacroPer100g(selected.carbsPer100g, grams),
        hint: `Beräknat för ${grams} g (värden från Open Food Facts när de finns).`,
      };
    }
    if (showPortions) {
      return {
        protein: scaleMacroServing(selected.proteinPerServing, portions),
        fat: scaleMacroServing(selected.fatPerServing, portions),
        carbs: scaleMacroServing(selected.carbsPerServing, portions),
        hint: `Beräknat för ${portions} portion(er).`,
      };
    }
    return null;
  }, [selected, showGrams, showPortions, grams, portions]);

  // Extra rad för jämförelse.
  // När per-100g finns men vi kör portionsläge.
  const macroRef100 = useMemo(() => {
    if (!selected) return null;
    const has =
      selected.proteinPer100g != null ||
      selected.fatPer100g != null ||
      selected.carbsPer100g != null;
    if (!has) return null;
    return {
      protein: selected.proteinPer100g,
      fat: selected.fatPer100g,
      carbs: selected.carbsPer100g,
    };
  }, [selected]);

  // Brett modal-UI: söklista, kö av rader, makrofält, batch-sparning
  return (
    <div className="dashboard-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="dashboard-modal dashboard-modal-wide" role="dialog" aria-labelledby="modal-meal-title" onClick={(ev) => ev.stopPropagation()}>
        <h2 id="modal-meal-title">Logga måltid</h2>
        <p className="dashboard-modal-hint">
          Välj måltid och datum, lägg sedan till en rad i taget (t.ex. havregryn, mjölk, ägg). Använd <strong>Lägg till i måltid</strong> mellan varje rätt och spara när allt är klart. Du kan också spara en enda rad utan att använda kön.
        </p>
        <form className="dashboard-modal-form" onSubmit={handleSubmit}>
          <label className="dashboard-field">
            <span>Måltid</span>
            <select value={mealType} onChange={(e) => setMealType(e.target.value as typeof mealType)}>
              <option value="frukost">Frukost</option>
              <option value="lunch">Lunch</option>
              <option value="middag">Middag</option>
              <option value="mellanmål">Mellanmål</option>
            </select>
          </label>
          <label className="dashboard-field">
            <span>Datum</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>

          {pendingLines.length > 0 ? (
            <div className="dashboard-meal-pending">
              <span className="dashboard-meal-pending-title">I denna måltid ({pendingLines.length} rätter)</span>
              <ul className="dashboard-meal-pending-list">
                {pendingLines.map((line) => (
                  <li key={line.key} className="dashboard-meal-pending-item">
                    <span className="dashboard-meal-pending-text">
                      {line.foodLabel ? <strong>{line.foodLabel}</strong> : <em>Utan namn</em>}
                      <span className="dashboard-meal-pending-kcal">{line.calories} kcal</span>
                    </span>
                    <button
                      type="button"
                      className="dashboard-meal-pending-remove"
                      onClick={() => removePendingLine(line.key)}
                      aria-label="Ta bort rad"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <p className="dashboard-meal-pending-sum">Summa i kön: {pendingTotalKcal} kcal</p>
            </div>
          ) : null}

          <p className="dashboard-meal-builder-label">Ny rad</p>

          <div className="dashboard-food-search">
            <label className="dashboard-field">
              <span>Sök mat / produkt</span>
              <input
                type="search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="t.ex. kycklingfilé, havregryn, filmjölk"
                autoComplete="off"
              />
            </label>
            <label className="dashboard-food-checkbox">
              <input type="checkbox" checked={swedishOnly} onChange={(e) => setSwedishOnly(e.target.checked)} />
              <span>Prioritera produkter kopplade till Sverige</span>
            </label>
            {searchLoading ? <p className="dashboard-muted dashboard-food-search-status">Söker…</p> : null}
            {searchError ? <p className="dashboard-modal-error dashboard-food-search-status">{searchError}</p> : null}
            {hits.length > 0 ? (
              <ul className="dashboard-food-hits" role="listbox">
                {hits.map((h, i) => (
                  <li key={`${h.code ?? h.name}-${i}`}>
                    <button type="button" className="dashboard-food-hit-btn" onClick={() => pickFood(h)}>
                      <span className="dashboard-food-hit-name">{h.name}</span>
                      {h.brand ? <span className="dashboard-food-hit-brand">{h.brand}</span> : null}
                      {h.proteinPer100g != null || h.fatPer100g != null || h.carbsPer100g != null ? (
                        <span className="dashboard-food-hit-macros">
                          P {fmtMacroVal(h.proteinPer100g)} · F {fmtMacroVal(h.fatPer100g)} · KH {fmtMacroVal(h.carbsPer100g)} g/100 g
                        </span>
                      ) : null}
                      <span className="dashboard-food-hit-kcal">
                        {h.kcalPer100g != null ? `${h.kcalPer100g} kcal/100 g` : ""}
                        {h.kcalPer100g == null && h.kcalPerServing != null ? `${h.kcalPerServing} kcal/port` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {selected ? (
            <div className="dashboard-food-selected">
              <span>
                Vald: <strong>{selected.name}</strong>
                {selected.brand ? ` · ${selected.brand}` : ""}
              </span>
              <button type="button" className="dashboard-modal-secondary dashboard-food-clear" onClick={clearSelection}>
                Rensa val
              </button>
            </div>
          ) : null}

          {selected && macroForPortion ? (
            <div className="dashboard-food-macros" aria-label="Näringsvärden för vald mängd">
              <span className="dashboard-food-macros-title">Näringsvärden (denna loggning)</span>
              <p className="dashboard-food-macros-hint">{macroForPortion.hint}</p>
              <div className="dashboard-food-macros-grid">
                <div>
                  <span className="dashboard-food-macro-label">Protein</span>
                  <span className="dashboard-food-macro-val">{fmtMacroVal(macroForPortion.protein)} g</span>
                </div>
                <div>
                  <span className="dashboard-food-macro-label">Fett</span>
                  <span className="dashboard-food-macro-val">{fmtMacroVal(macroForPortion.fat)} g</span>
                </div>
                <div>
                  <span className="dashboard-food-macro-label">Kolhydrater</span>
                  <span className="dashboard-food-macro-val">{fmtMacroVal(macroForPortion.carbs)} g</span>
                </div>
              </div>
              {macroRef100 && showPortions ? (
                <p className="dashboard-food-macros-ref">
                  Referens per 100 g: P {fmtMacroVal(macroRef100.protein)} · F {fmtMacroVal(macroRef100.fat)} · KH{" "}
                  {fmtMacroVal(macroRef100.carbs)} g
                </p>
              ) : null}
            </div>
          ) : null}

          {showGrams ? (
            <label className="dashboard-field">
              <span>Gram</span>
              <input
                type="number"
                min={1}
                max={5000}
                step={1}
                value={grams}
                onChange={(e) => {
                  setGrams(Number(e.target.value));
                  setManualCalories(false);
                }}
              />
            </label>
          ) : null}

          {showPortions ? (
            <label className="dashboard-field">
              <span>Antal portioner (enligt förpackning)</span>
              <input
                type="number"
                min={0.25}
                max={50}
                step={0.25}
                value={portions}
                onChange={(e) => {
                  setPortions(Number(e.target.value));
                  setManualCalories(false);
                }}
              />
            </label>
          ) : null}

          <label className="dashboard-field">
            <span>Namn i loggen (valfritt)</span>
            <input
              value={foodLabel}
              onChange={(e) => setFoodLabel(e.target.value)}
              placeholder="Visas i kosthistoriken"
            />
          </label>

          <label className="dashboard-field">
            <span>Kalorier (denna rad)</span>
            <input
              type="number"
              min={0}
              max={10000}
              value={calories}
              onChange={(e) => {
                setManualCalories(true);
                setCalories(Number(e.target.value));
              }}
            />
          </label>
          <label className="dashboard-field dashboard-field-inline">
            <input
              type="checkbox"
              checked={manualCalories}
              onChange={(e) => setManualCalories(e.target.checked)}
            />
            <span>Lås manuella kalorier (uppdateras inte när du ändrar gram/portioner)</span>
          </label>

          <div className="dashboard-meal-add-row">
            <button type="button" className="dashboard-modal-secondary" onClick={addCurrentLineToPending}>
              + Lägg till i måltid
            </button>
            <span className="dashboard-muted dashboard-meal-add-hint">Lägger nuvarande rad i kön så du kan lägga till nästa.</span>
          </div>

          {submitError ? <p className="dashboard-modal-error">{submitError}</p> : null}
          <div className="dashboard-modal-actions">
            <button type="button" className="dashboard-modal-secondary" onClick={onClose}>
              Avbryt
            </button>
            <button type="submit" className="dashboard-modal-primary" disabled={submitting || !canSubmitMeal}>
              {submitting
                ? "Sparar…"
                : (() => {
                    const draft = currentLineHasContent ? 1 : 0;
                    const n = pendingLines.length + draft;
                    return n > 1 ? `Spara ${n} rätter` : "Spara måltid";
                  })()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
