'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { editContentAction, type EditResult } from '../../actions';

function SaveButton() {
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
      {pending ? 'Publishing...' : 'Publish edited content'}
    </button>
  );
}

/*
 * Edit the generated trip content as JSON, then publish. BE validates the
 * payload against the schema on write; here we just ensure it parses and looks
 * like a TripContent before sending.
 */
export function EditForm({
  tripId,
  initialJson,
}: {
  tripId: string;
  initialJson: string;
}) {
  const [result, formAction] = useActionState<EditResult | null, FormData>(
    editContentAction,
    null,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="tripId" value={tripId} />
      <textarea
        name="content"
        defaultValue={initialJson}
        rows={24}
        spellCheck={false}
        style={{
          width: '100%',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          padding: 'var(--space-3)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface)',
        }}
      />
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          alignItems: 'center',
          marginTop: 'var(--space-3)',
        }}
      >
        <SaveButton />
        {result && !result.ok ? (
          <span role="status" style={{ color: 'var(--alert)' }}>
            {result.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
