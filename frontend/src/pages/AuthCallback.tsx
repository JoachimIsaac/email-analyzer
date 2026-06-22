import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get("access");
    const refresh = params.get("refresh");
    const error = params.get("error");

    if (error) {
      navigate(`/login?error=${error}`, { replace: true });
      return;
    }

    if (!access || !refresh) {
      // React StrictMode runs effects twice; on the second run the URL has
      // already changed to "/app" so tokens are gone — check localStorage instead.
      if (localStorage.getItem("access_token")) {
        navigate("/app", { replace: true });
      } else {
        navigate("/login?error=missing_tokens", { replace: true });
      }
      return;
    }

    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    navigate("/app", { replace: true });
  }, [navigate]);

  return (
    <div
      style={{ minHeight: "100vh", backgroundColor: "#0d0f1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "14px" }}
    >
      Signing you in…
    </div>
  );
}
