import { PageHeader, Card } from '@/components/ui';
import { SubmitButton } from '@/components/SubmitButton';
import { listModelRoutes } from '@/lib/data';
import type { AiModel } from '@/lib/contracts/types';
import { setRouteAction } from './actions';

const MODELS: AiModel[] = ['claude-sonnet', 'claude-opus', 'gemini', 'openai'];

const selectStyle: React.CSSProperties = {
  minHeight: 'var(--tap-min)',
  padding: '0 var(--space-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface)',
};

export default async function ModelsPage() {
  const routes = await listModelRoutes();
  return (
    <>
      <PageHeader
        title="Models"
        subtitle="Per-task default model and overrides. Default for use-our-AI is Claude Sonnet."
      />
      {routes.map((r) => (
        <Card key={r.task} title={r.task}>
          <form
            action={setRouteAction}
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            <input type="hidden" name="task" value={r.task} />
            <label>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Default
              </div>
              <select
                name="defaultModel"
                defaultValue={r.defaultModel}
                style={selectStyle}
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Override
              </div>
              <select
                name="override"
                defaultValue={r.override ?? ''}
                style={selectStyle}
              >
                <option value="">none</option>
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <SubmitButton
              pendingLabel="Saving..."
              style={{
                minHeight: 'var(--tap-min)',
                padding: '0 var(--space-6)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--brand-cta)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save
            </SubmitButton>
          </form>
        </Card>
      ))}
    </>
  );
}
