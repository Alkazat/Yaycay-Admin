import { PageHeader, Card, Badge } from '@/components/ui';
import { getAdminMe, listAdmins } from '@/lib/data';
import { isAdminDataLive } from '@/lib/config';
import { promoteAction } from './actions';

const inputStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
};

const buttonStyle: React.CSSProperties = {
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-4)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
  cursor: 'pointer',
};

export default async function AdminsPage() {
  const [me, admins] = await Promise.all([getAdminMe(), listAdmins()]);

  return (
    <>
      <PageHeader
        title="Admins"
        subtitle="Who can sign in to this console. Promoting an account grants the admin role; the change is audited."
      />

      {me ? (
        <Card title="Signed in as">
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <strong>{me.email}</strong>
            <Badge tone="info">{me.role}</Badge>
            {me.mfaVerified ? (
              <Badge tone="success">MFA verified</Badge>
            ) : (
              <Badge tone="alert">no MFA</Badge>
            )}
          </div>
        </Card>
      ) : null}

      <Card title="Promote an account">
        <p style={{ marginTop: 0, color: 'var(--muted)' }}>
          The account must already exist (signed in at least once). Promoting
          sets <code>role=admin</code>; they still need MFA to reach any screen.
        </p>
        <form
          action={promoteAction}
          style={{ display: 'flex', gap: 'var(--space-2)' }}
        >
          <input
            name="email"
            type="email"
            required
            placeholder="person@example.com"
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>
            Promote to admin
          </button>
        </form>
      </Card>

      <Card title="Current admins">
        {admins.length === 0 ? (
          <p style={{ margin: 0 }}>No admins listed.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: 'var(--space-2)' }}>Email</th>
                <th style={{ padding: 'var(--space-2)' }}>Role</th>
                <th style={{ padding: 'var(--space-2)' }}>Since</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr
                  key={a.userId}
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <td style={{ padding: 'var(--space-2)' }}>{a.email}</td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    <Badge tone="info">{a.role}</Badge>
                  </td>
                  <td
                    style={{ padding: 'var(--space-2)', color: 'var(--muted)' }}
                  >
                    {a.createdAt ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {isAdminDataLive() ? (
        <Card title="BE endpoint status">
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            <code>GET/POST /admin/admins</code> may not be deployed yet. Until
            it is, this list fails soft to empty and promotion is a no-op. See
            the BE verification checklist.
          </p>
        </Card>
      ) : null}
    </>
  );
}
