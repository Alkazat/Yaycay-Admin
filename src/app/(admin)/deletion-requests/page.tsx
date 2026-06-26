import { PageHeader, Card, Badge } from '@/components/ui';
import { ApiStatusBanner } from '@/components/ApiStatusBanner';
import { NoticeBanner } from '@/components/NoticeBanner';
import { SubmitButton } from '@/components/SubmitButton';
import { listDeletionRequests } from '@/lib/data';
import {
  requestDeletionAction,
  cancelDeletionAction,
  executeDeletionAction,
} from './actions';

const confirmInput: React.CSSProperties = {
  minHeight: 'var(--tap-min)',
  minWidth: '16rem',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
};

const subtleBtn: React.CSSProperties = {
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-4)',
  border: '1px solid var(--brand-primary)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
  color: 'var(--brand-primary-deep)',
  fontWeight: 700,
  cursor: 'pointer',
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

function day(iso: string): string {
  return iso.slice(0, 10);
}

export default async function DeletionRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    notice?: string;
    status?: string;
    detail?: string;
    focus?: string;
    email?: string;
  }>;
}) {
  const { notice, status, detail, focus, email } = await searchParams;
  const items = await listDeletionRequests();

  // An account opened from the Users row with no pending request yet: offer to
  // request one here, so the whole deletion lifecycle lives in this console.
  const focusPending = focus ? items.some((i) => i.userId === focus) : false;
  const showRequest = Boolean(focus && email && !focusPending);

  return (
    <>
      <PageHeader
        title="Deletion requests"
        subtitle="The data-deletion (GDPR) queue. Verify the footprint, then cancel a request or execute the hard delete after the 30-day grace."
      />
      <ApiStatusBanner />
      <NoticeBanner notice={notice} status={status} detail={detail} />

      {showRequest ? (
        <Card title={`Request deletion — ${email}`}>
          <p style={{ marginTop: 0, color: 'var(--muted)' }}>
            No pending request for this account. Requesting schedules a
            reversible deletion (a 30-day grace), after which it can be executed
            below.
          </p>
          <form action={requestDeletionAction}>
            <input type="hidden" name="userId" value={focus} />
            <SubmitButton pendingLabel="Recording..." style={dangerBtn}>
              Request deletion
            </SubmitButton>
          </form>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <Card>
          <p style={{ margin: 0 }}>No pending deletion requests.</p>
        </Card>
      ) : (
        items.map((r) => (
          <Card key={r.userId} title={r.email}>
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: 'var(--space-3)',
              }}
            >
              {r.eligible ? (
                <Badge tone="alert">eligible</Badge>
              ) : (
                <Badge tone="info">in grace</Badge>
              )}
              <span style={{ color: 'var(--muted)' }}>
                requested {day(r.requestedAt)} ({r.ageDays}d ago) · eligible{' '}
                {day(r.eligibleAt)}
              </span>
              <span style={{ color: 'var(--muted)' }}>
                {r.tier ?? 'no tier'} · {r.trips} trips · {r.media} media ·{' '}
                {r.purchases} purchases
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
              }}
            >
              <form action={cancelDeletionAction}>
                <input type="hidden" name="userId" value={r.userId} />
                <SubmitButton pendingLabel="Cancelling..." style={subtleBtn}>
                  Cancel request
                </SubmitButton>
              </form>

              <form
                action={executeDeletionAction}
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  marginLeft: 'auto',
                }}
              >
                <input type="hidden" name="userId" value={r.userId} />
                <input
                  name="confirmEmail"
                  placeholder={`type ${r.email} to confirm`}
                  required
                  autoComplete="off"
                  style={confirmInput}
                />
                <label
                  style={{
                    display: 'flex',
                    gap: 'var(--space-1)',
                    alignItems: 'center',
                    color: 'var(--muted)',
                    fontSize: '0.85rem',
                  }}
                  title="Override the 30-day grace window. Required to delete a request still in grace."
                >
                  <input type="checkbox" name="force" />
                  force (skip grace)
                </label>
                <SubmitButton pendingLabel="Deleting..." style={dangerBtn}>
                  Execute delete
                </SubmitButton>
              </form>
            </div>
          </Card>
        ))
      )}
    </>
  );
}
