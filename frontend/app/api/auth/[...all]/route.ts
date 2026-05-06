import { NextResponse } from 'next/server';

const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://backend:8080';

export const dynamic = 'force-dynamic';

async function proxyAuth(request: Request, params: { all?: string[] }) {
  const path = (params.all ?? []).join('/');
  const incomingUrl = new URL(request.url);
  const targetUrl = `${API_URL}/api/auth/${path}${incomingUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');

  const method = request.method.toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();

  const response = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: 'manual',
    cache: 'no-store',
  });

  const responseHeaders = new Headers(response.headers);
  return new NextResponse(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

type Context = {
  params: Promise<{ all?: string[] }>;
};

export async function GET(request: Request, context: Context) {
  return proxyAuth(request, await context.params);
}

export async function POST(request: Request, context: Context) {
  return proxyAuth(request, await context.params);
}

export async function PUT(request: Request, context: Context) {
  return proxyAuth(request, await context.params);
}

export async function PATCH(request: Request, context: Context) {
  return proxyAuth(request, await context.params);
}

export async function DELETE(request: Request, context: Context) {
  return proxyAuth(request, await context.params);
}

export async function OPTIONS(request: Request, context: Context) {
  return proxyAuth(request, await context.params);
}
