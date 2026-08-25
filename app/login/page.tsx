"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const params = new URLSearchParams(window.location.search);
        window.location.href = params.get("redirect") || "/studio";
      } else {
        const data = (await response.json()) as { error?: string };
        setError(data.error || "Incorrect password.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-mark" aria-hidden="true">O</span>
          <div>
            <strong>Sunday Data</strong>
            <span>Editorial Studio</span>
          </div>
        </div>
        <h1>Sign in to the studio</h1>
        <p>Enter the team password to access the editorial tools.</p>
        <form onSubmit={handleSubmit}>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Team password"
              autoFocus
              required
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Enter the studio"}
          </button>
        </form>
        <a href="/" className="login-back">← Back to Sunday Data</a>
      </div>
    </main>
  );
}
