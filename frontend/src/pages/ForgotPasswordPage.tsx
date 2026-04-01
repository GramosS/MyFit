import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { postJson } from "../lib/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>("");
  const [ok, setOk] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setOk(false);
    setIsLoading(true);
    try {
      await postJson<{ ok: true }>("/auth/forgot-password", { email: email.trim() });
      setOk(true);
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
            <h1>Glömt lösenord</h1>
            <p>Skriv din e-post så skickar vi en återställningslänk.</p>
          </header>

          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <label className="field">
              <span className="field-label">E-post</span>
              <input
                className="field-input"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <button className="cta-button primary auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? "Skickar..." : "Skicka länk"}
            </button>

            <p className="auth-error" role="alert" aria-live="polite">
              {error}
            </p>

            {ok ? (
              <p className="auth-error" style={{ color: "#bbf7d0" }}>
                Om e-posten finns så har en länk skickats.
              </p>
            ) : null}
          </form>

          <footer className="auth-footer">
            <Link className="auth-link" to="/login">
              Tillbaka till logga in
            </Link>
          </footer>
        </section>
      </main>
    </>
  );
}

