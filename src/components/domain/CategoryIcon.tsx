import { Briefcase, Car, Droplets, Flower2, GraduationCap, Hammer, PaintRoller, Plug, Scissors, Smartphone, Sparkles, Truck, Wrench, Zap, type LucideIcon } from "lucide-react";

// Icons are decoration only: categories always come from GET /service-categories.
const ICONS: [RegExp, LucideIcon][] = [
  [/plumb|pipe|water/i, Droplets],
  [/electr|wiring|solar/i, Zap],
  [/carpent|wood|furnit/i, Hammer],
  [/clean|laundry|house/i, Sparkles],
  [/paint/i, PaintRoller],
  [/garden|lawn|landscap/i, Flower2],
  [/auto|vehicle|motor|mechanic/i, Car],
  [/appliance|fridge|freezer|cooker/i, Plug],
  [/phone|repair|tech|computer/i, Smartphone],
  [/tutor|teach|lesson|school/i, GraduationCap],
  [/hair|beauty|barber|tailor/i, Scissors],
  [/transport|move|deliver|driver/i, Truck],
  [/mechanic|fix|appliance/i, Wrench],
];

export function CategoryIcon({ name, size = 22 }: { name: string; size?: number }) {
  const Icon = ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? Briefcase;
  return <Icon size={size} aria-hidden="true" />;
}
