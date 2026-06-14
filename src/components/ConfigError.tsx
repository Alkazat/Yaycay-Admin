import { Card } from '@/components/ui';

/*
 * Friendly stand-in shown when the Admin app is deployed without its required
 * environment. Turns the otherwise-cryptic SSR 500 ("Application error: a
 * server-side exception has occurred") into a readable list of the exact env
 * vars an operator must set (in the Vercel project), then redeploy.
 */
export function ConfigError({ missing }: { missing: string[] }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div style={{ width: 'min(520px, 100%)' }}>
        <Card title="Admin is not configured">
          <p style={{ marginTop: 0 }}>
            The console can&apos;t start because required environment variables
            are missing. Set the following in the deployment (Vercel project
            settings), then redeploy:
          </p>
          <ul style={{ margin: '0 0 var(--space-3)', paddingLeft: 'var(--space-5)' }}>
            {missing.map((name) => (
              <li key={name}>
                <code>{name}</code>
              </li>
            ))}
          </ul>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Until then the admin screens stay locked.
          </p>
        </Card>
      </div>
    </main>
  );
}
