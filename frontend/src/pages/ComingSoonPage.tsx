import type { LucideIcon } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Shared placeholder for shell destinations whose real feature ships in a later phase. */
export function ComingSoonPage({ title, description, icon }: ComingSoonPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title="Coming in a future phase"
        description="This screen is part of the navigation shell today. Its real functionality is built in a later phase."
      />
    </>
  );
}
