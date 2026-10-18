import express from 'express';
import { createServer as createViteServer } from 'vite';
import { isIP } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose, { Schema } from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import type {
  AppSettings,
  EmailTemplate,
  OutreachLog,
  Prospect,
  WebsiteDraft,
} from './src/types/index.ts';
import { calculateOpportunityScore, calculateDashboardStats, interpolateEmailTemplate } from './src/utils/pipeline.ts';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
type StoredProspect = Prospect & { demoDraft?: WebsiteDraft };
type StoredDemo = { prospectId: string | null; draft: WebsiteDraft; createdAt: string };
type StoredOutreachLog = OutreachLog & { providerMessageId?: string };
type StoredSettings = {
  key: string;
  settings?: Partial<AppSettings>;
  templates?: EmailTemplate[];
};
const prospectSchema = new Schema<StoredProspect>({}, { strict: false, versionKey: false });
const demoSchema = new Schema<StoredDemo>({}, { strict: false, versionKey: false });
const outreachLogSchema = new Schema<StoredOutreachLog>({}, { strict: false, versionKey: false });
const settingsSchema = new Schema<StoredSettings>({}, { strict: false, versionKey: false });
const ProspectModel: mongoose.Model<StoredProspect> = mongoose.models.Prospect as mongoose.Model<StoredProspect>
  || mongoose.model<StoredProspect>('Prospect', prospectSchema, 'prospects');
const GeneratedDemoModel: mongoose.Model<StoredDemo> = mongoose.models.GeneratedDemo as mongoose.Model<StoredDemo>
  || mongoose.model<StoredDemo>('GeneratedDemo', demoSchema, 'generated_demos');
const OutreachLogModel: mongoose.Model<StoredOutreachLog> = mongoose.models.OutreachLog as mongoose.Model<StoredOutreachLog>
  || mongoose.model<StoredOutreachLog>('OutreachLog', outreachLogSchema, 'outreach_logs');
const SettingsModel: mongoose.Model<StoredSettings> = mongoose.models.Settings as mongoose.Model<StoredSettings>
  || mongoose.model<StoredSettings>('Settings', settingsSchema, 'settings');

function requireConfiguration(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required. Add it to .env.local and restart the server.`);
  }
  return value;
}

function serialize(doc: mongoose.Document): Record<string, unknown> & { id: string } {
  const plain = doc.toObject() as Record<string, unknown>;
  const { _id, ...data } = plain;
  return { ...data, id: String(_id) };
}

function templateDefaults(): EmailTemplate[] {
  return [{
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
  }];
}

function prospectWebsitePainPoints(prospect: Prospect): string[] {
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

function prospectResearchSummary(prospect: Prospect, demoUrl: string): string {
  const location = [prospect.address, prospect.city, prospect.state]
    .filter((part) => typeof part === 'string' && part.trim())
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(', ') || 'Not listed';
  const rating = Number(prospect.rating) > 0 ? `${Number(prospect.rating).toFixed(1)} / 5.0` : 'Not listed';
  const reviewsCount = Number(prospect.reviewsCount) > 0
    ? `${Number(prospect.reviewsCount).toLocaleString()}`
    : 'Not listed';
  const painPoints = prospectWebsitePainPoints(prospect).map((point) => `- ${point}`).join('\n');

  return `CLIENT RESEARCH
Business: ${prospect.name}
Location: ${location}
Google rating: ${rating}
Total Google reviews: ${reviewsCount}
Detected pain points:
${painPoints}

INTERACTIVE DEMO PREVIEW
${demoUrl}`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

function safeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value : fallback;
}

function renderPublicDemo(draft: WebsiteDraft): string {
  const primary = safeColor(draft.primaryColor, '#0369a1');
  const accent = safeColor(draft.accentColor, '#38bdf8');
  const phone = draft.contactInfo?.phone || '';
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contactInfo?.email || '')
    ? draft.contactInfo.email
    : '';
  const contactHref = email
    ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Website enquiry for ${draft.businessName}`)}`
    : phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '#services';
  const services = (draft.services || []).map((service) => `
    <article class="card"><span class="eyebrow">SERVICE CONCEPT · PRICING ON REQUEST</span>
      <h3>${escapeHtml(service.title)}</h3><p>${escapeHtml(service.description)}</p>
      <a class="text-link" href="#contact">Ask about this service →</a></article>`).join('');
  const features = (draft.features || []).map((feature) => `<li>${escapeHtml(feature)}</li>`).join('');
  const rating = Number(draft.googleRating);
  const ratingMarkup = Number.isFinite(rating) && rating > 0
    ? `<p class="rating">★ ${rating.toFixed(1)} / 5 on Google${draft.googleReviewCount ? ` · ${Number(draft.googleReviewCount).toLocaleString()} ratings` : ''}</p>`
    : '<p class="rating">Google rating not available</p>';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(draft.businessName)} · Website concept</title><style>
  *{box-sizing:border-box}body{margin:0;font:16px/1.6 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#0f172a;background:#f8fafc}
  header{position:sticky;top:0;z-index:2;padding:18px max(24px,calc((100vw - 1120px)/2));display:flex;justify-content:space-between;align-items:center;background:#ffffffdd;backdrop-filter:blur(18px);border-bottom:1px solid #e2e8f0}
  header strong{font-size:18px}header span{display:block;color:#64748b;font-size:12px}.hero{padding:88px 24px;color:white;background:radial-gradient(ellipse at 80% 0%,${accent}66,transparent 40%),linear-gradient(125deg,#0f172a,${primary} 70%,#172554)}
  .inner{max-width:1120px;margin:auto}.pill{display:inline-block;padding:6px 12px;border:1px solid #ffffff4d;border-radius:999px;background:#ffffff18;color:${accent};font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
  h1{max-width:820px;margin:20px 0 14px;font-size:clamp(38px,7vw,68px);line-height:1.04;letter-spacing:-.04em}.hero p{max-width:680px;color:#e2e8f0}.button{display:inline-block;margin-top:18px;padding:13px 20px;border-radius:12px;background:linear-gradient(120deg,${primary},${accent});color:white;text-decoration:none;font-weight:700;box-shadow:0 12px 28px #02061755}
  section{padding:64px 24px}.section-head{margin-bottom:24px}.section-head h2{font-size:30px;letter-spacing:-.03em;margin:0}.muted{color:#64748b}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.card{padding:22px;border:1px solid #ffffff;background:#ffffffd9;backdrop-filter:blur(16px);border-radius:18px;box-shadow:0 12px 36px #0f172a0a}.eyebrow{font-size:10px;font-weight:800;letter-spacing:.12em;color:${primary}}.card h3{margin:12px 0 5px}.card p{font-size:14px;color:#475569}.text-link{color:${primary};font-size:13px;font-weight:700;text-decoration:none}
  .trust{background:white;border-block:1px solid #e2e8f0}.rating{font-size:18px;font-weight:800;color:#92400e}.contact{color:white;background:#0f172a}.contact .muted{color:#cbd5e1}footer{padding:24px;text-align:center;background:#020617;color:#94a3b8;font-size:12px}
  @media(max-width:600px){.hero{padding-block:64px}section{padding-block:44px}header{padding:14px 18px}}
  </style></head><body><header><div><strong>${escapeHtml(draft.businessName)}</strong><span>${escapeHtml(draft.industry)}</span></div>${phone ? `<a class="text-link" href="tel:${escapeHtml(phone.replace(/[^\d+]/g, ''))}">Call ${escapeHtml(phone)}</a>` : ''}</header>
  <main><section class="hero"><div class="inner"><span class="pill">${escapeHtml(draft.tagline || draft.industry)}</span><h1>${escapeHtml(draft.headline)}</h1><p>${escapeHtml(draft.subheadline)}</p><a class="button" href="${escapeHtml(contactHref)}">${escapeHtml(draft.heroCtaText || 'Request information')} →</a></div></section>
  <section><div class="inner"><div class="section-head"><h2>Services to explore</h2><p class="muted">Concept suggestions; confirm offerings and pricing with the business.</p></div><div class="grid">${services || '<p class="muted">Contact the business to discuss available services.</p>'}</div></div></section>
  <section class="trust"><div class="inner"><div class="section-head"><h2>Local business profile</h2><p class="muted">${escapeHtml(draft.contactInfo?.address || 'Business location details')}</p>${ratingMarkup}</div>${features ? `<p class="muted">Suggested website highlights</p><ul>${features}</ul>` : ''}</div></section>
  <section id="contact" class="contact"><div class="inner"><div class="section-head"><h2>Start a conversation</h2><p class="muted">Contact the business to confirm services, pricing, and availability.</p></div>${phone ? `<p><a class="button" href="tel:${escapeHtml(phone.replace(/[^\d+]/g, ''))}">Call ${escapeHtml(phone)}</a></p>` : ''}${email ? `<p><a class="button" href="${escapeHtml(contactHref)}">Email the business</a></p>` : ''}${draft.contactInfo?.address ? `<p class="muted">${escapeHtml(draft.contactInfo.address)}</p>` : ''}${draft.contactInfo?.hours ? `<p class="muted">${escapeHtml(draft.contactInfo.hours)}</p>` : ''}</div></section></main>
  <footer>Website concept preview · Not yet published · Confirm all business details before launch</footer></body></html>`;
}

async function findPublicWebsiteEmail(websiteUrl: string | null | undefined): Promise<string | null> {
  if (!websiteUrl) return null;
  let base: URL;
  try {
    base = new URL(websiteUrl);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(base.protocol) || !base.hostname || isPrivateWebsiteHost(base.hostname)) return null;

  const pages = [base];
  const visited = new Set<string>();
  const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const signal = AbortSignal.timeout(4000);
  while (pages.length && visited.size < 3) {
    const pageUrl = pages.shift()!;
    if (visited.has(pageUrl.href)) continue;
    visited.add(pageUrl.href);
    try {
      let currentUrl = pageUrl;
      let response: Response | undefined;
      for (let redirects = 0; redirects <= 3; redirects += 1) {
        response = await fetch(currentUrl, {
          headers: { Accept: 'text/html', 'User-Agent': 'SiteSellerContactDiscovery/1.0' },
          redirect: 'manual',
          signal,
        });
        if (response.status < 300 || response.status >= 400) break;
        const redirect = response.headers.get('location');
        if (response.body) await response.body.cancel();
        if (!redirect || redirects === 3) break;
        currentUrl = new URL(redirect, currentUrl);
        if (!['http:', 'https:'].includes(currentUrl.protocol) || isPrivateWebsiteHost(currentUrl.hostname)) break;
      }
      if (!response?.ok || !response.headers.get('content-type')?.includes('text/html') || !response.body) continue;
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (size < 128 * 1024) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = value.subarray(0, 128 * 1024 - size);
        chunks.push(chunk);
        size += chunk.byteLength;
        if (chunk.byteLength < value.byteLength) break;
      }
      await reader.cancel();
      const html = new TextDecoder().decode(Buffer.concat(chunks));
      const candidates = [
        ...Array.from(html.matchAll(/href\s*=\s*["']mailto:([^"'?]+)/gi), (match) => match[1]),
        ...(html.match(emailPattern) || []),
      ].map((value) => value.trim().replace(/&amp;.*$/, '')).filter((value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        && !/(no[-_.]?reply|example\.|sentry|wixpress|\.png$|\.jpg$)/i.test(value),
      );
      if (candidates.length) return candidates[0];

      for (const match of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
        try {
          const link = new URL(match[1], currentUrl);
          if (link.origin === base.origin && /contact|about/i.test(link.pathname)) pages.push(link);
        } catch {
          continue;
        }
      }
    } catch (error) {
      if (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name)) return null;
      if (error instanceof TypeError) continue;
      throw error;
    }
  }
  return null;
}

function isPrivateWebsiteHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }

  const ipVersion = isIP(host);
  if (ipVersion === 4) {
    const octets = host.split('.').map(Number);
    return octets[0] === 0
      || octets[0] === 10
      || octets[0] === 127
      || (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127)
      || (octets[0] === 169 && octets[1] === 254)
      || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
      || (octets[0] === 192 && octets[1] === 168)
      || (octets[0] === 198 && (octets[1] === 18 || octets[1] === 19))
      || octets[0] >= 224;
  }
  if (ipVersion === 6) {
    const normalized = host.toLowerCase();
    return normalized === '::'
      || normalized === '::1'
      || normalized.startsWith('fc')
      || normalized.startsWith('fd')
      || /^fe[89ab]/.test(normalized)
      || normalized.startsWith('ff');
  }
  return false;
}

async function checkWebsiteStatus(websiteUrl: string | null | undefined): Promise<Prospect['websiteStatus']> {
  if (!websiteUrl) return 'no_website';

  let url: URL;
  try {
    url = new URL(websiteUrl);
  } catch {
    return 'broken';
  }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password
    || isPrivateWebsiteHost(url.hostname)) {
    return 'broken';
  }

  try {
    const signal = AbortSignal.timeout(4000);
    for (let redirects = 0; redirects <= 5; redirects += 1) {
      const response = await fetch(url, {
        headers: { Range: 'bytes=0-0' },
        redirect: 'manual',
        signal,
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (response.body) await response.body.cancel();
        if (!location || redirects === 5) return 'broken';
        try {
          url = new URL(location, url);
        } catch {
          return 'broken';
        }
        if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password
          || isPrivateWebsiteHost(url.hostname)) {
          return 'broken';
        }
        continue;
      }

      const status: Prospect['websiteStatus'] = !response.ok
        ? 'broken'
        : url.protocol === 'http:'
          ? 'outdated'
          : 'modern';
      if (response.body) await response.body.cancel();
      return status;
    }
    return 'broken';
  } catch (error) {
    if (error instanceof TypeError || (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name))) {
      return 'broken';
    }
    throw error;
  }
}

async function appSettings(): Promise<AppSettings> {
  const stored = await SettingsModel.findOne({ key: 'app' }).lean();
  return {
    googlePlacesConfigured: Boolean(process.env.GOOGLE_PLACES_API_KEY),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    resendConfigured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
    senderEmail: process.env.RESEND_FROM_EMAIL || '',
    ...(stored?.settings || {}),
  } as AppSettings;
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;
  app.use(express.json({ limit: '1mb' }));

  const frontendOrigin = process.env.FRONTEND_URL
    ? new URL(process.env.FRONTEND_URL).origin
    : undefined;
  app.use((req, res, next) => {
    const requestOrigin = req.get('Origin');
    if (requestOrigin && requestOrigin === frontendOrigin) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') {
      return requestOrigin === frontendOrigin && frontendOrigin
        ? res.sendStatus(204)
        : res.sendStatus(403);
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
  });

  app.use('/api', (_req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'MongoDB is not connected. Configure MONGODB_URI in .env.local.' });
    }
    next();
  });

  app.get('/api/stats', async (_req, res, next) => {
    try {
      const [prospectDocs, sentCount] = await Promise.all([
        ProspectModel.find().lean(),
        OutreachLogModel.countDocuments({ status: 'sent' }),
      ]);
      const prospects = prospectDocs.map((doc) => ({
        ...doc,
        id: String(doc._id),
      })) as unknown as Prospect[];
      const stats = calculateDashboardStats(prospects, sentCount);
      stats.generatedSitesCount = await GeneratedDemoModel.countDocuments();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/prospects', async (req, res, next) => {
    try {
      const filter: Record<string, unknown> = {};
      if (req.query.status && req.query.status !== 'all') filter.pipelineStatus = req.query.status;
      if (req.query.category && req.query.category !== 'all') {
        filter.category = { $regex: String(req.query.category), $options: 'i' };
      }
      const docs = await ProspectModel.find(filter).sort({ createdAt: -1 }).lean();
      res.json(docs.map((doc) => ({ ...doc, id: String(doc._id) })));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/prospects/:id/contact-email', async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'A valid prospect is required.' });
      }
      const prospect = await ProspectModel.findById(req.params.id);
      if (!prospect) return res.status(404).json({ error: 'Prospect not found.' });

      const savedEmail = String(prospect.get('email') || '').trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(savedEmail)) {
        return res.json({ email: savedEmail, source: 'saved' });
      }

      const websiteUrl = String(prospect.get('websiteUrl') || '');
      if (!websiteUrl) {
        return res.json({
          email: '',
          source: 'not_found',
          message: 'Google Places does not provide email addresses, and this listing has no website to check. Enter a verified email or find one on the business website.',
        });
      }

      const email = await findPublicWebsiteEmail(websiteUrl);
      if (!email) {
        return res.json({
          email: '',
          source: 'not_found',
          message: 'No public email was found on the business website. Enter a verified email or check the website contact page.',
        });
      }
      prospect.set('email', email);
      await prospect.save();
      res.json({ email, source: 'website' });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/prospects', async (req, res, next) => {
    try {
      const data = req.body as Partial<Prospect>;
      if (!data.name || !data.placeId) {
        return res.status(400).json({ error: 'A business name and Google Place ID are required.' });
      }
      const existing = await ProspectModel.findOne({ placeId: data.placeId });
      if (existing) return res.json(serialize(existing));
      const websiteStatus = await checkWebsiteStatus(data.websiteUrl);
      const prospect: Prospect = {
        id: '',
        name: data.name,
        category: data.category || 'Local Business',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        phone: data.phone || '',
        email: '',
        rating: Number(data.rating) || 0,
        reviewsCount: Number(data.reviewsCount) || 0,
        websiteUrl: data.websiteUrl || null,
        websiteStatus,
        opportunityScore: calculateOpportunityScore({
          rating: Number(data.rating) || 0,
          reviewsCount: Number(data.reviewsCount) || 0,
          websiteStatus,
        }),
        painPoints: data.websiteUrl ? [] : ['No website is listed on the Google Business profile'],
        pipelineStatus: 'discovered',
        estimatedDealValue: 0,
        placeId: data.placeId,
        googleMapsUrl: data.googleMapsUrl || '',
        createdAt: new Date().toISOString(),
      };
      const doc = await ProspectModel.create(prospect);
      res.status(201).json(serialize(doc));
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/prospects/:id', async (req, res, next) => {
    try {
      const updates = { ...req.body };
      delete updates._id;
      delete updates.id;
      if (Object.prototype.hasOwnProperty.call(updates, 'websiteUrl')) {
        updates.websiteStatus = await checkWebsiteStatus(updates.websiteUrl);
      }
      const updated = await ProspectModel.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true },
      );
      if (!updated) return res.status(404).json({ error: 'Prospect not found.' });
      res.json(serialize(updated));
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/prospects/:id', async (req, res, next) => {
    try {
      const deleted = await ProspectModel.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Prospect not found.' });
      await GeneratedDemoModel.deleteMany({ prospectId: req.params.id });
      res.json({ success: true, id: req.params.id });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/places/search', async (req, res, next) => {
    try {
      const apiKey = requireConfiguration(process.env.GOOGLE_PLACES_API_KEY, 'GOOGLE_PLACES_API_KEY');
      const { query, location, category, websiteFilter, minRating } = req.body;
      if (typeof location !== 'string' || !location.trim() || typeof (query || category) !== 'string') {
        return res.status(400).json({ error: 'A location and business category/query are required.' });
      }
      const search = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': [
            'places.id',
            'places.displayName',
            'places.formattedAddress',
            'places.addressComponents',
            'places.nationalPhoneNumber',
            'places.internationalPhoneNumber',
            'places.websiteUri',
            'places.rating',
            'places.userRatingCount',
            'places.googleMapsUri',
            'places.types',
          ].join(','),
        },
        body: JSON.stringify({
          textQuery: `${query || category} in ${location}`,
          maxResultCount: 20,
        }),
      });
      const searchData = await search.json() as {
        error?: { message?: string };
        places?: Array<Record<string, any>>;
      };
      if (!search.ok) {
        throw new Error(searchData.error?.message || `Google Places search failed (${search.status}).`);
      }

      const places = searchData.places || [];
      const results = await Promise.all(places.map(async (place) => {
        const addressParts = Array.isArray(place.addressComponents)
          ? place.addressComponents as Array<{ longText?: string; shortText?: string; types?: string[] }>
          : [];
        const city = addressParts.find((part) => part.types?.includes('locality'))?.longText || '';
        const state = addressParts.find((part) => part.types?.includes('administrative_area_level_1'))?.shortText || '';
        const websiteUrl = place.websiteUri || null;
        const websiteStatus = await checkWebsiteStatus(websiteUrl);
        const rating = Number(place.rating) || 0;
        const reviewsCount = Number(place.userRatingCount) || 0;
        return {
          id: String(place.id),
          name: place.displayName?.text || '',
          category: category || (place.types || []).filter((type: string) => !['point_of_interest', 'establishment'].includes(type)).join(', ') || 'Local Business',
          address: place.formattedAddress || '',
          city,
          state,
          phone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
          email: '',
          rating,
          reviewsCount,
          websiteUrl,
          websiteStatus,
          opportunityScore: calculateOpportunityScore({ rating, reviewsCount, websiteStatus }),
          painPoints: websiteUrl ? [] : ['No website is listed on the Google Business profile'],
          pipelineStatus: 'discovered' as const,
          estimatedDealValue: 0,
          placeId: String(place.id),
          googleMapsUrl: place.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${place.id}`,
          createdAt: new Date().toISOString(),
        };
      }));
      const filtered = results.filter((place) =>
        (websiteFilter !== 'no_website' || place.websiteStatus === 'no_website')
        && (websiteFilter !== 'broken' || place.websiteStatus === 'broken')
        && (websiteFilter !== 'outdated' || place.websiteStatus === 'outdated')
        && (!minRating || place.rating >= Number(minRating)),
      );
      res.json({ results: filtered, source: 'google_places_api', totalFound: filtered.length, city: location });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/demo/generate', async (req, res, next) => {
    try {
      const apiKey = requireConfiguration(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY');
      const { prospectId, businessName, category, city, customTone } = req.body;
      const prospect = prospectId ? await ProspectModel.findById(prospectId).lean() : null;
      if (prospectId && !prospect) return res.status(404).json({ error: 'Prospect not found.' });
      const name = businessName || prospect?.name;
      const industry = category || prospect?.category;
      const location = city || prospect?.city;
      if (!name || !industry || !location) {
        return res.status(400).json({ error: 'Business name, category, and city are required.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Act as a senior local-business website copywriter. Create polished, conversion-focused copy for a website concept for the real business below. Use natural, specific language localized to its city and business category; make the headline benefit-led, the tagline memorable, and the subheadline clear about the kinds of needs this business may serve. Tailor suggested services and customer pain-point solutions to the category (for example: preventive and urgent dental care, custom bakery orders, plumbing repairs, roof inspections, or legal consultations), but treat every service as an unverified concept unless explicitly present in the supplied facts. Only use the supplied business facts. Never claim existing customers, testimonials, reviews, ratings, licenses, insurance, opening hours, guarantees, exact prices, appointments, booking/SMS integrations, performance scores, or measured outcomes. Do not imply that draft suggestions are confirmed offerings. Keep all copy concise, credible, and easy to scan.
Business: ${name}
Category: ${industry}
City: ${location}
Tone: ${customTone || 'clear and professional'}
Return valid JSON only, with these fields: tagline (short), headline (one sentence), subheadline (one or two sentences), heroCtaText (a request/quote CTA, not confirmed booking), customPitchAngle (a concise sales angle that does not assert unverified facts), services (3-4 objects with title and description; suggestions only), and features (3-4 short category-relevant draft ideas; do not present as verified credentials or existing guarantees).`,
        config: { responseMimeType: 'application/json' },
      });
      if (!response.text) throw new Error('Gemini returned an empty draft.');
      const generated = JSON.parse(response.text) as Record<string, unknown>;
      const categoryText = String(industry).toLowerCase();
      const palette = categoryText.includes('dental') || categoryText.includes('medical') || categoryText.includes('wellness')
        ? { primary: '#0e7490', accent: '#22d3ee' }
        : categoryText.includes('plumb') || categoryText.includes('roof') || categoryText.includes('trade')
          ? { primary: '#c2410c', accent: '#fb923c' }
          : categoryText.includes('bakery') || categoryText.includes('cafe') || categoryText.includes('food')
            ? { primary: '#a16207', accent: '#fbbf24' }
            : categoryText.includes('law') || categoryText.includes('legal')
              ? { primary: '#4338ca', accent: '#a5b4fc' }
              : { primary: '#0369a1', accent: '#38bdf8' };
      const draft: WebsiteDraft = {
        id: new mongoose.Types.ObjectId().toString(),
        prospectId: prospectId || '',
        businessName: name,
        tagline: String(generated.tagline || ''),
        industry,
        headline: String(generated.headline || ''),
        subheadline: String(generated.subheadline || ''),
        heroCtaText: String(generated.heroCtaText || ''),
        primaryColor: palette.primary,
        accentColor: palette.accent,
        services: Array.isArray(generated.services) ? generated.services.map((service, index) => {
          const item = service as { title?: string; description?: string };
          return { id: `service-${index + 1}`, title: String(item.title || ''), description: String(item.description || '') };
        }) : [],
        features: Array.isArray(generated.features) ? generated.features.map(String) : [],
        testimonials: [],
        contactInfo: {
          phone: prospect?.phone || '',
          email: prospect?.email || '',
          address: prospect?.address || '',
          hours: '',
        },
        ...(Number.isFinite(Number(prospect?.rating)) && Number(prospect?.rating) > 0
          ? { googleRating: Number(prospect?.rating) }
          : {}),
        ...(Number.isFinite(Number(prospect?.reviewsCount)) && Number(prospect?.reviewsCount) > 0
          ? { googleReviewCount: Number(prospect?.reviewsCount) }
          : {}),
        ...(prospect?.googleMapsUrl ? { googleMapsUrl: prospect?.googleMapsUrl } : {}),
        customPitchAngle: String(generated.customPitchAngle || ''),
        createdAt: new Date().toISOString(),
      };
      await GeneratedDemoModel.create({ prospectId: prospectId || null, draft, createdAt: draft.createdAt });
      if (prospectId) {
        await ProspectModel.findByIdAndUpdate(prospectId, {
          $set: { demoDraft: draft, pipelineStatus: 'demo_created' },
        });
      }
      res.status(201).json({ draft, generatedBy: 'gemini' });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/outreach/templates', async (_req, res, next) => {
    try {
      const stored = await SettingsModel.findOne({ key: 'templates' }).lean();
      res.json((stored?.templates as EmailTemplate[] | undefined) || templateDefaults());
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/outreach/templates', async (req, res, next) => {
    try {
      const template: EmailTemplate = {
        id: new mongoose.Types.ObjectId().toString(),
        name: String(req.body.name || ''),
        category: req.body.category,
        subject: String(req.body.subject || ''),
        bodyTemplate: String(req.body.bodyTemplate || ''),
        description: String(req.body.description || ''),
      };
      if (!template.name || !template.subject || !template.bodyTemplate) {
        return res.status(400).json({ error: 'Template name, subject, and body are required.' });
      }
      const stored = await SettingsModel.findOne({ key: 'templates' });
      const templates = [...((stored?.get('templates') as EmailTemplate[] | undefined) || []), template];
      await SettingsModel.findOneAndUpdate(
        { key: 'templates' },
        { $set: { templates } },
        { upsert: true, new: true },
      );
      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/outreach/logs', async (_req, res, next) => {
    try {
      const logs = await OutreachLogModel.find().sort({ sentAt: -1 }).lean();
      res.json(logs.map((log) => ({ ...log, id: String(log._id) })));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/outreach/send', async (req, res, next) => {
    try {
      const apiKey = requireConfiguration(process.env.RESEND_API_KEY, 'RESEND_API_KEY');
      const from = requireConfiguration(process.env.RESEND_FROM_EMAIL, 'RESEND_FROM_EMAIL');
      const { prospectId, recipientEmail, subject, body, templateId } = req.body;
      if (!mongoose.isValidObjectId(prospectId)) return res.status(400).json({ error: 'A valid prospect is required.' });
      if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
        return res.status(400).json({ error: 'A valid recipient email address is required.' });
      }
      if (!subject || !body) return res.status(400).json({ error: 'Email subject and body are required.' });
      const prospect = await ProspectModel.findById(prospectId);
      if (!prospect) return res.status(404).json({ error: 'Prospect not found.' });

      let publicBaseUrl: URL;
      try {
        publicBaseUrl = new URL(process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`);
      } catch {
        throw new Error('PUBLIC_APP_URL must be a valid absolute URL before sending outreach.');
      }
      if (!['http:', 'https:'].includes(publicBaseUrl.protocol) || publicBaseUrl.username || publicBaseUrl.password) {
        throw new Error('PUBLIC_APP_URL must use HTTP or HTTPS and must not contain credentials.');
      }
      const demoUrl = new URL(`/demo/${prospectId}`, publicBaseUrl).toString();
      const templateVariables = {
        businessName: prospect.get('name'),
        contactName: String(prospect.get('name') || '').split(' ')[0] || 'Team',
        city: prospect.get('city'),
        demoUrl,
        researchSummary: prospectResearchSummary(
          prospect.toObject() as Prospect,
          demoUrl,
        ),
        rating: Number(prospect.get('rating')) > 0 ? `${prospect.get('rating')} / 5` : 'not listed',
        reviewsCount: Number(prospect.get('reviewsCount')) > 0
          ? Number(prospect.get('reviewsCount')).toLocaleString()
          : 'not listed',
        painPoints: prospectWebsitePainPoints(prospect.toObject() as Prospect).join('; '),
      };
      const resolvedSubject = interpolateEmailTemplate(String(subject), templateVariables);
      let resolvedBody = interpolateEmailTemplate(String(body), templateVariables)
        .replace(/https?:\/\/[^\s)]+\/demo\/[a-f\d]{24}/gi, demoUrl);
      if (!resolvedBody.includes('CLIENT RESEARCH')) {
        resolvedBody = `${resolvedBody.trim()}\n\n${templateVariables.researchSummary}`;
      }
      if (!resolvedBody.includes(demoUrl)) {
        resolvedBody = `${resolvedBody.trim()}\n\nView your website concept: ${demoUrl}`;
      }
      const htmlBody = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0f172a;white-space:pre-line">${escapeHtml(resolvedBody)}</div><p style="margin:24px 0"><a href="${escapeHtml(demoUrl)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:700">View the website concept</a></p>`;

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [recipientEmail],
          subject: resolvedSubject,
          text: resolvedBody,
          html: htmlBody,
        }),
      });
      const resendResult = await resendResponse.json() as { id?: string; message?: string; name?: string };
      if (!resendResponse.ok || !resendResult.id) {
        const providerError = resendResult.message || resendResult.name || 'Resend failed to send the email.';
        if (/only send testing emails/i.test(providerError)) {
          return res.status(422).json({
            error: 'Resend testing mode only allows sending to the account owner. This prospect email was not sent. Use Copy email to send it manually, or verify a sending domain in Resend to enable client delivery.',
            code: 'RESEND_TEST_MODE',
          });
        }
        throw new Error(providerError);
      }

      const doc = await OutreachLogModel.create({
        prospectId,
        prospectName: prospect.name,
        recipientEmail,
        subject: resolvedSubject,
        bodySnippet: resolvedBody.slice(0, 140),
        templateId: templateId || '',
        status: 'sent',
        sentAt: new Date().toISOString(),
        demoUrl,
        providerMessageId: resendResult.id,
      });
      await ProspectModel.findByIdAndUpdate(prospectId, {
        $set: { pipelineStatus: 'pitched', lastContactedAt: doc.get('sentAt'), email: recipientEmail },
      });
      res.status(201).json({
        success: true,
        log: serialize(doc),
        message: `Email sent to ${recipientEmail}.`,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/settings', async (_req, res, next) => {
    try {
      res.json(await appSettings());
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/settings', async (req, res, next) => {
    try {
      const allowed = { senderName: String(req.body.senderName || '') };
      await SettingsModel.findOneAndUpdate(
        { key: 'app' },
        { $set: { settings: allowed } },
        { upsert: true, new: true },
      );
      res.json({ success: true, settings: await appSettings(), message: 'Settings saved.' });
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('API request failed:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected API error.' });
  });

  app.get('/demo/:id', async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).type('text/plain').send('Website concept not found.');
      }
      const prospect = await ProspectModel.findById(req.params.id).lean();
      const draft = prospect?.demoDraft as WebsiteDraft | undefined;
      if (!draft) {
        return res.status(404).type('text/plain').send('This prospect does not have a generated website concept yet.');
      }
      res.type('html').send(renderPublicDemo(draft));
    } catch (error) {
      next(error);
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist/client')));
    app.get('*', (_req, res) => res.sendFile(path.resolve(__dirname, 'dist/client', 'index.html')));
  } else {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected.');
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is required in production.');
  } else {
    console.warn('MONGODB_URI is missing. API data routes will return HTTP 503 until configured.');
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`SiteSeller server listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});
