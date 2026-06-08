import { PageHeader, Card, Badge } from '@/components/ui';
import { listAudit } from '@/lib/audit';

/*
 * The admin audit trail. Every /admin/* write records an entry; this is the
 * read view. In stub mode the trail starts empty and fills as you act (create
 * a prompt version, activate, retry a job, request a deletion).
 */
export default async function AuditPage() {
  const entries = await listAudit();
  return (
    <>
      <PageHeader
        title="Audit"
        subtitle="Every admin action is logged: actor, action, target and when."
      />
      <Card>
        {entries.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            No actions recorded yet. Admin writes appear here as they happen.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: 'var(--space-2)' }}>When</th>
                <th style={{ padding: 'var(--space-2)' }}>Actor</th>
                <th style={{ padding: 'var(--space-2)' }}>Action</th>
                <th style={{ padding: 'var(--space-2)' }}>Target</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td
                    style={{ padding: 'var(--space-2)', color: 'var(--muted)' }}
                  >
                    {e.at}
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>{e.actor}</td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    <Badge tone="info">{e.action}</Badge>
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    {e.target}
                    {e.details ? (
                      <span style={{ color: 'var(--muted)' }}>
                        {' '}
                        ({e.details})
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
