import { type FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { postJson } from "../lib/api";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [ok, setOk] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setOk(false);
    setIsLoading(true);
    try {
      await postJson<{ ok: true }>("/auth/reset-password", { token, password });
      setOk(true);
      window.setTimeout(() => navigate("/login", { replace: true }), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setIsLoading(false);
    }
  }

  const missingToken = token.trim().length < 10;

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
            <h1>Återställ lösenord</h1>
            <p>Välj ett nytt lösenord.</p>
          </header>

          {missingToken ? (
            <>
              <p className="auth-error" role="alert">
                Ogiltig eller saknad länk.
              </p>
              <footer className="auth-footer">
                <Link className="auth-link" to="/forgot-password">
                  Skicka ny länk
                </Link>
              </footer>
            </>
          ) : (
            <form className="auth-form" onSubmit={onSubmit} noValidate>
              <label className="field">
                <span className="field-label">Nytt lösenord</span>
                <input
                  className="field-input"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              <button className="cta-button primary auth-submit" type="submit" disabled={isLoading}>
                {isLoading ? "Sparar..." : "Spara nytt lösenord"}
              </button>

              <p className="auth-error" role="alert" aria-live="polite">
                {error}
              </p>

              {ok ? (
                <p className="auth-error" style={{ color: "#bbf7d0" }}>
                  Klart! Du skickas till inloggning…
                </p>
              ) : null}
            </form>
          )}
        </section>
      </main>
    </>
  );
}

