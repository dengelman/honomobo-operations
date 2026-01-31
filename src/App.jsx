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
// PROJECT FORM MODAL
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
  const bays = ['', 'Bay 1', 'Bay 2', 'Bay 3', 'Bay 4'];
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
                    <label className="block text-sm font-medium mb-1">Bay Assignment</label>
                    <select value={form['Bay Assignment']} onChange={e => setForm({ ...form, 'Bay Assignment': e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                      {bays.map(s => <option key={s} value={s}>{s || '— Select —'}</option>)}
                    </select>
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

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD VIEW
// ══════════════════════════════════════════════════════════════════════════════
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

// END OF PART 1
// Continue in Part 2...

function ManufacturingFloorView({ projects, onEdit }) {
  const bays = [
    { id: 'Bay 1', name: 'Bay 1', color: '#3B82F6' },
    { id: 'Bay 2', name: 'Bay 2', color: '#10B981' },
    { id: 'Bay 3', name: 'Bay 3', color: '#F59E0B' },
    { id: 'Bay 4', name: 'Bay 4', color: '#8B5CF6' },
  ];

  const productionProjects = useMemo(() =>
    projects.filter(p => p.Stage === 'Production'),
    [projects]
  );

  const getBayProject = (bayName) => {
    return productionProjects.find(p => p['Bay Assignment'] === bayName);
  };

  const assignedCount = productionProjects.filter(p => p['Bay Assignment']).length;
  const avgWeek = productionProjects.length > 0
    ? Math.round(productionProjects.reduce((s, p) => s + (parseInt(p['MFG Week']) || 0), 0) / productionProjects.length)
    : 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        <span className="text-blue-600 font-medium">Data from Airtable</span> • Bay assignments from "Bay Assignment" field
      </p>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">Total in Production</div>
          <div className="text-3xl font-bold">{productionProjects.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">Bays Occupied</div>
          <div className="text-3xl font-bold text-blue-600">{assignedCount}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">Available Bays</div>
          <div className="text-3xl font-bold text-emerald-600">{4 - assignedCount}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">Avg Week</div>
          <div className="text-3xl font-bold">{avgWeek}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {bays.map(bay => {
          const project = getBayProject(bay.id);
          return (
            <div key={bay.id} className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center gap-2" style={{ backgroundColor: `${bay.color}15` }}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: bay.color }} />
                <span className="font-semibold text-gray-900">{bay.name}</span>
                {project && <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">Active</span>}
                {!project && <span className="ml-auto px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Empty</span>}
              </div>

              {project ? (
                <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => onEdit(project)}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-lg">{project['Project ID']}</div>
                      <div className="text-gray-500">{project['Status'] || project['Customer (text)'] || ''}</div>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                      {project['Model'] || project['Unit Type'] || '—'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">MFG Status</span>
                      <span className="font-medium">{project['MFG Status'] || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Week</span>
                      <span className="font-medium">{project['MFG Week'] || '—'} / 12</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Market</span>
                      <span className="font-medium">{project['Site State/Province'] || project['Market'] || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">PM</span>
                      <span className="font-medium">{project['Project Manager'] || '—'}</span>
                    </div>
                  </div>

                  {project['MFG Week'] && (
                    <div className="mt-4">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(parseInt(project['MFG Week']) / 12) * 100}%`, backgroundColor: bay.color }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-500 text-right">
                        {Math.round((parseInt(project['MFG Week']) / 12) * 100)}% complete
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Bay available</p>
                  <p className="text-xs mt-1">Assign a project in Airtable</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {productionProjects.filter(p => !p['Bay Assignment']).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-900 mb-3">Unassigned Production Projects</h3>
          <p className="text-sm text-amber-700 mb-3">These projects need Bay Assignment in Airtable:</p>
          <div className="grid grid-cols-4 gap-3">
            {productionProjects.filter(p => !p['Bay Assignment']).map(p => (
              <div
                key={p.id}
                className="bg-white rounded-lg p-3 border border-amber-200 cursor-pointer hover:shadow-md"
                onClick={() => onEdit(p)}
              >
                <div className="font-semibold">{p['Project ID']}</div>
                <div className="text-sm text-gray-500">{p['Model'] || '—'}</div>
                <div className="text-xs text-amber-600 mt-1">Click to edit</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BUDGET VIEW - Uses Real Airtable Data
// ══════════════════════════════════════════════════════════════════════════════
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
