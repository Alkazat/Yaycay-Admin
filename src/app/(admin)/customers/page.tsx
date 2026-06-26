import Link from 'next/link';
import { PageHeader, Card, Badge } from '@/components/ui';
import { ApiStatusBanner } from '@/components/ApiStatusBanner';
import { NoticeBanner } from '@/components/NoticeBanner';
import { SubmitButton } from '@/components/SubmitButton';
import { searchUsers } from '@/lib/data';
import type { AdminUserRow } from '@/lib/contracts/types';
import {
  changeEmailAction,
  deletionRequestAction,
  executeDeletionAction,
  inviteUserAction,
  removeUserAction,
} from './actions';
import { startSupportSessionAction } from '../support/actions';

const inputStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
};

const dangerBtn: React.CSSProperties = {
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-4)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--alert)',
  color: 'var(--surface)',
  fontWeight: 700,
  cursor: 'pointer',
};

const th: React.CSSProperties = {
  padding: 'var(--space-2)',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--muted)',
};
const td: React.CSSProperties = {
  padding: 'var(--space-2)',
  whiteSpace: 'nowrap',
  borderTop: '1px solid var(--border)',
};
const num: React.CSSProperties = { ...td, textAlign: 'right' };

/** A date only, or an em dash for null. */
function day(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '—';
}

function statusBadge(s: AdminUserRow['status']) {
  if (s === 'active') return <Badge tone="success">active</Badge>;
  if (s === 'invited') return <Badge tone="info">invited</Badge>;
  return <Badge tone="alert">deletion requested</Badge>;
}

export default async function UsersPage({
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
  const { items, nextCursor } = await searchUsers({ query: q, cursor });

  const nextHref = nextCursor
    ? `/customers?${new URLSearchParams({ ...(q ? { q } : {}), cursor: nextCursor })}`
    : null;

  const heading = q
    ? `${items.length} ${items.length === 1 ? 'match' : 'matches'} for "${q}"`
    : `${items.length} user account${items.length === 1 ? '' : 's'}`;

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Administer every account: invite, edit email, manage trips, request and execute deletions, and run support sessions."
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

      {/* Live at-a-glance table. */}
      <Card title="All users">
        <p
          style={{
            margin: '0 0 var(--space-3)',
            color: 'var(--muted)',
            fontSize: '0.85rem',
          }}
        >
          {heading}
        </p>
        {items.length === 0 ? (
          <p style={{ margin: 0 }}>
            {q
              ? `No users match "${q}".`
              : 'No user accounts yet. They appear here as people sign up or are invited.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>User</th>
                  <th style={th}>Status</th>
                  <th style={th}>User since</th>
                  <th style={th}>Last login</th>
                  <th style={th}>Tier</th>
                  <th style={th}>Retention</th>
                  <th style={{ ...th, textAlign: 'right' }}>Trips</th>
                  <th style={{ ...th, textAlign: 'right' }}>Explorers</th>
                  <th style={{ ...th, textAlign: 'right' }}>Grownups</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.userId}>
                    <td style={td}>
                      <a href={`#user-${u.userId}`}>{u.email}</a>
                    </td>
                    <td style={td}>{statusBadge(u.status)}</td>
                    <td style={td}>{day(u.createdAt)}</td>
                    <td style={td}>{day(u.lastLoginAt)}</td>
                    <td style={td}>{u.tier ?? '—'}</td>
                    <td style={td}>{u.retentionExpiresAt ?? '—'}</td>
                    <td style={num}>{u.tripCount}</td>
                    <td style={num}>{u.explorerCount}</td>
                    <td style={num}>{u.grownupCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Per-user management. */}
      {items.map((u) => (
        <Card key={u.userId} title={u.email}>
          <span id={`user-${u.userId}`} />
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-3)',
            }}
          >
            {statusBadge(u.status)}
            {u.tier ? (
              <Badge tone="info">{u.tier}</Badge>
            ) : (
              <Badge>no tier</Badge>
            )}
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {u.tripCount} trips · {u.explorerCount} explorers ·{' '}
              {u.grownupCount} grownups
            </span>
            <Link
              href={`/trips?q=${encodeURIComponent(u.email)}`}
              style={{ marginLeft: 'auto', fontSize: '0.85rem' }}
            >
              Manage trips -&gt;
            </Link>
          </div>

          {/* Change email. */}
          <form
            action={changeEmailAction}
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-3)',
            }}
          >
            <input type="hidden" name="userId" value={u.userId} />
            <input
              name="email"
              type="email"
              required
              defaultValue={u.email}
              style={inputStyle}
            />
            <SubmitButton
              pendingLabel="Saving..."
              style={{
                minHeight: 'var(--tap-min)',
                padding: '0 var(--space-4)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Change email
            </SubmitButton>
          </form>

          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
            }}
          >
            {/* Support session. */}
            <form
              action={startSupportSessionAction}
              style={{ display: 'flex', gap: 'var(--space-2)' }}
            >
              <input type="hidden" name="targetUserId" value={u.userId} />
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

            {/* Deletion lifecycle. */}
            {u.status === 'invited' ? (
              <form action={removeUserAction}>
                <input type="hidden" name="userId" value={u.userId} />
                <SubmitButton pendingLabel="Removing..." style={dangerBtn}>
                  Remove invite
                </SubmitButton>
              </form>
            ) : u.status === 'deletion-requested' ? (
              <form
                action={executeDeletionAction}
                style={{ display: 'flex', gap: 'var(--space-2)' }}
              >
                <input type="hidden" name="userId" value={u.userId} />
                <input
                  name="confirm"
                  placeholder="type DELETE"
                  required
                  style={{
                    minHeight: 'var(--tap-min)',
                    padding: '0 var(--space-3)',
                    border: '1px solid var(--alert)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)',
                    width: 130,
                  }}
                />
                <SubmitButton pendingLabel="Deleting..." style={dangerBtn}>
                  Execute deletion
                </SubmitButton>
              </form>
            ) : (
              <form action={deletionRequestAction}>
                <input type="hidden" name="userId" value={u.userId} />
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
          {u.status === 'deletion-requested' ? (
            <p
              style={{
                margin: 'var(--space-2) 0 0',
                fontSize: '0.8rem',
                color: 'var(--alert)',
              }}
            >
              Deletion is pending. Executing permanently purges this user and
              their {u.tripCount} trip{u.tripCount === 1 ? '' : 's'} - there is
              no undo.
            </p>
          ) : null}
        </Card>
      ))}

      {nextHref ? <Link href={nextHref}>Next page -&gt;</Link> : null}
    </>
  );
}
