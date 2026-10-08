import { BadgeCheck, Flag, Images, ShieldCheck } from "lucide-react";
import { Card } from "../ui/Card";

const points = [
  { Icon: ShieldCheck, title: "Applications reviewed", text: "Every Provider application is reviewed by an Admin before Provider tools are enabled." },
  { Icon: BadgeCheck, title: "Booking-based reviews", text: "Reviews come from eligible, completed bookings, so you know they reflect real service." },
  { Icon: Flag, title: "Citizens can report problems", text: "If something goes wrong, you can report it and an Admin will look into it." },
  { Icon: Images, title: "Work galleries", text: "Providers can showcase photos of their completed work on their profile." },
];

export function TrustSection() {
  return (
    <section className="section soft" id="trust"><div className="container">
      <div className="center"><span className="eyebrow">WHY SERVALINK</span><h2>Clear, accountable local services.</h2></div>
      <div className="steps">{points.map(({ Icon, title, text }) => <Card key={title}><Icon /><h3>{title}</h3><p>{text}</p></Card>)}</div>
    </div></section>
  );
}
