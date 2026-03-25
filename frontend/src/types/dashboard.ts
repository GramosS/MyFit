// Typer som speglar backend-JSON (camelCase) för dashboard.
export type WorkoutExercise = { name: string; weight: number; sets: number; reps: number };
export type WorkoutItem = {
  id: string;
  title: string;
  date: string;
  exercises: (WorkoutExercise & { id?: string })[];
};
export type MealItem = {
  id: string;
  mealType: string;
  calories: number;
  date: string;
  foodLabel?: string;
  createdAt?: string;
};
export type WeightItem = { id: string; weight: number; date: string };
export type NoteItem = { id: string; date: string; content: string; createdAt: string };
