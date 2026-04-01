import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

type AskGlobalAssistantBody = {
  question?: string;
  language?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AskGlobalAssistantBody | null;

  if (!body?.question?.trim()) {
    return NextResponse.json({ message: 'question is required' }, { status: 400 });
  }

  const response = await fetch(`${API_URL}/assistant/ask/global`, {
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
