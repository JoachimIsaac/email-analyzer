import { enterDemo } from "../lib/demo";
import { startGoogleLogin } from "../api/auth";
import { C } from "../lib/theme";

export default function LoginPage() {
  return (
    <div
      style={{ backgroundColor: C.bg, minHeight: "100vh" }}
      className="flex items-center justify-center p-4"
    >
      <div
        style={{
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: "16px",
          width: "100%",
          maxWidth: "400px",
        }}
        className="flex flex-col items-center gap-6 p-10"
      >
        {/* Brand mark */}
        <div className="flex flex-col items-center gap-3">
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: `linear-gradient(135deg, ${C.accent}, #818cf8)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
            }}
          >
            📬
          </div>
          <h1 style={{ color: C.text, fontSize: "18px", fontWeight: 700, margin: 0 }}>
            Job Email Classifier
          </h1>
          <p style={{ color: C.muted, fontSize: "13px", textAlign: "center", lineHeight: 1.6, margin: 0 }}>
            Connect Gmail to automatically classify<br />
            rejections, interviews, offers &amp; more.
          </p>
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: "1px", backgroundColor: C.border }} />

        {/* Demo section */}
        <div
          style={{
            width: "100%",
            backgroundColor: `${C.accent}14`,
            border: `1px solid ${C.accent}44`,
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              style={{
                display: "inline-block",
                backgroundColor: C.accent,
                color: "#fff",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                padding: "2px 7px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            >
              Demo
            </span>
            <span style={{ color: "#a5b4fc", fontSize: "12px", fontWeight: 500 }}>
              No account required
            </span>
          </div>
          <p style={{ color: C.muted, fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
            Explore with 30 pre-loaded job emails. Sync up to{" "}
            <span style={{ color: C.text, fontWeight: 600 }}>3 times</span> to discover
            more — watch the classifier run live.
          </p>
          <button
            onClick={enterDemo}
            style={{
              width: "100%",
              backgroundColor: C.accent,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.01em",
            }}
          >
            Try the Demo →
          </button>
        </div>

        {/* Google sign-in */}
        <div style={{ width: "100%" }} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div style={{ flex: 1, height: "1px", backgroundColor: C.border }} />
            <span style={{ color: C.muted, fontSize: "11px" }}>or sign in with Gmail</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: C.border }} />
          </div>

          <button
            onClick={startGoogleLogin}
            className="w-full flex items-center justify-center gap-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "#fff",
              color: "#1f2937",
              border: "none",
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            <GoogleIcon />
            Sign in with Google
          </button>
        </div>

        <p style={{ color: "#374151", fontSize: "11px", textAlign: "center", margin: 0 }}>
          Only Gmail read access is requested.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
