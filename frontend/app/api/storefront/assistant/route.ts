import { NextResponse } from 'next/server';

const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://backend:8080';

type AskAssistantBody = {
  subdomain?: string;
  question?: string;
  session_id?: string;
  anonymous_id?: string;
  language?: string;
};

export async function POST(request: Request) {
  const body = (await request
    .json()
    .catch(() => null)) as AskAssistantBody | null;

  if (!body?.question?.trim()) {
    return NextResponse.json(
      { message: 'question is required' },
      { status: 400 },
    );
  }

  const response = await fetch(`${API_URL}/assistant/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  return NextResponse.json(data, { status: response.status });
}
