import { Compass } from "lucide-react";
import { ButtonLink } from "../components/ui/Button";
import { EmptyState } from "../components/ui/Display";

export function NotFoundPage() {
  return (
    <div className="card" style={{ maxWidth: 560, margin: "48px auto" }}>
      <EmptyState icon={<Compass size={24} />} title="We can't find that page"
        action={<ButtonLink to="/">Go to the homepage</ButtonLink>}>
        The link may be broken or the page may have moved.
      </EmptyState>
    </div>
  );
}
