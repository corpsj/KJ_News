"use client";

// Catches errors thrown in the root layout itself (the only boundary that can).
// Must render its own <html>/<body>.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          fontFamily: "sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827" }}>
            일시적인 오류가 발생했습니다
          </h1>
          <p style={{ marginTop: 8, color: "#6b7280", fontSize: "0.9rem" }}>
            잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 16,
              padding: "0.5rem 1.25rem",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
