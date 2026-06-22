import { useEffect, useState } from "react";
import { fetchMe, type User } from "../api/auth";
import { isDemoMode } from "../lib/demo";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      fetchMe().then(setUser).finally(() => setLoading(false));
      return;
    }
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      })
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
