import React, { useState } from 'react';
import { 
  Sparkles, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Share2, 
  Mail, 
  Copy, 
  Check, 
  Palette, 
  Code, 
  ExternalLink,
  Zap,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { Prospect, WebsiteDraft } from '../../types/index.ts';
import { WebsiteLivePreview } from './WebsiteLivePreview.tsx';

interface DemoGeneratorViewProps {
  prospects: Prospect[];
  selectedProspectId: string | null;
  onSelectProspect: (id: string) => void;
  onLaunchOutreach: (prospect: Prospect, demoDraft: WebsiteDraft) => void;
  onUpdateDraft: (prospectId: string, updatedDraft: WebsiteDraft) => void;
  onGenerateWithAI: (prospectId: string, tone?: string) => Promise<void>;
  isGeneratingAI: boolean;
}

const THEME_PRESETS = [
  { name: 'Teal Wellness', primary: '#0d9488', accent: '#2dd4bf', bg: 'Clinical & Modern' },
  { name: 'Trades Orange', primary: '#ea580c', accent: '#fb923c', bg: 'High Energy Trades' },
  { name: 'Artisan Amber', primary: '#b45309', accent: '#f59e0b', bg: 'Warm Hospitality' },
  { name: 'Corporate Sky', primary: '#0284c7', accent: '#38bdf8', bg: 'Clean B2B / Dental' },
  { name: 'Executive Indigo', primary: '#1e3a8a', accent: '#60a5fa', bg: 'Legal & Advisory' },
];

export const DemoGeneratorView: React.FC<DemoGeneratorViewProps> = ({
  prospects,
  selectedProspectId,
  onSelectProspect,
  onLaunchOutreach,
  onUpdateDraft,
  onGenerateWithAI,
  isGeneratingAI,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [selectedTone, setSelectedTone] = useState('High-converting, trustworthy');
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Find active prospect or default to first
  const activeProspect = prospects.find((p) => p.id === selectedProspectId) || prospects[0];
  const draft = activeProspect?.demoDraft;

  const handleFieldChange = (field: keyof WebsiteDraft, value: any) => {
    if (!draft || !activeProspect) return;
    const updated = { ...draft, [field]: value };
    onUpdateDraft(activeProspect.id, updated);
  };

  const handleCopyDemoLink = () => {
    const url = `https://siteseller.preview/demo/${activeProspect?.id || 'demo'}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyHtml = () => {
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  if (!draft) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mx-auto flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Website Draft Selected</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          {prospects.length > 0
            ? `Load or generate a website draft for ${prospects[0].name}, your first saved prospect.`
            : 'Save a real prospect from Discovery before generating a website draft.'}
        </p>
        {prospects.length > 0 && (
          <button
            disabled={isGeneratingAI}
            onClick={() => {
              const firstProspect = prospects[0];
              if (firstProspect.demoDraft) {
                onSelectProspect(firstProspect.id);
              } else {
                void onGenerateWithAI(firstProspect.id);
              }
            }}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {isGeneratingAI
              ? `Building Demo for ${prospects[0].name}...`
              : prospects[0].demoDraft
                ? `Load Draft for ${prospects[0].name}`
                : `Build Demo for ${prospects[0].name}`}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Controls Toolbar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Prospect Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">
            Prospect Target:
          </label>
          <select
            value={activeProspect?.id}
            onChange={(e) => onSelectProspect(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-sky-500 max-w-xs"
          >
            {prospects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Theme Presets */}
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            {THEME_PRESETS.map((t) => (
              <button
                key={t.name}
                title={t.name}
                onClick={() => {
                  handleFieldChange('primaryColor', t.primary);
                  handleFieldChange('accentColor', t.accent);
                }}
                className={`w-6 h-6 rounded-md border flex items-center justify-center transition-transform hover:scale-110 ${
                  draft.primaryColor === t.primary ? 'ring-2 ring-white scale-110' : 'border-slate-700'
                }`}
                style={{ backgroundColor: t.primary }}
              />
            ))}
          </div>
        </div>

        {/* Viewport switchers & Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {/* Device viewport segmented control */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded text-xs transition-colors ${
                deviceMode === 'desktop' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Desktop View"
              aria-label="Desktop View"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`p-1.5 rounded text-xs transition-colors ${
                deviceMode === 'tablet' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tablet View"
              aria-label="Tablet View"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded text-xs transition-colors ${
                deviceMode === 'mobile' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Mobile View"
              aria-label="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCopyDemoLink}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
          </button>

          <button
            onClick={() => setShowCodeModal(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Export Code</span>
          </button>

          <button
            onClick={() => onLaunchOutreach(activeProspect, draft)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Pitch this Demo</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: Left Config Panel, Right Live Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Config & Customization Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* AI Generator Refine Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Content Engine
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Gemini 2.5</span>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Tailor copy, tone, and high-conversion hooks for {activeProspect.name}.
            </p>
            <div className="space-y-2 mb-3">
              <input
                type="text"
                placeholder="e.g. Urgent emergency focus, luxury aesthetic"
                value={selectedTone}
                onChange={(e) => setSelectedTone(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              disabled={isGeneratingAI}
              onClick={() => onGenerateWithAI(activeProspect.id, selectedTone)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin text-sky-400' : ''}`} />
              <span>{isGeneratingAI ? 'Refining with AI...' : 'Re-generate Custom Copy'}</span>
            </button>
          </div>

          {/* Quick Copy Customizer */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Live Copy & Branding
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Headline (Hero Title)
              </label>
              <textarea
                rows={2}
                value={draft.headline}
                onChange={(e) => handleFieldChange('headline', e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 resize-none font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Subheadline
              </label>
              <textarea
                rows={3}
                value={draft.subheadline}
                onChange={(e) => handleFieldChange('subheadline', e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Call-To-Action Button Label
              </label>
              <input
                type="text"
                value={draft.heroCtaText}
                onChange={(e) => handleFieldChange('heroCtaText', e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Tagline / Kicker
              </label>
              <input
                type="text"
                value={draft.tagline}
                onChange={(e) => handleFieldChange('tagline', e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Sales Pitch Hook / Angle */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-2">
              Strategic Pitch Angle
            </span>
            <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              "{draft.customPitchAngle}"
            </p>
          </div>

          {/* SEO & Performance Scorecard */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Before vs. After Pitch Metrics
            </span>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-lg">
                <div className="text-[11px] text-rose-300 mb-1">Current Presence</div>
                <div className="text-2xl font-mono font-bold text-rose-400 tabular-nums">
                  {draft.metrics?.currentAuditScore ?? 'Not measured'}
                  {draft.metrics?.currentAuditScore !== undefined && '/100'}
                </div>
                <div className="text-[10px] text-rose-400/80 mt-1">Losing Leads</div>
              </div>
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-lg">
                <div className="text-[11px] text-emerald-300 mb-1">SiteSeller Draft</div>
                <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
                  {draft.metrics?.redesignAuditScore ?? 'Not measured'}
                  {draft.metrics?.redesignAuditScore !== undefined && '/100'}
                </div>
                <div className="text-[10px] text-emerald-300 mt-1">
                  {draft.metrics?.speedImprovement ?? 'Not measured'}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>Mobile conversion lift:</span>
              <span className="font-semibold text-emerald-400 font-mono">
                {draft.metrics?.mobileConversionLift ?? 'Not measured'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Viewport Centerpiece (8 cols) */}
        <div className="lg:col-span-8 bg-[#090d16] border border-slate-800 rounded-xl p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className="font-medium">
              Interactive Live Draft: <strong className="text-white">{activeProspect.name}</strong>
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Responsive Rendering: {deviceMode.toUpperCase()}
            </span>
          </div>

          {/* Render the embedded Website Live Preview */}
          <WebsiteLivePreview draft={draft} deviceMode={deviceMode} />
        </div>
      </div>

      {/* Code Export Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-sky-400" />
                Export Production HTML & CSS
              </h3>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Clean, standalone HTML5 bundle ready to deploy on any hosting provider (Vercel, Netlify, Cloudflare Pages, or WordPress).
            </p>
            <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 max-h-64 overflow-y-auto border border-slate-800 select-all">
              {`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${draft.businessName} - ${draft.tagline}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-slate-900 font-sans">
  <header class="py-4 px-6 border-b flex justify-between items-center">
    <div class="text-xl font-bold">${draft.businessName}</div>
    <a href="tel:${draft.contactInfo.phone}" class="text-sm font-semibold text-sky-600">${draft.contactInfo.phone}</a>
  </header>
  <main class="py-16 px-6 max-w-4xl mx-auto text-center">
    <h1 class="text-4xl font-extrabold mb-4">${draft.headline}</h1>
    <p class="text-lg text-slate-600 mb-8">${draft.subheadline}</p>
    <a href="#contact" class="px-6 py-3 bg-[${draft.primaryColor}] text-white font-bold rounded-lg shadow-md">${draft.heroCtaText}</a>
  </main>
</body>
</html>`}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCopyHtml}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                {copiedHtml ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedHtml ? 'Copied HTML!' : 'Copy to Clipboard'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
