import { PageHeader, Card, Badge } from '@/components/ui';
import { listPrompts } from '@/lib/data';

export default async function PromptsPage() {
  const prompts = await listPrompts();
  return (
    <>
      <PageHeader
        title="Prompts"
        subtitle="Versioned prompt harness. Edit, version, set the model per task, and activate."
      />
      {prompts.map((p) => (
        <Card key={p.id} title={p.title}>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              alignItems: 'center',
              marginBottom: 'var(--space-3)',
            }}
          >
            <Badge tone="info">{p.task}</Badge>
            <Badge>{p.model}</Badge>
            <Badge>v{p.version}</Badge>
            {p.active ? <Badge tone="success">active</Badge> : null}
          </div>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{p.body}</p>
          <p
            style={{
              marginTop: 'var(--space-3)',
              fontSize: '0.8rem',
              color: 'var(--muted)',
            }}
          >
            Updated {p.updatedAt} by {p.updatedBy}
          </p>
        </Card>
      ))}
    </>
  );
}
