// middleware.ts

import { NextResponse } from 'next/server';

export function middleware(request) {
  // New proxy logic
  const url = request.nextUrl.clone();
  // Implement your proxy logic here

  return NextResponse.rewrite(url);
}