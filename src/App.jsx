// Honomobo Operations - Full Integrated Platform
// UPDATED: All views now use real Airtable data
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ClipboardList, DollarSign, AlertTriangle, Menu, X, Plus, RefreshCw, Edit2, Trash2, Calendar, MapPin, Clock, CheckCircle, AlertCircle, FileText, Eye, Shield, ChevronDown, ChevronRight, Upload, Search, Check, History, Home, ChevronLeft, Truck, Ship, GripVertical, Zap, Users, Package, Settings, RotateCcw, Download, Filter, CheckCircle2, Factory, TrendingUp, TrendingDown, Building2, Circle, MoreHorizontal, MessageSquare, ExternalLink, ArrowRight, ArrowLeft, Folder, User, Wrench, ClipboardCheck, Camera, Flag, BarChart3, CreditCard, Pencil, Info, PieChart, Calculator, Loader2, Lock, Pen, PackageCheck, Phone, Mail } from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════════════
// AIRTABLE CONFIGURATION & API
// ══════════════════════════════════════════════════════════════════════════════
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const PROJECTS_TABLE = 'Projects';
const DOCUMENTS_TABLE = 'Documents';
const ACTUALS_TABLE = 'Actuals';
const PAYMENTS_TABLE = 'Payments';

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
    if (!res.ok) return [];
    const data = await res.json();
    return data.records.map(r => ({ id: r.id, ...r.fields }));
  },
  async fetchPayments() {
    try {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PAYMENTS_TABLE}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } });
      if (!res.ok) return [];
      const data = await res.json();
      return data.records.map(r => ({ id: r.id, ...r.fields }));
    } catch { return []; }
  },
  async fetchActuals() {
    try {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ACTUALS_TABLE}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } });
      if (!res.ok) return [];
      const data = await res.json();
      return data.records.map(r => ({ id: r.id, ...r.fields }));
    } catch { return []; }
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
  },
  async createActualsBatch(records) {
    const batches = [];
    for (let i = 0; i < records.length; i += 10) {
      batches.push(records.slice(i, i + 10));
    }
    const results = [];
    for (const batch of batches) {
      const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${ACTUALS_TABLE}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: batch.map(fields => ({ fields })) })
      });
      const data = await res.json();
      results.push(...(data.records || []).map(r => ({ id: r.id, ...r.fields })));
    }
    return results;
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS & CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════
const formatCurrency = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
const formatCompact = v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v?.toLocaleString() || '0';

const MARKET_MAP = {
  'CA': 'california', 'California': 'california',
  'HI': 'hawaii', 'Hawaii': 'hawaii',
  'CO': 'colorado', 'Colorado': 'colorado',
  'AB': 'alberta', 'Alberta': 'alberta',
  'ON': 'ontario', 'Ontario': 'ontario',
  'BC': 'bc', 'British Columbia': 'bc',
  'WA': 'washington', 'Washington': 'washington',
  'NY': 'newyork', 'New York': 'newyork',
  'WI': 'wisconsin', 'ID': 'idaho', 'NJ': 'newjersey', 'MA': 'massachusetts', 'MI': 'michigan',
};

const BAY_MAP = {
  'Bay 1': 'bay1', 'Bay1': 'bay1', 'bay1': 'bay1', '1': 'bay1',
  'Bay 2': 'bay2', 'Bay2': 'bay2', 'bay2': 'bay2', '2': 'bay2',
  'Bay 3': 'bay3', 'Bay3': 'bay3', 'bay3': 'bay3', '3': 'bay3',
  'Bay 4': 'bay4', 'Bay4': 'bay4', 'bay4': 'bay4', '4': 'bay4',
};

const MFG_STATUS_TO_STAGE = {
  'Fabrication': 'fabrication', 'Steel Frame': 'fabrication',
  'Rough-In': 'rough_in', 'Rough MEP': 'rough_in', 'Insulation': 'rough_in',
  'Finishing': 'finishing', 'Interior Finish': 'finishing',
  'Final': 'final', 'Final QC': 'final',
  'Ready to Ship': 'ready', 'Ready': 'ready',
};

const MFG_STATUS_TO_WEEK = {
  'Fabrication': 2, 'Steel Frame': 2,
  'Rough-In': 4, 'Rough MEP': 4, 'Insulation': 5,
  'Finishing': 8, 'Interior Finish': 8,
  'Final': 10, 'Final QC': 10,
  'Ready to Ship': 12, 'Ready': 12,
};

// ══════════════════════════════════════════════════════════════════════════════
// HONOMOBO PLANT LAYOUT - 3925 8 St, Nisku, AB (51,255 sq ft)
// 12 indoor positions + 6 outdoor = 18 total
// ══════════════════════════════════════════════════════════════════════════════
const PLANT_POSITIONS = {
  '1N': { bay: 1, row: 'N', zone: 'PRE-FAB', color: '#6366F1', desc: 'Pre-Fabrication' },
  '1C': { bay: 1, row: 'C', zone: 'BUILD', color: '#3B82F6', desc: 'Build' },
  '1S': { bay: 1, row: 'S', zone: 'BUILD', color: '#3B82F6', desc: 'Build' },
  '2N': { bay: 2, row: 'N', zone: 'BUILD', color: '#3B82F6', desc: 'Build' },
  '2C': { bay: 2, row: 'C', zone: 'BUILD', color: '#3B82F6', desc: 'Build' },
  '2S': { bay: 2, row: 'S', zone: 'BUILD', color: '#3B82F6', desc: 'Build' },
  '3N': { bay: 3, row: 'N', zone: 'BUILD', color: '#10B981', desc: 'Build' },
  '3C': { bay: 3, row: 'C', zone: 'BUILD', color: '#10B981', desc: 'Build' },
  '3S': { bay: 3, row: 'S', zone: 'BUILD', color: '#10B981', desc: 'Build' },
  '4N': { bay: 4, row: 'N', zone: 'FAB 1', color: '#F59E0B', desc: 'Fabrication 1' },
  '4C': { bay: 4, row: 'C', zone: 'FAB 2', color: '#F59E0B', desc: 'Fabrication 2' },
  '4S': { bay: 4, row: 'S', zone: 'FAB FLEX', color: '#F59E0B', desc: 'Fab Flex' },
  'OW': { bay: 0, row: 'O', zone: 'OUTDOOR', color: '#8B5CF6', desc: 'Outdoor West' },
  'OE': { bay: 0, row: 'O', zone: 'OUTDOOR', color: '#8B5CF6', desc: 'Outdoor East' },
  'OF1': { bay: 0, row: 'O', zone: 'OUTDOOR', color: '#8B5CF6', desc: 'Outdoor Flex 1' },
  'OF2': { bay: 0, row: 'O', zone: 'OUTDOOR', color: '#8B5CF6', desc: 'Outdoor Flex 2' },
  'OF3': { bay: 0, row: 'O', zone: 'OUTDOOR', color: '#8B5CF6', desc: 'Outdoor Flex 3' },
  'OF4': { bay: 0, row: 'O', zone: 'OUTDOOR', color: '#8B5CF6', desc: 'Outdoor Flex 4' },
};
const POSITION_IDS = Object.keys(PLANT_POSITIONS);
const INDOOR_POSITIONS = POSITION_IDS.filter(p => PLANT_POSITIONS[p].bay > 0);
const OUTDOOR_POSITIONS = POSITION_IDS.filter(p => PLANT_POSITIONS[p].bay === 0);

// ══════════════════════════════════════════════════════════════════════════════
// PROJECT FORM MODAL
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// PROJECT FORM MODAL - Updated with 18 positions
// ══════════════════════════════════════════════════════════════════════════════
function ProjectFormModal({ project, onSave, onClose }) {
  const [form, setForm] = useState({
    'Project ID': project?.['Project ID'] || '',
    'Project Name': project?.['Project Name'] || '',
    'Stage': project?.['Stage'] || 'Assessment',
    'Status': project?.['Status'] || '',
    'Contract Value': project?.['Contract Value'] || 0,
    'Bay Assignment': project?.['Bay Assignment'] || '',
    'MFG Week': project?.['MFG Week'] || '',
    'MFG Status': project?.['MFG Status'] || '',
    'Project Manager': project?.['Project Manager'] || '',
  });
  const [saving, setSaving] = useState(false);
  const stages = ['Assessment', 'Concept', 'D&E', 'Permitting', 'Production', 'Logistics', 'Complete'];
  const positions = ['', ...POSITION_IDS];
  const mfgStatuses = ['', 'Fabrication', 'Rough-In', 'Insulation', 'Finishing', 'Final QC', 'Ready to Ship'];
  const pms = ['', 'Sarah Chen', 'Nicole Murray', 'Ryan Sieben'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form, project?.id);
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedPosition = PLANT_POSITIONS[form['Bay Assignment']];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="font-semibold text-lg">{project ? 'Edit' : 'New'} Project</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project ID *</label>
            <input type="text" value={form['Project ID']} onChange={e => setForm({ ...form, 'Project ID': e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Customer Name</label>
            <input type="text" value={form['Status']} onChange={e => setForm({ ...form, 'Status': e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., HOLLAND" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Stage</label>
              <select value={form['Stage']} onChange={e => setForm({ ...form, 'Stage': e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {stages.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Project Manager</label>
              <select value={form['Project Manager']} onChange={e => setForm({ ...form, 'Project Manager': e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {pms.map(s => <option key={s} value={s}>{s || '— Select —'}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contract Value ($)</label>
            <input type="number" value={form['Contract Value']} onChange={e => setForm({ ...form, 'Contract Value': parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          {(form['Stage'] === 'Production' || form['Stage'] === 'Logistics') && (
            <>
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-gray-700 mb-3">Manufacturing Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Position (Bay Assignment)</label>
                    <select value={form['Bay Assignment']} onChange={e => setForm({ ...form, 'Bay Assignment': e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                      {positions.map(p => (
                        <option key={p} value={p}>
                          {p ? `${p} - ${PLANT_POSITIONS[p]?.zone}` : '— Select Position —'}
                        </option>
                      ))}
                    </select>
                    {selectedPosition && (
                      <div className="mt-1 text-xs text-gray-500">
                        Bay {selectedPosition.bay > 0 ? selectedPosition.bay : 'Outdoor'} • {selectedPosition.desc}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">MFG Week (1-12)</label>
                    <input type="number" min="1" max="12" value={form['MFG Week']} onChange={e => setForm({ ...form, 'MFG Week': e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">MFG Status</label>
                  <select value={form['MFG Status']} onChange={e => setForm({ ...form, 'MFG Status': e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    {mfgStatuses.map(s => <option key={s} value={s}>{s || '— Select —'}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function DashboardView({ projects, onEdit }) {
  const STAGES = ['Assessment', 'Concept', 'D&E', 'Permitting', 'Production', 'Logistics', 'Complete'];
  const stageColors = { 'Assessment': '#64748b', 'Concept': '#a855f7', 'D&E': '#3b82f6', 'Permitting': '#f59e0b', 'Production': '#10b981', 'Logistics': '#f97316', 'Complete': '#6b7280' };

  const metrics = useMemo(() => {
    const active = projects.filter(p => p.Stage !== 'Complete');
    const total = active.reduce((s, p) => s + (p['Contract Value'] || 0), 0);
    return {
      active: active.length,
      total,
      inProduction: active.filter(p => p.Stage === 'Production').length,
      avgValue: active.length ? total / active.length : 0
    };
  }, [projects]);

  const stageCounts = useMemo(() => {
    const counts = {};
    STAGES.forEach(s => counts[s] = { count: 0, value: 0 });
    projects.forEach(p => {
      if (counts[p.Stage]) {
        counts[p.Stage].count++;
        counts[p.Stage].value += p['Contract Value'] || 0;
      }
    });
    return counts;
  }, [projects]);

  const maxCount = Math.max(...Object.values(stageCounts).map(c => c.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-gray-500">Active Projects</span>
            <Home className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold">{metrics.active}</div>
          <div className="text-sm text-gray-500 mt-1">{metrics.inProduction} in production</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-gray-500">Contract Value</span>
            <DollarSign className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-semibold">${formatCompact(metrics.total)}</div>
          <div className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />Avg ${formatCompact(metrics.avgValue)}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-gray-500">In Production</span>
            <Factory className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-semibold text-emerald-600">{metrics.inProduction}</div>
          <div className="text-sm text-gray-500 mt-1">units manufacturing</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-gray-500">D&E Active</span>
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-semibold text-blue-600">{stageCounts['D&E']?.count || 0}</div>
          <div className="text-sm text-gray-500 mt-1">in design phase</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="text-sm text-gray-500 mb-4">Pipeline by Stage</div>
        <div className="flex items-end gap-3">
          {STAGES.filter(s => s !== 'Complete').map((stage, idx) => (
            <React.Fragment key={stage}>
              <div className="flex-1 flex flex-col items-center">
                <div className="text-lg font-semibold text-gray-900">{stageCounts[stage]?.count || 0}</div>
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${(stageCounts[stage]?.count / maxCount) * 80}px`,
                    minHeight: stageCounts[stage]?.count > 0 ? '8px' : '0',
                    backgroundColor: stageColors[stage]
                  }}
                />
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
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projects.slice(0, 10).map(p => (
              <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(p)}>
                <td className="px-6 py-4">
                  <div className="font-medium">{p['Project ID']}</div>
                  <div className="text-sm text-gray-500">{p['Model'] || p['Unit Type'] || ''}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: `${stageColors[p.Stage]}20`, color: stageColors[p.Stage] }}>
                    {p.Stage}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium">{formatCurrency(p['Contract Value'])}</td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{p['Status'] || p['Customer (text)'] || '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WIP SCHEDULE VIEW - Uses Real Airtable Data
// ══════════════════════════════════════════════════════════════════════════════
const WIP_MONTHS = [
  { key: 'dec', label: 'Dec 31', isBaseline: true },
  { key: 'jan', label: 'Jan' }, { key: 'feb', label: 'Feb' }, { key: 'mar', label: 'Mar' },
  { key: 'apr', label: 'Apr' }, { key: 'may', label: 'May' }, { key: 'jun', label: 'Jun' },
  { key: 'jul', label: 'Jul' }, { key: 'aug', label: 'Aug' }, { key: 'sep', label: 'Sep' },
  { key: 'oct', label: 'Oct' }, { key: 'nov', label: 'Nov' }, { key: 'dec2', label: 'Dec' },
];

const WipCell = ({ value, isBaseline, isEditing, onStartEdit, onChange }) => {
  const [editValue, setEditValue] = useState(value || '');
  useEffect(() => { setEditValue(value || ''); }, [value]);
  
  const handleSave = () => {
    onChange(editValue === '' ? null : parseInt(editValue));
  };
  
  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          max="100"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-12 px-1 py-0.5 text-sm border border-blue-400 rounded text-center focus:outline-none"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') onChange(value);
          }}
        />
        <button onClick={handleSave} className="text-emerald-600 hover:text-emerald-700">
          <Check className="w-3 h-3" />
        </button>
      </div>
    );
  }
  
  if (value === null || value === undefined) {
    return <div onClick={onStartEdit} className="text-gray-300 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">—</div>;
  }
  
  return (
    <div
      onClick={onStartEdit}
      className={`px-2 py-1 rounded cursor-pointer text-sm font-medium transition-colors ${
        value === 100 ? 'bg-emerald-100 text-emerald-700' :
        isBaseline ? 'bg-amber-100 text-amber-700' :
        'bg-blue-50 text-blue-700 hover:bg-blue-100'
      }`}
    >
      {value}%
    </div>
  );
};

function WIPScheduleView({ projects }) {
  // Calculate WIP % based on real Airtable data (Stage + MFG Week)
  const calculateWipFromProject = (p) => {
    const stage = p.Stage;
    const mfgWeek = parseInt(p['MFG Week']) || 0;
    const mfgStatus = p['MFG Status'];
    
    // Base WIP by stage
    if (stage === 'Assessment') return 0;
    if (stage === 'Concept') return 10;
    if (stage === 'D&E') return 25;
    if (stage === 'Permitting') return 40;
    if (stage === 'Complete') return 100;
    if (stage === 'Logistics') return 95;
    
    // Production stage - use MFG Week or MFG Status
    if (stage === 'Production') {
      if (mfgWeek > 0) {
        return 50 + Math.min(45, Math.round(mfgWeek * 3.75)); // 50% at start, up to 95%
      }
      if (mfgStatus && MFG_STATUS_TO_WEEK[mfgStatus]) {
        const estimatedWeek = MFG_STATUS_TO_WEEK[mfgStatus];
        return 50 + Math.min(45, Math.round(estimatedWeek * 3.75));
      }
      return 50; // Default for Production with no details
    }
    
    return 0;
  };

  const buildWipData = (projects) => {
    return projects
      .filter(p => ['Production', 'Logistics', 'D&E', 'Permitting'].includes(p.Stage))
      .map(p => {
        const currentWip = calculateWipFromProject(p);
        const currentMonth = new Date().getMonth(); // 0 = Jan
        
        // Generate WIP schedule
        const wip = {};
        WIP_MONTHS.forEach((m, idx) => {
          if (idx === 0) {
            // Dec baseline - estimate prior month
            wip[m.key] = currentWip > 10 ? Math.max(0, currentWip - 15) : null;
          } else {
            const monthIndex = idx - 1; // 0 = Jan
            if (monthIndex < currentMonth) {
              // Past months - show progression to current
              const monthsAgo = currentMonth - monthIndex;
              wip[m.key] = Math.max(0, currentWip - (monthsAgo * 8));
            } else if (monthIndex === currentMonth) {
              // Current month
              wip[m.key] = currentWip;
            } else {
              // Future months - project forward
              const monthsAhead = monthIndex - currentMonth;
              wip[m.key] = Math.min(100, currentWip + (monthsAhead * 8));
            }
          }
        });
        
        return {
          id: p['Project ID'],
          customer: p['Status'] || p['Customer (text)'] || '',
          unit: p['Model'] || p['Unit Type'] || '',
          contract: p['Contract Value'] || 0,
          budget: p['MFG Budget'] || Math.round((p['Contract Value'] || 0) * 0.7),
          wip,
          airtableId: p.id
        };
      });
  };

  const [wipData, setWipData] = useState(() => buildWipData(projects));
  const [editingCell, setEditingCell] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    setWipData(prev => {
      const newData = buildWipData(projects);
      // Preserve manual edits
      return newData.map(nd => {
        const existing = prev.find(p => p.airtableId === nd.airtableId);
        if (existing) {
          return { ...nd, wip: existing.wip };
        }
        return nd;
      });
    });
  }, [projects]);

  const units = [...new Set(wipData.map(p => p.unit).filter(Boolean))].sort();
  
  const summary = useMemo(() => {
    const activeProjects = wipData.filter(p => {
      const latestWip = Object.values(p.wip).filter(v => v !== null).pop() || 0;
      return showCompleted || latestWip < 100;
    });
    const totalContract = activeProjects.reduce((sum, p) => sum + p.contract, 0);
    const totalBudget = activeProjects.reduce((sum, p) => sum + p.budget, 0);
    const currentMonthKey = WIP_MONTHS[new Date().getMonth() + 1]?.key || 'jan';
    const recognizedRevenue = activeProjects.reduce((sum, p) => sum + (p.contract * (p.wip[currentMonthKey] || 0) / 100), 0);
    const revenueByMonth = WIP_MONTHS.reduce((acc, month, idx) => {
      acc[month.key] = activeProjects.reduce((sum, p) => {
        const wipPercent = p.wip[month.key] || 0;
        const prevMonth = WIP_MONTHS[idx - 1];
        const prevWipPercent = prevMonth ? (p.wip[prevMonth.key] || 0) : 0;
        return sum + (p.contract * Math.max(0, wipPercent - prevWipPercent) / 100);
      }, 0);
      return acc;
    }, {});
    return {
      projectCount: activeProjects.length,
      totalContract,
      totalBudget,
      recognizedRevenue,
      revenueByMonth,
      projectedMargin: totalContract - totalBudget,
      marginPercent: totalContract > 0 ? ((totalContract - totalBudget) / totalContract * 100).toFixed(1) : '0'
    };
  }, [wipData, showCompleted]);

  const filteredData = useMemo(() => {
    let result = wipData.filter(p => {
      if (searchTerm && !p.id.toLowerCase().includes(searchTerm.toLowerCase()) && !p.customer.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (unitFilter !== 'all' && p.unit !== unitFilter) return false;
      if (!showCompleted) {
        const latestWip = Object.values(p.wip).filter(v => v !== null).pop() || 0;
        if (latestWip === 100) return false;
      }
      return true;
    });
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = ['contract', 'budget'].includes(sortConfig.key) ? a[sortConfig.key] : ['customer', 'id', 'unit'].includes(sortConfig.key) ? a[sortConfig.key] : a.wip[sortConfig.key] || 0;
        let bVal = ['contract', 'budget'].includes(sortConfig.key) ? b[sortConfig.key] : ['customer', 'id', 'unit'].includes(sortConfig.key) ? b[sortConfig.key] : b.wip[sortConfig.key] || 0;
        return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * (sortConfig.direction === 'asc' ? 1 : -1);
      });
    }
    return result;
  }, [wipData, searchTerm, unitFilter, showCompleted, sortConfig]);

  const handleSort = (key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  const handleWipUpdate = (projectId, month, value) => {
    setWipData(prev => prev.map(p => p.id === projectId ? { ...p, wip: { ...p.wip, [month]: value } } : p));
    setEditingCell(null);
  };
  
  const handleExport = () => {
    const headers = ['Job #', 'Customer', 'Unit', 'Contract', 'Budget', ...WIP_MONTHS.map(m => m.label)];
    const rows = filteredData.map(p => [p.id, p.customer, p.unit, p.contract, p.budget, ...WIP_MONTHS.map(m => p.wip[m.key] !== null ? `${p.wip[m.key]}%` : '')]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WIP_Schedule_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  
  const SortIndicator = ({ columnKey }) => sortConfig.key !== columnKey ? null : <ChevronDown className={`w-3 h-3 inline ml-1 ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="inline-block w-3 h-3 bg-amber-200 rounded mr-1"></span> Dec 31 Baseline
          <span className="mx-2">|</span>
          <span className="inline-block w-3 h-3 bg-emerald-200 rounded mr-1"></span> 100% Complete
          <span className="mx-2">|</span>
          Click any cell to edit WIP %
          <span className="mx-2">|</span>
          <span className="text-blue-600 font-medium">Data from Airtable</span>
        </p>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
          <Download className="w-4 h-4" />Export CSV
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border p-4 bg-gray-50">
          <div className="text-sm text-gray-600 mb-1">Active Projects</div>
          <div className="text-2xl font-bold">{summary.projectCount}</div>
        </div>
        <div className="rounded-xl border p-4 bg-blue-50 border-blue-200">
          <div className="text-sm text-gray-600 mb-1">Total Contract Value</div>
          <div className="text-2xl font-bold">${formatCompact(summary.totalContract)}</div>
          <div className="text-sm text-gray-500 mt-1">Budget: ${formatCompact(summary.totalBudget)}</div>
        </div>
        <div className="rounded-xl border p-4 bg-emerald-50 border-emerald-200">
          <div className="text-sm text-gray-600 mb-1">Recognized Revenue</div>
          <div className="text-2xl font-bold text-emerald-700">${formatCompact(summary.recognizedRevenue)}</div>
          <div className="text-sm text-gray-500 mt-1">{summary.totalContract > 0 ? Math.round(summary.recognizedRevenue / summary.totalContract * 100) : 0}% of contract</div>
        </div>
        <div className="rounded-xl border p-4 bg-amber-50 border-amber-200">
          <div className="text-sm text-gray-600 mb-1">Projected Margin</div>
          <div className="text-2xl font-bold text-amber-700">${formatCompact(summary.projectedMargin)}</div>
          <div className="text-sm text-gray-500 mt-1">{summary.marginPercent}% margin</div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border p-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search job # or customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} className="text-sm border rounded-lg px-3 py-2">
            <option value="all">All Models</option>
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} className="rounded border-gray-300 text-blue-500" />
          Show completed
        </label>
        <div className="flex-1" />
        <div className="text-sm text-gray-500">Showing {filteredData.length} of {wipData.length} projects</div>
      </div>
      
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 sticky left-0 bg-gray-50 z-10" onClick={() => handleSort('id')}>Job # <SortIndicator columnKey="id" /></th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('customer')}>Customer <SortIndicator columnKey="customer" /></th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('unit')}>Model <SortIndicator columnKey="unit" /></th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('contract')}>Contract <SortIndicator columnKey="contract" /></th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('budget')}>Budget <SortIndicator columnKey="budget" /></th>
                {WIP_MONTHS.map(m => (
                  <th key={m.key} className={`text-center py-3 px-2 text-xs font-semibold uppercase cursor-pointer hover:bg-gray-100 ${m.isBaseline ? 'bg-amber-50 text-amber-700' : 'text-gray-600'}`} onClick={() => handleSort(m.key)}>
                    {m.label} <SortIndicator columnKey={m.key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map(p => (
                <tr key={p.id} className={`border-b border-gray-100 ${(Object.values(p.wip).filter(v => v !== null).pop() || 0) === 100 ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}>
                  <td className="py-2 px-4 font-medium text-gray-900 sticky left-0 bg-white z-10">{p.id}</td>
                  <td className="py-2 px-4 text-gray-700">{p.customer}</td>
                  <td className="py-2 px-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">{p.unit || '—'}</span></td>
                  <td className="py-2 px-3 text-right text-sm text-gray-900">${formatCompact(p.contract)}</td>
                  <td className="py-2 px-3 text-right text-sm text-gray-600">${formatCompact(p.budget)}</td>
                  {WIP_MONTHS.map(m => (
                    <td key={m.key} className={`py-2 px-2 text-center ${m.isBaseline ? 'bg-amber-50/50' : ''}`}>
                      <WipCell
                        value={p.wip[m.key]}
                        isBaseline={m.isBaseline}
                        isEditing={editingCell?.id === p.id && editingCell?.month === m.key}
                        onStartEdit={() => setEditingCell({ id: p.id, month: m.key })}
                        onChange={(v) => handleWipUpdate(p.id, m.key, v)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr>
                <td colSpan={3} className="py-3 px-4 font-semibold text-gray-900 sticky left-0 bg-gray-100 z-10">TOTALS ({filteredData.length} projects)</td>
                <td className="py-3 px-3 text-right font-semibold text-gray-900">${formatCompact(filteredData.reduce((s, p) => s + p.contract, 0))}</td>
                <td className="py-3 px-3 text-right font-semibold text-gray-700">${formatCompact(filteredData.reduce((s, p) => s + p.budget, 0))}</td>
                {WIP_MONTHS.map(m => (
                  <td key={m.key} className={`py-3 px-2 text-center text-sm font-semibold text-gray-700 ${m.isBaseline ? 'bg-amber-100' : ''}`}>
                    ${formatCompact(filteredData.reduce((s, p) => s + (p.contract * (p.wip[m.key] || 0) / 100), 0))}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Monthly Revenue Recognition</h3>
        <div className="flex items-end gap-2 h-32">
          {WIP_MONTHS.slice(1).map(m => {
            const rev = summary.revenueByMonth[m.key] || 0;
            const max = Math.max(...Object.values(summary.revenueByMonth), 1);
            const h = max > 0 ? (rev / max) * 100 : 0;
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-end h-24">
                  <div className="text-xs text-gray-500 mb-1">{rev > 0 ? `$${formatCompact(rev)}` : ''}</div>
                  <div className="w-full bg-blue-500 rounded-t transition-all" style={{ height: `${h}%`, minHeight: rev > 0 ? '4px' : '0' }} />
                </div>
                <div className="text-xs text-gray-500 mt-2">{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// JOB SCHEDULE VIEW
// ══════════════════════════════════════════════════════════════════════════════
function JobScheduleView({ projects, onEdit }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (filter !== 'all') {
      result = result.filter(p => p.Stage === filter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p['Project ID']?.toLowerCase().includes(term) ||
        p['Status']?.toLowerCase().includes(term) ||
        p['Customer (text)']?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [projects, filter, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Jobs</p>
            <p className="text-2xl font-bold">{projects.length}</p>
          </div>
          <Calendar className="w-10 h-10 text-blue-500" />
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500">In Production</p>
            <p className="text-2xl font-bold text-emerald-600">{projects.filter(p => p.Stage === 'Production').length}</p>
          </div>
          <Factory className="w-10 h-10 text-emerald-500" />
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500">In D&E</p>
            <p className="text-2xl font-bold text-blue-600">{projects.filter(p => p.Stage === 'D&E').length}</p>
          </div>
          <FileText className="w-10 h-10 text-blue-500" />
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500">In Concept</p>
            <p className="text-2xl font-bold text-purple-600">{projects.filter(p => p.Stage === 'Concept').length}</p>
          </div>
          <Home className="w-10 h-10 text-purple-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between gap-4 flex-wrap">
          <span className="font-semibold">Job Schedule</span>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 border rounded-lg text-sm w-48"
              />
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm">
              <option value="all">All Stages</option>
              <option value="Concept">Concept</option>
              <option value="D&E">D&E</option>
              <option value="Permitting">Permitting</option>
              <option value="Production">Production</option>
              <option value="Logistics">Logistics</option>
            </select>
          </div>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PM</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProjects.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(p)}>
                <td className="px-6 py-4 font-medium">{p['Project ID']}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{p['Status'] || p['Customer (text)'] || '—'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{p['Model'] || p['Unit Type'] || '—'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    p.Stage === 'Production' ? 'bg-emerald-100 text-emerald-800' :
                    p.Stage === 'D&E' ? 'bg-blue-100 text-blue-800' :
                    p.Stage === 'Concept' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>{p.Stage}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{p['Site State/Province'] || p['Market'] || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{p['Project Manager'] || '—'}</td>
                <td className="px-6 py-4 text-right font-medium">{formatCurrency(p['Contract Value'])}</td>
              </tr>
            ))}
            {!filteredProjects.length && (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No projects found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MANUFACTURING FLOOR VIEW - Visual Plant Layout (18 positions)
// ══════════════════════════════════════════════════════════════════════════════
function ManufacturingFloorView({ projects, onEdit }) {
  const productionProjects = useMemo(() =>
    projects.filter(p => p.Stage === 'Production' || p.Stage === 'Logistics'),
    [projects]
  );

  const getPositionProject = (positionId) => {
    return productionProjects.find(p => {
      const assignment = p['Bay Assignment'] || '';
      return assignment === positionId || assignment.toUpperCase() === positionId;
    });
  };

  const occupiedIndoor = INDOOR_POSITIONS.filter(p => getPositionProject(p)).length;
  const occupiedOutdoor = OUTDOOR_POSITIONS.filter(p => getPositionProject(p)).length;
  const unassigned = productionProjects.filter(p => !p['Bay Assignment']).length;

  const PositionCard = ({ positionId, size = 'normal' }) => {
    const position = PLANT_POSITIONS[positionId];
    const project = getPositionProject(positionId);
    const isSmall = size === 'small';

    return (
      <div
        className={`rounded-lg border-2 transition-all ${project ? 'cursor-pointer hover:shadow-lg' : ''} ${isSmall ? 'p-2' : 'p-3'}`}
        style={{ borderColor: project ? position.color : '#E5E7EB', backgroundColor: project ? `${position.color}10` : '#FAFAFA' }}
        onClick={() => project && onEdit(project)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`font-bold ${isSmall ? 'text-xs' : 'text-sm'}`} style={{ color: position.color }}>{positionId}</span>
          <span className={`text-gray-400 ${isSmall ? 'text-[10px]' : 'text-xs'}`}>{position.zone}</span>
        </div>
        {project ? (
          <div className={isSmall ? 'space-y-0.5' : 'space-y-1'}>
            <div className={`font-semibold text-gray-900 ${isSmall ? 'text-xs' : 'text-sm'}`}>{project['Project ID']}</div>
            <div className={`text-gray-500 truncate ${isSmall ? 'text-[10px]' : 'text-xs'}`}>{project['Status'] || ''}</div>
            <div className="flex items-center justify-between">
              <span className={`px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded ${isSmall ? 'text-[10px]' : 'text-xs'}`}>{project['Model'] || '—'}</span>
              {project['MFG Week'] && <span className={`text-gray-400 ${isSmall ? 'text-[10px]' : 'text-xs'}`}>W{project['MFG Week']}</span>}
            </div>
            {!isSmall && project['MFG Week'] && (
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(parseInt(project['MFG Week']) / 12) * 100}%`, backgroundColor: position.color }} />
              </div>
            )}
          </div>
        ) : (
          <div className={`text-center text-gray-400 ${isSmall ? 'py-2 text-xs' : 'py-4'}`}>
            <Package className={`mx-auto mb-1 ${isSmall ? 'w-4 h-4' : 'w-6 h-6'}`} />
            <span className={isSmall ? 'text-[10px]' : 'text-xs'}>Available</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Honomobo Manufacturing</h2>
          <p className="text-sm text-gray-500">3925 8 St, Nisku, AB • 51,255 sq ft • <span className="text-blue-600 font-medium">Live from Airtable</span></p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">In Production</div><div className="text-3xl font-bold">{productionProjects.length}</div></div>
        <div className="bg-blue-50 border-blue-200 rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">Indoor</div><div className="text-3xl font-bold text-blue-600">{occupiedIndoor}<span className="text-lg text-gray-400">/12</span></div></div>
        <div className="bg-purple-50 border-purple-200 rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">Outdoor</div><div className="text-3xl font-bold text-purple-600">{occupiedOutdoor}<span className="text-lg text-gray-400">/6</span></div></div>
        <div className="bg-emerald-50 border-emerald-200 rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">Available</div><div className="text-3xl font-bold text-emerald-600">{18 - occupiedIndoor - occupiedOutdoor}</div></div>
        <div className={`rounded-xl border p-4 ${unassigned > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}><div className="text-sm text-gray-500 mb-1">Unassigned</div><div className={`text-3xl font-bold ${unassigned > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{unassigned}</div></div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Plant Floor Layout</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor:'#6366F1'}} /><span>Pre-Fab</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor:'#3B82F6'}} /><span>Build</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor:'#F59E0B'}} /><span>Fabrication</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor:'#8B5CF6'}} /><span>Outdoor</span></div>
          </div>
        </div>

        <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="text-center text-xs text-gray-400 mb-3">← MAIN FLOOR (51,255 SQ.FT.) →</div>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center font-bold text-gray-700">BAY 1</div>
            <div className="text-center font-bold text-gray-700">BAY 2</div>
            <div className="text-center font-bold text-gray-700">BAY 3</div>
            <div className="text-center font-bold text-gray-700">BAY 4</div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-3"><PositionCard positionId="1N" /><PositionCard positionId="1C" /><PositionCard positionId="1S" /></div>
            <div className="space-y-3"><PositionCard positionId="2N" /><PositionCard positionId="2C" /><PositionCard positionId="2S" /></div>
            <div className="space-y-3"><PositionCard positionId="3N" /><PositionCard positionId="3C" /><PositionCard positionId="3S" /></div>
            <div className="space-y-3"><PositionCard positionId="4N" /><PositionCard positionId="4C" /><PositionCard positionId="4S" /></div>
          </div>
          <div className="flex justify-end mt-2 text-xs text-gray-400 gap-4 pr-4"><span>N = North</span><span>C = Center</span><span>S = South</span></div>
        </div>

        <div className="mt-4 border-2 border-dashed border-purple-300 rounded-lg p-4 bg-purple-50/30">
          <div className="text-xs text-purple-600 font-medium mb-3">OUTDOOR STAGING (6 positions)</div>
          <div className="grid grid-cols-6 gap-3">
            <PositionCard positionId="OW" size="small" />
            <PositionCard positionId="OE" size="small" />
            <PositionCard positionId="OF1" size="small" />
            <PositionCard positionId="OF2" size="small" />
            <PositionCard positionId="OF3" size="small" />
            <PositionCard positionId="OF4" size="small" />
          </div>
        </div>
      </div>

      {unassigned > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2"><AlertCircle className="w-5 h-5" />Unassigned ({unassigned})</h3>
          <div className="grid grid-cols-6 gap-3">
            {productionProjects.filter(p => !p['Bay Assignment']).map(p => (
              <div key={p.id} className="bg-white rounded-lg p-3 border border-amber-200 cursor-pointer hover:shadow-md" onClick={() => onEdit(p)}>
                <div className="font-semibold text-sm">{p['Project ID']}</div>
                <div className="text-xs text-gray-500">{p['Model'] || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTION SCHEDULER - 18-Position Gantt Chart
// ══════════════════════════════════════════════════════════════════════════════
const SCHED_WEEKS_TO_SHOW = 20;
const SCHED_MFG_DURATION = 12;
const SCHED_MARKETS = {
  california: { name: 'California', icon: '🌴', color: '#F59E0B' },
  hawaii: { name: 'Hawaii', icon: '🏝️', color: '#06B6D4' },
  colorado: { name: 'Colorado', icon: '🏔️', color: '#8B5CF6' },
  alberta: { name: 'Alberta', icon: '🍁', color: '#EF4444' },
  ontario: { name: 'Ontario', icon: '🍁', color: '#EC4899' },
  bc: { name: 'BC', icon: '🌲', color: '#10B981' },
  other: { name: 'Other', icon: '📍', color: '#6B7280' },
};

const getSchedWeekLabel = (weekOffset) => { const d = new Date(); d.setDate(d.getDate() + (weekOffset * 7)); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
const getSchedWeekNum = (weekOffset) => { const d = new Date(); const startOfYear = new Date(d.getFullYear(), 0, 1); d.setDate(d.getDate() + (weekOffset * 7)); return Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7); };

function ProductionSchedulerView({ projects }) {
  const [viewOffset, setViewOffset] = useState(0);
  const [zoneFilter, setZoneFilter] = useState('all');

  const jobs = useMemo(() => {
    return projects
      .filter(p => p.Stage === 'Production' || p.Stage === 'Logistics')
      .map(p => {
        const stateCode = p['Site State/Province'] || p['Market'] || '';
        const market = MARKET_MAP[stateCode] || 'other';
        const position = p['Bay Assignment'] || null;
        const mfgWeek = parseInt(p['MFG Week']) || 0;
        let startWeek = null, status = 'queued';
        if (position) {
          if (mfgWeek > 0) { startWeek = -mfgWeek; status = mfgWeek < 12 ? 'in_progress' : 'complete'; }
          else { startWeek = 0; status = 'scheduled'; }
        }
        return { id: p['Project ID'], name: p['Status'] || '', model: p['Model'] || '', market, position, startWeek, status, mfgWeek, airtableId: p.id };
      });
  }, [projects]);

  const weeks = useMemo(() => Array.from({ length: SCHED_WEEKS_TO_SHOW }, (_, i) => i + viewOffset - 6), [viewOffset]);
  
  const getFilteredPositions = () => {
    if (zoneFilter === 'indoor') return INDOOR_POSITIONS;
    if (zoneFilter === 'outdoor') return OUTDOOR_POSITIONS;
    if (zoneFilter === 'fab') return ['4N', '4C', '4S'];
    if (zoneFilter === 'build') return ['1N', '1C', '1S', '2N', '2C', '2S', '3N', '3C', '3S'];
    return POSITION_IDS;
  };
  const positions = getFilteredPositions();
  const queuedJobs = jobs.filter(j => j.status === 'queued');

  const stats = useMemo(() => ({
    inProgress: jobs.filter(j => j.status === 'in_progress').length,
    scheduled: jobs.filter(j => j.status === 'scheduled').length,
    queued: queuedJobs.length,
    indoorUsed: INDOOR_POSITIONS.filter(p => jobs.some(j => j.position === p)).length,
    outdoorUsed: OUTDOOR_POSITIONS.filter(p => jobs.some(j => j.position === p)).length,
  }), [jobs, queuedJobs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Production Scheduler</h2>
          <p className="text-sm text-gray-500">18 positions • 12-week builds • <span className="text-blue-600 font-medium">Live from Airtable</span></p>
        </div>
        <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All Positions (18)</option>
          <option value="indoor">Indoor Only (12)</option>
          <option value="outdoor">Outdoor Only (6)</option>
          <option value="fab">Fabrication (3)</option>
          <option value="build">Build (9)</option>
        </select>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">In Progress</div><div className="text-3xl font-bold">{stats.inProgress}</div></div>
        <div className="bg-blue-50 border-blue-200 rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">Scheduled</div><div className="text-3xl font-bold text-blue-600">{stats.scheduled}</div></div>
        <div className="bg-amber-50 border-amber-200 rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">In Queue</div><div className="text-3xl font-bold text-amber-600">{stats.queued}</div></div>
        <div className="bg-emerald-50 border-emerald-200 rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">Indoor</div><div className="text-3xl font-bold text-emerald-600">{stats.indoorUsed}<span className="text-lg text-gray-400">/12</span></div></div>
        <div className="bg-purple-50 border-purple-200 rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">Outdoor</div><div className="text-3xl font-bold text-purple-600">{stats.outdoorUsed}<span className="text-lg text-gray-400">/6</span></div></div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex items-center border-b bg-gray-50">
          <div className="w-28 flex-shrink-0 p-3 border-r flex items-center justify-between">
            <button onClick={() => setViewOffset(v => v - 4)} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs text-gray-500">Position</span>
            <button onClick={() => setViewOffset(v => v + 4)} className="p-1 hover:bg-gray-200 rounded"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 flex">
            {weeks.map((w, i) => (
              <div key={i} className={`flex-1 text-center py-2 text-xs border-r border-gray-100 ${w === 0 ? 'bg-blue-100 font-semibold text-blue-900' : 'text-gray-500'}`}>
                <div>{getSchedWeekLabel(w)}</div>
                <div className="text-[10px] text-gray-400">W{getSchedWeekNum(w)}</div>
              </div>
            ))}
          </div>
        </div>

        {positions.map(posId => {
          const pos = PLANT_POSITIONS[posId];
          const positionJobs = jobs.filter(j => j.position === posId && j.startWeek !== null);
          const isOutdoor = pos.bay === 0;

          return (
            <div key={posId} className={`flex items-stretch border-b border-gray-100 ${isOutdoor ? 'bg-purple-50/30' : ''}`}>
              <div className="w-28 flex-shrink-0 p-2 bg-gray-50 border-r flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pos.color }} />
                <div><span className="font-medium text-sm">{posId}</span><div className="text-[10px] text-gray-400">{pos.zone}</div></div>
              </div>
              <div className="flex-1 flex relative min-h-[50px]">
                {weeks.map((w, i) => <div key={i} className={`flex-1 border-r border-gray-100 ${w === 0 ? 'bg-blue-50/50' : ''}`} />)}
                {positionJobs.map(job => {
                  const idx = weeks.findIndex(w => w === job.startWeek);
                  if (idx === -1) return null;
                  const left = (idx / weeks.length) * 100;
                  const duration = isOutdoor ? 4 : SCHED_MFG_DURATION;
                  const width = (duration / weeks.length) * 100;
                  const progress = job.mfgWeek / 12;
                  const market = SCHED_MARKETS[job.market] || SCHED_MARKETS.other;
                  return (
                    <div key={job.id} className="absolute top-1 bottom-1 rounded-md overflow-hidden shadow-sm border cursor-pointer hover:shadow-md" style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%`, backgroundColor: `${pos.color}15`, borderColor: pos.color }}>
                      <div className="absolute inset-y-0 left-0 opacity-30" style={{ width: `${progress * 100}%`, backgroundColor: pos.color }} />
                      <div className="relative px-2 py-1 flex items-center justify-between h-full">
                        <div className="flex items-center gap-1 min-w-0"><span className="font-semibold text-gray-900 text-xs truncate">{job.id}</span><span className="text-[10px]">{market.icon}</span></div>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">{job.model}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {queuedJobs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2"><Package className="w-5 h-5" />Queue ({queuedJobs.length})</h3>
          <div className="grid grid-cols-6 gap-3">
            {queuedJobs.map(job => {
              const market = SCHED_MARKETS[job.market] || SCHED_MARKETS.other;
              return (
                <div key={job.id} className="bg-white rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center justify-between mb-1"><span className="font-semibold text-sm">{job.id}</span><span>{market.icon}</span></div>
                  <div className="text-xs text-gray-500 truncate">{job.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{job.model}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTION BOARD VIEW
// ══════════════════════════════════════════════════════════════════════════════
const PROD_STAGES = [
  { id: 'fabrication', name: 'Fabrication', color: '#3B82F6' },
  { id: 'rough_in', name: 'Rough-In', color: '#F59E0B' },
  { id: 'finishing', name: 'Finishing', color: '#8B5CF6' },
  { id: 'final', name: 'Final QC', color: '#10B981' },
  { id: 'ready', name: 'Ready to Ship', color: '#06B6D4' }
];

function ProductionBoardView({ projects, onEdit }) {
  const productionProjects = useMemo(() =>
    projects.filter(p => p.Stage === 'Production').map(p => ({
      ...p,
      boardStage: MFG_STATUS_TO_STAGE[p['MFG Status']] || 'fabrication'
    })),
    [projects]
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500"><span className="text-blue-600 font-medium">Data from Airtable</span> • Columns based on MFG Status</p>
      <div className="grid grid-cols-5 gap-4">
        {PROD_STAGES.map(stage => {
          const stageProjects = productionProjects.filter(p => p.boardStage === stage.id);
          return (
            <div key={stage.id} className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ backgroundColor: `${stage.color}15` }}>
                <span className="font-semibold text-gray-900">{stage.name}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: stage.color }}>{stageProjects.length}</span>
              </div>
              <div className="p-3 space-y-2 min-h-[300px] max-h-[500px] overflow-y-auto">
                {stageProjects.length === 0 ? <div className="text-center py-8 text-gray-400 text-sm">No projects</div> : stageProjects.map(p => (
                  <div key={p.id} onClick={() => onEdit(p)} className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow border border-gray-100">
                    <div className="font-semibold text-gray-900">{p['Project ID']}</div>
                    <div className="text-sm text-gray-500">{p['Status'] || ''}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">{p['Model'] || '—'}</span>
                      <span className="text-xs text-gray-400">{p['Bay Assignment'] || 'No Pos'}</span>
                    </div>
                    {p['MFG Week'] && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1"><span>W{p['MFG Week']}/12</span><span>{Math.round((parseInt(p['MFG Week']) / 12) * 100)}%</span></div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(parseInt(p['MFG Week']) / 12) * 100}%`, backgroundColor: stage.color }} /></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function BudgetView({ projects }) {
  const summary = useMemo(() => {
    const active = projects.filter(p => p.Stage !== 'Complete');
    const totalContract = active.reduce((s, p) => s + (p['Contract Value'] || 0), 0);
    const totalMfgBudget = active.reduce((s, p) => s + (p['MFG Budget'] || 0), 0);
    const totalGrossMargin = active.reduce((s, p) => s + (p['Gross Margin'] || 0), 0);
    const avgMargin = active.length > 0
      ? active.reduce((s, p) => s + (parseFloat(p['Margin %']) || 0), 0) / active.length
      : 0;

    return { totalContract, totalMfgBudget, totalGrossMargin, avgMargin, projectCount: active.length };
  }, [projects]);

  const byStage = useMemo(() => {
    const stages = ['Concept', 'D&E', 'Permitting', 'Production', 'Logistics'];
    return stages.map(stage => {
      const stageProjects = projects.filter(p => p.Stage === stage);
      return {
        stage,
        count: stageProjects.length,
        contract: stageProjects.reduce((s, p) => s + (p['Contract Value'] || 0), 0),
        budget: stageProjects.reduce((s, p) => s + (p['MFG Budget'] || 0), 0),
        margin: stageProjects.reduce((s, p) => s + (p['Gross Margin'] || 0), 0),
      };
    });
  }, [projects]);

  const byMarket = useMemo(() => {
    const markets = {};
    projects.filter(p => p.Stage !== 'Complete').forEach(p => {
      const market = p['Site State/Province'] || p['Market'] || 'Unknown';
      if (!markets[market]) markets[market] = { count: 0, contract: 0, budget: 0 };
      markets[market].count++;
      markets[market].contract += p['Contract Value'] || 0;
      markets[market].budget += p['MFG Budget'] || 0;
    });
    return Object.entries(markets).sort((a, b) => b[1].contract - a[1].contract);
  }, [projects]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        <span className="text-blue-600 font-medium">Data from Airtable</span> • Aggregated from Projects table
      </p>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-gray-500 mb-1">Total Contract Value</div>
          <div className="text-2xl font-bold">${formatCompact(summary.totalContract)}</div>
          <div className="text-sm text-gray-400 mt-1">{summary.projectCount} active projects</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-gray-500 mb-1">Total MFG Budget</div>
          <div className="text-2xl font-bold">${formatCompact(summary.totalMfgBudget)}</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-gray-500 mb-1">Total Gross Margin</div>
          <div className="text-2xl font-bold text-emerald-600">${formatCompact(summary.totalGrossMargin)}</div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-gray-500 mb-1">Avg Margin %</div>
          <div className="text-2xl font-bold">{summary.avgMargin.toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b font-semibold">By Stage</div>
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Count</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Contract</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {byStage.map(s => (
                <tr key={s.stage} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{s.stage}</td>
                  <td className="px-6 py-3 text-center">{s.count}</td>
                  <td className="px-6 py-3 text-right">${formatCompact(s.contract)}</td>
                  <td className="px-6 py-3 text-right text-gray-500">${formatCompact(s.budget)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <td className="px-6 py-3 font-semibold">Total</td>
                <td className="px-6 py-3 text-center font-semibold">{byStage.reduce((s, x) => s + x.count, 0)}</td>
                <td className="px-6 py-3 text-right font-semibold">${formatCompact(byStage.reduce((s, x) => s + x.contract, 0))}</td>
                <td className="px-6 py-3 text-right font-semibold">${formatCompact(byStage.reduce((s, x) => s + x.budget, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b font-semibold">By Market</div>
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Count</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Contract</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {byMarket.slice(0, 8).map(([market, data]) => (
                <tr key={market} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{market}</td>
                  <td className="px-6 py-3 text-center">{data.count}</td>
                  <td className="px-6 py-3 text-right">${formatCompact(data.contract)}</td>
                  <td className="px-6 py-3 text-right text-gray-500">${formatCompact(data.budget)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// P&L VIEW - Calculates from Real Airtable Data
// ══════════════════════════════════════════════════════════════════════════════
const plMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PLSectionHeader = ({ title, expanded, onToggle }) => (
  <tr className="bg-gray-100 cursor-pointer hover:bg-gray-200" onClick={onToggle}>
    <td colSpan={14} className="py-2 px-4 font-semibold text-gray-700">
      <div className="flex items-center gap-2">
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {title}
      </div>
    </td>
  </tr>
);

const PLRow = ({ label, values, ytd, isHeader, isTotal, isSubtotal, isInput, indent = 0 }) => {
  if (isHeader) {
    return (
      <tr className="bg-gray-50 border-b">
        <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50">{label}</th>
        {values.map((v, i) => <th key={i} className="py-2 px-2 text-center text-xs font-semibold text-gray-600 uppercase">{v}</th>)}
        <th className="py-2 px-3 text-center text-xs font-semibold text-gray-600 uppercase bg-gray-100">{ytd}</th>
      </tr>
    );
  }

  return (
    <tr className={`border-b ${isTotal ? 'bg-gray-50 font-semibold' : isSubtotal ? 'bg-gray-50/50' : ''}`}>
      <td className={`py-2 px-4 text-sm sticky left-0 bg-white ${isTotal ? 'font-semibold' : ''}`} style={{ paddingLeft: `${16 + indent * 16}px` }}>
        {isInput && <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mr-2"></span>}
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className={`py-2 px-2 text-center text-sm font-mono ${v < 0 ? 'text-red-600' : ''} ${isInput ? 'bg-amber-50' : ''}`}>
          {formatCompact(v)}
        </td>
      ))}
      <td className={`py-2 px-3 text-center text-sm font-mono font-semibold bg-gray-100 ${ytd < 0 ? 'text-red-600' : ''}`}>
        {formatCompact(ytd)}
      </td>
    </tr>
  );
};

const PLSummaryCard = ({ title, value, subtitle, icon: Icon, color = 'gray' }) => {
  const colors = {
    gray: 'bg-white border-gray-200',
    blue: 'bg-blue-50 border-blue-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
  };
  const iconColors = { gray: 'text-gray-400', blue: 'text-blue-500', emerald: 'text-emerald-500', amber: 'text-amber-500', red: 'text-red-500' };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-600 mb-1">{title}</div>
          <div className={`text-2xl font-bold ${value < 0 ? 'text-red-600' : 'text-gray-900'}`}>{formatCompact(value)}</div>
          {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
        </div>
        <Icon className={`w-5 h-5 ${iconColors[color]}`} />
      </div>
    </div>
  );
};

function PLView({ projects }) {
  // Calculate production revenue/costs from real project data
  const productionData = useMemo(() => {
    const prodProjects = projects.filter(p => p.Stage === 'Production' || p.Stage === 'Logistics');
    const deProjects = projects.filter(p => p.Stage === 'D&E');

    // Total values
    const totalProdContract = prodProjects.reduce((s, p) => s + (p['Contract Value'] || 0), 0);
    const totalProdBudget = prodProjects.reduce((s, p) => s + (p['MFG Budget'] || 0), 0);
    const totalDeContract = deProjects.reduce((s, p) => s + (p['Contract Value'] || 0), 0);

    // Distribute across months based on project count and progress
    const revenue = {};
    const costs = {};

    plMonths.forEach((month, idx) => {
      // Simple distribution - more revenue in current and upcoming months
      const currentMonth = new Date().getMonth();
      let weight;

      if (idx < currentMonth) {
        weight = 0.06; // Past months - some revenue recognized
      } else if (idx === currentMonth) {
        weight = 0.12; // Current month - higher
      } else if (idx < currentMonth + 3) {
        weight = 0.10; // Next few months
      } else {
        weight = 0.08; // Further out
      }

      revenue[month] = Math.round(totalProdContract * weight);
      costs[month] = Math.round(totalProdBudget * weight);
    });

    return { revenue, costs, totalProdContract, totalProdBudget, totalDeContract, prodCount: prodProjects.length, deCount: deProjects.length };
  }, [projects]);

  const [inputs, setInputs] = useState({
    deRevenue: 200000,
    liRevenue: 100000,
    deCosts: 140000,
    liCosts: 80000,
    mfgOverhead: 175000,
    corpOverhead: 175000,
    prodMarginSplitMfg: 0.5
  });

  const [expandedSections, setExpandedSections] = useState({
    revenue: true,
    cogs: true,
    grossProfit: true,
    marginSplit: false,
    overhead: false,
    netProfit: true
  });
  const [showInputs, setShowInputs] = useState(false);

  const toggleSection = (section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

  // Calculate all P&L values using real data
  const plData = useMemo(() => {
    const data = {};
    plMonths.forEach(month => {
      const prodRev = productionData.revenue[month] || 0;
      const prodCost = productionData.costs[month] || 0;
      const deRevenue = inputs.deRevenue;
      const liRevenue = inputs.liRevenue;
      const totalRevenue = deRevenue + prodRev + liRevenue;
      const deCosts = inputs.deCosts;
      const liCosts = inputs.liCosts;
      const totalCogs = deCosts + prodCost + liCosts;
      const deGP = deRevenue - deCosts;
      const prodGP = prodRev - prodCost;
      const liGP = liRevenue - liCosts;
      const totalGP = deGP + prodGP + liGP;
      const mfgMargin = prodGP * inputs.prodMarginSplitMfg;
      const corpMargin = (prodGP * (1 - inputs.prodMarginSplitMfg)) + deGP + liGP;
      const mfgOverhead = inputs.mfgOverhead;
      const corpOverhead = inputs.corpOverhead;
      const mfgNet = mfgMargin - mfgOverhead;
      const corpNet = corpMargin - corpOverhead;
      const totalNet = mfgNet + corpNet;

      data[month] = {
        deRevenue, prodRevenue: prodRev, liRevenue, totalRevenue,
        deCosts, prodCosts: prodCost, liCosts, totalCogs,
        deGP, prodGP, liGP, totalGP,
        mfgMargin, corpMargin, mfgOverhead, corpOverhead,
        mfgNet, corpNet, totalNet
      };
    });
    return data;
  }, [productionData, inputs]);

  // Calculate YTD totals
  const ytdTotals = useMemo(() => {
    const totals = {};
    const keys = Object.keys(plData[plMonths[0]] || {});
    keys.forEach(key => {
      totals[key] = plMonths.reduce((sum, month) => sum + (plData[month]?.[key] || 0), 0);
    });
    return totals;
  }, [plData]);

  const getMonthlyValues = (key) => plMonths.map(month => plData[month]?.[key] || 0);

  const handleExport = () => {
    const rows = [
      ['2026 MONTHLY P&L PROJECTION - FROM AIRTABLE DATA'],
      ['', ...plMonths, 'YTD'],
      [],
      ['REVENUE'],
      ['D&E Revenue', ...getMonthlyValues('deRevenue'), ytdTotals.deRevenue],
      ['Production Revenue', ...getMonthlyValues('prodRevenue'), ytdTotals.prodRevenue],
      ['L&I Revenue', ...getMonthlyValues('liRevenue'), ytdTotals.liRevenue],
      ['Total Revenue', ...getMonthlyValues('totalRevenue'), ytdTotals.totalRevenue],
      [],
      ['COST OF SALES'],
      ['D&E Costs', ...getMonthlyValues('deCosts'), ytdTotals.deCosts],
      ['Production Costs', ...getMonthlyValues('prodCosts'), ytdTotals.prodCosts],
      ['L&I Costs', ...getMonthlyValues('liCosts'), ytdTotals.liCosts],
      ['Total COGS', ...getMonthlyValues('totalCogs'), ytdTotals.totalCogs],
      [],
      ['GROSS PROFIT'],
      ['Total GP', ...getMonthlyValues('totalGP'), ytdTotals.totalGP],
      [],
      ['NET PROFIT'],
      ['MFG Net', ...getMonthlyValues('mfgNet'), ytdTotals.mfgNet],
      ['Corp Net', ...getMonthlyValues('corpNet'), ytdTotals.corpNet],
      ['Total Net', ...getMonthlyValues('totalNet'), ytdTotals.totalNet]
    ];
    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PL_Projection_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">2026 Monthly P&L Projection</h1>
          <p className="text-sm text-gray-500 mt-1">
            <span className="text-blue-600 font-medium">Production data from Airtable</span> •
            {productionData.prodCount} production projects, {productionData.deCount} D&E projects •
            <span className="inline-block w-3 h-3 bg-amber-200 rounded mx-1"></span> Yellow = Manual Input
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInputs(!showInputs)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${showInputs ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
          >
            <Settings className="w-4 h-4" />Inputs
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
            <Download className="w-4 h-4" />Export CSV
          </button>
        </div>
      </div>

      {showInputs && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-900 mb-4">Monthly Inputs (D&E, L&I, Overhead are manual - Production from Airtable)</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-amber-800 mb-1">D&E Revenue/mo</label>
              <input type="number" value={inputs.deRevenue} onChange={(e) => setInputs({ ...inputs, deRevenue: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-amber-800 mb-1">L&I Revenue/mo</label>
              <input type="number" value={inputs.liRevenue} onChange={(e) => setInputs({ ...inputs, liRevenue: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-amber-800 mb-1">D&E Costs/mo</label>
              <input type="number" value={inputs.deCosts} onChange={(e) => setInputs({ ...inputs, deCosts: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-amber-800 mb-1">L&I Costs/mo</label>
              <input type="number" value={inputs.liCosts} onChange={(e) => setInputs({ ...inputs, liCosts: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-amber-800 mb-1">MFG Overhead/mo</label>
              <input type="number" value={inputs.mfgOverhead} onChange={(e) => setInputs({ ...inputs, mfgOverhead: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-amber-800 mb-1">Corp Overhead/mo</label>
              <input type="number" value={inputs.corpOverhead} onChange={(e) => setInputs({ ...inputs, corpOverhead: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-amber-800 mb-1">Prod Margin to MFG %</label>
              <input type="number" min="0" max="100" value={inputs.prodMarginSplitMfg * 100} onChange={(e) => setInputs({ ...inputs, prodMarginSplitMfg: (parseInt(e.target.value) || 0) / 100 })} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-4">
        <PLSummaryCard title="YTD Revenue" value={ytdTotals.totalRevenue} icon={DollarSign} color="blue" />
        <PLSummaryCard title="YTD Gross Profit" value={ytdTotals.totalGP} subtitle={`${((ytdTotals.totalGP / ytdTotals.totalRevenue) * 100 || 0).toFixed(1)}% margin`} icon={TrendingUp} color="emerald" />
        <PLSummaryCard title="MFG Net Profit" value={ytdTotals.mfgNet} icon={Factory} color={ytdTotals.mfgNet >= 0 ? 'emerald' : 'red'} />
        <PLSummaryCard title="Corp Net Profit" value={ytdTotals.corpNet} icon={Building2} color={ytdTotals.corpNet >= 0 ? 'emerald' : 'red'} />
        <PLSummaryCard title="Total Net Profit" value={ytdTotals.totalNet} subtitle={`${((ytdTotals.totalNet / ytdTotals.totalRevenue) * 100 || 0).toFixed(1)}% net margin`} icon={DollarSign} color={ytdTotals.totalNet >= 0 ? 'amber' : 'red'} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <PLRow label="" values={plMonths} ytd="YTD" isHeader />
            </thead>
            <tbody>
              <PLSectionHeader title="REVENUE" expanded={expandedSections.revenue} onToggle={() => toggleSection('revenue')} />
              {expandedSections.revenue && (
                <>
                  <PLRow label="D&E Revenue" values={getMonthlyValues('deRevenue')} ytd={ytdTotals.deRevenue} isInput indent={1} />
                  <PLRow label="Production Revenue" values={getMonthlyValues('prodRevenue')} ytd={ytdTotals.prodRevenue} indent={1} />
                  <PLRow label="L&I Revenue" values={getMonthlyValues('liRevenue')} ytd={ytdTotals.liRevenue} isInput indent={1} />
                </>
              )}
              <PLRow label="Total Revenue" values={getMonthlyValues('totalRevenue')} ytd={ytdTotals.totalRevenue} isTotal />

              <PLSectionHeader title="COST OF SALES" expanded={expandedSections.cogs} onToggle={() => toggleSection('cogs')} />
              {expandedSections.cogs && (
                <>
                  <PLRow label="D&E Costs" values={getMonthlyValues('deCosts')} ytd={ytdTotals.deCosts} isInput indent={1} />
                  <PLRow label="Production Costs" values={getMonthlyValues('prodCosts')} ytd={ytdTotals.prodCosts} indent={1} />
                  <PLRow label="L&I Costs" values={getMonthlyValues('liCosts')} ytd={ytdTotals.liCosts} isInput indent={1} />
                </>
              )}
              <PLRow label="Total COGS" values={getMonthlyValues('totalCogs')} ytd={ytdTotals.totalCogs} isSubtotal />

              <PLSectionHeader title="GROSS PROFIT" expanded={expandedSections.grossProfit} onToggle={() => toggleSection('grossProfit')} />
              {expandedSections.grossProfit && (
                <>
                  <PLRow label="D&E GP → Corp" values={getMonthlyValues('deGP')} ytd={ytdTotals.deGP} indent={1} />
                  <PLRow label="Production GP" values={getMonthlyValues('prodGP')} ytd={ytdTotals.prodGP} indent={1} />
                  <PLRow label="L&I GP → Corp" values={getMonthlyValues('liGP')} ytd={ytdTotals.liGP} indent={1} />
                </>
              )}
              <PLRow label="Total Gross Profit" values={getMonthlyValues('totalGP')} ytd={ytdTotals.totalGP} isTotal />

              <PLSectionHeader title="NET PROFIT" expanded={expandedSections.netProfit} onToggle={() => toggleSection('netProfit')} />
              {expandedSections.netProfit && (
                <>
                  <PLRow label="MFG Net" values={getMonthlyValues('mfgNet')} ytd={ytdTotals.mfgNet} indent={1} />
                  <PLRow label="Corp Net" values={getMonthlyValues('corpNet')} ytd={ytdTotals.corpNet} indent={1} />
                </>
              )}
              <PLRow label="Total Net Profit" values={getMonthlyValues('totalNet')} ytd={ytdTotals.totalNet} isTotal />
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Monthly Net Profit</h3>
        <div className="flex items-end gap-2 h-40">
          {plMonths.map(month => {
            const net = plData[month]?.totalNet || 0;
            const maxNet = Math.max(...plMonths.map(m => Math.abs(plData[m]?.totalNet || 0)), 1);
            const h = (Math.abs(net) / maxNet) * 100;
            const isNegative = net < 0;
            return (
              <div key={month} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="text-xs text-gray-500 mb-1">{net !== 0 ? `$${formatCompact(net)}` : ''}</div>
                <div
                  className={`w-full rounded-t transition-all ${isNegative ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ height: `${h}%`, minHeight: net !== 0 ? '4px' : '0' }}
                />
                <div className="text-xs text-gray-500 mt-2">{month}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// END OF PART 2
// Continue in Part 3 with Drawings, Deviations, Sage Import, Customer Portal, and Main App

// CUSTOMER PORTAL VIEW - Uses Real Airtable Data
// ══════════════════════════════════════════════════════════════════════════════
const PORTAL_STAGES = [
  { id: 'contract', name: 'Contract', icon: FileText },
  { id: 'design', name: 'Design', icon: Home },
  { id: 'permitting', name: 'Permitting', icon: Shield },
  { id: 'manufacturing', name: 'Manufacturing', icon: Building2 },
  { id: 'delivery', name: 'Delivery', icon: Truck },
  { id: 'complete', name: 'Complete', icon: PackageCheck },
];

const STAGE_TO_PORTAL = {
  'Contract': 'contract', 'Concept': 'design', 'D&E': 'design',
  'Permitting': 'permitting', 'Production': 'manufacturing',
  'Logistics': 'delivery', 'Complete': 'complete',
};

function CustomerPortalView({ projects, documents, payments }) {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const portalProjects = useMemo(() =>
    projects.filter(p => ['D&E', 'Permitting', 'Production', 'Logistics'].includes(p.Stage)),
    [projects]
  );

  const selectedProject = selectedProjectId
    ? projects.find(p => p.id === selectedProjectId)
    : portalProjects[0];

  const projectPayments = useMemo(() => {
    if (!selectedProject || !payments) return [];
    return payments.filter(p =>
      p['Project ID'] === selectedProject['Project ID'] ||
      p['Project']?.includes(selectedProject.id)
    );
  }, [payments, selectedProject]);

  const projectDocuments = useMemo(() => {
    if (!selectedProject || !documents) return [];
    return documents.filter(d =>
      d['Project ID'] === selectedProject['Project ID'] ||
      d['Project']?.includes(selectedProject.id)
    );
  }, [documents, selectedProject]);

  if (!selectedProject) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Home className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No projects available for customer portal</p>
      </div>
    );
  }

  const portalStage = STAGE_TO_PORTAL[selectedProject.Stage] || 'design';
  const currentStageIndex = PORTAL_STAGES.findIndex(s => s.id === portalStage);
  const customerName = selectedProject['Status'] || selectedProject['Customer (text)'] || 'Customer';

  return (
    <div className="min-h-screen bg-gray-50 -m-6 -mt-4">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900">Honomobo</div>
                <div className="text-xs text-gray-500">Customer Portal</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select value={selectedProjectId || selectedProject?.id || ''} onChange={e => setSelectedProjectId(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
                {portalProjects.map(p => <option key={p.id} value={p.id}>{p['Project ID']}</option>)}
              </select>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">Welcome, {customerName}</div>
                <div className="text-xs text-gray-500">Project {selectedProject['Project ID']}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-slate-400 text-sm mb-1">Your Home</div>
              <h1 className="text-3xl font-bold mb-2">{selectedProject['Model'] || selectedProject['Unit Type'] || 'Honomobo Home'}</h1>
              <div className="flex items-center gap-4 text-slate-300 text-sm">
                <span>{selectedProject['Site State/Province'] || '—'}</span>
                <span>•</span>
                <span>{formatCurrency(selectedProject['Contract Value'])}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
              <Calendar className="w-8 h-8 text-emerald-400" />
              <div>
                <div className="text-slate-400 text-xs">Current Stage</div>
                <div className="text-xl font-semibold">{selectedProject.Stage}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {PORTAL_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isComplete = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <React.Fragment key={stage.id}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isComplete ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-slate-900 text-white ring-4 ring-slate-200' : 'bg-gray-200 text-gray-400'}`}>
                      {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${isCurrent ? 'text-slate-900' : 'text-gray-500'}`}>{stage.name}</span>
                  </div>
                  {idx < PORTAL_STAGES.length - 1 && <div className={`flex-1 h-1 mx-2 rounded ${idx < currentStageIndex ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1">
            {[{ id: 'overview', label: 'Overview' }, { id: 'documents', label: 'Documents', badge: projectDocuments.length }, { id: 'payments', label: 'Payments', badge: projectPayments.length }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab.id ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.label}
                {tab.badge > 0 && <span className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">{tab.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4">Project Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-500">Project ID</span><span className="font-medium">{selectedProject['Project ID']}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Model</span><span>{selectedProject['Model'] || selectedProject['Unit Type'] || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Location</span><span>{selectedProject['Site State/Province'] || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Stage</span><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-sm">{selectedProject.Stage}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Project Manager</span><span>{selectedProject['Project Manager'] || '—'}</span></div>
              </div>
            </div>
            {selectedProject.Stage === 'Production' && (
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold mb-4">Manufacturing Progress</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-gray-500">Bay</span><span>{selectedProject['Bay Assignment'] || 'Not assigned'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Week</span><span>{selectedProject['MFG Week'] || '—'} / 12</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Status</span><span>{selectedProject['MFG Status'] || '—'}</span></div>
                </div>
                {selectedProject['MFG Week'] && (
                  <div className="mt-4">
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(parseInt(selectedProject['MFG Week']) / 12) * 100}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-gray-500 text-right">{Math.round((parseInt(selectedProject['MFG Week']) / 12) * 100)}% complete</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b font-semibold">Documents ({projectDocuments.length})</div>
            {projectDocuments.length > 0 ? (
              <div className="divide-y">
                {projectDocuments.map(doc => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium">{doc['Name'] || doc['Document Name'] || 'Document'}</div>
                        <div className="text-sm text-gray-500">{doc['Type'] || ''} • {doc['Status'] || 'Draft'}</div>
                      </div>
                    </div>
                    {doc['URL'] && <a href={doc['URL']} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Download className="w-4 h-4" /></a>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No documents available yet</div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b font-semibold">Payment Schedule ({projectPayments.length})</div>
            {projectPayments.length > 0 ? (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Milestone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {projectPayments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{p['Name'] || p['Milestone'] || 'Payment'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{p['Due Date'] || '—'}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatCurrency(p['Amount'])}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${p['Status'] === 'Paid' ? 'bg-emerald-100 text-emerald-700' : p['Status'] === 'Due' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                          {p['Status'] || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">No payment schedule available yet</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'wip', label: 'WIP Schedule', icon: ClipboardList },
  { id: 'jobs', label: 'Job Schedule', icon: Calendar },
  { id: 'scheduler', label: 'Production Scheduler', icon: Factory },
  { id: 'board', label: 'Production Board', icon: Package },
  { id: 'floor', label: 'Mfg Floor', icon: Wrench },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'projectbudget', label: 'Project Budget', icon: Calculator },
  { id: 'pl', label: 'P&L', icon: TrendingUp },
  { id: 'drawings', label: 'Drawings', icon: FileText },
  { id: 'deviations', label: 'Deviations', icon: AlertTriangle },
  { id: 'sage', label: 'Sage Import', icon: Upload },
  { id: 'portal', label: 'Customer Portal', icon: User },
];

export default function App() {
  const [view, setView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [actuals, setActuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projData, docData, paymentData, actualsData] = await Promise.all([
        airtableAPI.fetchProjects(),
        airtableAPI.fetchDocuments(),
        airtableAPI.fetchPayments(),
        airtableAPI.fetchActuals(),
      ]);
      setProjects(projData);
      setDocuments(docData);
      setPayments(paymentData);
      setActuals(actualsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveProject = async (formData, existingId) => {
    if (existingId) {
      const updated = await airtableAPI.updateProject(existingId, formData);
      setProjects(prev => prev.map(p => p.id === existingId ? updated : p));
    } else {
      const created = await airtableAPI.createProject(formData);
      setProjects(prev => [...prev, created]);
    }
    setEditingProject(null);
    setShowForm(false);
  };

  const handleDeleteProject = async (id) => {
    if (!confirm('Delete this project?')) return;
    await airtableAPI.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateDocument = async (id, fields) => {
    const updated = await airtableAPI.updateDocument(id, fields);
    setDocuments(prev => prev.map(d => d.id === id ? updated : d));
  };

  const handleEdit = (project) => { setEditingProject(project); setShowForm(true); };

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView projects={projects} onEdit={handleEdit} />;
      case 'wip': return <WIPScheduleView projects={projects} />;
      case 'jobs': return <JobScheduleView projects={projects} onEdit={handleEdit} />;
      case 'scheduler': return <ProductionSchedulerView projects={projects} />;
      case 'board': return <ProductionBoardView projects={projects} onEdit={handleEdit} />;
      case 'floor': return <ManufacturingFloorView projects={projects} onEdit={handleEdit} />;
      case 'budget': return <BudgetView projects={projects} />;
      case 'projectbudget': return <ProjectBudgetView projects={projects} actuals={actuals} />;
      case 'pl': return <PLView projects={projects} />;
      case 'drawings': return <DrawingsView projects={projects} documents={documents} onUpdateDoc={handleUpdateDocument} onEdit={handleEdit} />;
      case 'deviations': return <DeviationsView projects={projects} onEdit={handleEdit} />;
      case 'sage': return <SageImportView projects={projects} onImportComplete={loadData} />;
      case 'portal': return <CustomerPortalView projects={projects} documents={documents} payments={payments} />;
      default: return <DashboardView projects={projects} onEdit={handleEdit} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading from Airtable...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Button */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow">
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">Honomobo</h1>
          <p className="text-slate-400 text-sm">Operations Platform</p>
        </div>
        <nav className="p-4 space-y-1 max-h-[calc(100vh-120px)] overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${view === item.id ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="text-xs text-slate-400">
            {projects.length} projects loaded
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="lg:ml-0 ml-12">
            <h2 className="text-xl font-semibold text-gray-900">
              {navItems.find(n => n.id === view)?.label || 'Dashboard'}
            </h2>
            <p className="text-sm text-gray-500">
              <span className="text-emerald-600 font-medium">●</span> Connected to Airtable • {projects.length} projects
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Refresh">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={() => { setEditingProject(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Project</span>
            </button>
          </div>
        </header>

        <div className="p-6">
          {renderView()}
        </div>
      </main>

      {/* Project Form Modal */}
      {showForm && (
        <ProjectFormModal
          project={editingProject}
          onSave={handleSaveProject}
          onClose={() => { setShowForm(false); setEditingProject(null); }}
        />
      )}
    </div>
  );
}
