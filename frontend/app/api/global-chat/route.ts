import { NextResponse } from 'next/server';

const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://backend:8080';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ message: 'messages are required' }, { status: 400 });
  }

  const response = await fetch(`${API_URL}/global/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: body.messages }),
    cache: 'no-store',
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => 'Unknown error');
    return NextResponse.json({ message: text }, { status: response.status });
  }

  // Stream the backend response directly to the client
  return new Response(response.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Vercel-AI-Data-Stream': 'v1',
    },
  });
}
