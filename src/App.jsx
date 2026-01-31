// Honomobo Operations - Full Integrated Platform
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ClipboardList, DollarSign, AlertTriangle, Menu, X, Plus, RefreshCw, Edit2, Trash2, Calendar, MapPin, Clock, CheckCircle, AlertCircle, FileText, Eye, Shield, ChevronDown, ChevronRight, Upload, Search, Check, History, Home, ChevronLeft, Truck, Ship, GripVertical, Zap, Users, Package, Settings, RotateCcw, Download, Filter, CheckCircle2, Factory, TrendingUp, TrendingDown, Building2, Circle, MoreHorizontal, MessageSquare, ExternalLink, ArrowRight, ArrowLeft, Folder, User, Wrench, ClipboardCheck, Camera, Flag, BarChart3, CreditCard } from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════════════
// AIRTABLE CONFIGURATION & API
// ══════════════════════════════════════════════════════════════════════════════
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const PROJECTS_TABLE = 'Projects';
const DOCUMENTS_TABLE = 'Documents';

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

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS & CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════
const formatCurrency = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
const formatCompact = v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v?.toLocaleString() || '0';

// ══════════════════════════════════════════════════════════════════════════════
// PROJECT FORM MODAL
// ══════════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD VIEW (Portfolio Overview)
// ══════════════════════════════════════════════════════════════════════════════
function DashboardView({ projects, onEdit }) {
  const STAGES = ['Assessment', 'Concept', 'D&E', 'Permitting', 'Production', 'Logistics', 'Complete'];
  const stageColors = { 'Assessment': '#64748b', 'Concept': '#a855f7', 'D&E': '#3b82f6', 'Permitting': '#f59e0b', 'Production': '#10b981', 'Logistics': '#f97316', 'Complete': '#6b7280' };

  const metrics = useMemo(() => {
    const active = projects.filter(p => p.Stage !== 'Complete');
    const total = active.reduce((s, p) => s + (p['Contract Value'] || 0), 0);
    return { active: active.length, total, inProduction: active.filter(p => p.Stage === 'Production').length, avgValue: active.length ? total / active.length : 0 };
  }, [projects]);

  const stageCounts = useMemo(() => {
    const counts = {};
    STAGES.forEach(s => counts[s] = { count: 0, value: 0 });
    projects.forEach(p => { if (counts[p.Stage]) { counts[p.Stage].count++; counts[p.Stage].value += p['Contract Value'] || 0; }});
    return counts;
  }, [projects]);

  const maxCount = Math.max(...Object.values(stageCounts).map(c => c.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5"><div className="flex justify-between items-start mb-2"><span className="text-sm text-gray-500">Active Projects</span><Home className="w-5 h-5 text-gray-400" /></div><div className="text-2xl font-semibold">{metrics.active}</div><div className="text-sm text-gray-500 mt-1">{metrics.inProduction} in production</div></div>
        <div className="bg-white rounded-xl border p-5"><div className="flex justify-between items-start mb-2"><span className="text-sm text-gray-500">Contract Value</span><DollarSign className="w-5 h-5 text-blue-400" /></div><div className="text-2xl font-semibold">${formatCompact(metrics.total)}</div><div className="text-sm text-emerald-600 mt-1 flex items-center gap-1"><TrendingUp className="w-4 h-4" />Avg ${formatCompact(metrics.avgValue)}</div></div>
        <div className="bg-white rounded-xl border p-5"><div className="flex justify-between items-start mb-2"><span className="text-sm text-gray-500">In Production</span><Factory className="w-5 h-5 text-emerald-400" /></div><div className="text-2xl font-semibold text-emerald-600">{metrics.inProduction}</div><div className="text-sm text-gray-500 mt-1">units manufacturing</div></div>
        <div className="bg-white rounded-xl border p-5"><div className="flex justify-between items-start mb-2"><span className="text-sm text-gray-500">D&E Active</span><FileText className="w-5 h-5 text-blue-400" /></div><div className="text-2xl font-semibold text-blue-600">{stageCounts['D&E']?.count || 0}</div><div className="text-sm text-gray-500 mt-1">in design phase</div></div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="text-sm text-gray-500 mb-4">Pipeline by Stage</div>
        <div className="flex items-end gap-3">
          {STAGES.filter(s => s !== 'Complete').map((stage, idx) => (
            <React.Fragment key={stage}>
              <div className="flex-1 flex flex-col items-center">
                <div className="text-lg font-semibold text-gray-900">{stageCounts[stage]?.count || 0}</div>
                <div className="w-full rounded-t transition-all" style={{ height: `${maxCount > 0 ? (stageCounts[stage]?.count / maxCount) * 80 : 0}px`, minHeight: stageCounts[stage]?.count > 0 ? '8px' : '0', backgroundColor: stageColors[stage] }} />
                <div className="text-xs text-gray-500 mt-2 text-center">{stage}</div>
                <div className="text-xs text-gray-400">${formatCompact(stageCounts[stage]?.value || 0)}</div>
              </div>
              {idx < STAGES.length - 2 && <ArrowRight className="w-4 h-4 text-gray-300 mb-8" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b font-semibold">Recent Projects</div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-200">
            {projects.slice(0, 10).map(p => (
              <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(p)}>
                <td className="px-6 py-4"><div className="font-medium">{p['Project ID']}</div><div className="text-sm text-gray-500">{p['Project Name']}</div></td>
                <td className="px-6 py-4"><span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: `${stageColors[p.Stage]}20`, color: stageColors[p.Stage] }}>{p.Stage}</span></td>
                <td className="px-6 py-4 text-right font-medium">{formatCurrency(p['Contract Value'])}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${p.Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.Status}</span></td>
                <td className="px-6 py-4 text-center"><button className="p-1.5 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WIP SCHEDULE VIEW (Enhanced Spreadsheet)
// ══════════════════════════════════════════════════════════════════════════════
function WIPScheduleView({ projects, onEdit }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const stages = ['Assessment', 'Concept', 'D&E', 'Permitting', 'Production', 'Logistics', 'Complete'];
  const stageColors = { 'Assessment': 'bg-gray-200', 'Concept': 'bg-purple-100', 'D&E': 'bg-blue-100', 'Permitting': 'bg-yellow-100', 'Production': 'bg-green-100', 'Logistics': 'bg-cyan-100', 'Complete': 'bg-gray-100' };

  const summary = useMemo(() => {
    const total = projects.reduce((s, p) => s + (p['Contract Value'] || 0), 0);
    return { count: projects.length, total, production: projects.filter(p => p.Stage === 'Production').length };
  }, [projects]);

  const byStage = stages.map(s => ({ stage: s, projects: projects.filter(p => p.Stage === s) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-600 mb-1">Active Projects</div><div className="text-2xl font-bold">{summary.count}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-600 mb-1">Total Value</div><div className="text-2xl font-bold">${formatCompact(summary.total)}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-600 mb-1">In Production</div><div className="text-2xl font-bold text-emerald-600">{summary.production}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-600 mb-1">Avg Value</div><div className="text-2xl font-bold">${formatCompact(summary.count ? summary.total / summary.count : 0)}</div></div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">WIP by Stage</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {byStage.map(({ stage, projects: sp }) => (
            <div key={stage} className="flex-shrink-0 w-56">
              <div className={`rounded-t-lg px-3 py-2 font-medium text-sm ${stageColors[stage]}`}>{stage} ({sp.length})</div>
              <div className="bg-gray-50 rounded-b-lg p-2 min-h-24 space-y-2">
                {sp.slice(0, 5).map(p => (
                  <div key={p.id} onClick={() => onEdit(p)} className="bg-white rounded p-2 shadow-sm border text-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="font-medium">{p['Project ID']}</div>
                    <div className="text-xs text-gray-500">{p['Project Name']}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatCurrency(p['Contract Value'])}</div>
                  </div>
                ))}
                {sp.length > 5 && <div className="text-xs text-gray-400 text-center">+{sp.length - 5} more</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// JOB SCHEDULE VIEW
// ══════════════════════════════════════════════════════════════════════════════
function JobScheduleView({ projects, onEdit, onDelete }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 flex justify-between"><div><p className="text-sm text-gray-500">Total Jobs</p><p className="text-2xl font-bold">{projects.length}</p></div><Calendar className="w-10 h-10 text-blue-500" /></div>
        <div className="bg-white rounded-lg shadow p-6 flex justify-between"><div><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-green-600">{projects.filter(p => p.Status === 'Active').length}</p></div><Clock className="w-10 h-10 text-green-500" /></div>
        <div className="bg-white rounded-lg shadow p-6 flex justify-between"><div><p className="text-sm text-gray-500">In Production</p><p className="text-2xl font-bold text-purple-600">{projects.filter(p => p.Stage === 'Production').length}</p></div><Factory className="w-10 h-10 text-purple-500" /></div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b font-semibold">Job Schedule</div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-200">{projects.map(p => (<tr key={p.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-medium">{p['Project ID']}</td><td className="px-6 py-4 text-sm text-gray-500">{p['Project Name']}</td><td className="px-6 py-4 text-sm text-gray-500">{p.Stage}</td><td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${p.Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.Status}</span></td><td className="px-6 py-4 text-right"><button onClick={() => onEdit(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1"><Edit2 className="w-4 h-4" /></button><button onClick={() => onDelete(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></td></tr>))}{!projects.length && <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No projects yet</td></tr>}</tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTION SCHEDULER (Gantt Chart)
// ══════════════════════════════════════════════════════════════════════════════
const BAYS = [{ id: 'bay1', name: 'Bay 1', color: '#3B82F6' }, { id: 'bay2', name: 'Bay 2', color: '#10B981' }, { id: 'bay3', name: 'Bay 3', color: '#F59E0B' }, { id: 'bay4', name: 'Bay 4', color: '#8B5CF6' }];
const WEEKS_TO_SHOW = 16;
const MFG_DURATION_WEEKS = 12;
const MARKETS = { california: { name: 'California', icon: '🌴' }, hawaii: { name: 'Hawaii', icon: '🏝️' }, colorado: { name: 'Colorado', icon: '🏔️' }, alberta: { name: 'Alberta', icon: '🍁' }, ontario: { name: 'Ontario', icon: '🍁' } };

const initialScheduleJobs = [
  { id: 'HO801', name: 'Nakamura', model: 'HO5', market: 'hawaii', bay: 'bay2', startWeek: -4, status: 'in_progress', stage: 4, siteReady: true, priority: 'normal' },
  { id: 'HO823', name: 'Martinez', model: 'HS6', market: 'colorado', bay: 'bay1', startWeek: -2, status: 'in_progress', stage: 2, siteReady: false, priority: 'high' },
  { id: 'HO825', name: 'Chen', model: 'HO3', market: 'california', bay: 'bay3', startWeek: -1, status: 'in_progress', stage: 1, siteReady: true, priority: 'normal' },
  { id: 'HO830', name: 'Williams', model: 'HO4', market: 'california', bay: 'bay4', startWeek: 0, status: 'scheduled', stage: 0, siteReady: true, priority: 'normal' },
  { id: 'HO832', name: 'Tanaka', model: 'HO5', market: 'hawaii', bay: null, startWeek: null, status: 'queued', stage: 0, siteReady: false, priority: 'normal' },
  { id: 'HO838', name: 'Patel', model: 'HO4', market: 'california', bay: null, startWeek: null, status: 'queued', stage: 0, siteReady: true, priority: 'high' },
];

const getWeekLabel = (weekOffset) => { const d = new Date(); d.setDate(d.getDate() + (weekOffset * 7)); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };

function ProductionSchedulerView() {
  const [jobs, setJobs] = useState(initialScheduleJobs);
  const [viewOffset, setViewOffset] = useState(0);
  const [showQueue, setShowQueue] = useState(true);
  const weeks = useMemo(() => Array.from({ length: WEEKS_TO_SHOW }, (_, i) => i + viewOffset - 4), [viewOffset]);
  const queuedJobs = jobs.filter(j => j.status === 'queued').sort((a, b) => ({ high: 0, normal: 1, low: 2 }[a.priority] - { high: 0, normal: 1, low: 2 }[b.priority]));
  const stats = useMemo(() => ({ inProgress: jobs.filter(j => j.status === 'in_progress').length, scheduled: jobs.filter(j => j.status === 'scheduled').length, queued: jobs.filter(j => j.status === 'queued').length }), [jobs]);
  const handleDragStart = (e, job) => e.dataTransfer.setData('jobId', job.id);
  const handleDropJob = (jobId, bayId, week) => setJobs(prev => prev.map(job => job.id === jobId ? { ...job, bay: bayId, startWeek: week, status: week <= 0 ? 'in_progress' : 'scheduled' } : job));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">In Production</div><div className="text-3xl font-bold">{stats.inProgress}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">Scheduled</div><div className="text-3xl font-bold text-blue-600">{stats.scheduled}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">In Queue</div><div className="text-3xl font-bold text-amber-600">{stats.queued}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">Total Bays</div><div className="text-3xl font-bold">{BAYS.length}</div></div>
      </div>
      <div className="flex gap-6">
        <div className="flex-1 bg-white rounded-xl border overflow-hidden">
          <div className="flex items-center border-b bg-gray-50">
            <div className="w-24 flex-shrink-0 p-3 border-r flex items-center justify-between">
              <button onClick={() => setViewOffset(v => v - 4)} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setViewOffset(v => v + 4)} className="p-1 hover:bg-gray-200 rounded"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 flex">{weeks.map((week, idx) => (<div key={idx} className={`flex-1 text-center py-2 text-xs border-r border-gray-100 ${week === 0 ? 'bg-blue-100 font-semibold' : 'text-gray-500'}`}>{getWeekLabel(week)}</div>))}</div>
          </div>
          {BAYS.map(bay => {
            const bayJobs = jobs.filter(j => j.bay === bay.id && j.startWeek !== null);
            return (
              <div key={bay.id} className="flex items-stretch border-b border-gray-100">
                <div className="w-24 flex-shrink-0 p-3 bg-gray-50 border-r flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: bay.color }} /><span className="font-medium text-sm">{bay.name}</span></div>
                <div className="flex-1 flex relative">
                  {weeks.map((week, idx) => (<div key={idx} className={`flex-1 min-h-[60px] border-r border-gray-100 ${week === 0 ? 'bg-blue-50/50' : ''}`} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const jid = e.dataTransfer.getData('jobId'); if (jid) handleDropJob(jid, bay.id, week); }} />))}
                  {bayJobs.map(job => {
                    const startIdx = weeks.findIndex(w => w === job.startWeek);
                    if (startIdx === -1) return null;
                    const leftPct = (startIdx / weeks.length) * 100;
                    const widthPct = (MFG_DURATION_WEEKS / weeks.length) * 100;
                    return (<div key={job.id} className="absolute top-2 bottom-2 rounded-lg border shadow-sm flex items-center px-2 text-sm font-medium" style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: `${bay.color}20`, borderColor: bay.color }}><span>{job.id}</span><span className="ml-1">{MARKETS[job.market]?.icon}</span></div>);
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {showQueue && (
          <div className="w-64 flex-shrink-0 bg-white rounded-xl border overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between"><div className="flex items-center gap-2"><Package className="w-5 h-5" /><h3 className="font-semibold">Queue</h3><span className="px-2 py-0.5 bg-gray-200 text-xs rounded-full">{queuedJobs.length}</span></div><button onClick={() => setShowQueue(false)}><X className="w-4 h-4" /></button></div>
            <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
              {queuedJobs.map(job => (<div key={job.id} draggable onDragStart={e => handleDragStart(e, job)} className="bg-white border rounded-lg p-3 cursor-grab hover:shadow-md"><div className="font-semibold text-sm">{job.id} <span className="font-normal text-gray-500">- {job.name}</span></div><div className="text-xs text-gray-500 mt-1">{job.model} • {MARKETS[job.market]?.icon} {MARKETS[job.market]?.name}</div></div>))}
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">Drag to schedule</div>
          </div>
        )}
      </div>
      {!showQueue && <button onClick={() => setShowQueue(true)} className="fixed bottom-6 right-6 px-4 py-2 bg-slate-900 text-white rounded-lg shadow-lg flex items-center gap-2"><Package className="w-4 h-4" />Queue ({queuedJobs.length})</button>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTION BOARD VIEW
// ══════════════════════════════════════════════════════════════════════════════
const PROD_STAGES = [{ id: 'fabrication', name: 'Fabrication' }, { id: 'rough_in', name: 'Rough-In' }, { id: 'finishing', name: 'Finishing' }, { id: 'final', name: 'Final' }, { id: 'ready', name: 'Ready to Ship' }];
const prodData = [
  { id: 'HO755', name: 'Holland', model: 'HO3', bay: 1, stage: 'rough_in', shipDate: '2026-03-27', status: 'on_track', siteStatus: 'behind' },
  { id: 'HO761', name: 'Chen', model: 'HO4', bay: 2, stage: 'fabrication', shipDate: '2026-04-15', status: 'on_track', siteStatus: 'on_track' },
  { id: 'HO758', name: 'Reyes', model: 'SO2', bay: 3, stage: 'finishing', shipDate: '2026-02-28', status: 'behind', siteStatus: 'on_track' },
  { id: 'HO752', name: 'Nakamura', model: 'HO3', bay: 4, stage: 'final', shipDate: '2026-02-15', status: 'on_track', siteStatus: 'on_track' },
  { id: 'HO749', name: 'Thompson', model: 'HS8', bay: 5, stage: 'ready', shipDate: '2026-02-03', status: 'on_track', siteStatus: 'confirmed' },
];

function ProductionBoardView() {
  const [viewMode, setViewMode] = useState('table');
  const stageColors = { fabrication: 'bg-purple-100 text-purple-700', rough_in: 'bg-blue-100 text-blue-700', finishing: 'bg-amber-100 text-amber-700', final: 'bg-orange-100 text-orange-700', ready: 'bg-emerald-100 text-emerald-700' };
  const statusColors = { on_track: 'text-emerald-600', behind: 'text-amber-600', blocked: 'text-red-600' };

  const stats = { inBay: prodData.filter(p => p.bay).length, onTrack: prodData.filter(p => p.status === 'on_track').length, behind: prodData.filter(p => p.status === 'behind').length, ready: prodData.filter(p => p.stage === 'ready').length };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div></div>
        <div className="flex items-center bg-white border rounded-lg p-1">
          <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 text-sm font-medium rounded ${viewMode === 'table' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}>Table</button>
          <button onClick={() => setViewMode('board')} className={`px-3 py-1.5 text-sm font-medium rounded ${viewMode === 'board' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}>Board</button>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-500">In Production</div><div className="text-2xl font-semibold">{stats.inBay}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-500">On Track</div><div className="text-2xl font-semibold text-emerald-600">{stats.onTrack}</div></div>
        <div className="bg-white rounded-xl border border-amber-200 p-4"><div className="text-sm text-gray-500">Behind</div><div className="text-2xl font-semibold text-amber-600">{stats.behind}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-500">Ready to Ship</div><div className="text-2xl font-semibold">{stats.ready}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-500">Total</div><div className="text-2xl font-semibold">{prodData.length}</div></div>
      </div>
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr><th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Bay</th><th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Project</th><th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Model</th><th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Stage</th><th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Ship Date</th><th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th></tr></thead>
            <tbody>{prodData.map(p => (<tr key={p.id} className="border-b hover:bg-gray-50"><td className="py-3 px-4"><span className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm font-medium">{p.bay || '—'}</span></td><td className="py-3 px-4 font-medium">{p.id} - {p.name}</td><td className="py-3 px-4">{p.model}</td><td className="py-3 px-4"><span className={`px-2 py-1 rounded text-xs font-medium ${stageColors[p.stage]}`}>{PROD_STAGES.find(s => s.id === p.stage)?.name}</span></td><td className="py-3 px-4 text-sm">{p.shipDate}</td><td className="py-3 px-4"><span className={`flex items-center gap-1 ${statusColors[p.status]}`}>{p.status === 'on_track' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{p.status === 'on_track' ? 'On Track' : 'Behind'}</span></td></tr>))}</tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prodData.map(p => (
            <div key={p.id} className={`bg-white rounded-xl border p-4 ${p.status === 'behind' ? 'border-amber-300' : ''}`}>
              <div className="flex justify-between mb-3"><div><div className="font-semibold">{p.id} - {p.name}</div><div className="text-sm text-gray-500">{p.model}</div></div><span className={`px-2 py-1 h-fit rounded text-xs font-medium ${stageColors[p.stage]}`}>{PROD_STAGES.find(s => s.id === p.stage)?.name}</span></div>
              <div className="flex items-center gap-4 text-sm"><div className="flex items-center gap-1 text-gray-500"><Truck className="w-4 h-4" />{p.shipDate}</div><div className={statusColors[p.status]}>{p.status === 'on_track' ? 'On Track' : 'Behind'}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MANUFACTURING FLOOR VIEW
// ══════════════════════════════════════════════════════════════════════════════
const mfgUnits = [
  { id: 'HO755', name: 'Holland', model: 'HO3', stage: 'rough_in', progress: 35, currentTask: 'Framing', nextTask: 'MEP Rough-In', daysToShip: 57, needsAttention: false },
  { id: 'HO812', name: 'Chen', model: 'HO4', stage: 'fabrication', progress: 80, currentTask: 'Steel Inspection', nextTask: 'Stage 2', daysToShip: 45, needsAttention: true },
  { id: 'HO819', name: 'Martinez', model: 'SO2', stage: 'finishing', progress: 45, currentTask: 'Interior', nextTask: 'HVAC', daysToShip: 30, needsAttention: false },
  { id: 'HO823', name: 'Williams', model: 'HO3', stage: 'rough_in', progress: 70, currentTask: 'Spray Foam', nextTask: 'Inspection', daysToShip: 16, needsAttention: true },
  { id: 'HO801', name: 'Thompson', model: 'HS8', stage: 'finalization', progress: 60, currentTask: 'Decomplex', nextTask: 'Final QC', daysToShip: 9, needsAttention: true },
  { id: 'HO798', name: 'Nakamura', model: 'HO3', stage: 'ready_ship', progress: 100, currentTask: 'Ready', nextTask: 'Ship', daysToShip: 3, needsAttention: true },
];
const MFG_STAGES = [{ id: 'fabrication', name: 'FAB', color: 'bg-blue-500' }, { id: 'rough_in', name: 'ROUGH', color: 'bg-amber-500' }, { id: 'finishing', name: 'FINISH', color: 'bg-purple-500' }, { id: 'finalization', name: 'FINAL', color: 'bg-emerald-500' }, { id: 'ready_ship', name: 'SHIP', color: 'bg-green-500' }];

function ManufacturingFloorView() {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const stats = { total: mfgUnits.length, attention: mfgUnits.filter(u => u.needsAttention).length, urgent: mfgUnits.filter(u => u.daysToShip <= 14).length, ready: mfgUnits.filter(u => u.stage === 'ready_ship').length };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4"><div className="text-3xl font-bold">{stats.total}</div><div className="text-sm text-gray-500">Units in Production</div></div>
        <div className={`rounded-xl border p-4 ${stats.attention > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}><div className={`text-3xl font-bold ${stats.attention > 0 ? 'text-amber-600' : ''}`}>{stats.attention}</div><div className="text-sm text-gray-500">Need Attention</div></div>
        <div className={`rounded-xl border p-4 ${stats.urgent > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}><div className={`text-3xl font-bold ${stats.urgent > 0 ? 'text-red-600' : ''}`}>{stats.urgent}</div><div className="text-sm text-gray-500">Ship in 14 days</div></div>
        <div className={`rounded-xl border p-4 ${stats.ready > 0 ? 'bg-green-50 border-green-200' : 'bg-white'}`}><div className={`text-3xl font-bold ${stats.ready > 0 ? 'text-green-600' : ''}`}>{stats.ready}</div><div className="text-sm text-gray-500">Ready to Ship</div></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mfgUnits.map(unit => {
          const stageInfo = MFG_STAGES.find(s => s.id === unit.stage);
          return (
            <div key={unit.id} onClick={() => setSelectedUnit(unit)} className={`bg-white rounded-xl border-2 p-4 cursor-pointer hover:shadow-lg ${unit.needsAttention ? 'border-amber-400' : unit.daysToShip <= 14 ? 'border-red-300' : 'border-gray-200'}`}>
              <div className="flex justify-between mb-3"><div><div className="font-bold">{unit.id} <span className="font-normal text-gray-500">- {unit.name}</span></div><div className="text-xs text-gray-500">{unit.model}</div></div><span className={`px-2 py-1 text-xs font-semibold text-white rounded ${stageInfo?.color}`}>{stageInfo?.name}</span></div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3"><div className={`h-2 rounded-full ${stageInfo?.color}`} style={{ width: `${unit.progress}%` }} /></div>
              <div className="space-y-1 text-sm mb-3"><div className="flex items-center gap-2"><Wrench className="w-3.5 h-3.5 text-blue-500" /><span className="text-gray-600">Now:</span><span className="font-medium">{unit.currentTask}</span></div><div className="flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-600">Next:</span><span>{unit.nextTask}</span></div></div>
              <div className="flex items-center justify-between pt-2 border-t"><div className={`flex items-center gap-1 text-xs ${unit.daysToShip <= 14 ? 'text-red-600 font-medium' : 'text-gray-500'}`}><Calendar className="w-3.5 h-3.5" />{unit.daysToShip}d to ship</div>{unit.needsAttention && <AlertTriangle className="w-4 h-4 text-amber-500" />}</div>
            </div>
          );
        })}
      </div>
      {selectedUnit && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedUnit(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l z-50 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between"><div><div className="font-bold text-lg">{selectedUnit.id} - {selectedUnit.name}</div><div className="text-sm text-gray-500">{selectedUnit.model}</div></div><button onClick={() => setSelectedUnit(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>
            <div className="p-4 space-y-6">
              <div><div className="flex justify-between mb-2"><span className={`px-2 py-1 text-xs font-semibold text-white rounded ${MFG_STAGES.find(s => s.id === selectedUnit.stage)?.color}`}>{MFG_STAGES.find(s => s.id === selectedUnit.stage)?.name}</span><span className="text-sm text-gray-500">{selectedUnit.progress}%</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${MFG_STAGES.find(s => s.id === selectedUnit.stage)?.color}`} style={{ width: `${selectedUnit.progress}%` }} /></div></div>
              {selectedUnit.needsAttention && <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-amber-500" /><div><div className="font-medium text-amber-800">Needs Attention</div><div className="text-sm text-amber-700">{selectedUnit.daysToShip <= 14 ? 'Shipping soon' : 'Inspection due'}</div></div></div>}
              <div className="bg-gray-50 rounded-lg p-3"><div className="flex justify-between"><div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4" /><span className="text-sm">Ship Date</span></div><div className="text-right"><div className="font-semibold">{selectedUnit.daysToShip} days</div></div></div></div>
              <div className="pt-4 border-t space-y-2"><button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg"><ClipboardCheck className="w-4 h-4" />Mark Stage Complete</button><button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border text-gray-700 font-medium rounded-lg"><Camera className="w-4 h-4" />Add Photos</button></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BUDGET VIEW
// ══════════════════════════════════════════════════════════════════════════════
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
          <tbody className="divide-y divide-gray-200">{projects.map(p => (<tr key={p.id} className="hover:bg-gray-50"><td className="px-6 py-4"><div className="font-medium">{p['Project ID']}</div><div className="text-sm text-gray-500">{p['Project Name']}</div></td><td className="px-6 py-4 text-sm text-gray-500">{p.Stage}</td><td className="px-6 py-4 text-sm text-right font-medium">{formatCurrency(p['Contract Value'])}</td><td className="px-6 py-4"><span className={`px-2 py-1 text-xs rounded-full ${p.Status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.Status}</span></td><td className="px-6 py-4 text-right"><button onClick={() => onEdit(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1"><Edit2 className="w-4 h-4" /></button><button onClick={() => onDelete(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// P&L VIEW
// ══════════════════════════════════════════════════════════════════════════════
const plMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const prodRevenue = { Jan: 1359425, Feb: 2000897, Mar: 2219090, Apr: 1964596, May: 2012243, Jun: 1999437, Jul: 2122352, Aug: 1715822, Sep: 1220362, Oct: 767104, Nov: 298466, Dec: 109545 };
const prodCosts = { Jan: 997450, Feb: 1487273, Mar: 1593905, Apr: 1376053, May: 1362385, Jun: 1283323, Jul: 1358806, Aug: 1087325, Sep: 769825, Oct: 496688, Nov: 186369, Dec: 56250 };

function PLView() {
  const [inputs] = useState({ deRevenue: 200000, liRevenue: 100000, deCosts: 140000, liCosts: 80000, mfgOverhead: 175000, corpOverhead: 175000 });

  const plData = useMemo(() => {
    let ytdRev = 0, ytdCogs = 0, ytdGP = 0, ytdNet = 0;
    const data = plMonths.map(month => {
      const rev = inputs.deRevenue + (prodRevenue[month] || 0) + inputs.liRevenue;
      const cogs = inputs.deCosts + (prodCosts[month] || 0) + inputs.liCosts;
      const gp = rev - cogs;
      const overhead = inputs.mfgOverhead + inputs.corpOverhead;
      const net = gp - overhead;
      ytdRev += rev; ytdCogs += cogs; ytdGP += gp; ytdNet += net;
      return { month, rev, cogs, gp, net };
    });
    return { data, ytdRev, ytdCogs, ytdGP, ytdNet };
  }, [inputs]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-600 mb-1">YTD Revenue</div><div className="text-2xl font-bold">${formatCompact(plData.ytdRev)}</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-600 mb-1">YTD COGS</div><div className="text-2xl font-bold">${formatCompact(plData.ytdCogs)}</div></div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4"><div className="text-sm text-gray-600 mb-1">Gross Profit</div><div className="text-2xl font-bold text-emerald-600">${formatCompact(plData.ytdGP)}</div><div className="text-sm text-gray-500">{((plData.ytdGP / plData.ytdRev) * 100).toFixed(1)}% margin</div></div>
        <div className={`rounded-xl border p-4 ${plData.ytdNet >= 0 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}><div className="text-sm text-gray-600 mb-1">Net Profit</div><div className={`text-2xl font-bold ${plData.ytdNet >= 0 ? 'text-amber-600' : 'text-red-600'}`}>${formatCompact(plData.ytdNet)}</div><div className="text-sm text-gray-500">{((plData.ytdNet / plData.ytdRev) * 100).toFixed(1)}% net</div></div>
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-600 mb-1">Overhead/mo</div><div className="text-2xl font-bold">${formatCompact(inputs.mfgOverhead + inputs.corpOverhead)}</div></div>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold mb-4">Monthly Net Profit</h3>
        <div className="flex items-end gap-2 h-40">
          {plData.data.map(d => {
            const maxNet = Math.max(...plData.data.map(x => Math.abs(x.net)));
            const heightPct = maxNet > 0 ? (Math.abs(d.net) / maxNet) * 100 : 0;
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center">
                <div className={`text-xs mb-1 font-medium ${d.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${formatCompact(d.net)}</div>
                <div className={`w-full rounded-t ${d.net >= 0 ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ height: `${heightPct}%`, minHeight: '4px' }} />
                <div className="text-xs text-gray-500 mt-2">{d.month}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-white"><tr><th className="py-2 px-4 text-left">Line Item</th>{plMonths.map(m => <th key={m} className="py-2 px-3 text-right">{m}</th>)}<th className="py-2 px-4 text-right bg-gray-700">YTD</th></tr></thead>
          <tbody>
            <tr className="border-b bg-blue-50"><td className="py-2 px-4 font-medium">Revenue</td>{plData.data.map(d => <td key={d.month} className="py-2 px-3 text-right font-mono">${formatCompact(d.rev)}</td>)}<td className="py-2 px-4 text-right font-mono font-semibold bg-blue-100">${formatCompact(plData.ytdRev)}</td></tr>
            <tr className="border-b"><td className="py-2 px-4 font-medium">COGS</td>{plData.data.map(d => <td key={d.month} className="py-2 px-3 text-right font-mono">${formatCompact(d.cogs)}</td>)}<td className="py-2 px-4 text-right font-mono font-semibold bg-gray-50">${formatCompact(plData.ytdCogs)}</td></tr>
            <tr className="border-b bg-emerald-50"><td className="py-2 px-4 font-semibold">Gross Profit</td>{plData.data.map(d => <td key={d.month} className="py-2 px-3 text-right font-mono">${formatCompact(d.gp)}</td>)}<td className="py-2 px-4 text-right font-mono font-bold bg-emerald-100">${formatCompact(plData.ytdGP)}</td></tr>
            <tr className="border-b bg-amber-50"><td className="py-2 px-4 font-semibold">Net Profit</td>{plData.data.map(d => <td key={d.month} className={`py-2 px-3 text-right font-mono ${d.net < 0 ? 'text-red-600' : ''}`}>${formatCompact(d.net)}</td>)}<td className={`py-2 px-4 text-right font-mono font-bold bg-amber-100 ${plData.ytdNet < 0 ? 'text-red-600' : ''}`}>${formatCompact(plData.ytdNet)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DRAWINGS VIEW
// ══════════════════════════════════════════════════════════════════════════════
const DRAWING_SETS = [{ id: 'Site Assessment', phase: 'design', required: true }, { id: 'Concept Design', phase: 'design', required: true }, { id: 'Permit Set', phase: 'permitting', required: true }, { id: 'IFC', phase: 'manufacturing', required: true, gatekeeper: true }, { id: 'Shop Drawings', phase: 'manufacturing' }, { id: 'As-Built', phase: 'closeout' }];
const DOC_STATUSES = { 'Not Started': { color: 'bg-gray-100 text-gray-600' }, 'Draft': { color: 'bg-slate-100 text-slate-600' }, 'In Review': { color: 'bg-blue-100 text-blue-700' }, 'Revision Requested': { color: 'bg-amber-100 text-amber-700' }, 'Approved': { color: 'bg-emerald-100 text-emerald-700' } };
const mapAirtableDoc = (doc) => ({ id: doc.id, projectId: doc.Name?.split(' - ')[0] || '', setType: doc.Name?.split(' - ')[1] || 'Other', status: doc.Status || 'Draft' });

function DrawingsView({ projects, documents, onUpdateDoc, onEdit }) {
  const [expanded, setExpanded] = useState(projects[0]?.['Project ID']);
  const [search, setSearch] = useState('');
  const docs = useMemo(() => documents.map(mapAirtableDoc), [documents]);

  const getLatestVersion = (pid, setType) => docs.filter(d => d.projectId === pid && d.setType === setType).sort((a, b) => (b.version || '').localeCompare(a.version || ''))[0] || null;
  const getSetStatus = (pid) => { const s = {}; DRAWING_SETS.forEach(set => { const l = getLatestVersion(pid, set.id); s[set.id] = l ? l.status : 'Not Started'; }); return s; };
  const getReadiness = (pid) => { const s = getSetStatus(pid); const req = DRAWING_SETS.filter(x => x.required); const app = req.filter(x => s[x.id] === 'Approved').length; return { app, total: req.length, pct: Math.round(app / req.length * 100), ifc: s['IFC'] === 'Approved' }; };

  const stats = useMemo(() => {
    let inReview = 0, needsRev = 0, ifcReady = 0;
    projects.forEach(p => {
      const s = getSetStatus(p['Project ID']);
      DRAWING_SETS.forEach(set => { if (s[set.id] === 'In Review') inReview++; if (s[set.id] === 'Revision Requested') needsRev++; });
      if (s['IFC'] === 'Approved') ifcReady++;
    });
    return { inReview, needsRev, ifcReady };
  }, [projects, docs]);

  const filtered = search ? projects.filter(p => p['Project ID']?.toLowerCase().includes(search.toLowerCase()) || p['Project Name']?.toLowerCase().includes(search.toLowerCase())) : projects;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Eye className="w-5 h-5 text-blue-600" /></div><div><div className="text-2xl font-bold">{stats.inReview}</div><div className="text-sm text-gray-500">In Review</div></div></div>
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${stats.needsRev > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.needsRev > 0 ? 'bg-amber-500 text-white' : 'bg-gray-100'}`}><AlertTriangle className="w-5 h-5" /></div><div><div className="text-2xl font-bold">{stats.needsRev}</div><div className="text-sm text-gray-500">Need Revision</div></div></div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 flex items-center gap-3"><div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div><div><div className="text-2xl font-bold">{stats.ifcReady}</div><div className="text-sm text-gray-500">IFC Ready</div></div></div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-gray-600" /></div><div><div className="text-2xl font-bold">{documents.length}</div><div className="text-sm text-gray-500">Total Docs</div></div></div>
      </div>
      <div className="flex items-center gap-3"><div className="relative flex-1 max-w-xs"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" /></div></div>
      <div className="space-y-4">
        {filtered.map(p => {
          const readiness = getReadiness(p['Project ID']);
          const status = getSetStatus(p['Project ID']);
          const isExpanded = expanded === p['Project ID'];
          return (
            <div key={p.id} className="bg-white rounded-xl border overflow-hidden">
              <button onClick={() => setExpanded(isExpanded ? null : p['Project ID'])} className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center"><Home className="w-6 h-6 text-slate-600" /></div>
                  <div className="text-left"><div className="flex items-center gap-2"><span className="font-bold">{p['Project ID']}</span><span className="text-gray-500">—</span><span>{p['Project Name']}</span></div><div className="text-sm text-gray-500">{p.Stage} • {p.Status}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  {readiness.ifc && <span className="flex items-center gap-1 text-emerald-600 text-sm"><Shield className="w-4 h-4" />IFC</span>}
                  <div className="w-32 flex items-center gap-2"><div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${readiness.ifc ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${readiness.pct}%` }} /></div><span className="text-xs text-gray-500">{readiness.app}/{readiness.total}</span></div>
                  <button onClick={(e) => { e.stopPropagation(); onEdit(p); }} className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600" title="Edit Project"><Edit2 className="w-4 h-4" /></button>
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                </div>
              </button>
              {isExpanded && (
                <div className="border-t p-4 space-y-2">
                  {DRAWING_SETS.map(set => {
                    const setStatus = status[set.id] || 'Not Started';
                    const statusCfg = DOC_STATUSES[setStatus] || DOC_STATUSES['Not Started'];
                    return (
                      <div key={set.id} className={`flex items-center justify-between p-3 rounded-lg border ${setStatus === 'Approved' ? 'bg-emerald-50 border-emerald-200' : setStatus === 'Revision Requested' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${setStatus === 'Approved' ? 'bg-emerald-500' : setStatus === 'Revision Requested' ? 'bg-amber-500' : 'bg-gray-300'}`}><FileText className="w-4 h-4" /></div><div><span className="font-medium">{set.id}</span>{set.required && <span className="text-xs text-gray-400 ml-2">Required</span>}{set.gatekeeper && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 rounded ml-2">Gate</span>}</div></div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>{setStatus}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DEVIATIONS VIEW
// ══════════════════════════════════════════════════════════════════════════════
function DeviationsView({ projects }) {
  const devs = [{ id: 1, project: projects[0]?.['Project ID'] || 'N/A', type: 'Schedule', severity: 'High', desc: 'Permit delays - 2 weeks behind', status: 'Open' }, { id: 2, project: projects[1]?.['Project ID'] || 'N/A', type: 'Budget', severity: 'Medium', desc: 'Material cost +5%', status: 'Reviewing' }, { id: 3, project: projects[2]?.['Project ID'] || 'N/A', type: 'Quality', severity: 'Low', desc: 'Minor finish defect', status: 'Resolved' }];
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
// NAVIGATION & MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'wip', label: 'WIP Schedule', icon: ClipboardList },
  { id: 'jobs', label: 'Job Schedule', icon: Calendar },
  { id: 'scheduler', label: 'Production Scheduler', icon: Factory },
  { id: 'board', label: 'Production Board', icon: Package },
  { id: 'floor', label: 'Mfg Floor', icon: Wrench },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'pl', label: 'P&L', icon: TrendingUp },
  { id: 'drawings', label: 'Drawings', icon: FileText },
  { id: 'deviations', label: 'Deviations', icon: AlertTriangle },
];

export default function App() {
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
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
      case 'dashboard': return <DashboardView {...props} />;
      case 'wip': return <WIPScheduleView {...props} />;
      case 'jobs': return <JobScheduleView {...props} />;
      case 'scheduler': return <ProductionSchedulerView />;
      case 'board': return <ProductionBoardView />;
      case 'floor': return <ManufacturingFloorView />;
      case 'budget': return <BudgetView {...props} />;
      case 'pl': return <PLView />;
      case 'drawings': return <DrawingsView projects={projects} documents={documents} onUpdateDoc={handleUpdateDoc} onEdit={openEdit} />;
      case 'deviations': return <DeviationsView {...props} />;
      default: return <DashboardView {...props} />;
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
          <div className="p-6 border-b"><h1 className="text-xl font-bold">Honomobo</h1><p className="text-sm text-gray-500">Operations Platform</p></div>
          <nav className="p-4 space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto">{navItems.map(item => (<button key={item.id} onClick={() => { setActiveView(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${activeView === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><item.icon className="w-5 h-5" /><span className="font-medium">{item.label}</span></button>))}</nav>
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
