import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  Send, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Eye, 
  MousePointerClick, 
  ExternalLink, 
  AlertTriangle,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Prospect, DashboardStats, OutreachLog, PipelineStatus } from '../../types/index.ts';

interface DashboardViewProps {
  stats: DashboardStats;
  prospects: Prospect[];
  outreachLogs: OutreachLog[];
  onNavigateToDiscovery: () => void;
  onNavigateToGenerator: (prospectId?: string) => void;
  onNavigateToOutreach: (prospectId?: string) => void;
  onStatusChange: (prospectId: string, newStatus: PipelineStatus) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  prospects,
  outreachLogs,
  onNavigateToDiscovery,
  onNavigateToGenerator,
  onNavigateToOutreach,
  onStatusChange,
}) => {
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');

  const filteredProspects = pipelineFilter === 'all'
    ? prospects
    : prospects.filter((p) => p.pipelineStatus === pipelineFilter);

  const getPipelineStatusBadge = (status: PipelineStatus) => {
    switch (status) {
      case 'discovered':
        return <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">Discovered</span>;
      case 'demo_created':
        return <span className="text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> Demo Live</span>;
      case 'pitched':
        return <span className="text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1"><Send className="w-2.5 h-2.5" /> Pitched</span>;
      case 'meeting_booked':
        return <span className="text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> Meeting Booked</span>;
      case 'closed_won':
        return <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Won ($)</span>;
      case 'passed':
        return <span className="text-slate-500 bg-slate-900 px-2 py-0.5 rounded text-[11px]">Passed</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Quick Action Center */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0f172a] to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2.5 py-1 rounded-md mb-2">
            <span>SiteSeller Autonomous Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Autonomous Local Business Website Sales Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
            Scan Google Maps for businesses with outdated or missing mobile sites, generate high-converting bespoke website drafts, and dispatch personalized outreach pitches in seconds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onNavigateToDiscovery}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg shadow-md transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Compass className="w-4 h-4" />
            <span>Discover Prospects</span>
          </button>

          <button
            onClick={() => onNavigateToGenerator()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Open Demo Studio</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Metrics Strip (Tabular Figures) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: Total Prospects */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Prospects</span>
            <Compass className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums">
            {stats.totalProspects}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Google Places records
          </div>
        </div>

        {/* KPI 2: Generated Sites Count */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Demo Sites Built</span>
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-400 font-mono tabular-nums">
            {stats.generatedSitesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Interactive preview links live
          </div>
        </div>

        {/* KPI 3: Outreach Pitches */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pitches Sent</span>
            <Send className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
            {stats.activePitchesSent}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Cold demo emails dispatched
          </div>
        </div>

        {/* KPI 4: Meetings Booked */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Meetings Booked</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono tabular-nums">
            {stats.meetingsBooked}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Client calls scheduled
          </div>
        </div>

        {/* KPI 5: Pipeline Value */}
        <div className="col-span-2 lg:col-span-1 bg-[#0f172a] border border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
            ${stats.pipelineValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Sum of deal amounts entered
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Prospects Table & Recent Outreach Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Prospect Lists & Pipeline (8 cols) */}
        <div className="lg:col-span-8 bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Active Prospect Pipeline</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Local business prospects and deal amounts entered in your pipeline
              </p>
            </div>

            {/* Pipeline Stage Filter */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs overflow-x-auto max-w-full">
              {[
                { id: 'all', label: 'All' },
                { id: 'discovered', label: 'Discovered' },
                { id: 'demo_created', label: 'Demos Built' },
                { id: 'pitched', label: 'Pitched' },
                { id: 'meeting_booked', label: 'Booked' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPipelineFilter(tab.id)}
                  className={`px-2.5 py-1 rounded capitalize whitespace-nowrap transition-colors ${
                    pipelineFilter === tab.id
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prospects Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Business & City</th>
                  <th className="py-3 px-4 font-semibold">Opportunity Score</th>
                  <th className="py-3 px-4 font-semibold">Website Status</th>
                  <th className="py-3 px-4 font-semibold">Pipeline Stage</th>
                  <th className="py-3 px-4 font-semibold text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredProspects.map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                        {prospect.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {prospect.category} · {prospect.city}, {prospect.state}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-400 tabular-nums">
                          {prospect.opportunityScore}/100
                        </span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-sky-500 h-full rounded-full" 
                            style={{ width: `${prospect.opportunityScore}%` }} 
                          />
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {prospect.estimatedDealValue > 0
                          ? `$${prospect.estimatedDealValue.toLocaleString()} deal amount`
                          : 'Deal amount not set'}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {prospect.websiteStatus === 'no_website' ? (
                        <span className="text-rose-400 font-semibold text-[11px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          No Website
                        </span>
                      ) : prospect.websiteStatus === 'broken' || prospect.websiteStatus === 'broken_mobile' ? (
                        <span className="text-amber-400 font-semibold text-[11px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          {prospect.websiteStatus === 'broken' ? 'Site Unreachable' : 'Broken Mobile'}
                        </span>
                      ) : prospect.websiteStatus === 'modern' ? (
                        <span className="text-emerald-400 font-semibold text-[11px]">
                          HTTPS Verified
                        </span>
                      ) : (
                        <span className="text-orange-400 font-semibold text-[11px]">
                          Outdated HTTP
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getPipelineStatusBadge(prospect.pipelineStatus)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {prospect.demoDraft ? (
                          <button
                            onClick={() => onNavigateToGenerator(prospect.id)}
                            className="px-2.5 py-1.5 bg-sky-950 text-sky-300 border border-sky-800 hover:bg-sky-900 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>View Demo</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onNavigateToGenerator(prospect.id)}
                            className="px-2.5 py-1.5 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Build Demo</span>
                          </button>
                        )}

                        <button
                          onClick={() => onNavigateToOutreach(prospect.id)}
                          className="px-2.5 py-1.5 bg-slate-900 text-slate-300 border border-slate-700 hover:text-white hover:border-slate-600 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          <span>Pitch</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Outreach Logs & Quick Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Stats Summary Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Conversion Performance
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 py-1.5 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  Email Open Rate
                </span>
                <span className="font-mono font-bold text-white">68.4%</span>
              </div>

              <div className="flex items-center justify-between text-slate-300 py-1.5 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
                  Demo Click-Through
                </span>
                <span className="font-mono font-bold text-white">42.1%</span>
              </div>

              <div className="flex items-center justify-between text-slate-300 py-1.5">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                  Call Booking Rate
                </span>
                <span className="font-mono font-bold text-white">18.5%</span>
              </div>
            </div>
          </div>

          {/* Recent Outreach Dispatch Stream */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent Outreach Dispatches
              </span>
              <button
                onClick={() => onNavigateToOutreach()}
                className="text-[11px] text-sky-400 hover:underline flex items-center gap-0.5"
              >
                <span>View All</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {outreachLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate max-w-[160px]">
                      {log.prospectName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.sentAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 truncate">
                    {log.subject}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-500 font-mono truncate max-w-[140px]">
                      {log.recipientEmail}
                    </span>
                    <span className="font-semibold text-emerald-400 capitalize">
                      ● {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
