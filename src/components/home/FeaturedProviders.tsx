import { Link } from "react-router-dom";
import { MapPin, Users } from "lucide-react";
import { api, type ProviderCard } from "../../api";
import { ButtonLink } from "../ui/Button";
import { Avatar, EmptyState, ErrorState, RatingChip, Skeleton } from "../ui/Display";
import { plural } from "../../lib/format";
import { useResource } from "../../lib/useResource";
import { CategoryIcon } from "../domain/CategoryIcon";

/** How many providers the home page shows. */
const FEATURED_COUNT = 6;

function FeaturedCard({ provider }: { provider: ProviderCard }) {
  // Real work photo from the provider's own gallery; any failure just falls back to the avatar block.
  const gallery = useResource(() => api.providerGallery(provider.provider_id), [provider.provider_id]);
  const photo = gallery.data?.find((item) => item.photo_url)?.photo_url ?? null;
  const title = provider.service_title || provider.name;
  return (
    <article className="home-provider" aria-label={title}>
      <div className="home-provider-media">
        {photo
          ? <img src={photo} alt={`Example of work by ${provider.name}`} loading="lazy" decoding="async" />
          : (
            <div className="home-provider-fallback" aria-hidden="true">
              <Avatar name={provider.name} src={provider.photo_url} size={64} />
              <span className="ci"><CategoryIcon name={provider.category} size={18} /></span>
            </div>
          )}
      </div>
      <div className="home-provider-body">
        <div>
          <h3>{title}</h3>
          <p className="muted small">{provider.name}</p>
        </div>
        <p className="small row" style={{ gap: 14 }}>
          <span>{provider.category}</span>
          <span className="muted row" style={{ gap: 4 }}><MapPin size={14} aria-hidden="true" />{provider.city}</span>
        </p>
        {provider.review_count > 0 && (
          <p className="row" style={{ gap: 10 }}>
            <RatingChip rating={provider.overall_rating} />
            <span className="muted small">{plural(provider.review_count, "review")}</span>
          </p>
        )}
        <ButtonLink to={`/providers/${provider.provider_id}`} variant="secondary" size="sm" aria-label={`View Profile of ${provider.name}`}>View Profile</ButtonLink>
      </div>
    </article>
  );
}

/**
 * "Meet Local Professionals". Selection is deterministic and needs no extra field: the first FEATURED_COUNT
 * approved providers in the API's order (GET /providers sorts by provider id). Nothing here is invented.
 */
export function FeaturedProviders() {
  const providers = useResource(() => api.providers({ limit: FEATURED_COUNT }), []);
  const list = providers.data ?? [];
  return (
    <section className="home-band home-band-sage" aria-labelledby="featured-title">
      <div className="home-wrap">
        <div className="home-head row-between">
          <div>
            <h2 id="featured-title">Meet Local Professionals</h2>
            <p>Explore service providers available in your area.</p>
          </div>
          <Link to="/search" className="small nowrap">Browse all providers</Link>
        </div>
        {providers.loading && !providers.data ? (
          <div className="home-provider-grid" aria-busy="true">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} height={300} radius={16} />)}</div>
        ) : providers.error ? (
          <div className="card"><ErrorState error={providers.error} onRetry={providers.reload} title="We couldn't load providers" /></div>
        ) : list.length === 0 ? (
          <div className="card">
            <EmptyState icon={<Users size={24} />} title="No providers are listed yet"
              action={<ButtonLink to="/become-provider" size="sm">Become a Provider</ButtonLink>}>
              Approved providers appear here as they join ServaLink.
            </EmptyState>
          </div>
        ) : (
          <div className="home-provider-grid">{list.map((p) => <FeaturedCard key={p.provider_id} provider={p} />)}</div>
        )}
      </div>
    </section>
  );
}
