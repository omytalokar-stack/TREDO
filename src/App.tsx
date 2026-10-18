/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar, ActiveTab } from './components/layout/Navbar.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { ProspectDiscoveryView } from './components/discovery/ProspectDiscoveryView.tsx';
import { DemoGeneratorView } from './components/generator/DemoGeneratorView.tsx';
import { OutreachControlPanel } from './components/outreach/OutreachControlPanel.tsx';
import { SettingsPanel } from './components/settings/SettingsPanel.tsx';
import { api } from './services/api.ts';
import { 
  Prospect, 
  WebsiteDraft, 
  OutreachLog, 
  EmailTemplate, 
  DashboardStats, 
  AppSettings,
  PipelineStatus,
  SearchPlacesParams 
} from './types/index.ts';
import { calculateDashboardStats } from './utils/pipeline.ts';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSendingOutreach, setIsSendingOutreach] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Toast notification system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Initial Data Fetching from API
  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedProspects, fetchedLogs, fetchedTemplates, fetchedSettings] = await Promise.all([
          api.getProspects(),
          api.getOutreachLogs(),
          api.getTemplates(),
          api.getSettings(),
        ]);

        setProspects(fetchedProspects);
        setOutreachLogs(fetchedLogs);
        setTemplates(fetchedTemplates);
        setSettings(fetchedSettings);

        if (fetchedProspects.length > 0) {
          setSelectedProspectId(fetchedProspects[0].id);
        }
      } catch (err) {
        console.warn('API error or local startup, initializing fallback state:', err);
      }
    }

    loadData();
  }, []);

  // Compute live dashboard stats
  const stats: DashboardStats = useMemo(() => {
    return calculateDashboardStats(prospects, outreachLogs.length);
  }, [prospects, outreachLogs]);

  // Set of pipeline prospect IDs for fast lookup in Discovery
  const pipelineProspectIds = useMemo(() => {
    return new Set(prospects.map((p) => p.id));
  }, [prospects]);

  // Handler: Add prospect from Discovery
  const handleAddProspectToPipeline = async (prospect: Prospect) => {
    try {
      const added = await api.addProspect(prospect);
      setProspects((prev) => [added, ...prev.filter((p) => p.id !== added.id)]);
      setSelectedProspectId(added.id);
      showToast(`Added ${prospect.name} to sales pipeline!`);
    } catch (error) {
      console.error('Could not add prospect:', error);
      showToast('Could not save prospect. Please check the server and try again.', 'error');
    }
  };

  // Handler: Generate demo from Discovery card
  const handleGenerateDemoFromDiscovery = async (prospect: Prospect) => {
    setIsGeneratingAI(true);
    try {
      let target = prospects.find((p) => p.id === prospect.id);
      if (!target) {
        target = await api.addProspect(prospect);
      }
      setProspects((prev) => [target!, ...prev.filter((p) => p.id !== target!.id)]);
      setSelectedProspectId(target.id);
      await ensureDemoDraft(target);
      setActiveTab('generator');
      showToast(`Website draft ready for ${target.name}.`);
    } catch (error) {
      console.error('Demo generation error:', error);
      showToast(
        error instanceof Error ? `Could not build demo: ${error.message}` : 'Could not build demo.',
        'error',
      );
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const ensureDemoDraft = async (prospect: Prospect): Promise<WebsiteDraft> => {
    if (prospect.demoDraft) return prospect.demoDraft;
    const result = await api.generateDemoDraft({
      prospectId: prospect.id,
      businessName: prospect.name,
      category: prospect.category,
      city: prospect.city,
    });
    setProspects((prev) =>
      prev.map((item) => (item.id === prospect.id
        ? { ...item, demoDraft: result.draft, pipelineStatus: 'demo_created' }
        : item))
    );
    return result.draft;
  };

  // Handler: Direct pitch from Discovery card
  const handleDirectPitchFromDiscovery = async (prospect: Prospect) => {
    let target = prospects.find((p) => p.id === prospect.id);
    if (!target) {
      target = await api.addProspect(prospect);
      setProspects((prev) => [target!, ...prev]);
    }
    setSelectedProspectId(target.id);
    setActiveTab('outreach');
    showToast(`Prepared pitch campaign for ${prospect.name}`);
  };

  // Handler: Search Google Places API
  const handleSearchPlaces = async (params: SearchPlacesParams): Promise<Prospect[]> => {
    setIsSearchingPlaces(true);
    try {
      const res = await api.searchPlaces(params);
      return res.results;
    } catch (err) {
      console.error('Search error:', err);
      const message = err instanceof Error ? err.message : 'Google Places search failed.';
      showToast(`Google Places search failed: ${message}`, 'error');
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  // Handler: Launch Outreach from Generator View
  const handleLaunchOutreachFromDraft = (prospect: Prospect, draft: WebsiteDraft) => {
    setSelectedProspectId(prospect.id);
    setActiveTab('outreach');
    showToast(`Demo ready. Pitch initialized for ${prospect.name}`);
  };

  // Handler: Update Draft content in Generator
  const handleUpdateDraft = async (prospectId: string, updatedDraft: WebsiteDraft) => {
    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, demoDraft: updatedDraft } : p))
    );
    try {
      await api.updateProspect(prospectId, { demoDraft: updatedDraft });
    } catch (err) {
      // Local state is already updated
    }
  };

  // Handler: AI Copy generation trigger
  const handleGenerateWithAI = async (prospectId: string, customTone?: string) => {
    setIsGeneratingAI(true);
    try {
      const prospect = prospects.find((p) => p.id === prospectId);
      if (!prospect) return;

      const res = await api.generateDemoDraft({
        prospectId,
        businessName: prospect.name,
        category: prospect.category,
        city: prospect.city,
        customTone,
      });

      setProspects((prev) =>
        prev.map((p) => (p.id === prospectId ? { ...p, demoDraft: res.draft, pipelineStatus: 'demo_created' } : p))
      );
      showToast(`Website draft generated with AI for ${prospect.name}!`);
    } catch (err) {
      console.error('AI generation error:', err);
      showToast('AI demo generation failed. Please check the Gemini API configuration and try again.', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handler: Send Pitch Email
  const handleSendPitch = async (payload: {
    prospectId: string;
    recipientEmail: string;
    subject: string;
    body: string;
    templateId: string;
    demoUrl: string;
  }): Promise<boolean> => {
    setIsSendingOutreach(true);
    try {
      const res = await api.sendPitch(payload);
      if (res.success) {
        setOutreachLogs((prev) => [res.log, ...prev]);
        setProspects((prev) =>
          prev.map((p) =>
            p.id === payload.prospectId
              ? { ...p, pipelineStatus: 'pitched', lastContactedAt: res.log.sentAt }
              : p
          )
        );
        showToast(res.message);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Pitch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      const message = /only send testing emails/i.test(errorMessage)
        ? 'Resend is in testing mode. Verify a domain in Resend and set RESEND_FROM_EMAIL to an address on that domain. Testing mode only allows sending to your own email address.'
        : `Email was not sent: ${errorMessage}`;
      showToast(message, 'error');
      return false;
    } finally {
      setIsSendingOutreach(false);
    }
  };

  // Handler: Add Template
  const handleAddTemplate = async (newTpl: Partial<EmailTemplate>) => {
    try {
      const res = await api.addTemplate(newTpl);
      setTemplates((prev) => [...prev, res]);
      showToast(`Template "${res.name}" created!`);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Save Settings
  const handleSaveSettings = async (
    updates: Partial<AppSettings> & { adminPassword?: string }
  ): Promise<boolean> => {
    setIsSavingSettings(true);
    try {
      const res = await api.saveSettings(updates);
      if (res.success) {
        setSettings(res.settings);
        showToast('Settings saved successfully!');
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      if (settings) {
        setSettings({ ...settings, ...updates });
      }
      showToast('Settings saved locally.');
      return true;
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handler: Status change from Dashboard
  const handleStatusChange = async (prospectId: string, newStatus: PipelineStatus) => {
    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, pipelineStatus: newStatus } : p))
    );
    try {
      await api.updateProspect(prospectId, { pipelineStatus: newStatus });
      showToast(`Updated prospect pipeline status to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      // Local state is updated
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-2.5 max-w-xl px-4 py-3 bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-xl shadow-2xl">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="break-words">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global Top Navbar adhering to Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickDiscover={() => setActiveTab('discovery')}
        prospectsCount={prospects.length}
        draftsCount={prospects.filter((p) => !!p.demoDraft).length}
      />

      {/* Main View Port Container */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            prospects={prospects}
            outreachLogs={outreachLogs}
            onNavigateToDiscovery={() => setActiveTab('discovery')}
            onNavigateToGenerator={(id) => {
              if (id) setSelectedProspectId(id);
              setActiveTab('generator');
            }}
            onNavigateToOutreach={(id) => {
              if (id) setSelectedProspectId(id);
              setActiveTab('outreach');
            }}
            onStatusChange={handleStatusChange}
          />
        )}

        {activeTab === 'discovery' && (
          <ProspectDiscoveryView
            onAddProspectToPipeline={handleAddProspectToPipeline}
            onGenerateDemo={handleGenerateDemoFromDiscovery}
            onDirectPitch={handleDirectPitchFromDiscovery}
            onSearchPlaces={handleSearchPlaces}
            isSearching={isSearchingPlaces}
            pipelineProspectIds={pipelineProspectIds}
          />
        )}

        {activeTab === 'generator' && (
          <DemoGeneratorView
            prospects={prospects}
            selectedProspectId={selectedProspectId}
            onSelectProspect={setSelectedProspectId}
            onLaunchOutreach={handleLaunchOutreachFromDraft}
            onUpdateDraft={handleUpdateDraft}
            onGenerateWithAI={handleGenerateWithAI}
            isGeneratingAI={isGeneratingAI}
          />
        )}

        {activeTab === 'outreach' && (
          <OutreachControlPanel
            prospects={prospects}
            templates={templates}
            outreachLogs={outreachLogs}
            onSendPitch={handleSendPitch}
            onAddTemplate={handleAddTemplate}
            onResolveRecipientEmail={api.resolveProspectEmail}
            onEnsureDemo={ensureDemoDraft}
            isSending={isSendingOutreach}
            preselectedProspectId={selectedProspectId}
          />
        )}

        {activeTab === 'settings' && settings && (
          <SettingsPanel
            settings={settings}
            onSaveSettings={handleSaveSettings}
            isSaving={isSavingSettings}
          />
        )}
      </main>

      {/* Subtle Anti-Slop Clean Footer */}
      <footer className="border-t border-slate-900 bg-[#070a10] py-4 px-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div>
            <strong className="text-slate-300">SiteSeller Agent</strong> · Autonomous Local Business Sales Engine
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Google Places Integration</span>
            <span>·</span>
            <span>Gemini AI Demo Generator</span>
            <span>·</span>
            <span>Verified Outreach</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
