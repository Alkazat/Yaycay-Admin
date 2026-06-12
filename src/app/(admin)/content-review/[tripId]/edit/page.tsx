import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader, Card } from '@/components/ui';
import { getTripContent } from '@/lib/data';
import { EditForm } from './EditForm';

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const content = await getTripContent(tripId);
  if (!content) notFound();

  return (
    <>
      <PageHeader
        title="Edit content"
        subtitle={`Trip ${tripId} · edit the generated content, then publish`}
      />
      <p>
        <Link href="/content-review">&lt;- Back to content review</Link>
      </p>
      <Card>
        <EditForm
          tripId={tripId}
          initialJson={JSON.stringify(content, null, 2)}
        />
      </Card>
    </>
  );
}
