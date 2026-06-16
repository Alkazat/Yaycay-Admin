import { PageHeader, Card, Badge } from '@/components/ui';
import { SubmitButton } from '@/components/SubmitButton';
import { listPrompts } from '@/lib/data';
import { groupByTask } from '@/lib/prompts/versioning';
import { activateAction } from './actions';
import { PromptEditor } from './PromptEditor';

export default async function PromptsPage() {
  const prompts = await listPrompts();
  const groups = groupByTask(prompts);

  return (
    <>
      <PageHeader
        title="Prompts"
        subtitle="Versioned prompt harness. Edit to create a new version, pick the model per task, and activate."
      />
      {groups.map(({ task, versions }) => {
        const latest = versions[0];
        return (
          <Card key={task} title={task}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                  <th style={{ padding: 'var(--space-2)' }}>Version</th>
                  <th style={{ padding: 'var(--space-2)' }}>Model</th>
                  <th style={{ padding: 'var(--space-2)' }}>Updated</th>
                  <th style={{ padding: 'var(--space-2)' }}>State</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr
                    key={v.id}
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <td style={{ padding: 'var(--space-2)' }}>v{v.version}</td>
                    <td style={{ padding: 'var(--space-2)' }}>
                      <Badge>{v.model}</Badge>
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-2)',
                        color: 'var(--muted)',
                      }}
                    >
                      {v.updatedAt} by {v.updatedBy}
                    </td>
                    <td style={{ padding: 'var(--space-2)' }}>
                      {v.active ? (
                        <Badge tone="success">active</Badge>
                      ) : (
                        <form action={activateAction}>
                          <input type="hidden" name="id" value={v.id} />
                          <SubmitButton
                            pendingLabel="Activating..."
                            style={{
                              minHeight: 'var(--tap-min)',
                              padding: '0 var(--space-4)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--surface)',
                              cursor: 'pointer',
                            }}
                          >
                            Activate
                          </SubmitButton>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <details style={{ marginTop: 'var(--space-4)' }}>
              <summary
                style={{
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  color: 'var(--brand-primary-deep)',
                }}
              >
                Edit (creates a new version)
              </summary>
              <PromptEditor
                task={latest.task}
                title={latest.title}
                body={latest.body}
                model={latest.model}
              />
            </details>
          </Card>
        );
      })}
    </>
  );
}
