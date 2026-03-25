// Ny användare: register, sparar JWT och går till dashboard.
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postJson } from "../lib/api";
import { setToken } from "../lib/auth";

type AuthResponse = { token: string; user: { id: string; name: string; email: string } };

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    // FormData → JSON; validering sker även på servern (Zod)
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
    };

    try {
      const data = await postJson<AuthResponse>("/auth/register", payload);
      setToken(data.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <header className="top-nav">
        <Link className="logo" to="/" aria-label="Till startsidan">
          MyFit
        </Link>
      </header>

      <main className="auth-main">
        <section className="auth-card">
          <header className="auth-header">
            <h1>Skapa konto</h1>
            <p>Kom igång på mindre än en minut.</p>
          </header>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <label className="field">
              <span className="field-label">Namn</span>
              <input className="field-input" name="name" autoComplete="name" required minLength={2} />
            </label>

            <label className="field">
              <span className="field-label">E-post</span>
              <input className="field-input" type="email" name="email" autoComplete="email" required />
            </label>

            <label className="field">
              <span className="field-label">Lösenord</span>
              <input
                className="field-input"
                type="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </label>

            <button className="cta-button primary auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? "Skapar..." : "Skapa konto"}
            </button>

            <p className="auth-error" role="alert" aria-live="polite">
              {error}
            </p>
          </form>

          <footer className="auth-footer">
            <span>Har du redan konto?</span>
            <Link className="auth-link" to="/login">
              Logga in
            </Link>
          </footer>
        </section>
      </main>
    </>
  );
}

