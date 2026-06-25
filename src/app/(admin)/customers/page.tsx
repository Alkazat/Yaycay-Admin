import Link from 'next/link';
import { PageHeader, Card, Badge } from '@/components/ui';
import { ApiStatusBanner } from '@/components/ApiStatusBanner';
import { NoticeBanner } from '@/components/NoticeBanner';
import { SubmitButton } from '@/components/SubmitButton';
import { searchCustomers } from '@/lib/data';
import { deletionRequestAction, inviteUserAction } from './actions';
import { startSupportSessionAction } from '../support/actions';

const inputStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    cursor?: string;
    notice?: string;
    status?: string;
    detail?: string;
  }>;
}) {
  const { q, cursor, notice, status, detail } = await searchParams;
  const { items, nextCursor } = await searchCustomers({ query: q, cursor });

  const nextHref = nextCursor
    ? `/customers?${new URLSearchParams({ ...(q ? { q } : {}), cursor: nextCursor })}`
    : null;

  const heading = q
    ? `${items.length} ${items.length === 1 ? 'match' : 'matches'} for "${q}"`
    : `${items.length} customer account${items.length === 1 ? '' : 's'}`;

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Customer accounts: lookup, entitlement, retention status, support sessions and data-deletion requests."
      />
      <ApiStatusBanner />
      <NoticeBanner notice={notice} status={status} detail={detail} />
      <Card>
        <form method="get" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="search by email"
            style={inputStyle}
          />
          <SubmitButton
            pendingLabel="Searching..."
            style={{
              minHeight: 'var(--tap-min)',
              padding: '0 var(--space-4)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)',
              cursor: 'pointer',
            }}
          >
            Search
          </SubmitButton>
        </form>
      </Card>

      <Card title="Invite a user">
        <p style={{ marginTop: 0, color: 'var(--muted)' }}>
          Onboard someone manually: we provision a pending account and email
          them a magic link to finish signing up (they set their own 2FA). No
          password is set here - Yaycay logins are always magic-link + 2FA.
        </p>
        <form
          action={inviteUserAction}
          style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}
        >
          <input
            name="email"
            type="email"
            required
            placeholder="email"
            style={inputStyle}
          />
          <input name="name" placeholder="name (optional)" style={inputStyle} />
          <SubmitButton
            pendingLabel="Inviting..."
            style={{
              minHeight: 'var(--tap-min)',
              padding: '0 var(--space-4)',
              border: '1px solid var(--brand-primary)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)',
              color: 'var(--brand-primary-deep)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Send invite
          </SubmitButton>
        </form>
      </Card>

      <p
        style={{
          margin: 'var(--space-2) 0',
          color: 'var(--muted)',
          fontSize: '0.85rem',
        }}
      >
        {heading}
      </p>

      {items.length === 0 ? (
        <Card>
          <p style={{ margin: 0 }}>
            {q
              ? `No users match "${q}".`
              : 'No customer accounts yet. They appear here as people sign up in the app.'}
          </p>
        </Card>
      ) : (
        items.map((c) => (
          <Card key={c.userId} title={c.email}>
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {c.tier ? (
                <Badge tone="info">{c.tier}</Badge>
              ) : (
                <Badge>no tier</Badge>
              )}
              <span style={{ color: 'var(--muted)' }}>
                retention: {c.retentionExpiresAt ?? 'disposal by default'}
              </span>
              <div
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  gap: 'var(--space-2)',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <form
                  action={startSupportSessionAction}
                  style={{ display: 'flex', gap: 'var(--space-2)' }}
                >
                  <input type="hidden" name="targetUserId" value={c.userId} />
                  <input
                    name="reason"
                    placeholder="reason / ticket #"
                    required
                    style={{
                      minHeight: 'var(--tap-min)',
                      padding: '0 var(--space-3)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)',
                    }}
                  />
                  <SubmitButton
                    pendingLabel="Starting..."
                    style={{
                      minHeight: 'var(--tap-min)',
                      padding: '0 var(--space-4)',
                      border: '1px solid var(--brand-primary)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)',
                      color: 'var(--brand-primary-deep)',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Start support session
                  </SubmitButton>
                </form>
                {c.deletionRequested ? (
                  <Badge tone="alert">deletion requested</Badge>
                ) : (
                  <form action={deletionRequestAction}>
                    <input type="hidden" name="userId" value={c.userId} />
                    <SubmitButton
                      pendingLabel="Recording..."
                      style={{
                        minHeight: 'var(--tap-min)',
                        padding: '0 var(--space-4)',
                        border: '1px solid var(--alert)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface)',
                        color: 'var(--alert)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Request deletion
                    </SubmitButton>
                  </form>
                )}
              </div>
            </div>
          </Card>
        ))
      )}

      {nextHref ? <Link href={nextHref}>Next page -&gt;</Link> : null}
    </>
  );
}
