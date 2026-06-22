import { AppShell } from "@/components/layout/AppShell";
import { DecisionDetail } from "@/components/decisions/DecisionDetail";

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <DecisionDetail id={id} />
    </AppShell>
  );
}
