import { Card } from '@/components/ui';
import { isAdminDataLive } from '@/lib/config';
import { probeAdminApi } from '@/lib/data';

/*
 * A consistent, honest status line for every admin screen. Without it, a
 * fail-soft empty list is ambiguous: "no data" looks identical to "the endpoint
 * is down". This resolves that:
 *  - not configured -> the screen is on stub data (sample, not real);
 *  - live but the API errors -> a red banner with the failing status, so an
 *    empty screen below it is explained;
 *  - live and healthy -> nothing (stay out of the way).
 *
 * The liveness probe hits /admin/jobs (the documented probe endpoint); pages
 * that already have a probe result can pass it in to avoid a second call.
 */
export async function ApiStatusBanner({
  probe,
}: {
  probe?: { ok: true } | { ok: false; status: number; message: string };
}) {
  if (!isAdminDataLive()) {
    return (
      <Card title="Sample data">
        <p style={{ margin: 0 }}>
          Sign-in is live, but the BE data API is not configured, so this screen
          shows sample data. Set <code>NEXT_PUBLIC_API_BASE</code> to switch to
          real data.
        </p>
      </Card>
    );
  }

  const result = probe ?? (await probeAdminApi());
  if (result.ok) return null;

  return (
    <Card title="Live API not responding">
      <p style={{ margin: 0, color: 'var(--alert)' }}>
        <strong>
          {result.status === 0
            ? 'Could not reach the API'
            : `HTTP ${result.status}`}
        </strong>{' '}
        on <code>/admin/jobs</code>. Data below may be empty until this clears.
      </p>
      <p
        style={{ marginBottom: 0, color: 'var(--muted)', fontSize: '0.85rem' }}
      >
        403 usually means the admin JWT is not accepted (role/MFA). 404 means
        the endpoint is not deployed. 0 means the API base URL is wrong or
        unreachable.
      </p>
    </Card>
  );
}
