import { NextResponse } from 'next/server';

const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://backend:8080';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { message: 'Invalid request body' },
      { status: 400 },
    );
  }

  const hostHeader =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    '';

  const response = await fetch(`${API_URL}/payway/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-host': hostHeader,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  return NextResponse.json(data, { status: response.status });
}
