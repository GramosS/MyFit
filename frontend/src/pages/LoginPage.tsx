import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postJson } from "../lib/api";
import { setToken } from "../lib/auth";

type AuthResponse = { token: string; user: { id: string; name: string; email: string } };

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
    };

    try {
      const data = await postJson<AuthResponse>("/auth/login", payload);
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
            <h1>Logga in</h1>
            <p>Fortsätt där du slutade.</p>
          </header>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
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
                autoComplete="current-password"
                required
                minLength={8}
              />
            </label>

            <button className="cta-button primary auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? "Loggar in..." : "Logga in"}
            </button>

            <p className="auth-error" role="alert" aria-live="polite">
              {error}
            </p>
          </form>

          <footer className="auth-footer">
            <span>Inget konto än?</span>
            <Link className="auth-link" to="/register">
              Skapa konto
            </Link>
          </footer>
        </section>
      </main>
    </>
  );
}

