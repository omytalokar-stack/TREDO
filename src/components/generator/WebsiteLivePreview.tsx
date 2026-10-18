import React, { useState } from 'react';
import { 
  Phone, 
  MapPin, 
  Clock,
  Star, 
  CheckCircle2, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { WebsiteDraft } from '../../types/index.ts';

interface WebsiteLivePreviewProps {
  draft: WebsiteDraft;
  deviceMode: 'desktop' | 'tablet' | 'mobile';
}

export const WebsiteLivePreview: React.FC<WebsiteLivePreviewProps> = ({
  draft,
  deviceMode,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'reviews' | 'contact'>('home');
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: draft.services?.[0]?.title || 'General enquiry',
    date: '',
    notes: '',
  });
  const services = Array.isArray(draft.services) ? draft.services : [];
  const features = Array.isArray(draft.features) ? draft.features : [];
  const contactInfo = draft.contactInfo || { phone: '', email: '', address: '', hours: '' };
  const industry = draft.industry.toLowerCase();
  const heroTheme = industry.includes('dental') || industry.includes('medical') || industry.includes('wellness')
    ? { from: '#082f49', via: '#164e63', accent: '#67e8f9', glow: 'rgba(34, 211, 238, 0.2)' }
    : industry.includes('plumb') || industry.includes('roof') || industry.includes('trade')
      ? { from: '#431407', via: '#7c2d12', accent: '#fdba74', glow: 'rgba(251, 146, 60, 0.2)' }
      : industry.includes('bakery') || industry.includes('cafe') || industry.includes('food')
        ? { from: '#451a03', via: '#78350f', accent: '#fcd34d', glow: 'rgba(251, 191, 36, 0.2)' }
        : industry.includes('law') || industry.includes('legal')
          ? { from: '#172554', via: '#312e81', accent: '#c4b5fd', glow: 'rgba(129, 140, 248, 0.2)' }
          : { from: '#0f172a', via: '#1e3a5f', accent: '#7dd3fc', glow: 'rgba(56, 189, 248, 0.2)' };
  const trustLink = draft.googleMapsUrl;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSubmitted(true);
  };

  const navigateTo = (tab: typeof activeTab, sectionId: string) => {
    setActiveTab(tab);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getContainerWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[380px]';
      case 'tablet':
        return 'max-w-[760px]';
      case 'desktop':
      default:
        return 'max-w-full';
    }
  };

  return (
    <div className={`mx-auto transition-all duration-300 ${getContainerWidth()} bg-slate-50 text-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/20 font-sans ring-1 ring-slate-950/10`}>
      {/* Browser Chrome Simulation Header */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
          <span className="ml-2 font-mono text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
            Preview · {draft.businessName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-sky-200 bg-white/10 border border-white/10 px-2 py-1 rounded-full">
          <Sparkles className="w-3 h-3" />
          <span>Concept · Not published</span>
        </div>
      </div>

      {/* Website Navigation */}
      <header className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-20">
        <div className="px-4 sm:px-7 py-4 flex items-center justify-between gap-4">
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 block leading-tight">
              {draft.businessName}
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:block mt-0.5">
              {draft.industry}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {contactInfo.phone && (
              <a
                href={`tel:${contactInfo.phone}`}
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                <Phone className="w-3.5 h-3.5 text-sky-600" />
                <span>{contactInfo.phone}</span>
              </a>
            )}

            <button
              onClick={() => {
                const el = document.getElementById('booking-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ background: `linear-gradient(120deg, ${draft.primaryColor}, ${draft.accentColor})` }}
              className="text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-slate-900/15 flex items-center gap-1.5"
            >
              <Calendar className="w-3 h-3" />
              <span className="truncate max-w-[140px]">{draft.heroCtaText || 'Request a quote'}</span>
            </button>
          </div>
        </div>

        {/* Sub-nav for preview navigation */}
        <div className="flex items-center gap-5 px-4 sm:px-7 py-2 bg-white/70 border-t border-slate-100 text-xs font-medium text-slate-600 overflow-x-auto">
          <button 
            onClick={() => navigateTo('home', 'preview-home')}
            className={`pb-1 border-b-2 whitespace-nowrap ${activeTab === 'home' ? 'border-sky-600 text-sky-700 font-semibold' : 'border-transparent hover:text-slate-900'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => navigateTo('services', 'preview-services')}
            className={`pb-1 border-b-2 whitespace-nowrap ${activeTab === 'services' ? 'border-sky-600 text-sky-700 font-semibold' : 'border-transparent hover:text-slate-900'}`}
          >
            Services & Pricing
          </button>
          <button 
            onClick={() => navigateTo('reviews', 'preview-google-profile')}
            className={`pb-1 border-b-2 whitespace-nowrap flex items-center gap-1 ${activeTab === 'reviews' ? 'border-sky-600 text-sky-700 font-semibold' : 'border-transparent hover:text-slate-900'}`}
          >
            <span>Google listing</span>
          </button>
          <button 
            onClick={() => navigateTo('contact', 'preview-contact')}
            className={`pb-1 border-b-2 whitespace-nowrap ${activeTab === 'contact' ? 'border-sky-600 text-sky-700 font-semibold' : 'border-transparent hover:text-slate-900'}`}
          >
            Location & Hours
          </button>
        </div>
      </header>

      {/* Main Website Content Body */}
      <div className="max-h-[600px] overflow-y-auto">
        {/* Hero Section */}
        <section
          id="preview-home"
          className="relative isolate overflow-hidden px-5 sm:px-10 py-12 sm:py-16 text-white"
          style={{ background: `linear-gradient(125deg, ${heroTheme.from}, ${heroTheme.via} 58%, #0f172a)` }}
        >
          <div className="absolute inset-0 -z-10 opacity-80" style={{ background: `radial-gradient(ellipse at 80% 5%, ${heroTheme.glow}, transparent 42%), radial-gradient(ellipse at 10% 100%, ${heroTheme.glow}, transparent 45%)` }} />
          <div className="absolute inset-0 -z-10 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-xl mb-5" style={{ color: heroTheme.accent }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{draft.tagline || `${draft.industry} · ${contactInfo.address || 'Local service'}`}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] mb-4 max-w-3xl">
              {draft.headline || `${draft.industry} in ${contactInfo.address || 'your community'}`}
            </h1>

            <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed mb-7 max-w-2xl">
              {draft.subheadline || `Explore ${draft.industry.toLowerCase()} options from ${draft.businessName}. Contact the team to discuss your needs.`}
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-9">
              <button
                onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ background: `linear-gradient(120deg, ${draft.primaryColor}, ${draft.accentColor})` }}
                className="text-white text-sm font-bold px-5 py-3 rounded-xl shadow-lg shadow-black/20 hover:-translate-y-0.5 hover:brightness-110 transition-all flex items-center gap-2"
              >
                <span>{draft.heroCtaText || 'Request a quote'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {contactInfo.phone && (
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="text-white bg-white/10 backdrop-blur-xl border border-white/20 text-sm font-semibold px-4 py-3 rounded-xl hover:bg-white/15 transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {contactInfo.phone}</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {draft.googleRating ? (
                <a
                  href={trustLink || '#google-profile'}
                  target={trustLink ? '_blank' : undefined}
                  rel={trustLink ? 'noreferrer' : undefined}
                  className="rounded-xl border border-white/15 bg-white/10 backdrop-blur-xl p-3.5 flex items-center gap-3 hover:bg-white/15 transition-colors"
                >
                  <Star className="w-5 h-5 fill-amber-300 text-amber-300 shrink-0" />
                  <span>
                    <strong className="block text-sm">{draft.googleRating.toFixed(1)} / 5</strong>
                    <span className="text-[10px] text-slate-300">
                      Google listing{draft.googleReviewCount ? ` · ${draft.googleReviewCount.toLocaleString()} reviews` : ''}
                    </span>
                  </span>
                </a>
              ) : (
                <div className="rounded-xl border border-white/15 bg-white/10 backdrop-blur-xl p-3.5 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-slate-300 shrink-0" />
                  <span className="text-xs text-slate-200">Business profile details</span>
                </div>
              )}
              <div className="rounded-xl border border-white/15 bg-white/10 backdrop-blur-xl p-3.5 flex items-center gap-3">
                <MapPin className="w-5 h-5 shrink-0" style={{ color: heroTheme.accent }} />
                <span className="text-xs text-slate-200">{contactInfo.address || `Serving ${draft.industry} customers`}</span>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 backdrop-blur-xl p-3.5 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                <span className="text-xs text-slate-200">A website concept tailored to this business</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature / Why Choose Us */}
        <section className="px-4 sm:px-8 py-8 bg-white border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Suggested website highlights
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">Draft ideas only; confirm details with the business before publishing.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feat, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/75 backdrop-blur-lg border border-slate-200/80 shadow-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: draft.primaryColor }} />
                <span className="text-xs font-medium text-slate-700 leading-snug">{feat}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Services Showcase */}
        <section id="preview-services" className="px-4 sm:px-8 py-9 bg-gradient-to-b from-white to-slate-100/80 border-b border-slate-200/70">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Services to explore</h2>
              <p className="text-xs text-slate-500 mt-1">Suggested offerings for this website concept. Confirm services and pricing with the business.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {services.map((srv) => (
              <div key={srv.id} className="group relative bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-white shadow-lg shadow-slate-900/[0.04] ring-1 ring-slate-200/70 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl transition-all">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ color: draft.primaryColor, backgroundColor: `${draft.primaryColor}12` }}>
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Pricing on request</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{srv.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{srv.description}</p>
                </div>
                <button
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, service: srv.title }));
                    document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-3 text-xs font-bold hover:opacity-75 flex items-center gap-1 self-start"
                  style={{ color: draft.primaryColor }}
                >
                  <span>Ask about this service</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section id="preview-google-profile" className="px-4 sm:px-8 py-8 bg-white border-b border-slate-100">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">Google business profile</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {draft.googleRating
                    ? `${draft.googleRating.toFixed(1)} out of 5${draft.googleReviewCount ? ` · ${draft.googleReviewCount.toLocaleString()} ratings` : ''} · Listing data`
                    : 'Rating data was not available for this listing.'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">No customer review quotes are reproduced in this concept.</p>
              </div>
            </div>
            {trustLink && (
              <a href={trustLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:brightness-110 transition-all" style={{ backgroundColor: draft.primaryColor }}>
                View Google listing <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </section>

        {/* Interactive inquiry form */}
        <section id="booking-section" className="px-4 sm:px-8 py-8 bg-slate-900 text-white">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-6">
              <span 
                style={{ color: draft.accentColor }} 
                className="text-xs font-bold uppercase tracking-wider inline-block mb-1"
              >
                Request a callback
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">Tell us what you need</h2>
              <p className="text-xs text-slate-400 mt-1">Choose a service and preferred date to preview an enquiry.</p>
            </div>

            {bookingSubmitted ? (
              <div className="p-4 bg-emerald-900/50 border border-emerald-500/50 rounded-lg text-center animate-fade-in">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">Enquiry preview complete</h4>
                <p className="text-xs text-emerald-200 mt-1">This is a website concept. Your request has not been sent and no appointment is booked.</p>
                <button type="button" onClick={() => setBookingSubmitted(false)} className="mt-3 text-xs font-semibold underline underline-offset-2 text-emerald-100">Edit request</button>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-3 bg-white/10 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/15 shadow-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Your phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Service Required
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-sky-500"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.title}>{s.title}</option>
                      ))}
                      {services.length === 0 && <option value="General enquiry">General enquiry</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    How can the team help?
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Share a few details about your enquiry..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  style={{ background: `linear-gradient(120deg, ${draft.primaryColor}, ${draft.accentColor})` }}
                  className="w-full text-white font-bold text-xs py-3 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Preview enquiry</span>
                </button>
                <p className="text-[10px] leading-relaxed text-center text-slate-400">Demo interaction only. This form does not send personal information to the business.</p>
              </form>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer id="preview-contact" className="px-4 sm:px-8 py-7 bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-bold text-white text-sm">{draft.businessName}</div>
              {contactInfo.address && (
                <a
                  href={trustLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 mt-2 hover:text-white transition-colors"
                >
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{contactInfo.address} · View map</span>
                </a>
              )}
              {contactInfo.phone && <a className="flex items-center gap-2 mt-2 hover:text-white transition-colors" href={`tel:${contactInfo.phone}`}><Phone className="w-3.5 h-3.5" />{contactInfo.phone}</a>}
              {contactInfo.email && <a className="flex items-center gap-2 mt-2 hover:text-white transition-colors" href={`mailto:${contactInfo.email}`}><span>{contactInfo.email}</span></a>}
            </div>
            <div className="text-right text-[11px]">
              <div className="flex items-center gap-1.5 justify-end"><Clock className="w-3 h-3" />{contactInfo.hours || 'Contact the business to confirm hours'}</div>
              <div className="text-slate-500 mt-1">Website concept preview · Not yet published</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
