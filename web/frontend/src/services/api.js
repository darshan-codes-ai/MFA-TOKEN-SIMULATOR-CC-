const SESSION_KEY = "mfa-demo-session";

export async function apiRequest(path, options = {}) {
  try {
    const response = await fetch(path, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        reason: data.reason,
        message: data.message || "Request failed. Please try again.",
      };
    }

    return { ok: true, status: response.status, ...data };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Unable to reach the server. Please start the backend and try again.",
    };
  }
}

export function loginRequest(username, password) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function generateOtpRequest() {
  return apiRequest("/api/mfa/generate", { method: "POST" });
}

export function verifyOtpRequest(otp) {
  return apiRequest("/api/mfa/verify", {
    method: "POST",
    body: JSON.stringify({ otp }),
  });
}

export function getDashboard() {
  return apiRequest("/api/dashboard");
}

export function getActivity() {
  return apiRequest("/api/activity");
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : { loggedIn: false, mfaVerified: false };
  } catch {
    return { loggedIn: false, mfaVerified: false };
  }
}

export function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
