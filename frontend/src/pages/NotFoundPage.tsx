import { Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ROUTES } from "../routes/paths";

/**
 * Catch-all for any URL that doesn't match a real route — direct
 * navigation to a typo'd or old link should never render a blank page.
 */
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Page not found" description="That page doesn't exist, or the link may be out of date." />
      <Card>
        <EmptyState
          icon={Compass}
          title="Let's get you back on track"
          description="The Overview dashboard is the best place to pick up where you left off."
          action={
            <Button variant="primary" onClick={() => navigate(ROUTES.overview)}>
              Go to Overview
            </Button>
          }
        />
      </Card>
    </>
  );
}
