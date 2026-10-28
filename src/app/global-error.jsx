"use client";

// Rendered when the root layout itself fails, so it cannot rely on the site
// stylesheet, navbar or auth context.
export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0f172a", color: "#f8fafc", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" }}>
        <main style={{ maxWidth: 480, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: "#cbd5e1", lineHeight: 1.6, marginBottom: 24 }}>
            Mukh4mmadov IELTS could not load. Your saved drafts on this device are safe. Please try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ border: 0, borderRadius: 16, padding: "12px 20px", background: "#0284c7", color: "#fff", fontWeight: 600, fontSize: 16, cursor: "pointer" }}
          >
            Try again
          </button>
          <p style={{ marginTop: 16 }}>
            <a href="/home" style={{ color: "#7dd3fc" }}>Go to the home page</a>
          </p>
        </main>
      </body>
    </html>
  );
}
