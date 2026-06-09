import { PageHeader, Card, Badge } from '@/components/ui';
import { listModelRoutes } from '@/lib/data';

export default async function ModelsPage() {
  const routes = await listModelRoutes();
  return (
    <>
      <PageHeader
        title="Models"
        subtitle="Available models and routing defaults. Default for use-our-AI is Claude Sonnet."
      />
      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: 'var(--space-2)' }}>Task</th>
              <th style={{ padding: 'var(--space-2)' }}>Default model</th>
              <th style={{ padding: 'var(--space-2)' }}>Override</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.task} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: 'var(--space-2)' }}>{r.task}</td>
                <td style={{ padding: 'var(--space-2)' }}>
                  <Badge>{r.defaultModel}</Badge>
                </td>
                <td style={{ padding: 'var(--space-2)' }}>
                  {r.override ? <Badge tone="info">{r.override}</Badge> : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
