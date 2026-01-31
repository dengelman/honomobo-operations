// Honomobo Operations - Full Platform with Production Scheduler
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ClipboardList, DollarSign, AlertTriangle, Menu, X, Plus, RefreshCw, Edit2, Trash2, Calendar, MapPin, Clock, CheckCircle, AlertCircle, FileText, Eye, Shield, ChevronDown, ChevronRight, Upload, Search, Check, History, Home, ChevronLeft, Truck, Ship, GripVertical, Zap, Users, Package, Settings, RotateCcw, Download, Filter, CheckCircle2, Factory } from 'lucide-react';

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
// DRAWING MANAGEMENT VIEW
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
const mapAirtableDoc = (doc) => ({ id: doc.id, projectId: doc.Name?.split(' - ')[0] || doc.Name || '', setType: doc.Name?.split(' - ')[1] || 'Other', status: doc.Status || 'Draft', notes: doc.Notes || '', assignee: doc.Assignee?.name || doc.Assignee || '', version: 'v1' });
const getLatestVersion = (pid, setType, docs) => docs.filter(d => d.projectId === pid && d.setType === setType && d.status !== 'Superseded').sort((a, b) => (b.version || '').localeCompare(a.version || ''))[0] || null;
const getSetStatus = (pid, docs) => { const s = {}; DRAWING_SETS.forEach(set => { const l = getLatestVersion(pid, set.id, docs); s[set.id] = l ? l.status : 'Not Started'; }); return s; };
const getReadiness = (pid, docs) => { const s = getSetStatus(pid, docs); const req = DRAWING_SETS.filter(x => x.required); const app = req.filter(x => s[x.id] === 'Approved').length; return { app, total: req.length, pct: Math.round(app / req.length * 100), ifc: s['IFC'] === 'Approved' }; };

function DrawingStatusBadge({ status }) { const cfg = DOC_STATUSES[status] || DOC_STATUSES['Not Started']; const Icon = cfg.icon; return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}><Icon className="w-3 h-3" />{cfg.label}</span>; }

function DrawingSetRow({ set, doc, onAction }) {
  const status = doc?.status || 'Not Started';
  const bg = status === 'Approved' ? 'bg-emerald-50 border-emerald-200' : status === 'Revision Requested' ? 'bg-amber-50 border-amber-200' : status === 'In Review' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200';
  const iconBg = status === 'Approved' ? 'bg-emerald-500' : status === 'Revision Requested' ? 'bg-amber-500' : status === 'In Review' ? 'bg-blue-500' : 'bg-gray-300';
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${bg}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${iconBg}`}><FileText className="w-4 h-4" /></div>
        <div><div className="flex items-center gap-2"><span className="font-medium">{set.name}</span>{set.required && <span className="text-xs text-gray-400">Required</span>}{set.gatekeeper && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 rounded">Gate</span>}</div>{doc && <div className="text-xs text-gray-500">{doc.version} {doc.assignee && `• ${doc.assignee}`}</div>}</div>
      </div>
      <div className="flex items-center gap-2">
        <DrawingStatusBadge status={status} />
        {status === 'In Review' && <><button onClick={() => onAction('approve', doc)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded"><Check className="w-4 h-4" /></button><button onClick={() => onAction('revision', doc)} className="p-1.5 text-amber-600 hover:bg-amber-100 rounded"><AlertTriangle className="w-4 h-4" /></button></>}
        {status === 'Not Started' && <button className="p-1.5 text-gray-400 hover:bg-gray-200 rounded"><Upload className="w-4 h-4" /></button>}
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
          <div className="text-left"><div className="flex items-center gap-2"><span className="font-bold">{project['Project ID']}</span><span className="text-gray-500">—</span><span>{project['Project Name']}</span></div><div className="text-sm text-gray-500">{project.Stage} • {project.Status}</div></div>
        </div>
        <div className="flex items-center gap-4">
          {needsRev > 0 && <span className="flex items-center gap-1 text-amber-600 text-sm"><AlertTriangle className="w-4 h-4" />{needsRev}</span>}
          {inReview > 0 && <span className="flex items-center gap-1 text-blue-600 text-sm"><Eye className="w-4 h-4" />{inReview}</span>}
          {readiness.ifc && <span className="flex items-center gap-1 text-emerald-600 text-sm"><Shield className="w-4 h-4" />IFC</span>}
          <div className="w-32 hidden md:flex items-center gap-2"><div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${readiness.ifc ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${readiness.pct}%` }} /></div><span className="text-xs text-gray-500">{readiness.app}/{readiness.total}</span></div>
          {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t p-4 space-y-4">
          {Object.entries(PHASES).map(([phaseId, phase]) => {
            const sets = DRAWING_SETS.filter(s => s.phase === phaseId);
            if (!sets.length) return null;
            return (<div key={phaseId}><div className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: phase.color }} />{phase.label}</div><div className="space-y-2">{sets.map(set => <DrawingSetRow key={set.id} set={set} doc={getLatestVersion(project['Project ID'], set.id, docs)} onAction={onAction} />)}</div></div>);
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
  const docs = useMemo(() => documents.map(mapAirtableDoc), [documents]);

  const handleAction = async (action, doc) => { if (!doc?.id) return; try { if (action === 'approve') await onUpdateDoc(doc.id, { Status: 'Approved' }); else if (action === 'revision') await onUpdateDoc(doc.id, { Status: 'Revision Requested' }); } catch (err) { alert('Error: ' + err.message); } };

  const stats = useMemo(() => { let inReview = 0, needsRev = 0, missingIFC = 0, ifcReady = 0; projects.forEach(p => { const s = getSetStatus(p['Project ID'], docs); DRAWING_SETS.forEach(set => { if (s[set.id] === 'In Review') inReview++; if (s[set.id] === 'Revision Requested') needsRev++; }); if (s['IFC'] !== 'Approved' && ['D&E', 'Permitting'].includes(p.Stage)) missingIFC++; if (s['IFC'] === 'Approved') ifcReady++; }); return { inReview, needsRev, missingIFC, ifcReady }; }, [projects, docs]);
  const filtered = useMemo(() => { let r = projects; if (search) r = r.filter(p => p['Project ID']?.toLowerCase().includes(search.toLowerCase()) || p['Project Name']?.toLowerCase().includes(search.toLowerCase())); if (filter === 'needs_review') r = r.filter(p => Object.values(getSetStatus(p['Project ID'], docs)).includes('In Review')); if (filter === 'needs_revision') r = r.filter(p => Object.values(getSetStatus(p['Project ID'], docs)).includes('Revision Requested')); if (filter === 'ifc_pending') r = r.filter(p => getSetStatus(p['Project ID'], docs)['IFC'] !== 'Approved'); return r; }, [projects, docs, search, filter]);

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
      <div className="space-y-4">{filtered.length === 0 ? <div className="text-center py-8 text-gray-500">No projects found</div> : filtered.map(p => <ProjectDrawingCard key={p.id} project={p} docs={docs} expanded={expanded === p['Project ID']} onToggle={() => setExpanded(expanded === p['Project ID'] ? null : p['Project ID'])} onAction={handleAction} />)}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTION SCHEDULER - Gantt Chart with Drag & Drop
// ══════════════════════════════════════════════════════════════════════════════

const BAYS = [
  { id: 'bay1', name: 'Bay 1', color: '#3B82F6', capacity: 1 },
  { id: 'bay2', name: 'Bay 2', color: '#10B981', capacity: 1 },
  { id: 'bay3', name: 'Bay 3', color: '#F59E0B', capacity: 1 },
  { id: 'bay4', name: 'Bay 4', color: '#8B5CF6', capacity: 1 },
];

const WEEKS_TO_SHOW = 16;
const MFG_DURATION_WEEKS = 12;

const MARKETS = {
  california: { name: 'California', icon: '🌴', shippingDays: 3, color: '#F59E0B' },
  hawaii: { name: 'Hawaii', icon: '🏝️', shippingDays: 14, batchPreferred: true, color: '#06B6D4' },
  colorado: { name: 'Colorado', icon: '🏔️', shippingDays: 2, color: '#8B5CF6' },
  alberta: { name: 'Alberta', icon: '🍁', shippingDays: 1, color: '#EF4444' },
  ontario: { name: 'Ontario', icon: '🍁', shippingDays: 4, color: '#EC4899' },
};

const initialScheduleJobs = [
  { id: 'HO801', name: 'Nakamura', model: 'HO5', market: 'hawaii', bay: 'bay2', startWeek: -4, status: 'in_progress', stage: 4, siteReady: true, priority: 'normal' },
  { id: 'HO823', name: 'Martinez', model: 'HS6', market: 'colorado', bay: 'bay1', startWeek: -2, status: 'in_progress', stage: 2, siteReady: false, priority: 'high' },
  { id: 'HO825', name: 'Chen', model: 'HO3', market: 'california', bay: 'bay3', startWeek: -1, status: 'in_progress', stage: 1, siteReady: true, priority: 'normal' },
  { id: 'HO830', name: 'Williams', model: 'HO4', market: 'california', bay: 'bay4', startWeek: 0, status: 'scheduled', stage: 0, siteReady: true, priority: 'normal' },
  { id: 'HO832', name: 'Tanaka', model: 'HO5', market: 'hawaii', bay: null, startWeek: 2, status: 'scheduled', stage: 0, siteReady: false, priority: 'normal' },
  { id: 'HO835', name: 'Morrison', model: 'HO3', market: 'alberta', bay: null, startWeek: 3, status: 'scheduled', stage: 0, siteReady: true, priority: 'normal' },
  { id: 'HO838', name: 'Patel', model: 'HO4', market: 'california', bay: null, startWeek: null, status: 'queued', stage: 0, siteReady: true, priority: 'high' },
  { id: 'HO840', name: 'Suzuki', model: 'HO5', market: 'hawaii', bay: null, startWeek: null, status: 'queued', stage: 0, siteReady: false, priority: 'normal' },
  { id: 'HO842', name: 'Thompson', model: 'HO3', market: 'ontario', bay: null, startWeek: null, status: 'queued', stage: 0, siteReady: true, priority: 'normal' },
];

const getWeekLabel = (weekOffset) => { const date = new Date(); date.setDate(date.getDate() + (weekOffset * 7)); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
const getWeekNumber = (weekOffset) => { const date = new Date(); const startOfYear = new Date(date.getFullYear(), 0, 1); date.setDate(date.getDate() + (weekOffset * 7)); const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)); return Math.ceil((days + startOfYear.getDay() + 1) / 7); };
const getShipDate = (startWeek) => { const date = new Date(); date.setDate(date.getDate() + ((startWeek + MFG_DURATION_WEEKS) * 7)); return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };

function SchedulerJobCard({ job, onDragStart, onDragEnd }) {
  const market = MARKETS[job.market];
  const bayInfo = BAYS.find(b => b.id === job.bay);
  const priorityColors = { high: 'border-l-rose-500', normal: 'border-l-gray-300', low: 'border-l-gray-200' };
  return (
    <div draggable onDragStart={(e) => onDragStart(e, job)} onDragEnd={onDragEnd} className={`bg-white border border-gray-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-l-4 ${priorityColors[job.priority]} p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-300" />
          <div><div className="font-semibold text-gray-900 text-sm">{job.id}</div><div className="text-xs text-gray-500">{job.name}</div></div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm">{market?.icon}</span>
          {!job.siteReady && <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center" title="Site not ready"><AlertCircle className="w-3 h-3 text-amber-600" /></div>}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-gray-500">{job.model}</span>
        {bayInfo && <span className="px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: bayInfo.color }}>{bayInfo.name}</span>}
      </div>
      {job.startWeek !== null && <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500"><div className="flex justify-between"><span>Ship: {getShipDate(job.startWeek)}</span><span>→ {market?.name}</span></div></div>}
    </div>
  );
}

function GanttRow({ bay, jobs, weeks, onDropJob, currentWeek }) {
  const [dragOver, setDragOver] = useState(null);
  const bayJobs = jobs.filter(j => j.bay === bay.id && j.startWeek !== null);
  const handleDragOver = (e, weekIdx) => { e.preventDefault(); setDragOver(weekIdx); };
  const handleDrop = (e, weekIdx) => { e.preventDefault(); setDragOver(null); const jobId = e.dataTransfer.getData('jobId'); if (jobId) onDropJob(jobId, bay.id, weeks[weekIdx]); };
  return (
    <div className="flex items-stretch border-b border-gray-100">
      <div className="w-24 flex-shrink-0 p-3 bg-gray-50 border-r border-gray-200 flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: bay.color }} /><span className="font-medium text-gray-700 text-sm">{bay.name}</span></div>
      <div className="flex-1 flex relative">
        {weeks.map((week, idx) => (<div key={idx} className={`flex-1 min-h-[60px] border-r border-gray-100 relative ${dragOver === idx ? 'bg-blue-50' : week < currentWeek ? 'bg-gray-50' : ''} ${week === currentWeek ? 'bg-blue-50/50' : ''}`} onDragOver={(e) => handleDragOver(e, idx)} onDragLeave={() => setDragOver(null)} onDrop={(e) => handleDrop(e, idx)} />))}
        {bayJobs.map(job => {
          const startIdx = weeks.findIndex(w => w === job.startWeek);
          if (startIdx === -1) return null;
          const widthPercent = (MFG_DURATION_WEEKS / weeks.length) * 100;
          const leftPercent = (startIdx / weeks.length) * 100;
          const progress = job.stage / 6;
          return (
            <div key={job.id} className="absolute top-2 bottom-2 rounded-lg overflow-hidden shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow" style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, backgroundColor: `${bay.color}20`, borderColor: bay.color }}>
              <div className="absolute inset-y-0 left-0 opacity-30" style={{ width: `${progress * 100}%`, backgroundColor: bay.color }} />
              <div className="relative p-2 flex items-center justify-between h-full">
                <div className="flex items-center gap-2"><span className="font-semibold text-gray-900 text-sm">{job.id}</span><span className="text-xs text-gray-600">{job.name}</span><span className="text-sm">{MARKETS[job.market]?.icon}</span></div>
                <div className="flex items-center gap-1">{!job.siteReady && <AlertCircle className="w-4 h-4 text-amber-500" />}<span className="text-xs text-gray-500">{job.model}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductionSchedulerView() {
  const [jobs, setJobs] = useState(initialScheduleJobs);
  const [viewOffset, setViewOffset] = useState(0);
  const [showQueue, setShowQueue] = useState(true);
  const currentWeek = 0;
  const weeks = useMemo(() => Array.from({ length: WEEKS_TO_SHOW }, (_, i) => i + viewOffset - 4), [viewOffset]);
  const queuedJobs = jobs.filter(j => j.status === 'queued').sort((a, b) => ({ high: 0, normal: 1, low: 2 }[a.priority] - { high: 0, normal: 1, low: 2 }[b.priority]));

  const stats = useMemo(() => ({ inProgress: jobs.filter(j => j.status === 'in_progress').length, scheduled: jobs.filter(j => j.status === 'scheduled').length, queued: jobs.filter(j => j.status === 'queued').length, siteNotReady: jobs.filter(j => !j.siteReady && j.startWeek !== null).length }), [jobs]);

  const handleDragStart = (e, job) => { e.dataTransfer.setData('jobId', job.id); };
  const handleDragEnd = () => {};
  const handleDropJob = (jobId, bayId, week) => { setJobs(prev => prev.map(job => job.id === jobId ? { ...job, bay: bayId, startWeek: week, status: week <= currentWeek ? 'in_progress' : 'scheduled' } : job)); };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">In Production</div><div className="text-3xl font-bold text-gray-900">{stats.inProgress}</div><div className="text-xs text-gray-400 mt-1">of {BAYS.length} bays</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">Scheduled</div><div className="text-3xl font-bold text-blue-600">{stats.scheduled}</div><div className="text-xs text-gray-400 mt-1">next 12 weeks</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">In Queue</div><div className="text-3xl font-bold text-amber-600">{stats.queued}</div><div className="text-xs text-gray-400 mt-1">awaiting scheduling</div></div>
        <div className={`rounded-xl border p-4 ${stats.siteNotReady > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white'}`}><div className="text-sm text-gray-500 mb-1">Site Issues</div><div className={`text-3xl font-bold ${stats.siteNotReady > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{stats.siteNotReady}</div><div className="text-xs text-gray-400 mt-1">{stats.siteNotReady > 0 ? 'need attention' : 'all sites ready'}</div></div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="flex items-center border-b bg-gray-50">
              <div className="w-24 flex-shrink-0 p-3 border-r flex items-center justify-between">
                <button onClick={() => setViewOffset(v => v - 4)} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setViewOffset(v => v + 4)} className="p-1 hover:bg-gray-200 rounded"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 flex">
                {weeks.map((week, idx) => (<div key={idx} className={`flex-1 text-center py-2 text-xs border-r border-gray-100 ${week === currentWeek ? 'bg-blue-100 font-semibold text-blue-900' : 'text-gray-500'}`}><div>{getWeekLabel(week)}</div><div className="text-[10px] text-gray-400">W{getWeekNumber(week)}</div></div>))}
              </div>
            </div>
            {BAYS.map(bay => <GanttRow key={bay.id} bay={bay} jobs={jobs} weeks={weeks} currentWeek={currentWeek} onDropJob={handleDropJob} />)}
          </div>
        </div>

        {showQueue && (
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-2"><Package className="w-5 h-5 text-gray-600" /><h3 className="font-semibold">Queue</h3><span className="px-2 py-0.5 bg-gray-200 text-xs rounded-full">{queuedJobs.length}</span></div>
                <button onClick={() => setShowQueue(false)} className="p-1 hover:bg-gray-200 rounded"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                {queuedJobs.length === 0 ? <div className="text-center py-8 text-gray-500"><Package className="w-8 h-8 mx-auto mb-2 text-gray-300" /><p>No jobs in queue</p></div> : queuedJobs.map(job => <SchedulerJobCard key={job.id} job={job} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />)}
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">Drag jobs to timeline to schedule</div>
            </div>
          </div>
        )}
      </div>

      {!showQueue && <button onClick={() => setShowQueue(true)} className="fixed bottom-6 right-6 px-4 py-2 bg-slate-900 text-white rounded-lg shadow-lg flex items-center gap-2"><Package className="w-4 h-4" />Show Queue ({queuedJobs.length})</button>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NAVIGATION & MAIN APP
// ══════════════════════════════════════════════════════════════════════════════

const navItems = [
  { id: 'wip', label: 'WIP Schedule', icon: LayoutDashboard },
  { id: 'jobs', label: 'Job Schedule', icon: ClipboardList },
  { id: 'production', label: 'Production', icon: Factory },
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

  const loadData = async () => { setLoading(true); setError(null); try { const [projData, docData] = await Promise.all([airtableAPI.fetchProjects(), airtableAPI.fetchDocuments()]); setProjects(projData); setDocuments(docData); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { if (AIRTABLE_API_KEY && AIRTABLE_BASE_ID) loadData(); else { setError('Airtable not configured'); setLoading(false); } }, []);

  const handleSave = async (form, id) => { if (id) { const u = await airtableAPI.updateProject(id, form); setProjects(projects.map(p => p.id === id ? u : p)); } else { const c = await airtableAPI.createProject(form); setProjects([...projects, c]); } };
  const handleDelete = async id => { if (window.confirm('Delete?')) { await airtableAPI.deleteProject(id); setProjects(projects.filter(p => p.id !== id)); } };
  const handleUpdateDoc = async (id, fields) => { const updated = await airtableAPI.updateDocument(id, fields); setDocuments(documents.map(d => d.id === id ? updated : d)); };
  const openEdit = p => { setEditingProject(p); setShowForm(true); };
  const openNew = () => { setEditingProject(null); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingProject(null); };

  const renderView = () => {
    const props = { projects, onEdit: openEdit, onDelete: handleDelete };
    switch (activeView) {
      case 'wip': return <WIPScheduleView {...props} />;
      case 'jobs': return <JobScheduleView {...props} />;
      case 'production': return <ProductionSchedulerView />;
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
          <nav className="p-4 space-y-1">{navItems.map(item => (<button key={item.id} onClick={() => { setActiveView(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${activeView === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><item.icon className="w-5 h-5" /><span className="font-medium">{item.label}</span></button>))}</nav>
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
