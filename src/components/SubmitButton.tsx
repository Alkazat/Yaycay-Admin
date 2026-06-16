'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

/*
 * A submit button that reflects the enclosing <form>'s action state. While the
 * server action is in flight it disables itself and swaps to a "working" label,
 * so a click gives immediate, honest feedback instead of feeling dead. Drop-in
 * for `<button type="submit">`: pass the same `style` the old button used.
 *
 * Must be rendered INSIDE the <form> whose action it submits (useFormStatus
 * reads the nearest form), which is exactly how the admin forms are shaped.
 */
export function SubmitButton({
  children,
  pendingLabel = 'Working...',
  style,
  disabled,
}: {
  children: ReactNode;
  pendingLabel?: string;
  style?: CSSProperties;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      style={{
        ...style,
        ...(pending ? { opacity: 0.6, cursor: 'progress' } : {}),
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
