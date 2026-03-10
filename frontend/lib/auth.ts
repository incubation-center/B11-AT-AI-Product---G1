export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
};

export type SessionResponse = {
  session?: {
    id?: string;
    userId?: string;
  } | null;
  user?: SessionUser | null;
} | null;

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? (JSON.parse(text) as T & { message?: string }) : ({} as T);

  if (!response.ok) {
    const message =
      typeof (data as { message?: string }).message === "string"
        ? (data as { message: string }).message
        : "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export async function signInWithEmail(input: {
  email: string;
  password: string;
  callbackURL?: string;
  rememberMe?: boolean;
}) {
  const response = await fetch(`${API_URL}/api/auth/sign-in/email`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseResponse(response);
}

export async function signUpWithEmail(input: {
  name: string;
  email: string;
  password: string;
  callbackURL?: string;
  rememberMe?: boolean;
}) {
  const response = await fetch(`${API_URL}/api/auth/sign-up/email`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseResponse(response);
}

export async function signOut() {
  const response = await fetch(`${API_URL}/api/auth/sign-out`, {
    method: "POST",
    credentials: "include",
  });

  return parseResponse(response);
}
