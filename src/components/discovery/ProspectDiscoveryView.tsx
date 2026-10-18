import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Globe, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  Plus, 
  ExternalLink,
  Filter,
  Check,
  Send,
  Building2,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Prospect, SearchPlacesParams, WebsiteStatus } from '../../types/index.ts';

interface ProspectDiscoveryViewProps {
  onAddProspectToPipeline: (prospect: Prospect) => void;
  onGenerateDemo: (prospect: Prospect) => void;
  onDirectPitch: (prospect: Prospect) => void;
  onSearchPlaces: (params: SearchPlacesParams) => Promise<Prospect[]>;
  isSearching: boolean;
  pipelineProspectIds: Set<string>;
}

const QUICK_CATEGORIES = [
  { label: 'Dental Clinics', query: 'dentist', icon: '🦷' },
  { label: 'Plumbing & HVAC', query: 'plumbing hvac', icon: '🔧' },
  { label: 'Bakeries & Cafes', query: 'bakery cafe', icon: '☕' },
  { label: 'Chiropractic & Wellness', query: 'chiropractor', icon: '🌿' },
  { label: 'Roofing & Remodel', query: 'roofing contractor', icon: '🏠' },
];

export const ProspectDiscoveryView: React.FC<ProspectDiscoveryViewProps> = ({
  onAddProspectToPipeline,
  onGenerateDemo,
  onDirectPitch,
  onSearchPlaces,
  isSearching,
  pipelineProspectIds,
}) => {
  const [location, setLocation] = useState('Austin, TX');
  const [category, setCategory] = useState('Dental Clinics');
  const [customQuery, setCustomQuery] = useState('');
  const [websiteFilter, setWebsiteFilter] = useState<SearchPlacesParams['websiteFilter']>('all');
  const [searchResults, setSearchResults] = useState<Prospect[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Auto-run initial discovery on mount
  React.useEffect(() => {
    let active = true;
    async function init() {
      try {
        const results = await onSearchPlaces({
          query: QUICK_CATEGORIES.find((item) => item.label === category)?.query || category,
          location,
          category,
          websiteFilter,
        });
        if (active) {
          setSearchResults(results);
          setSearchError(null);
          setHasSearched(true);
        }
      } catch (error) {
        if (active) {
          setSearchResults([]);
          setSearchError(error instanceof Error ? error.message : String(error));
          setHasSearched(true);
        }
      }
    }
    init();
    return () => { active = false; };
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = customQuery.trim() || QUICK_CATEGORIES.find((item) => item.label === category)?.query || category;
    setSearchError(null);
    try {
      const results = await onSearchPlaces({ query, location, category, websiteFilter });
      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      setSearchResults([]);
      setSearchError(error instanceof Error ? error.message : String(error));
      setHasSearched(true);
    }
  };

  const handleQuickCategorySelect = (item: typeof QUICK_CATEGORIES[0]) => {
    setCategory(item.label);
    setCustomQuery(item.query);
  };

  const handleAdd = (prospect: Prospect) => {
    onAddProspectToPipeline(prospect);
    setAddedIds((prev) => new Set(prev).add(prospect.id));
  };

  const getWebsiteStatusBadge = (status: WebsiteStatus) => {
    switch (status) {
      case 'no_website':
        return (
          <span className="text-rose-400 bg-rose-950/40 border border-rose-800/60 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            No Website Detected
          </span>
        );
      case 'broken_mobile':
        return (
          <span className="text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Broken Mobile / Non-Responsive
          </span>
        );
      case 'broken':
        return (
          <span className="text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Site Unreachable / Error
          </span>
        );
      case 'outdated':
        return (
          <span className="text-orange-400 bg-orange-950/40 border border-orange-800/60 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-400" />
            HTTP (Not Secure)
          </span>
        );
      case 'modern':
      default:
        return (
          <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
            <Globe className="w-3 h-3 text-slate-400" />
            HTTPS Reachable
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Search Form */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="max-w-3xl mb-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">
            <Search className="w-3.5 h-3.5" />
            Google Places Discovery Engine
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Discover Local Businesses with Underperforming Websites
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
            Search Google Business listings by category and location, then review real business details, ratings, and listed websites.
          </p>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 text-xs">
          <span className="text-slate-500 font-medium whitespace-nowrap">Popular Sectors:</span>
          {QUICK_CATEGORIES.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleQuickCategorySelect(item)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                category === item.label
                  ? 'bg-sky-500/20 border-sky-500/60 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Search Inputs Grid */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Location */}
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Target Metro / City / Zip
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Austin, TX"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>
            </div>

            {/* Keyword / Niche */}
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Business Category or Custom Keyword
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={category || 'e.g. Dentist, Roofer, Bistro'}
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 h-[38px]"
              >
                <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                <span>{isSearching ? 'Scanning Places...' : 'Find Businesses'}</span>
              </button>
            </div>
          </div>

          {/* Filter options bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <Filter className="w-3.5 h-3.5" />
                Opportunity Filter:
              </span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setWebsiteFilter('no_website')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    websiteFilter === 'no_website'
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  No Website Only
                </button>
                <button
                  type="button"
                  onClick={() => setWebsiteFilter('broken')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    websiteFilter === 'broken'
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Broken / Unreachable
                </button>
                <button
                  type="button"
                  onClick={() => setWebsiteFilter('outdated')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    websiteFilter === 'outdated'
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Outdated HTTP
                </button>
                <button
                  type="button"
                  onClick={() => setWebsiteFilter('all')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    websiteFilter === 'all'
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Places
                </button>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Google Places API (New)
            </div>
          </div>
        </form>
      </div>

      {/* Discovery Results */}
      {isSearching && (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-white">Scanning Google Places & Local Maps...</p>
          <p className="text-xs text-slate-400 mt-1">Fetching live business listings and ratings</p>
        </div>
      )}

      {!isSearching && searchError && (
        <div role="alert" className="border border-rose-800/70 bg-rose-950/30 rounded-xl p-6 max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-200 mb-1">Google Places search failed</h3>
              <p className="text-sm text-rose-100 break-words">{searchError}</p>
            </div>
          </div>
        </div>
      )}

      {!isSearching && !searchError && hasSearched && searchResults.length === 0 && (
        <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No matching businesses found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Try another category or location, or select All Places to broaden your Google Places search.
          </p>
        </div>
      )}

      {!isSearching && searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Found <strong className="text-white font-mono">{searchResults.length}</strong> qualified prospects in{' '}
              <strong className="text-white">{location}</strong>
            </span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Ready for instant demo generation</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((prospect) => {
              const isAdded = addedIds.has(prospect.id) || pipelineProspectIds.has(prospect.id);

              return (
                <div
                  key={prospect.id}
                  className="bg-[#0f172a] border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Top status & category */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider truncate">
                        {prospect.category}
                      </span>
                      {getWebsiteStatusBadge(prospect.websiteStatus)}
                    </div>

                    {/* Business Name */}
                    <h3 className="text-base font-bold text-white tracking-tight leading-snug mb-2">
                      {prospect.name}
                    </h3>

                    {/* Google Reviews & Rating */}
                    <div className="flex items-center gap-2 text-xs mb-3">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{prospect.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 font-mono">
                        {prospect.reviewsCount} Google reviews
                      </span>
                      <span className="text-slate-600">·</span>
                      <a
                        href={prospect.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(prospect.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:underline inline-flex items-center gap-0.5 text-[11px]"
                      >
                        Maps <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-1.5 text-xs text-slate-300 mb-4 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-2 text-slate-400 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{prospect.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{prospect.phone}</span>
                      </div>
                    </div>

                    {/* Pain points */}
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Opportunity Factors</span>
                        <span className="text-sky-400 font-mono font-bold">{prospect.opportunityScore}/100</span>
                      </div>
                      <ul className="space-y-1">
                        {prospect.painPoints.map((pt, i) => (
                          <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                            <span className="text-rose-400">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => onGenerateDemo(prospect)}
                      className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                      <span>Create Demo Site</span>
                    </button>

                    <button
                      onClick={() => handleAdd(prospect)}
                      disabled={isAdded}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors ${
                        isAdded
                          ? 'bg-slate-800 border-slate-700 text-emerald-400'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                      }`}
                      title={isAdded ? 'Already in pipeline' : 'Add to Pipeline'}
                      aria-label="Add to pipeline"
                    >
                      {isAdded ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Initial state if no search performed yet */}
      {!isSearching && !hasSearched && (
        <div className="border border-dashed border-slate-800 rounded-xl p-12 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Start Local Prospect Discovery</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Enter a city and category above or pick from popular local sectors to find top-rated businesses that lack mobile-optimized websites.
          </p>
          <button
            onClick={() => handleSearch()}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Austin, TX Dental Clinics</span>
          </button>
        </div>
      )}
    </div>
  );
};
