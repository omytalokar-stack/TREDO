import React from 'react';
import { 
  Compass, 
  LayoutDashboard, 
  Globe2, 
  Send, 
  Settings, 
  Plus, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'discovery' | 'generator' | 'outreach' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onQuickDiscover: () => void;
  prospectsCount: number;
  draftsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onQuickDiscover,
  prospectsCount,
  draftsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0d131f]/95 backdrop-blur-md border-b border-slate-800">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 sm:gap-6 h-16">
          {/* Zone 1: Single text element wordmark with icon */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
              aria-label="SiteSeller Agent Home"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:border-sky-400 transition-colors">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
                  SiteSeller Agent
                </span>
                <span className="text-[11px] text-slate-400 block whitespace-nowrap">
                  Local Website Sales Engine
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation links with single-line whitespace-nowrap */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 text-xs uppercase tracking-wider ${
                activeTab === 'dashboard'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onTabChange('discovery')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 text-xs uppercase tracking-wider ${
                activeTab === 'discovery'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Prospect Discovery</span>
              {prospectsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[10px] font-mono tabular-nums">
                  {prospectsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('generator')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 text-xs uppercase tracking-wider ${
                activeTab === 'generator'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Demo Generator</span>
              {draftsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-sky-950 text-sky-300 border border-sky-800 rounded text-[10px] font-mono tabular-nums">
                  {draftsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('outreach')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 text-xs uppercase tracking-wider ${
                activeTab === 'outreach'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Email Outreach</span>
            </button>

            <button
              onClick={() => onTabChange('settings')}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 text-xs uppercase tracking-wider ${
                activeTab === 'settings'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Agent Active</span>
            </div>
            
            <button
              onClick={onQuickDiscover}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Find Businesses</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden grid grid-cols-5 border-t border-slate-800/80 py-2 gap-1 text-center">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`py-1.5 px-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'dashboard' ? 'text-sky-400 font-bold bg-sky-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onTabChange('discovery')}
            className={`py-1.5 px-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'discovery' ? 'text-sky-400 font-bold bg-sky-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            Find
          </button>
          <button
            onClick={() => onTabChange('generator')}
            className={`py-1.5 px-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'generator' ? 'text-sky-400 font-bold bg-sky-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            Demos
          </button>
          <button
            onClick={() => onTabChange('outreach')}
            className={`py-1.5 px-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'outreach' ? 'text-sky-400 font-bold bg-sky-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pitch
          </button>
          <button
            onClick={() => onTabChange('settings')}
            className={`py-1.5 px-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'settings' ? 'text-sky-400 font-bold bg-sky-500/10' : 'text-slate-400 hover:text-white'
            }`}
          >
            Config
          </button>
        </div>
      </div>
    </header>
  );
};
