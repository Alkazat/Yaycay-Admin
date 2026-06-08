import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/config';

/*
 * Public health endpoint for the deploy smoke test. Reports liveness and
 * whether the Supabase admin connection is configured. Carries no customer
 * data and requires no auth.
 */
export function GET() {
  return NextResponse.json({
    status: 'ok',
    supabaseConfigured: isSupabaseConfigured(),
    time: new Date().toISOString(),
  });
}
