// Honomobo Operations
import React, { useState, createContext, useContext } from 'react';
import { LayoutDashboard, ClipboardList, DollarSign, TrendingUp, AlertTriangle, Menu, X } from 'lucide-react';
import BudgetView from './views/BudgetView';
import DeviationsView from './views/DeviationsView';
import WIPScheduleView from './views/WIPScheduleView';
import JobScheduleView from './views/JobScheduleView';

const DataContext = createContext(null);
const MOCK_PROJECTS = [
  { id: '1', 'Project ID': 'HO755', 'Project Name': 'Holland', Stage: 'D&E', Status: 'Active', 'Contract Value': 485000 },
  { id: '2', 'Project ID': 'HO801', 'Project Name': 'Nakamura', Stage: 'Production', Status: 'Active', 'Contract Value': 725000 },
  ];

const DataProvider = ({ children }) => {
    const [projects] = useState(MOCK_PROJECTS);
    const [loading] = useState(false);
    const [error] = useState('Demo mode');
    return <DataContext.Provider value={{ projects, loading, error }}>{children}</DataContext.Provider>DataContext.Provider>;
};
const useData = () => useContext(DataContext);

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs', label: 'Job Schedule', icon: ClipboardList },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'wip', label: 'WIP Schedule', icon: TrendingUp },
  { id: 'deviations', label: 'Deviations', icon: AlertTriangle },
  ];

const AppShell = () => {
    const [currentView, setCurrentView] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { projects, error } = useData();

    const renderView = () => {
          switch (currentView) {
            case 'jobs': return <JobScheduleView />;
            case 'budget': return <BudgetView projects={projects} />;
            case 'wip': return <WIPScheduleView />;
            case 'deviations': return <DeviationsView />;
            default: return <div className="bg-white rounded-xl p-6"><h2 className="text-xl font-bold mb-4">Projects</h2>h2>{projects.map(p => <div key={p.id} className="p-3 border-b">{p['Project ID']} - {p['Project Name']}</div>div>)}</div>div>;
          }
    };
  
    return (
          <div className="min-h-screen bg-gray-50 flex">
                <aside className={(sidebarOpen ? 'w-64' : 'w-16') + ' bg-slate-900 text-white flex flex-col'}>
                        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
                          {sidebarOpen && <span className="font-bold">Honomobo</span>span>}
                                  <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded">{sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>button>
                        </div>div>
                        <nav className="flex-1 py-4">
                          {NAV_ITEMS.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => setCurrentView(item.id)} className={'w-full flex items-center gap-3 px-4 py-3 ' + (currentView === item.id ? 'bg-blue-600' : 'hover:bg-slate-800')}><Icon className="w-5 h-5" />{sidebarOpen && <span>{item.label}</span>span>}</button>button>; })}
                        </nav>nav>
                </aside>aside>
                <div className="flex-1 flex flex-col">
                        <header className="h-16 bg-white border-b flex items-center px-6"><h1 className="text-xl font-semibold">Honomobo Operations</h1>h1></header>header>
                        <main className="flex-1 p-6 overflow-auto">
                          {error && <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-600" /><span>{error}</span>span></div>div>}
                          {renderView()}
                        </main>main>
                </div>div>
          </div>div>
        );
};

export default function App() { return <DataProvider><AppShell /></DataProvider>DataProvider>; }</div>
