import {
  Prospect,
  WebsiteDraft,
  OutreachLog,
  EmailTemplate,
  DashboardStats,
  AppSettings,
  SearchPlacesParams,
} from '../types/index.ts';

const API_BASE = '/api';

export const api = {
  // Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Prospects
  async getProspects(filter?: { status?: string; category?: string }): Promise<Prospect[]> {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.category) params.set('category', filter.category);
    const res = await fetch(`${API_BASE}/prospects?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch prospects');
    return res.json();
  },

  async addProspect(data: Partial<Prospect>): Promise<Prospect> {
    const res = await fetch(`${API_BASE}/prospects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add prospect');
    return res.json();
  },

  async updateProspect(id: string, updates: Partial<Prospect>): Promise<Prospect> {
    const res = await fetch(`${API_BASE}/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update prospect');
    return res.json();
  },

  async deleteProspect(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/prospects/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete prospect');
  },

  async resolveProspectEmail(id: string): Promise<{ email: string; source: 'saved' | 'website' | 'not_found'; message?: string }> {
    const res = await fetch(`${API_BASE}/prospects/${id}/contact-email`, { method: 'POST' });
    const data = await res.json() as { email?: string; source?: 'saved' | 'website' | 'not_found'; message?: string; error?: string };
    if (!res.ok) throw new Error(data.error || `Could not find a contact email (HTTP ${res.status}).`);
    return { email: data.email || '', source: data.source || 'not_found', message: data.message };
  },

  // Places Search (Google Places format)
  async searchPlaces(params: SearchPlacesParams): Promise<{ results: Prospect[]; totalFound: number; source: string; city?: string }> {
    const res = await fetch(`${API_BASE}/places/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const error = await res.json() as { error?: string };
      throw new Error(error.error || `Google Places search failed (HTTP ${res.status}).`);
    }
    return res.json();
  },

  // Demo Generator
  async generateDemoDraft(params: {
    prospectId?: string;
    businessName: string;
    category: string;
    city: string;
    customTone?: string;
  }): Promise<{ draft: WebsiteDraft; generatedBy: string }> {
    const res = await fetch(`${API_BASE}/demo/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const error = await res.json() as { error?: string };
      throw new Error(error.error || `Failed to generate demo draft (HTTP ${res.status}).`);
    }
    return res.json();
  },

  // Outreach & Templates
  async getTemplates(): Promise<EmailTemplate[]> {
    const res = await fetch(`${API_BASE}/outreach/templates`);
    if (!res.ok) throw new Error('Failed to fetch templates');
    return res.json();
  },

  async addTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const res = await fetch(`${API_BASE}/outreach/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add template');
    return res.json();
  },

  async getOutreachLogs(): Promise<OutreachLog[]> {
    const res = await fetch(`${API_BASE}/outreach/logs`);
    if (!res.ok) throw new Error('Failed to fetch outreach logs');
    return res.json();
  },

  async sendPitch(payload: {
    prospectId: string;
    recipientEmail: string;
    subject: string;
    body: string;
    templateId: string;
    demoUrl: string;
  }): Promise<{ success: boolean; log: OutreachLog; message: string }> {
    const res = await fetch(`${API_BASE}/outreach/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json() as { error?: string };
      throw new Error(error.error || `Failed to send outreach pitch (HTTP ${res.status}).`);
    }
    return res.json();
  },

  // Settings
  async getSettings(): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch app settings');
    return res.json();
  },

  async saveSettings(data: Partial<AppSettings> & { adminPassword?: string }): Promise<{ success: boolean; settings: AppSettings; message: string }> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save settings');
    return res.json();
  },
};
