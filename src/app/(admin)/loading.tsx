/*
 * Shown instantly while a route's server components fetch on navigation, so
 * moving between admin screens feels immediate instead of hanging on a blank
 * frame. The nav/shell (in the layout) stays put; only this content area swaps.
 */
export default function Loading() {
  return (
    <div aria-busy="true" style={{ padding: 'var(--space-2)' }}>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          color: 'var(--brand-primary-deep)',
          marginBottom: 'var(--space-4)',
        }}
      >
        Loading...
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            height: 72,
            marginBottom: 'var(--space-4)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface-raised)',
            opacity: 0.6,
          }}
        />
      ))}
    </div>
  );
}
