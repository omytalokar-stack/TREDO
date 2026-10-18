import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Mail, 
  FileText, 
  CheckCircle2, 
  Clock, 
  MousePointerClick, 
  Eye, 
  CornerUpLeft, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Plus,
  Users,
  Copy,
} from 'lucide-react';
import { Prospect, OutreachLog, EmailTemplate, OutreachStatus, WebsiteDraft } from '../../types/index.ts';
import { interpolateEmailTemplate } from '../../utils/pipeline.ts';

interface OutreachControlPanelProps {
  prospects: Prospect[];
  templates: EmailTemplate[];
  outreachLogs: OutreachLog[];
  onSendPitch: (payload: {
    prospectId: string;
    recipientEmail: string;
    subject: string;
    body: string;
    templateId: string;
    demoUrl: string;
  }) => Promise<boolean>;
  onAddTemplate: (tpl: Partial<EmailTemplate>) => Promise<void>;
  onResolveRecipientEmail: (prospectId: string) => Promise<{
    email: string;
    source: 'saved' | 'website' | 'not_found';
    message?: string;
  }>;
  onEnsureDemo: (prospect: Prospect) => Promise<WebsiteDraft>;
  isSending: boolean;
  preselectedProspectId?: string | null;
}

const DEFAULT_PITCH_TEMPLATE: EmailTemplate = {
  id: 'builtin-local-pitch',
  name: 'Personalized website concept',
  category: 'Cold Demo Pitch',
  subject: 'A website concept for {{businessName}}',
  bodyTemplate: `Hi {{contactName}},

I put together an interactive website concept tailored to {{businessName}}.

{{researchSummary}}

If the concept feels useful, would you be open to a quick conversation?

Best,
SiteSeller Agent`,
  description: 'A personalized pitch with prospect research and a shareable website concept preview.',
};

function getProspectPainPoints(prospect: Prospect): string[] {
  if (prospect.painPoints?.length) return prospect.painPoints;
  const statusDescriptions: Partial<Record<Prospect['websiteStatus'], string>> = {
    no_website: 'No website is listed for this business.',
    outdated: 'The existing website may be outdated.',
    broken: 'The existing website appears to be unavailable.',
    broken_mobile: 'The existing website may not work well on mobile devices.',
  };
  const description = statusDescriptions[prospect.websiteStatus];
  return description ? [description] : ['No website pain point was detected.'];
}

function getProspectResearchSummary(prospect: Prospect, demoUrl: string): string {
  const location = [prospect.address, prospect.city, prospect.state]
    .filter((part) => typeof part === 'string' && part.trim())
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(', ') || 'Not listed';
  const rating = prospect.rating > 0 ? `${prospect.rating.toFixed(1)} / 5.0` : 'Not listed';
  const reviewsCount = prospect.reviewsCount > 0
    ? prospect.reviewsCount.toLocaleString()
    : 'Not listed';

  return `CLIENT RESEARCH
Business: ${prospect.name}
Location: ${location}
Google rating: ${rating}
Total Google reviews: ${reviewsCount}
Detected pain points:
${getProspectPainPoints(prospect).map((point) => `- ${point}`).join('\n')}

INTERACTIVE DEMO PREVIEW
${demoUrl || '[website preview is being prepared]'}`;
}

export const OutreachControlPanel: React.FC<OutreachControlPanelProps> = ({
  prospects,
  templates,
  outreachLogs,
  onSendPitch,
  onAddTemplate,
  onResolveRecipientEmail,
  onEnsureDemo,
  isSending,
  preselectedProspectId,
}) => {
  const [selectedProspectId, setSelectedProspectId] = useState<string>(
    preselectedProspectId || prospects[0]?.id || ''
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || DEFAULT_PITCH_TEMPLATE.id
  );
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailLookupStatus, setEmailLookupStatus] = useState<'idle' | 'loading' | 'saved' | 'website' | 'not_found' | 'error'>('idle');
  const [emailLookupMessage, setEmailLookupMessage] = useState('');
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [demoError, setDemoError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');

  // Active items
  const activeProspect = prospects.find((p) => p.id === selectedProspectId) || prospects[0];
  const activeTemplate = templates.find((t) => t.id === selectedTemplateId)
    || templates[0]
    || DEFAULT_PITCH_TEMPLATE;
  const demoUrl = activeProspect?.demoDraft
    ? new URL(`/demo/${activeProspect.id}`, window.location.origin).toString()
    : '';
  const sentLogs = outreachLogs.filter((log) => ['sent', 'opened', 'clicked', 'replied'].includes(log.status));
  const openedLogs = outreachLogs.filter((log) => ['opened', 'clicked', 'replied'].includes(log.status));
  const clickedLogs = outreachLogs.filter((log) => ['clicked', 'replied'].includes(log.status));
  const formatRate = (count: number) => sentLogs.length
    ? `${Math.round((count / sentLogs.length) * 100)}%`
    : '—';

  useEffect(() => {
    if (!selectedProspectId && prospects[0]) setSelectedProspectId(prospects[0].id);
  }, [selectedProspectId, prospects]);

  useEffect(() => {
    if (templates.length && !templates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  useEffect(() => {
    if (preselectedProspectId) setSelectedProspectId(preselectedProspectId);
  }, [preselectedProspectId]);

  useEffect(() => {
    if (!activeProspect) return;
    let current = true;
    setRecipientEmail(activeProspect.email || '');
    setEmailLookupMessage('');
    setEmailLookupStatus('loading');
    setDemoError('');
    if (activeProspect.demoDraft) {
      setDemoStatus('ready');
    } else {
      setDemoStatus('loading');
    }

    onResolveRecipientEmail(activeProspect.id).then((result) => {
      if (!current) return;
      setRecipientEmail(result.email);
      setEmailLookupStatus(result.source);
      setEmailLookupMessage(result.message || (result.source === 'website'
        ? 'Found on the business website. Please verify before sending.'
        : result.source === 'saved' ? 'Using the saved prospect email.' : ''));
    }).catch((error: unknown) => {
      if (!current) return;
      setEmailLookupStatus('error');
      setEmailLookupMessage(error instanceof Error ? error.message : 'Email lookup failed.');
    });

    if (!activeProspect.demoDraft) {
      onEnsureDemo(activeProspect).then(() => {
        if (current) setDemoStatus('ready');
      }).catch((error: unknown) => {
        if (!current) return;
        setDemoStatus('error');
        setDemoError(error instanceof Error ? error.message : 'Could not generate a website concept.');
      });
    }

    return () => { current = false; };
  }, [activeProspect?.id]);

  // Update subject and body when prospect or template changes
  useEffect(() => {
    if (!activeProspect || !activeTemplate) return;

    const vars = {
      businessName: activeProspect.name,
      contactName: 'there',
      category: activeProspect.category,
      city: activeProspect.city,
      reviewsCount: activeProspect.reviewsCount,
      rating: activeProspect.rating > 0 ? `${activeProspect.rating.toFixed(1)} / 5.0` : 'not listed',
      demoUrl: demoUrl || `[website preview is ${demoStatus === 'loading' ? 'being generated' : 'unavailable'}]`,
      researchSummary: getProspectResearchSummary(activeProspect, demoUrl),
      painPoints: getProspectPainPoints(activeProspect).join('; '),
      senderName: 'SiteSeller Agent',
    };

    setCustomSubject(interpolateEmailTemplate(activeTemplate.subject, vars));
    const body = interpolateEmailTemplate(activeTemplate.bodyTemplate, vars);
    const withResearch = body.includes('CLIENT RESEARCH')
      ? body
      : `${body.trim()}\n\n${vars.researchSummary}`;
    setCustomBody(demoUrl && !withResearch.includes(demoUrl)
      ? `${withResearch.trim()}\n\nINTERACTIVE DEMO PREVIEW\n${demoUrl}`
      : withResearch);
  }, [selectedProspectId, selectedTemplateId, activeProspect?.id, activeProspect?.name, activeProspect?.city,
    activeProspect?.address, activeProspect?.state, activeProspect?.rating, activeProspect?.reviewsCount,
    activeProspect?.websiteStatus, activeProspect?.painPoints, activeTemplate?.id, demoUrl, demoStatus]);

  const handleCopyEmail = async () => {
    const emailText = `To: ${recipientEmail || '[recipient email]'}\nSubject: ${customSubject}\n\n${customBody}`;
    try {
      await navigator.clipboard.writeText(emailText);
      setCopyStatus('Email copied. Paste it into your email client to review and send.');
    } catch (error) {
      console.error('Could not copy outreach email:', error);
      setCopyStatus('Copy failed. Select the email text and copy it manually.');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProspect || !recipientEmail || !demoUrl || demoStatus !== 'ready') return;

    const success = await onSendPitch({
      prospectId: activeProspect.id,
      recipientEmail,
      subject: customSubject,
      body: customBody,
      templateId: selectedTemplateId,
      demoUrl,
    });

    if (success) {
      setSendSuccessMsg(`Pitch successfully queued and sent to ${recipientEmail}!`);
      setTimeout(() => setSendSuccessMsg(null), 4000);
    }
  };

  const getStatusBadge = (status: OutreachStatus) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 bg-sky-950/50 border border-sky-800/60 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3" />
            Sent
          </span>
        );
      case 'opened':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded">
            <Eye className="w-3 h-3" />
            Opened
          </span>
        );
      case 'clicked':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded">
            <MousePointerClick className="w-3 h-3" />
            Clicked Demo
          </span>
        );
      case 'replied':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 bg-purple-950/50 border border-purple-800/60 px-2 py-0.5 rounded">
            <CornerUpLeft className="w-3 h-3" />
            Replied (Hot)
          </span>
        );
      case 'bounced':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/50 border border-rose-800/60 px-2 py-0.5 rounded">
            <AlertCircle className="w-3 h-3" />
            Bounced
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            Draft
          </span>
        );
    }
  };

  const filteredLogs = filterStatus === 'all' 
    ? outreachLogs 
    : outreachLogs.filter((log) => log.status === filterStatus);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Verified Email Status Bar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Email delivery</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.2 rounded font-mono">
                RESEND
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Prospect emails require a verified sender domain in Resend
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div>
            <span className="text-slate-500">Total Pitches: </span>
            <strong className="text-white font-mono">{outreachLogs.length}</strong>
          </div>
          <div>
            <span className="text-slate-500">Open Rate: </span>
            <strong className="text-emerald-400 font-mono">{formatRate(openedLogs.length)}</strong>
          </div>
          <div>
            <span className="text-slate-500">Click Rate: </span>
            <strong className="text-amber-400 font-mono">{formatRate(clickedLogs.length)}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Pitch Composer (7 cols), Right Template Library & Prospect info (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Email Composer */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                Trigger Pitch Campaign
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Send tailored cold pitches with embedded interactive website demos
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  !previewMode ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  previewMode ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Preview Mode
              </button>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-slate-700 text-slate-300 hover:text-white hover:border-sky-500 transition-colors"
                aria-label="Copy recipient, subject, and email body"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy email
              </button>
            </div>
          </div>

          {copyStatus && (
            <div role="status" className="mb-4 p-3 bg-sky-950/40 border border-sky-500/40 rounded-lg text-sky-200 text-xs">
              {copyStatus}
            </div>
          )}

          {sendSuccessMsg && (
            <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{sendSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            {/* Recipient select */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Target Business / Prospect *
                </label>
                <select
                  value={activeProspect?.id || ''}
                  onChange={(e) => setSelectedProspectId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 font-medium"
                >
                  {prospects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Recipient Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Enter a verified business email"
                    className="w-full text-xs pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 font-mono text-[11px] focus:outline-none focus:border-sky-500"
                  />
                </div>
                <p role="status" className={`mt-1.5 text-[10px] ${
                  emailLookupStatus === 'error' ? 'text-rose-300' : 'text-slate-400'
                }`}>
                  {emailLookupStatus === 'loading'
                    ? 'Checking saved contact and the business website…'
                    : emailLookupMessage || (emailLookupStatus === 'website'
                      ? 'Found on the public business website; verify before sending.'
                      : emailLookupStatus === 'saved' ? 'Using saved prospect email.'
                        : 'Google Places does not provide emails. Enter a verified address or search for the business contact page.')}
                </p>
                {!recipientEmail && activeProspect && (
                  <a
                    className="mt-1 inline-flex text-[10px] text-sky-400 hover:underline"
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${activeProspect.name} ${activeProspect.city} contact email`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Search public contact details
                  </a>
                )}
              </div>
            </div>

            {/* Template selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Outreach Strategy & Template
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
              >
                <option value={DEFAULT_PITCH_TEMPLATE.id}>
                  [Cold Demo Pitch] Personalized website concept
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.category}] {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Email Subject Line
              </label>
              <input
                type="text"
                required
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 font-medium"
              />
            </div>

            {/* Email Body or Preview */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                <span>Message Body</span>
                <span className="text-[10px] text-sky-400">Business, city, rating and preview link auto-filled</span>
              </label>

              {previewMode ? (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 whitespace-pre-line font-sans leading-relaxed min-h-[220px]">
                  {customBody}
                </div>
              ) : (
                <textarea
                  rows={9}
                  required
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 font-mono leading-relaxed"
                />
              )}
            </div>

            {/* Demo Link info box */}
            <div className="bg-sky-950/20 border border-sky-800/40 rounded-lg p-3 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-300">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  {demoStatus === 'loading' ? 'Generating website concept…' : demoStatus === 'error'
                    ? `Demo unavailable: ${demoError}`
                    : demoUrl ? <>Website concept: <a className="text-white font-mono underline" href={demoUrl} target="_blank" rel="noreferrer">{demoUrl}</a></>
                      : 'Select a saved prospect to prepare a website concept.'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-sky-300 bg-slate-900 px-2 py-0.5 rounded">
                Shareable preview
              </span>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
              {demoStatus === 'loading' ? 'Preparing the prospect website concept…' : 'Send uses the configured Resend sender.'}
              </span>

              <button
                type="submit"
                disabled={isSending || !activeProspect || !recipientEmail || demoStatus !== 'ready'}
                className="py-2.5 px-6 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                <span>{isSending ? 'Sending…' : 'Send Personalized Pitch'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Prospect Context & Template Details */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Prospect Card */}
          {activeProspect && (
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Target Intelligence
                </span>
                <span className="text-xs font-mono font-bold text-sky-400">
                  {activeProspect.opportunityScore}/100 Score
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{activeProspect.name}</h3>
                <p className="text-xs text-slate-400">{activeProspect.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Reviews & Rating</div>
                  <div className="font-bold text-white font-mono text-xs flex items-center gap-1 mt-0.5">
                    <span>{activeProspect.reviewsCount} reviews</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-amber-400 font-bold">{activeProspect.rating.toFixed(1)} / 5.0</span>
                  </div>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Recorded Deal Amount</div>
                  <div className="font-bold text-emerald-400 font-mono">
                    {activeProspect.estimatedDealValue > 0
                      ? `$${activeProspect.estimatedDealValue.toLocaleString()}`
                      : 'Not set'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-1">Detected Pain Points:</div>
                <ul className="text-xs text-slate-300 space-y-1">
                  {activeProspect.painPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-slate-400 text-[11px]">
                      <span className="text-rose-400">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {activeProspect.demoDraft && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">Generated Tagline:</div>
                  <div className="text-xs text-sky-300 italic">"{activeProspect.demoDraft.tagline}"</div>
                </div>
              )}
            </div>
          )}

          {/* Template Info Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Template Rationale
            </span>
            <div className="text-sm font-bold text-white">{activeTemplate?.name}</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {activeTemplate?.description}
            </p>
            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
              <span>Category: {activeTemplate?.category}</span>
              <span className="text-sky-400 font-mono">Dynamic AI Hooks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Outreach Activity & Audit Logs */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Outreach Activity Stream & Tracking</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live delivery, open, and click logs for all dispatched pitches
            </p>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            {['all', 'sent', 'opened', 'clicked', 'replied'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded capitalize transition-colors ${
                  filterStatus === st
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table of logs */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Prospect</th>
                <th className="py-3 px-4 font-semibold">Recipient</th>
                <th className="py-3 px-4 font-semibold">Subject & Demo</th>
                <th className="py-3 px-4 font-semibold">Sent Timestamp</th>
                <th className="py-3 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                    {log.prospectName}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                    {log.recipientEmail}
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs">
                    <div className="truncate font-medium">{log.subject}</div>
                    <a
                      href={log.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:underline text-[11px] inline-flex items-center gap-1 mt-0.5 font-mono"
                    >
                      <span>View Demo</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono tabular-nums whitespace-nowrap">
                    {new Date(log.sentAt).toLocaleDateString()} {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {getStatusBadge(log.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
