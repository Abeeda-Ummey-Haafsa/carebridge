import { router } from "expo-router";
import { Alert } from "react-native";
import { useEffect } from "react";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";

let _cachedToken: string | null = null;
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").trim();

export function setAuthToken(token: string | null) {
  _cachedToken = token;
}

function resolveApiUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const normalizedPath = url.replace(/^\/\(api\)\//, "/api/");

  if (API_BASE_URL) {
    const path = normalizedPath.startsWith("/")
      ? normalizedPath
      : `/${normalizedPath}`;
    return `${API_BASE_URL}${path}`;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    const path = normalizedPath.startsWith("/")
      ? normalizedPath
      : `/${normalizedPath}`;
    return `${window.location.origin}${path}`;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost ?? "";
  const hostMatch = hostUri.match(/^(?:exp:\/\/)?([^:/]+)/);
  if (hostMatch?.[1]) {
    const path = normalizedPath.startsWith("/")
      ? normalizedPath
      : `/${normalizedPath}`;
    return `http://${hostMatch[1]}:3000${path}`;
  }

  throw new Error(
    "Missing EXPO_PUBLIC_API_BASE_URL: set the env var or run in web where the origin can be used as a fallback.",
  );
}

export async function fetchAPI(
  url: string,
  options?: RequestInit & { skipAuth?: boolean },
): Promise<any> {
  const fullUrl = resolveApiUrl(url);

  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  const hdrs = new Headers(baseHeaders);
  if (!options?.skipAuth && _cachedToken) {
    hdrs.set("Authorization", `Bearer ${_cachedToken}`);
  }

  const response = await fetch(fullUrl, { ...options, headers: hdrs });

  if (response.status === 401) {
    setAuthToken(null);
    try {
      router.replace("/(auth)/sign-in");
    } catch (e) {
      // router may not be available in some contexts
    }
    throw new Error("Session expired. Please sign in again.");
  }

  if (response.status === 403) {
    try {
      Alert.alert("Access denied.");
    } catch (e) {
      // ignore
    }
    throw new Error("Access denied.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function useSetAuthToken(): void {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) {
      setAuthToken(null);
      return;
    }

    let mounted = true;
    getToken()
      .then((token) => {
        if (mounted) setAuthToken(token ?? null);
      })
      .catch(() => setAuthToken(null));

    return () => {
      mounted = false;
    };
  }, [isSignedIn, getToken]);
}

export default fetchAPI;
