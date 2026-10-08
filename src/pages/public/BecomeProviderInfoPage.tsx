import { BadgeCheck, ClipboardCheck, Inbox, UserPlus } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { ButtonLink } from "../../components/ui/Button";

const STEPS = [
  { icon: UserPlus, title: "Use one account", text: "There's no separate provider account. Create your ServaLink account, or log in with the one you have." },
  { icon: ClipboardCheck, title: "Apply with your details", text: "Choose your service category, add a title and a short description. If your category isn't listed, you can request it." },
  { icon: BadgeCheck, title: "Wait for approval", text: "An administrator reviews your application. You'll see its status in your account." },
  { icon: Inbox, title: "Receive booking requests", text: "Once approved, list your services and accept or decline requests from customers in your town." },
];

export function BecomeProviderInfoPage() {
  const { status } = useAuth();
  return (
    <div className="section" style={{ paddingTop: 48 }}>
      <div className="section-head">
        <h1>Become a provider</h1>
        <p>Get found by customers in your town. Applying takes a few minutes, and there is nothing to pay.</p>
      </div>
      <div className="stack">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <div className="card card-pad row" style={{ gap: 16, flexWrap: "nowrap", alignItems: "flex-start" }} key={title}>
            <span className="ico ico-green" style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", flex: "none" }}><Icon size={22} aria-hidden="true" /></span>
            <div><h3 style={{ fontSize: "1.0625rem" }}>{i + 1}. {title}</h3><p className="muted small">{text}</p></div>
          </div>
        ))}
      </div>
      <div className="row" style={{ marginTop: 28 }}>
        {status === "authenticated"
          ? <ButtonLink to="/app/become-provider" size="lg">Start your application</ButtonLink>
          : <>
            <ButtonLink to="/register" size="lg">Create an account</ButtonLink>
            <ButtonLink to="/login?next=/app/become-provider" variant="secondary" size="lg">I already have an account</ButtonLink>
          </>}
      </div>
    </div>
  );
}
