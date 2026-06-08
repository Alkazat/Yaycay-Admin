'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createVersionAction, type ActionResult } from './actions';
import type { AiModel } from '@/lib/contracts/types';

const MODELS: AiModel[] = ['claude-sonnet', 'claude-opus', 'gemini', 'openai'];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--space-2)',
  minHeight: 'var(--tap-min)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'inherit',
  fontSize: '0.9rem',
  background: 'var(--surface)',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        minHeight: 'var(--tap-min)',
        padding: '0 var(--space-6)',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--brand-cta)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        cursor: pending ? 'wait' : 'pointer',
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? 'Saving...' : 'Save as new version'}
    </button>
  );
}

/*
 * Editor for a task: prefilled from the current/latest version. Submitting
 * creates a new immutable version (inactive until activated), so editing never
 * overwrites history.
 */
export function PromptEditor({
  task,
  title,
  body,
  model,
}: {
  task: string;
  title: string;
  body: string;
  model: AiModel;
}) {
  const [result, formAction] = useActionState<ActionResult | null, FormData>(
    createVersionAction,
    null,
  );

  return (
    <form action={formAction} style={{ marginTop: 'var(--space-4)' }}>
      <input type="hidden" name="task" value={task} />
      <label style={{ display: 'block', marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Title</span>
        <input name="title" defaultValue={title} style={inputStyle} />
      </label>
      <label style={{ display: 'block', marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Model</span>
        <select name="model" defaultValue={model} style={inputStyle}>
          {MODELS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'block', marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
          Prompt body
        </span>
        <textarea
          name="body"
          defaultValue={body}
          rows={5}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
      >
        <SubmitButton />
        {result ? (
          <span
            role="status"
            style={{
              fontSize: '0.85rem',
              color: result.ok ? 'var(--success)' : 'var(--alert)',
            }}
          >
            {result.ok ? result.message : result.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
