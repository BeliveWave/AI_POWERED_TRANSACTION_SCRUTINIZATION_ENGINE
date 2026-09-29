import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  AlertTriangle,
  Users,
  FileText,
  Sliders,
  HelpCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink
} from 'lucide-react';
import { Badge } from '../ui/badge.jsx';
import { Button } from '../ui/button.jsx';

const Sidebar = ({ sidebarOpen, setSidebarOpen, collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const navWorkspaces = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', path: '/transactions', icon: CreditCard },
    { id: 'investigator', label: 'Investigations', path: '/investigator', icon: AlertTriangle },
    { id: 'customers', label: 'Customers', path: '/customers', icon: Users },
    { id: 'reports', label: 'Reports', path: '/reports', icon: FileText },
  ];

  const navSystem = [
    { id: 'configuration', label: 'Configuration', path: '/configuration', icon: Sliders },
    { id: 'help', label: 'Help & API Docs', path: '/help', icon: HelpCircle },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full justify-between select-none">
      {/* Top Branding Section */}
      <div>
        <div className={`flex items-center h-14 border-b border-border px-4 ${collapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
          <div
            onClick={() => handleNavClick('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
              <Shield className="h-4 w-4" />
            </div>
            {(!collapsed || isMobile) && (
              <div className="flex flex-col">
                <span className="font-semibold text-base tracking-tight text-foreground leading-none">
                  Sentinel
                </span>
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider mt-1">
                  Fraud Engine
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          {isMobile ? (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            /* Desktop Collapse Toggle */
            <Button
              variant="ghost"
              size="icon"
              onClick={setCollapsed}
              className="h-7 w-7 text-muted-foreground hover:text-foreground hidden md:flex"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>

        {/* Navigation Groups */}
        <div className="p-3 space-y-6">
          {/* Workspaces Group */}
          <div className="space-y-1">
            {(!collapsed || isMobile) && (
              <p className="px-3 text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Workspaces
              </p>
            )}
            <nav className="space-y-0.5">
              {navWorkspaces.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.path)}
                    title={collapsed && !isMobile ? item.label : undefined}
                    className={`flex items-center w-full rounded-md text-sm font-medium transition-all ${
                      collapsed && !isMobile
                        ? 'h-9 justify-center px-0'
                        : 'gap-3 px-3 py-2'
                    } ${
                      active
                        ? 'bg-secondary text-foreground font-semibold shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-foreground' : 'text-muted-foreground'}`} />
                    {(!collapsed || isMobile) && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* System & Configuration Group */}
          <div className="space-y-1">
            {(!collapsed || isMobile) && (
              <p className="px-3 text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                System
              </p>
            )}
            <nav className="space-y-0.5">
              {navSystem.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.path)}
                    title={collapsed && !isMobile ? item.label : undefined}
                    className={`flex items-center w-full rounded-md text-sm font-medium transition-all ${
                      collapsed && !isMobile
                        ? 'h-9 justify-center px-0'
                        : 'gap-3 px-3 py-2'
                    } ${
                      active
                        ? 'bg-secondary text-foreground font-semibold shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-foreground' : 'text-muted-foreground'}`} />
                    {(!collapsed || isMobile) && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-3 border-t border-border">
        {(!collapsed || isMobile) ? (
          <div className="p-2 rounded-md bg-muted/40 border border-border/50 text-xs font-mono space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Inference Node</span>
              <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Engine v2.4</span>
              <span>&lt;200ms SLA</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Engine Online • v2.4">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 border-r border-border bg-card/60 backdrop-blur-xs shrink-0 transition-all duration-200 z-30 ${
          collapsed ? 'w-16' : 'w-56 lg:w-60'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] h-full bg-card border-r border-border shadow-xl z-50 animate-in slide-in-from-left duration-200">
            <SidebarContent isMobile={true} />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
