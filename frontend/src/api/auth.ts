import { DEMO_FLAG, DEMO_USER, exitDemo, isDemoMode } from "../lib/demo";
import { get } from "./client";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export function fetchMe(): Promise<User> {
  if (isDemoMode()) return Promise.resolve(DEMO_USER);
  return get<User>("auth/me");
}

export function startGoogleLogin() {
  window.location.href = "/api/auth/google/login";
}

export function logout() {
  if (isDemoMode()) {
    exitDemo();
    return;
  }
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/";
}

export function isAuthenticated() {
  if (localStorage.getItem(DEMO_FLAG) === "1") return true;
  return !!localStorage.getItem("access_token");
}
