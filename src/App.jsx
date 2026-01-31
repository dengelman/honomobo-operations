// Honomobo Operations - Connected to Airtable (with Documents)
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ClipboardList, DollarSign, AlertTriangle, Menu, X, Plus, RefreshCw, Edit2, Trash2, Calendar, MapPin, Clock, CheckCircle, AlertCircle, FileText, Eye, Shield, ChevronDown, ChevronRight, Upload, Search, Check, History, Home } from 'lucide-react';

// Airtable Configuration
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const PROJECTS_TABLE = 'Projects';
const DOCUMENTS_TABLE = 'Documents';

// Airtable API
const airtableAPI = {
  async fetchProjects() {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PROJECTS_TABLE}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } });
    if (!res.ok) throw new Error('Failed to fetch projects');
    const data = await res.json();
    return data.records.map(r => ({ id: r.id, ...r.fields }));
  },
  async fetchDocuments() {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DOCUMENTS_TABLE}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } });
    if (!res.ok) throw new Error('Failed to fetch documents');
    const data = await res.json();
    return data.records.map(r => ({ id: r.id, ...r.fields }));
  },
  async createProject(fields) {
    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PROJECTS_TABLE}`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    const data = await res.json();
    return { id: data.id, ...data.fields };
  },
  async updateProject(id, fields) {
    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PROJECTS_TABLE}/${id}`, {
      method: 'PATCH', headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    const data = await res.json();
    return { id: data.id, ...data.fields };
  },
  async deleteProject(id) {
    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PROJECTS_TABLE}/${id}`, {
      method: 'DELETE', headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
  },
  async createDocument(fields) {
    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DOCUMENTS_TABLE}`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    const data = await res.json();
    return { id: data.id, ...data.fields };
  },
  async updateDocument(id, fields) {
    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${DOCUMENTS_TABLE}/${id}`, {
      method: 'PATCH', headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    const data = await res.json();
    return { id: data.id, ...data.fields };
  }
};

// Project Form Modal
function ProjectFormModal({ project, onSave, onClose }) {
  const [form, setForm] = useState({
    'Project ID': project?.['Project ID'] || '', 'Project Name': project?.['Project Name'] || '',
    'Stage': project?.['Stage'] || 'Assessment', 'Status': project?.['Status'] || 'Active', 'Contract Value': project?.['Contract Value'] || 0
  });
  const [saving, setSaving] = useState(false);
  const stages = ['Assessment', 'Concept', 'D&E', 'Permitting', 'Production', 'Logistics', 'Complete'];
  const statuses = ['Active', 'On Hold', 'Completed', 'Cancelled'];

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await onSave(form, project?.id); onClose(); } catch (err) { alert('Error: ' + err.message); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center px-6 py-4 border-b"><h2 className="font-semibold text-lg">{project ? 'Edit' : 'New'} Project</h2><button onClick={onClose}><X className="w-5 h-5" /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="block text-sm font-medium mb-1">Project ID *</label><input type="text" value={form['Project ID']} onChange={e => setForm({...form, 'Project ID': e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
          <div><label className="block text-sm font-medium mb-1">Project Name *</label><input type="text" value={form['Project Name']} onChange={e => setForm({...form, 'Project Name': e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Stage</label><select value={form['Stage']} onChange={e => setForm({...form, 'Stage': e.target.value})} className="w-full px-3 py-2 border rounded-lg">{stages.map(s => <option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Status</label><select value={form['Status']} onChange={e => setForm({...form, 'Status': e.target.value})} className="w-full px-3 py-2 border rounded-lg">{statuses.map(s => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Contract Value ($)</label><input type="number" value={form['Contract Value']} onChange={e => setForm({...form, 'Contract Value': parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg">Cancel</button><button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button></div>
        </form>
      </div>
    </div>
  );
}

const formatCurrency = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);

// WIP Schedule View
function WIPScheduleView({ projects, onEdit, onDelete }) {
  const stages = ['Assessment', 'Concept', 'D&E', 'Permitting', 'Production', 'Logistics', 'Complete'];
  const colors = { 'Assessment': 'bg-gray-200', 'Concept': 'bg-purple-100', 'D&E': 'bg-blue-100', 'Permitting': 'bg-yellow-100', 'Production': 'bg-green-100', 'Logistics': 'bg-cyan-100', 'Complete': 'bg-gray-100' };
  const byStage = stages.map(s => ({ stage: s, projects: projects.filter(p => p.Stage === s) }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold">{projects.length}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Production</p><p className="text-2xl font-bold text-green-600">{projects.filter(p => p.Stage === 'Production').length}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">D&E</p><p className="text-2xl font-bold text-blue-600">{projects.filter(p => p.Stage === 'D&E').length}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-purple-600">{projects.filter(p => p.Status === 'Active').length}</p></div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-4">WIP by Stage</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {byStage.map(({ stage, projects: sp }) => (
            <div key={stage} className="flex-shrink-0 w-56">
              <div className={`rounded-t-lg px-3 py-2 font-medium text-sm ${colors[stage]}`}>{stage} ({sp.length})</div>
              <div className="bg-gray-50 rounded-b-lg p-2 min-h-24 space-y-2">
                {sp.map(p => (
                  <div key={p.id} className="bg-white rounded p-2 shadow-sm border text-sm group">
                    <div className="flex justify-between"><span className="font-medium">{p['Project ID']}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <button onClick={() => onEdit(p)} className="p-1 hover:bg-blue-50 rounded"><Edit2 className="w-3 h-3 text-blue-600" /></button>
                        <button onClick={() => onDelete(p.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3 text-red-600" /></button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{p['Project Name']}</p>
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
        <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold">{projects.filter(p => p.Status === 'Active').length}</p></div>
        <div className="bg-white rounded-lg shadow p-6"><p className="text-sm text-gray-500">Avg Value</p><p className="text-2xl font-bold">{formatCurrency(projects.length ? total / projects.length : 0)}</p></div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b font-semibold">Project Budgets</div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-200">{projects.map(p => (<tr key={p.id} className="hover:bg-gray-50"><td className="px-6 py-4"><div className="font-medium">{p['Project ID']}</div><div className="text-sm text-gray-500">{p['Project Name']}</div></td><td className="px-6 py-4 text-sm text-gray-500">{p.Stage}</td><td className="px-6 py-4 text-sm text-right font-medium">{formatCurrency(p['Contract Value'])}</td><td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${p.Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.Status}</span></td><td className="px-6 py-4 text-right"><button onClick={() => onEdit(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1"><Edit2 className="w-4 h-4" /></button><button onClick={() => onDelete(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></td></tr>))}{!projects.length && <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No projects yet</td></tr>}</tbody>
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
        <div className="bg-white rounded-lg shadow p-6 flex justify-between"><div><p className="text-sm text-gray-500">Total Jobs</p><p className="text-2xl font-bold">{projects.length}</p></div><Calendar className="w-10 h-10 text-blue-500" /></div>
        <div className="bg-white rounded-lg shadow p-6 flex justify-between"><div><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-green-600">{projects.filter(p => p.Status === 'Active').length}</p></div><Clock className="w-10 h-10 text-green-500" /></div>
        <div className="bg-white rounded-lg shadow p-6 flex justify-between"><div><p className="text-sm text-gray-500">Locations</p><p className="text-2xl font-bold text-purple-600">{new Set(projects.map(p => p['Project Name'])).size}</p></div><MapPin className="w-10 h-10 text-purple-500" /></div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b font-semibold">Job Schedule</div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-200">{projects.map(p => (<tr key={p.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-medium">{p['Project ID']}</td><td className="px-6 py-4 text-sm text-gray-500">{p['Project Name']}</td><td className="px-6 py-4 text-sm text-gray-500">{p.Stage}</td><td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${p.Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.Status}</span></td><td className="px-6 py-4 text-right"><button onClick={() => onEdit(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1"><Edit2 className="w-4 h-4" /></button><button onClick={() => onDelete(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></td></tr>))}{!projects.length && <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No projects yet</td></tr>}</tbody>
        </table>
      </div>
    </div>
  );
}

// Deviations View
function DeviationsView({ projects }) {
  const devs = [{ id: 1, project: projects[0]?.['Project ID'] || 'N/A', type: 'Schedule', severity: 'High', desc: 'Permit delays - 2 weeks behind', status: 'Open' }, { id: 2, project: projects[1]?.['Project ID'] || 'N/A', type: 'Budget', severity: 'Medium', desc: 'Material cost +5%', status: 'Reviewing' }];
  const colors = { High: 'bg-red-100 text-red-800', Medium: 'bg-yellow-100 text-yellow-800', Low: 'bg-blue-100 text-blue-800' };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 flex justify-between"><div><p className="text-sm text-gray-500">Open</p><p className="text-2xl font-bold text-red-600">{devs.filter(d => d.status === 'Open').length}</p></div><AlertTriangle className="w-10 h-10 text-red-500" /></div>
        <div className="bg-white rounded-lg shadow p-6 flex justify-between"><div><p className="text-sm text-gray-500">Reviewing</p><p className="text-2xl font-bold text-yellow-600">{devs.filter(d => d.status === 'Reviewing').length}</p></div><Clock className="w-10 h-10 text-yellow-500" /></div>
        <div className="bg-white rounded-lg shadow p-6 flex justify-between"><div><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold">{devs.length}</p></div><AlertCircle className="w-10 h-10 text-gray-500" /></div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b font-semibold">Project Deviations</div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th></tr></thead>
          <tbody className="divide-y divide-gray-200">{devs.map(d => (<tr key={d.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-medium">{d.project}</td><td className="px-6 py-4 text-sm text-gray-500">{d.type}</td><td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${colors[d.severity]}`}>{d.severity}</span></td><td className="px-6 py-4 text-sm text-gray-500">{d.desc}</td><td className="px-6 py-4 text-sm">{d.status}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DRAWING MANAGEMENT VIEW - Connected to Airtable Documents
// ══════════════════════════════════════════════════════════════════════════════

const DRAWING_SETS = [
  { id: 'Site Assessment', name: 'Site Assessment', phase: 'design', required: true },
  { id: 'Concept Design', name: 'Concept Design', phase: 'design', required: true, customerApproval: true },
  { id: 'Permit Set', name: 'Permit Set', phase: 'permitting', required: true },
  { id: 'IFC', name: 'IFC', phase: 'manufacturing', required: true, gatekeeper: true },
  { id: 'Shop Drawings', name: 'Shop Drawings', phase: 'manufacturing', required: false },
  { id: 'As-Built', name: 'As-Built', phase: 'closeout', required: false },
  { id: 'Closeout Package', name: 'Closeout Package', phase: 'closeout', required: false },
];

const DOC_STATUSES = {
  'Not Started': { label: 'Not Started', color: 'bg-gray-100 text-gray-600', icon: Clock },
  'Draft': { label: 'Draft', color: 'bg-slate-100 text-slate-600', icon: FileText },
  'In Review': { label: 'In Review', color: 'bg-blue-100 text-blue-700', icon: Eye },
  'Revision Requested': { label: 'Revision', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  'Approved': { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  'Superseded': { label: 'Superseded', color: 'bg-gray-100 text-gray-500', icon: History },
};

const PHASES = { design: { label: 'Design', color: '#8B5CF6' }, permitting: { label: 'Permitting', color: '#F59E0B' }, manufacturing: { label: 'Manufacturing', color: '#10B981' }, closeout: { label: 'Closeout', color: '#64748B' } };

const formatDateShort = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

// Map Airtable document to internal format
const mapAirtableDoc = (doc) => ({
  id: doc.id,
  projectId: doc.Name?.split(' - ')[0] || doc.Name || '',  // Extract project ID from name like "HO755 - Site Assessment"
  setType: doc.Name?.split(' - ')[1] || 'Other',
  status: doc.Status || 'Draft',
  notes: doc.Notes || '',
  assignee: doc.Assignee?.name || doc.Assignee || '',
  version: 'v1',
});

const getLatestVersion = (pid, setType, docs) => docs.filter(d => d.projectId === pid && d.setType === setType && d.status !== 'Superseded').sort((a, b) => (b.version || '').localeCompare(a.version || ''))[0] || null;
const getSetStatus = (pid, docs) => { const s = {}; DRAWING_SETS.forEach(set => { const l = getLatestVersion(pid, set.id, docs); s[set.id] = l ? l.status : 'Not Started'; }); return s; };
const getReadiness = (pid, docs) => { const s = getSetStatus(pid, docs); const req = DRAWING_SETS.filter(x => x.required); const app = req.filter(x => s[x.id] === 'Approved').length; return { app, total: req.length, pct: Math.round(app / req.length * 100), ifc: s['IFC'] === 'Approved' }; };

function DrawingStatusBadge({ status }) {
  const cfg = DOC_STATUSES[status] || DOC_STATUSES['Not Started'];
  const Icon = cfg.icon;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}><Icon className="w-3 h-3" />{cfg.label}</span>;
}

function DrawingSetRow({ set, doc, onAction }) {
  const status = doc?.status || 'Not Started';
  const bg = status === 'Approved' ? 'bg-emerald-50 border-emerald-200' : status === 'Revision Requested' ? 'bg-amber-50 border-amber-200' : status === 'In Review' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200';
  const iconBg = status === 'Approved' ? 'bg-emerald-500' : status === 'Revision Requested' ? 'bg-amber-500' : status === 'In Review' ? 'bg-blue-500' : 'bg-gray-300';
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${bg}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${iconBg}`}><FileText className="w-4 h-4" /></div>
        <div>
          <div className="flex items-center gap-2"><span className="font-medium">{set.name}</span>{set.required && <span className="text-xs text-gray-400">Required</span>}{set.gatekeeper && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 rounded">Gate</span>}</div>
          {doc && <div className="text-xs text-gray-500">{doc.version} {doc.assignee && `• ${doc.assignee}`}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DrawingStatusBadge status={status} />
        {status === 'In Review' && <><button onClick={() => onAction('approve', doc)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded" title="Approve"><Check className="w-4 h-4" /></button><button onClick={() => onAction('revision', doc)} className="p-1.5 text-amber-600 hover:bg-amber-100 rounded" title="Request Revision"><AlertTriangle className="w-4 h-4" /></button></>}
        {status === 'Not Started' && <button onClick={() => onAction('upload', { setType: set.id })} className="p-1.5 text-gray-400 hover:bg-gray-200 rounded" title="Upload"><Upload className="w-4 h-4" /></button>}
      </div>
    </div>
  );
}

function ProjectDrawingCard({ project, docs, expanded, onToggle, onAction }) {
  const readiness = getReadiness(project['Project ID'], docs);
  const status = getSetStatus(project['Project ID'], docs);
  const inReview = DRAWING_SETS.filter(s => status[s.id] === 'In Review').length;
  const needsRev = DRAWING_SETS.filter(s => status[s.id] === 'Revision Requested').length;
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <button onClick={onToggle} className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center"><Home className="w-6 h-6 text-slate-600" /></div>
          <div className="text-left">
            <div className="flex items-center gap-2"><span className="font-bold">{project['Project ID']}</span><span className="text-gray-500">—</span><span>{project['Project Name']}</span></div>
            <div className="text-sm text-gray-500">{project.Stage} • {project.Status}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {needsRev > 0 && <span className="flex items-center gap-1 text-amber-600 text-sm"><AlertTriangle className="w-4 h-4" />{needsRev}</span>}
          {inReview > 0 && <span className="flex items-center gap-1 text-blue-600 text-sm"><Eye className="w-4 h-4" />{inReview}</span>}
          {readiness.ifc && <span className="flex items-center gap-1 text-emerald-600 text-sm"><Shield className="w-4 h-4" />IFC</span>}
          <div className="w-32 hidden md:flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${readiness.ifc ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${readiness.pct}%` }} /></div>
            <span className="text-xs text-gray-500">{readiness.app}/{readiness.total}</span>
          </div>
          {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t p-4 space-y-4">
          {Object.entries(PHASES).map(([phaseId, phase]) => {
            const sets = DRAWING_SETS.filter(s => s.phase === phaseId);
            if (!sets.length) return null;
            return (
              <div key={phaseId}>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: phase.color }} />{phase.label}</div>
                <div className="space-y-2">{sets.map(set => <DrawingSetRow key={set.id} set={set} doc={getLatestVersion(project['Project ID'], set.id, docs)} onAction={onAction} />)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DrawingManagementView({ projects, documents, onUpdateDoc }) {
  const [expanded, setExpanded] = useState(projects[0]?.['Project ID']);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Map Airtable documents to internal format
  const docs = useMemo(() => documents.map(mapAirtableDoc), [documents]);

  const handleAction = async (action, doc) => {
    if (!doc?.id) return;
    try {
      if (action === 'approve') {
        await onUpdateDoc(doc.id, { Status: 'Approved' });
      } else if (action === 'revision') {
        await onUpdateDoc(doc.id, { Status: 'Revision Requested' });
      }
    } catch (err) {
      alert('Error updating document: ' + err.message);
    }
  };

  const stats = useMemo(() => {
    let inReview = 0, needsRev = 0, missingIFC = 0, ifcReady = 0;
    projects.forEach(p => {
      const s = getSetStatus(p['Project ID'], docs);
      DRAWING_SETS.forEach(set => { if (s[set.id] === 'In Review') inReview++; if (s[set.id] === 'Revision Requested') needsRev++; });
      if (s['IFC'] !== 'Approved' && ['D&E', 'Permitting'].includes(p.Stage)) missingIFC++;
      if (s['IFC'] === 'Approved') ifcReady++;
    });
    return { inReview, needsRev, missingIFC, ifcReady };
  }, [projects, docs]);

  const filtered = useMemo(() => {
    let r = projects;
    if (search) r = r.filter(p => p['Project ID']?.toLowerCase().includes(search.toLowerCase()) || p['Project Name']?.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'needs_review') r = r.filter(p => Object.values(getSetStatus(p['Project ID'], docs)).includes('In Review'));
    if (filter === 'needs_revision') r = r.filter(p => Object.values(getSetStatus(p['Project ID'], docs)).includes('Revision Requested'));
    if (filter === 'ifc_pending') r = r.filter(p => getSetStatus(p['Project ID'], docs)['IFC'] !== 'Approved');
    return r;
  }, [projects, docs, search, filter]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Eye className="w-5 h-5 text-blue-600" /></div><div><div className="text-2xl font-bold">{stats.inReview}</div><div className="text-sm text-gray-500">In Review</div></div></div>
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${stats.needsRev > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.needsRev > 0 ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}><AlertTriangle className="w-5 h-5" /></div><div><div className="text-2xl font-bold">{stats.needsRev}</div><div className="text-sm text-gray-500">Need Revision</div></div></div>
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${stats.missingIFC > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white'}`}><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.missingIFC > 0 ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-400'}`}><AlertCircle className="w-5 h-5" /></div><div><div className="text-2xl font-bold">{stats.missingIFC}</div><div className="text-sm text-gray-500">Missing IFC</div></div></div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 flex items-center gap-3"><div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div><div><div className="text-2xl font-bold">{stats.ifcReady}</div><div className="text-sm text-gray-500">IFC Ready</div></div></div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" /></div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm"><option value="all">All</option><option value="needs_review">Needs Review</option><option value="needs_revision">Needs Revision</option><option value="ifc_pending">IFC Pending</option></select>
      </div>
      {documents.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm">
          <strong>Tip:</strong> Add documents in Airtable with naming format: <code className="bg-blue-100 px-1 rounded">ProjectID - Drawing Set</code> (e.g., "HO755 - IFC")
        </div>
      )}
      <div className="space-y-4">
        {filtered.length === 0 ? <div className="text-center py-8 text-gray-500">No projects found</div> : filtered.map(p => <ProjectDrawingCard key={p.id} project={p} docs={docs} expanded={expanded === p['Project ID']} onToggle={() => setExpanded(expanded === p['Project ID'] ? null : p['Project ID'])} onAction={handleAction} />)}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NAVIGATION & MAIN APP
// ══════════════════════════════════════════════════════════════════════════════

const navItems = [
  { id: 'wip', label: 'WIP Schedule', icon: LayoutDashboard },
  { id: 'jobs', label: 'Job Schedule', icon: ClipboardList },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'drawings', label: 'Drawings', icon: FileText },
  { id: 'deviations', label: 'Deviations', icon: AlertTriangle },
];

export default function App() {
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('wip');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const [projData, docData] = await Promise.all([
        airtableAPI.fetchProjects(),
        airtableAPI.fetchDocuments()
      ]);
      setProjects(projData);
      setDocuments(docData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) loadData(); else { setError('Airtable not configured'); setLoading(false); } }, []);

  const handleSave = async (form, id) => { if (id) { const u = await airtableAPI.updateProject(id, form); setProjects(projects.map(p => p.id === id ? u : p)); } else { const c = await airtableAPI.createProject(form); setProjects([...projects, c]); } };
  const handleDelete = async id => { if (window.confirm('Delete?')) { await airtableAPI.deleteProject(id); setProjects(projects.filter(p => p.id !== id)); } };
  const handleUpdateDoc = async (id, fields) => {
    const updated = await airtableAPI.updateDocument(id, fields);
    setDocuments(documents.map(d => d.id === id ? updated : d));
  };
  const openEdit = p => { setEditingProject(p); setShowForm(true); };
  const openNew = () => { setEditingProject(null); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingProject(null); };

  const renderView = () => {
    const props = { projects, onEdit: openEdit, onDelete: handleDelete };
    switch (activeView) {
      case 'wip': return <WIPScheduleView {...props} />;
      case 'jobs': return <JobScheduleView {...props} />;
      case 'budget': return <BudgetView {...props} />;
      case 'drawings': return <DrawingManagementView projects={projects} documents={documents} onUpdateDoc={handleUpdateDoc} />;
      case 'deviations': return <DeviationsView {...props} />;
      default: return <WIPScheduleView {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100"><Menu className="w-6 h-6" /></button>
        <h1 className="text-lg font-bold">Honomobo Ops</h1>
        <button onClick={openNew} className="p-2 rounded-lg bg-blue-600 text-white"><Plus className="w-5 h-5" /></button>
      </div>
      <div className="flex">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform`}>
          <div className="p-6 border-b"><h1 className="text-xl font-bold">Honomobo</h1><p className="text-sm text-gray-500">Operations</p></div>
          <nav className="p-4 space-y-1">
            {navItems.map(item => (<button key={item.id} onClick={() => { setActiveView(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${activeView === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><item.icon className="w-5 h-5" /><span className="font-medium">{item.label}</span></button>))}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t"><button onClick={openNew} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" />New Project</button></div>
        </aside>
        <main className="flex-1 p-4 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div><h2 className="text-2xl font-bold">{navItems.find(n => n.id === activeView)?.label}</h2><p className="text-gray-500">{projects.length} projects • {documents.length} documents</p></div>
            <div className="hidden lg:flex gap-3">
              <button onClick={loadData} disabled={loading} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
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
