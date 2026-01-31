// Honomobo Operations - Connected to Airtable
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ClipboardList, DollarSign, TrendingUp, AlertTriangle, Menu, X, Plus, RefreshCw, Edit2, Trash2, Calendar, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';

// Airtable Configuration
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = 'Projects';

// Airtable API Functions
const airtableAPI = {
  async fetchProjects() {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    if (!response.ok) throw new Error('Failed to fetch projects');
    const data = await response.json();
    return data.records.map(record => ({ id: record.id, ...record.fields }));
  },
  async createProject(fields) {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (!response.ok) throw new Error('Failed to create project');
    const data = await response.json();
    return { id: data.id, ...data.fields };
  },
  async updateProject(id, fields) {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${id}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (!response.ok) throw new Error('Failed to update project');
    const data = await response.json();
    return { id: data.id, ...data.fields };
  },
  async deleteProject(id) {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    if (!response.ok) throw new Error('Failed to delete project');
    return true;
  }
};

// Project Form Modal
function ProjectFormModal({ project, onSave, onClose }) {
  const [formData, setFormData] = useState({
    'Project ID': project?.['Project ID'] || '',
    'Project Name': project?.['Project Name'] || '',
    'Stage': project?.['Stage'] || 'Assessment',
    'Status': project?.['Status'] || 'Active',
    'Contract Value': project?.['Contract Value'] || 0
  });
  const [saving, setSaving] = useState(false);
  const stages = ['Assessment', 'Concept', 'D&E', 'Permitting', 'Production', 'Logistics', 'Complete'];
  const statuses = ['Active', 'On Hold', 'Completed', 'Cancelled'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData, project?.id);
      onClose();
    } catch (error) {
      alert('Error saving: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project ID *</label>
            <input type="text" value={formData['Project ID']} onChange={(e) => setFormData({...formData, 'Project ID': e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., HO755" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input type="text" value={formData['Project Name']} onChange={(e) => setFormData({...formData, 'Project Name': e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Holland Residence" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select value={formData['Stage']} onChange={(e) => setFormData({...formData, 'Stage': e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={formData['Status']} onChange={(e) => setFormData({...formData, 'Status': e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Value ($)</label>
            <input type="number" value={formData['Contract Value']} onChange={(e) => setFormData({...formData, 'Contract Value': parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Utility functions
const formatCurrency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';

// WIP Schedule View
function WIPScheduleView({ projects, onEdit, onDelete }) {
  const stages = ['Assessment', 'Concept', 'D&E', 'Permitting', 'Production', 'Logistics', 'Complete'];
  const getStageColor = (stage) => {
    const colors = { 'Assessment': 'bg-gray-200 text-gray-700', 'Concept': 'bg-purple-100 text-purple-700', 'D&E': 'bg-blue-100 text-blue-700', 'Permitting': 'bg-yellow-100 text-yellow-700', 'Production': 'bg-green-100 text-green-700', 'Logistics': 'bg-cyan-100 text-cyan-700', 'Complete': 'bg-gray-100 text-gray-500' };
    return colors[stage] || 'bg-gray-100 text-gray-700';
  };
  const projectsByStage = stages.map(stage => ({ stage, projects: projects.filter(p => p.Stage === stage) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold">{projects.length}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Production</p><p className="text-2xl font-bold text-green-600">{projects.filter(p => p.Stage === 'Production').length}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">D&E</p><p className="text-2xl font-bold text-blue-600">{projects.filter(p => p.Stage === 'D&E').length}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-purple-600">{projects.filter(p => p.Status === 'Active').length}</p></div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">WIP by Stage</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {projectsByStage.map(({ stage, projects: sp }) => (
            <div key={stage} className="flex-shrink-0 w-56">
              <div className={`rounded-t-lg px-3 py-2 font-medium text-sm ${getStageColor(stage)}`}>{stage} ({sp.length})</div>
              <div className="bg-gray-50 rounded-b-lg p-2 min-h-24 space-y-2">
                {sp.map(p => (
                  <div key={p.id} className="bg-white rounded p-2 shadow-sm border text-sm group">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{p['Project ID']}</span>
                        <p className="text-xs text-gray-500">{p['Project Name']}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <button onClick={() => onEdit(p)} className="p-1 hover:bg-blue-50 rounded"><Edit2 className="w-3 h-3 text-blue-600" /></button>
                        <button onClick={() => onDelete(p.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3 text-red-600" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Budget View
function BudgetView({ projects, onEdit, onDelete }) {
  const total = projects.reduce((s, p) => s + (p['Contract Value'] || 0), 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-500">Total Value</p><p className="text-2xl font-bold">{formatCurrency(total)}</p></div>
        <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-500">Active Projects</p><p className="text-2xl font-bold">{projects.filter(p => p.Status === 'Active').length}</p></div>
        <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-500">Avg Value</p><p className="text-2xl font-bold">{formatCurrency(projects.length ? total / projects.length : 0)}</p></div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b"><h2 className="font-semibold">Project Budgets</h2></div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projects.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4"><div className="font-medium">{p['Project ID']}</div><div className="text-sm text-gray-500">{p['Project Name']}</div></td>
                <td className="px-6 py-4 text-sm text-gray-500">{p.Stage}</td>
                <td className="px-6 py-4 text-sm text-right font-medium">{formatCurrency(p['Contract Value'])}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${p.Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.Status}</span></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => onEdit(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {!projects.length && <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No projects yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Job Schedule View
function JobScheduleView({ projects, onEdit, onDelete }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center"><div><p className="text-sm text-gray-500">Total Jobs</p><p className="text-2xl font-bold">{projects.length}</p></div><Calendar className="w-10 h-10 text-blue-500" /></div>
        <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center"><div><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-green-600">{projects.filter(p => p.Status === 'Active').length}</p></div><Clock className="w-10 h-10 text-green-500" /></div>
        <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center"><div><p className="text-sm text-gray-500">Locations</p><p className="text-2xl font-bold text-purple-600">{new Set(projects.map(p => p['Project Name'])).size}</p></div><MapPin className="w-10 h-10 text-purple-500" /></div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b"><h2 className="font-semibold">Job Schedule</h2></div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projects.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{p['Project ID']}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{p['Project Name']}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{p.Stage}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${p.Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.Status}</span></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => onEdit(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {!projects.length && <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No projects yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Deviations View
function DeviationsView({ projects }) {
  const deviations = [
    { id: 1, project: projects[0]?.['Project ID'] || 'N/A', type: 'Schedule', severity: 'High', description: 'Permit delays - 2 weeks behind', status: 'Open' },
    { id: 2, project: projects[1]?.['Project ID'] || 'N/A', type: 'Budget', severity: 'Medium', description: 'Material cost increase +5%', status: 'Reviewing' },
  ];
  const getSeverityColor = (s) => ({ 'High': 'bg-red-100 text-red-800', 'Medium': 'bg-yellow-100 text-yellow-800', 'Low': 'bg-blue-100 text-blue-800' }[s] || 'bg-gray-100');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center"><div><p className="text-sm text-gray-500">Open Issues</p><p className="text-2xl font-bold text-red-600">{deviations.filter(d => d.status === 'Open').length}</p></div><AlertTriangle className="w-10 h-10 text-red-500" /></div>
        <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center"><div><p className="text-sm text-gray-500">Under Review</p><p className="text-2xl font-bold text-yellow-600">{deviations.filter(d => d.status === 'Reviewing').length}</p></div><Clock className="w-10 h-10 text-yellow-500" /></div>
        <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center"><div><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold">{deviations.length}</p></div><AlertCircle className="w-10 h-10 text-gray-500" /></div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b"><h2 className="font-semibold">Project Deviations</h2></div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {deviations.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{d.project}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{d.type}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(d.severity)}`}>{d.severity}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{d.description}</td>
                <td className="px-6 py-4 text-sm">{d.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Navigation Items
const navItems = [
  { id: 'wip', label: 'WIP Schedule', icon: LayoutDashboard },
  { id: 'jobs', label: 'Job Schedule', icon: ClipboardList },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'deviations', label: 'Deviations', icon: AlertTriangle },
];

// Main App
export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('wip');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await airtableAPI.fetchProjects();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      loadProjects();
    } else {
      setError('Airtable not configured. Add VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID.');
      setLoading(false);
    }
  }, []);

  const handleSave = async (formData, existingId) => {
    if (existingId) {
      const updated = await airtableAPI.updateProject(existingId, formData);
      setProjects(projects.map(p => p.id === existingId ? updated : p));
    } else {
      const created = await airtableAPI.createProject(formData);
      setProjects([...projects, created]);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this project?')) {
      await airtableAPI.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const openEdit = (p) => { setEditingProject(p); setShowForm(true); };
  const openNew = () => { setEditingProject(null); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingProject(null); };

  const renderView = () => {
    const props = { projects, onEdit: openEdit, onDelete: handleDelete };
    switch (activeView) {
      case 'wip': return <WIPScheduleView {...props} />;
      case 'jobs': return <JobScheduleView {...props} />;
      case 'budget': return <BudgetView {...props} />;
      case 'deviations': return <DeviationsView {...props} />;
      default: return <WIPScheduleView {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100"><Menu className="w-6 h-6" /></button>
        <h1 className="text-lg font-bold">Honomobo Ops</h1>
        <button onClick={openNew} className="p-2 rounded-lg bg-blue-600 text-white"><Plus className="w-5 h-5" /></button>
      </div>

      <div className="flex">
        {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform`}>
          <div className="p-6 border-b"><h1 className="text-xl font-bold">Honomobo</h1><p className="text-sm text-gray-500">Operations</p></div>
          <nav className="p-4 space-y-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { setActiveView(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${activeView === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <item.icon className="w-5 h-5" /><span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <button onClick={openNew} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" />New Project</button>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div><h2 className="text-2xl font-bold">{navItems.find(n => n.id === activeView)?.label}</h2><p className="text-gray-500">{projects.length} projects</p></div>
            <div className="hidden lg:flex gap-3">
              <button onClick={loadProjects} disabled={loading} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
              <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" />New Project</button>
            </div>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
          {loading && <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />Loading...</div>}

          {renderView()}
        </main>
      </div>

      {showForm && <ProjectFormModal project={editingProject} onSave={handleSave} onClose={closeForm} />}
    </div>
  );
}
