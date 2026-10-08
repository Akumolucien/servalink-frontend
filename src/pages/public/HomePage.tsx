import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, CalendarCheck, MapPin, Search, ShieldCheck } from "lucide-react";
import { api } from "../../api";
import heroPhoto from "../../assets/hero-worker.jpg"; // TEMPORARY placeholder, see src/assets/README.md
import { CategoryIcon } from "../../components/domain/CategoryIcon";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Display";
import { TextField, SelectField } from "../../components/ui/Field";
import { useResource } from "../../lib/useResource";

export function HomePage() {
  const navigate = useNavigate();
  const categories = useResource(() => api.categories(), []);
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState<{ category?: string; city?: string }>({});
  const list = categories.data ?? [];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = {
      category: category ? undefined : "Choose a category",
      city: city.trim() ? undefined : "Enter your town or city",
    };
    setErrors(next);
    if (next.category || next.city) return;
    navigate(`/search?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city.trim())}`);
  };

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-photo"><img src={heroPhoto} alt="" /></div>
        <div className="hero-inner">
          <h1 id="hero-title">Find trusted local service providers</h1>
          <p className="lead">Book skilled professionals in your town for everyday home and business services.</p>
          <form className="search-card" onSubmit={submit} noValidate aria-label="Search for a service">
            <SelectField label="Service category" value={category} error={errors.category}
              onChange={(e) => setCategory(e.target.value)} disabled={categories.loading || !list.length}>
              <option value="">{categories.loading ? "Loading categories…" : list.length ? "Service category" : "No categories yet"}</option>
              {list.map((c) => <option key={c.category_id} value={c.category_name}>{c.category_name}</option>)}
            </SelectField>
            <TextField label="Town or city" placeholder="e.g. Buea" value={city} error={errors.city}
              onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
            <div style={{ alignSelf: "end" }}><Button type="submit" size="lg" icon={<Search size={18} />}>Search</Button></div>
          </form>
        </div>
      </section>

      {(categories.loading || list.length > 0) && (
        <section className="section" aria-labelledby="cats-title">
          <div className="section-head row-between">
            <h2 id="cats-title">Browse by category</h2>
            <Link to="/search" className="small">See all providers</Link>
          </div>
          {categories.loading ? (
            <div className="cat-grid">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={108} radius={12} />)}</div>
          ) : (
            <div className="cat-grid">
              {list.slice(0, 12).map((c) => (
                <Link key={c.category_id} className="cat-tile" to={`/search?category=${encodeURIComponent(c.category_name)}`}>
                  <span className="ci"><CategoryIcon name={c.category_name} /></span>{c.category_name}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="section" id="how-it-works" aria-labelledby="how-title">
        <div className="section-head">
          <h2 id="how-title">How ServaLink works</h2>
          <p>From search to a finished job, with every step recorded on your booking.</p>
        </div>
        <div className="steps">
          <div className="card step"><span className="n">1</span><h3>Search your town</h3><p className="muted small">Pick a category and your town to see approved providers, their reviews and examples of their work.</p></div>
          <div className="card step"><span className="n">2</span><h3>Send a booking request</h3><p className="muted small">Choose a date and describe the job. The provider accepts or declines, and you can follow progress on your booking.</p></div>
          <div className="card step"><span className="n">3</span><h3>Confirm and review</h3><p className="muted small">When the provider marks the work finished, you confirm it. Then you can leave a review tied to that booking.</p></div>
        </div>
      </section>

      <section className="section" id="about" aria-labelledby="about-title">
        <div className="section-head">
          <h2 id="about-title">Local services you can trust</h2>
          <p>ServaLink helps people in Cameroon find suitable service providers in their own town.</p>
        </div>
        <div className="feature-split">
          <div className="card card-pad stack-sm">
            <span className="ico ico-green" style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center" }}><ShieldCheck size={22} aria-hidden="true" /></span>
            <h3>Reviews from real bookings</h3>
            <p className="muted small">Only customers with a completed booking can review a provider, so every review is marked as a verified booking.</p>
          </div>
          <div className="card card-pad stack-sm">
            <span className="ico ico-green" style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center" }}><MapPin size={22} aria-hidden="true" /></span>
            <h3>Local by design</h3>
            <p className="muted small">Providers are listed by town. ServaLink doesn't process payments, so you agree on the work directly with your provider.</p>
          </div>
        </div>
      </section>

      <section className="section" aria-label="Become a provider">
        <div className="cta-band">
          <div>
            <h2>Offer your skills in your town</h2>
            <p>Apply once with your existing account. After approval, list your services and receive booking requests.</p>
          </div>
          <ButtonLink to="/become-provider" variant="light" size="lg" icon={<BadgeCheck size={18} />}>Become a provider</ButtonLink>
        </div>
      </section>
      <div className="row" style={{ justifyContent: "center", marginTop: 28 }}>
        <span className="muted small row" style={{ gap: 6 }}><CalendarCheck size={16} aria-hidden="true" />Free to join. No payment handled on ServaLink.</span>
      </div>
    </>
  );
}
