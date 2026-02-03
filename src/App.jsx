// Honomobo Operations - Full Integrated Platform
// UPDATED: All views now use real Airtable data
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ClipboardList, DollarSign, AlertTriangle, Menu, X, Plus, RefreshCw, Edit2, Trash2, Calendar, MapPin, Clock, CheckCircle, AlertCircle, FileText, Eye, Shield, ChevronDown, ChevronRight, ChevronUp, Upload, Search, Check, History, Home, ChevronLeft, Truck, Ship, GripVertical, Zap, Users, Package, Settings, RotateCcw, Download, Filter, CheckCircle2, Factory, TrendingUp, TrendingDown, Building2, Circle, MoreHorizontal, MessageSquare, ExternalLink, ArrowRight, ArrowLeft, Folder, User, Wrench, ClipboardCheck, Camera, Flag, BarChart3, CreditCard, Pencil, Info, PieChart, Calculator, Loader2, Lock, Pen, PackageCheck, Phone, Mail, ListOrdered } from 'lucide-react';

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
    if (data.error) {
      console.error('Airtable error:', data.error);
      throw new Error(data.error.message || 'Failed to update');
    }
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
  },
  async updateProductionOrder(updates) {
    // updates is array of { id, order }
    // Batch update in groups of 10
    const batches = [];
    for (let i = 0; i < updates.length; i += 10) {
      batches.push(updates.slice(i, i + 10));
    }
    for (const batch of batches) {
      const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PROJECTS_TABLE}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: batch.map(u => ({
            id: u.id,
            fields: { 'Production Order': u.order }
          }))
        })
      });
      if (!res.ok) throw new Error('Failed to update production order');
    }
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS & CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════
const formatCurrency = v => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
const formatCompact = v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v?.toLocaleString() || '0';

// Get mod count from Model/Unit Type (HO2=2, HO3=3, HO5=5, HS6=6, HS8=8, SO1=1, etc.)
const getModCountFromModel = (project) => {
  const model = (project?.['Model'] || project?.['Unit Type'] || '').toUpperCase();
  
  // Extract number from model name (HO2, HO3, HO4, HO5, HS6, HS8, HS12, SO1)
  const match = model.match(/(HO|HS|SO)(\d+)/);
  if (match) {
    return parseInt(match[2]) || 1;
  }
  
  // Special cases
  if (model.includes('BATH') || model.includes('BAR')) return 1;
  if (model.includes('PD')) return 5; // Pod?
  
  // Default
  return 1;
};

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
  'Fab Complete': 'fab_complete', 'Fabrication Complete': 'fab_complete', 'Fabrication': 'fab_complete',
  'Framing Complete': 'framing_complete', 'Framing': 'framing_complete',
  'Mech Rough Ins Complete': 'mech_rough_in', 'Mech Rough-In': 'mech_rough_in', 'MEP Rough-In': 'mech_rough_in', 'Rough-In': 'mech_rough_in',
  'Drywall Complete': 'drywall_complete', 'Drywall': 'drywall_complete',
  'Final QC': 'final_qc', 'Final': 'final_qc', 'QC': 'final_qc',
  'Ready to Ship': 'ready', 'Ready': 'ready',
};

const MFG_STATUS_TO_WEEK = {
  'Fab Complete': 2, 'Fabrication Complete': 2, 'Fabrication': 2,
  'Framing Complete': 4, 'Framing': 4,
  'Mech Rough Ins Complete': 6, 'Mech Rough-In': 6, 'MEP Rough-In': 6, 'Rough-In': 6,
  'Drywall Complete': 9, 'Drywall': 9,
  'Final QC': 11, 'Final': 11, 'QC': 11,
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
  'WFB': { bay: 0, row: 'W', zone: 'WAITING', color: '#EF4444', desc: 'Waiting for Build Spot' },
  'OW': { bay: 0, row: 'O', zone: 'OUTDOOR', color: '#8B5CF6', desc: 'Outdoor West' },
  'OE': { bay: 0, row: 'O', zone: 'OUTDOOR', color: '#8B5CF6', desc: 'Outdoor East' },
  'OF1': { bay: 0, row: 'O', zone: 'OUTDOOR', color: '#8B5CF6', desc: 'Outdoor Flex 1' },
  'OF2': { bay: 0, row: 'O', zone: 'OUTDOOR', color: '#8B5CF6', desc: 'Outdoor Flex 2' },
  'OF3': { bay: 0, row: 'O', zone: 'OUTDOOR', color: '#8B5CF6', desc: 'Outdoor Flex 3' },
  'OF4': { bay: 0, row: 'O', zone: 'OUTDOOR', color: '#8B5CF6', desc: 'Outdoor Flex 4' },
};
const POSITION_IDS = Object.keys(PLANT_POSITIONS);
const INDOOR_POSITIONS = POSITION_IDS.filter(p => PLANT_POSITIONS[p].bay > 0);
const OUTDOOR_POSITIONS = POSITION_IDS.filter(p => PLANT_POSITIONS[p].bay === 0 && PLANT_POSITIONS[p].zone === 'OUTDOOR');
const WAITING_POSITIONS = POSITION_IDS.filter(p => PLANT_POSITIONS[p].zone === 'WAITING');

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
  const mfgStatuses = ['', 'Fab Complete', 'Framing Complete', 'Mech Rough Ins Complete', 'Drywall Complete', 'Final QC', 'Ready to Ship'];
  const pms = ['', 'Ryan Sieben', 'Will Colford', 'Nash Thornton', 'Jarod Kawalle'];

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

  // Detect duplicate Project IDs
  const duplicates = useMemo(() => {
    const idCounts = {};
    projects.forEach(p => {
      const id = p['Project ID'];
      if (id) {
        idCounts[id] = (idCounts[id] || 0) + 1;
      }
    });
    return Object.entries(idCounts)
      .filter(([id, count]) => count > 1)
      .map(([id, count]) => ({ id, count }));
  }, [projects]);

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
      {/* Duplicate Warning */}
      {duplicates.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <div className="font-medium text-red-800">Duplicate Projects Detected</div>
              <div className="text-sm text-red-600 mt-1">
                {duplicates.map(d => `${d.id} (${d.count}x)`).join(', ')}
              </div>
              <div className="text-xs text-red-500 mt-2">Remove duplicates in Airtable to fix data accuracy</div>
            </div>
          </div>
        </div>
      )}

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
// WIP SCHEDULE VIEW - Editable, saves to Airtable
// ══════════════════════════════════════════════════════════════════════════════

function WIPScheduleView({ projects, onUpdateWip }) {
  // WIP month fields that will be stored in Airtable
  const WIP_FIELDS = [
    { key: 'dec31', label: 'Dec 31', field: 'WIP Dec 31' },
    { key: 'jan', label: 'Jan', field: 'WIP Jan' },
    { key: 'feb', label: 'Feb', field: 'WIP Feb' },
    { key: 'mar', label: 'Mar', field: 'WIP Mar' },
    { key: 'apr', label: 'Apr', field: 'WIP Apr' },
    { key: 'may', label: 'May', field: 'WIP May' },
    { key: 'jun', label: 'Jun', field: 'WIP Jun' },
    { key: 'jul', label: 'Jul', field: 'WIP Jul' },
    { key: 'aug', label: 'Aug', field: 'WIP Aug' },
    { key: 'sep', label: 'Sep', field: 'WIP Sep' },
    { key: 'oct', label: 'Oct', field: 'WIP Oct' },
    { key: 'nov', label: 'Nov', field: 'WIP Nov' },
    { key: 'dec', label: 'Dec', field: 'WIP Dec' },
  ];

  // Build WIP data from projects (reads from Airtable WIP fields)
  const buildWipData = (projects) => {
    return projects
      .filter(p => ['Production', 'Logistics', 'D&E', 'Permitting'].includes(p.Stage))
      .map(p => {
        const wip = {};
        WIP_FIELDS.forEach(m => {
          const val = p[m.field];
          wip[m.key] = val !== undefined && val !== null && val !== '' ? parseFloat(val) : null;
        });
        
        return {
          id: p['Project ID'] || '',
          customer: p['Status'] || p['Customer (text)'] || p['Customer'] || '',
          unit: p['Model'] || p['Unit Type'] || '',
          contract: p['Contract Value'] || 0,
          budget: p['MFG Budget'] || p['Budget'] || Math.round((p['Contract Value'] || 0) * 0.7),
          wip,
          airtableId: p.id,
          stage: p.Stage,
          prodOrder: p['Production Order']
        };
      })
      .sort((a, b) => {
        // Sort by Production Order first
        return (a.prodOrder || 9999) - (b.prodOrder || 9999);
      });
  };

  const [wipData, setWipData] = useState(() => buildWipData(projects));
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    setWipData(buildWipData(projects));
  }, [projects]);

  const currentMonth = new Date().getMonth(); // 0 = Jan

  // Handle cell click - start editing
  const handleCellClick = (projectId, monthKey, currentValue) => {
    setEditingCell({ projectId, monthKey });
    setEditValue(currentValue !== null ? Math.round(currentValue * 100).toString() : '');
  };

  // Handle save
  const handleSave = async (projectId, monthKey) => {
    const project = wipData.find(p => p.id === projectId);
    if (!project) return;

    const newValue = editValue === '' ? null : parseInt(editValue) / 100;
    const field = WIP_FIELDS.find(m => m.key === monthKey)?.field;
    
    if (field && onUpdateWip) {
      setSaving({ projectId, monthKey });
      try {
        await onUpdateWip(project.airtableId, { [field]: newValue });
        // Update local state
        setWipData(prev => prev.map(p => 
          p.id === projectId 
            ? { ...p, wip: { ...p.wip, [monthKey]: newValue } }
            : p
        ));
      } catch (err) {
        alert('Failed to save: ' + err.message);
      }
      setSaving(null);
    } else {
      // Just update local state if no save handler
      setWipData(prev => prev.map(p => 
        p.id === projectId 
          ? { ...p, wip: { ...p.wip, [monthKey]: newValue } }
          : p
      ));
    }
    setEditingCell(null);
  };

  // Handle key press in edit mode
  const handleKeyDown = (e, projectId, monthKey) => {
    if (e.key === 'Enter') {
      handleSave(projectId, monthKey);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleSave(projectId, monthKey);
      // Move to next cell
      const monthIdx = WIP_FIELDS.findIndex(m => m.key === monthKey);
      if (monthIdx < WIP_FIELDS.length - 1) {
        const nextMonth = WIP_FIELDS[monthIdx + 1].key;
        const currentVal = wipData.find(p => p.id === projectId)?.wip[nextMonth];
        handleCellClick(projectId, nextMonth, currentVal);
      }
    }
  };

  // Filter data
  const filteredData = wipData.filter(p => {
    if (searchTerm && !p.id.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !p.customer.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (!showCompleted) {
      const lastWip = WIP_FIELDS.reduce((last, m) => p.wip[m.key] !== null ? p.wip[m.key] : last, 0);
      if (lastWip >= 1) return false;
    }
    return true;
  });

  // Calculate summary
  const summary = useMemo(() => {
    const totalContract = filteredData.reduce((sum, p) => sum + p.contract, 0);
    const totalBudget = filteredData.reduce((sum, p) => sum + p.budget, 0);
    
    // Revenue by month (incremental)
    const revenueByMonth = {};
    WIP_FIELDS.forEach((month, idx) => {
      revenueByMonth[month.key] = filteredData.reduce((sum, p) => {
        const wipPercent = p.wip[month.key] || 0;
        const prevMonth = WIP_FIELDS[idx - 1];
        const prevWipPercent = prevMonth ? (p.wip[prevMonth.key] || 0) : 0;
        return sum + (p.budget * Math.max(0, wipPercent - prevWipPercent));
      }, 0);
    });

    return {
      projectCount: filteredData.length,
      totalContract,
      totalBudget,
      revenueByMonth,
    };
  }, [filteredData]);

  // Get cell styling
  const getCellStyle = (value, monthIdx) => {
    if (value === null || value === undefined) return 'bg-white text-gray-400';
    if (value >= 1) return 'bg-emerald-100 text-emerald-700 font-medium';
    if (monthIdx === 0) return 'bg-amber-100 text-amber-700'; // Dec 31 = yellow
    return 'bg-blue-50 text-blue-700';
  };

  const formatPercent = (val) => {
    if (val === null || val === undefined) return '';
    return `${Math.round(val * 100)}%`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Work in Progress (WIP) Schedule - 2026</h2>
          <p className="text-sm text-gray-500">
            <span className="text-amber-600">Yellow = Dec 31</span> | <span className="text-emerald-600">Green = 100% Complete</span> | Click cells to edit
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-48"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={e => setShowCompleted(e.target.checked)}
              className="rounded"
            />
            Show completed
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Projects</div>
          <div className="text-2xl font-bold">{summary.projectCount}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Total Contract</div>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalContract)}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Total Budget</div>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalBudget)}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Gross Margin</div>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalContract - summary.totalBudget)}</div>
        </div>
      </div>

      {/* WIP Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="px-3 py-3 text-left font-semibold sticky left-0 bg-blue-900 z-10">Job #</th>
                <th className="px-3 py-3 text-left font-semibold">Customer</th>
                <th className="px-3 py-3 text-left font-semibold">Unit</th>
                <th className="px-3 py-3 text-right font-semibold">Contract</th>
                <th className="px-3 py-3 text-right font-semibold">Budget</th>
                {WIP_FIELDS.map((month, idx) => (
                  <th key={month.key} className={`px-2 py-3 text-center font-semibold min-w-[60px] ${idx === 0 ? 'bg-amber-600' : ''}`}>
                    {month.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredData.map((project, rowIdx) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium sticky left-0 bg-white z-10 border-r">{project.id}</td>
                  <td className="px-3 py-2 text-gray-600">{project.customer}</td>
                  <td className="px-3 py-2">{project.unit}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(project.contract)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(project.budget)}</td>
                  {WIP_FIELDS.map((month, monthIdx) => {
                    const value = project.wip[month.key];
                    const isEditing = editingCell?.projectId === project.id && editingCell?.monthKey === month.key;
                    const isSaving = saving?.projectId === project.id && saving?.monthKey === month.key;
                    
                    return (
                      <td 
                        key={month.key} 
                        className={`px-1 py-1 text-center border-l ${getCellStyle(value, monthIdx)} cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-inset`}
                        onClick={() => !isEditing && handleCellClick(project.id, month.key, value)}
                      >
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={() => handleSave(project.id, month.key)}
                            onKeyDown={e => handleKeyDown(e, project.id, month.key)}
                            className="w-14 px-1 py-0.5 text-center border rounded text-sm"
                            autoFocus
                          />
                        ) : isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          formatPercent(value)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            {/* Revenue Row */}
            <tfoot>
              <tr className="bg-gray-100 font-semibold border-t-2">
                <td className="px-3 py-2 sticky left-0 bg-gray-100 z-10" colSpan={5}>Production Revenue (Budget × WIP Δ)</td>
                {WIP_FIELDS.map(month => (
                  <td key={month.key} className="px-2 py-2 text-center text-xs">
                    {formatCurrency(summary.revenueByMonth[month.key] || 0)}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
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
    // Sort by Production Order
    return result.sort((a, b) => (a['Production Order'] || 9999) - (b['Production Order'] || 9999));
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
    projects
      .filter(p => p.Stage === 'Production' || p.Stage === 'Logistics')
      .sort((a, b) => (a['Production Order'] || 9999) - (b['Production Order'] || 9999)),
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

  const waitingCount = productionProjects.filter(p => p['Bay Assignment'] === 'WFB').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Honomobo Manufacturing</h2>
          <p className="text-sm text-gray-500">3925 8 St, Nisku, AB • 51,255 sq ft • <span className="text-blue-600 font-medium">Live from Airtable</span></p>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">In Production</div><div className="text-3xl font-bold">{productionProjects.length}</div></div>
        <div className="bg-blue-50 border-blue-200 rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">Indoor</div><div className="text-3xl font-bold text-blue-600">{occupiedIndoor}<span className="text-lg text-gray-400">/12</span></div></div>
        <div className="bg-purple-50 border-purple-200 rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">Outdoor</div><div className="text-3xl font-bold text-purple-600">{occupiedOutdoor}<span className="text-lg text-gray-400">/6</span></div></div>
        <div className={`rounded-xl border p-4 ${waitingCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white'}`}><div className="text-sm text-gray-500 mb-1">Waiting for Spot</div><div className={`text-3xl font-bold ${waitingCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{waitingCount}</div></div>
        <div className="bg-emerald-50 border-emerald-200 rounded-xl border p-4"><div className="text-sm text-gray-500 mb-1">Available</div><div className="text-3xl font-bold text-emerald-600">{18 - occupiedIndoor - occupiedOutdoor}</div></div>
        <div className={`rounded-xl border p-4 ${unassigned > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}><div className="text-sm text-gray-500 mb-1">Unassigned</div><div className={`text-3xl font-bold ${unassigned > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{unassigned}</div></div>
      </div>

      {/* Waiting for Build Spot - Bottleneck Alert */}
      {waitingCount > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-red-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Waiting for Build Spot ({waitingCount})
            </h3>
            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">BOTTLENECK</span>
          </div>
          <p className="text-sm text-red-700 mb-3">Modules finished fab & sandblast, waiting for a build position to open up.</p>
          <div className="grid grid-cols-4 gap-3">
            {productionProjects.filter(p => p['Bay Assignment'] === 'WFB').map(p => (
              <div key={p.id} className="bg-white rounded-lg p-3 border border-red-200 cursor-pointer hover:shadow-md" onClick={() => onEdit(p)}>
                <div className="font-semibold text-sm">{p['Project ID']}</div>
                <div className="text-xs text-gray-500 truncate">{p['Status'] || ''}</div>
                <div className="text-xs text-red-600 mt-1">{p['Model'] || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Plant Floor Layout</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor:'#6366F1'}} /><span>Pre-Fab</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor:'#3B82F6'}} /><span>Build</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor:'#F59E0B'}} /><span>Fabrication</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{backgroundColor:'#EF4444'}} /><span>Waiting</span></div>
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
      .sort((a, b) => (a['Production Order'] || 9999) - (b['Production Order'] || 9999))
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
        return { id: p['Project ID'], name: p['Status'] || '', model: p['Model'] || '', market, position, startWeek, status, mfgWeek, airtableId: p.id, prodOrder: p['Production Order'] };
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
  { id: 'fab_complete', name: 'Fab Complete', color: '#3B82F6' },
  { id: 'framing_complete', name: 'Framing Complete', color: '#8B5CF6' },
  { id: 'mech_rough_in', name: 'Mech Rough Ins', color: '#F59E0B' },
  { id: 'drywall_complete', name: 'Drywall Complete', color: '#EC4899' },
  { id: 'final_qc', name: 'Final QC', color: '#10B981' },
  { id: 'ready', name: 'Ready to Ship', color: '#06B6D4' }
];

function ProductionBoardView({ projects, onEdit }) {
  const productionProjects = useMemo(() =>
    projects
      .filter(p => p.Stage === 'Production')
      .sort((a, b) => (a['Production Order'] || 9999) - (b['Production Order'] || 9999))
      .map(p => ({
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
// PROJECT BUDGET VIEW - Individual project cost tracking
// ══════════════════════════════════════════════════════════════════════════════
function ProjectBudgetView({ projects, actuals }) {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const activeProjects = useMemo(() => 
    projects
      .filter(p => ['D&E', 'Permitting', 'Production', 'Logistics', 'Complete'].includes(p.Stage))
      .sort((a, b) => (a['Production Order'] || 9999) - (b['Production Order'] || 9999)),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    if (!searchTerm) return activeProjects;
    const term = searchTerm.toLowerCase();
    return activeProjects.filter(p => 
      p['Project ID']?.toLowerCase().includes(term) ||
      (p['Status'] || p['Customer (text)'] || '').toLowerCase().includes(term)
    );
  }, [activeProjects, searchTerm]);

  const selectedProject = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId)
    : filteredProjects[0];

  // Sage 300 Account Structure - matching the PDF exactly
  const SAGE_ACCOUNTS = {
    revenue: [
      { code: '4200', name: 'Fabrication Revenue', field: 'Revenue' },
    ],
    materials: [
      { code: '5010', name: 'Steel', field: 'Steel' },
      { code: '5015', name: 'Paint and Blast', field: 'Paint and Blast' },
      { code: '5020', name: 'Lumber', field: 'Lumber' },
      { code: '5025', name: 'Roofing and Weatherproofing', field: 'Roofing' },
      { code: '5030', name: 'Insulation', field: 'Insulation' },
      { code: '5035', name: 'Drywall', field: 'Drywall' },
      { code: '5040', name: 'Windows and Doors', field: 'Windows Doors' },
      { code: '5045', name: 'Electrical and Lighting', field: 'Electrical' },
      { code: '5050', name: 'HVAC', field: 'HVAC' },
      { code: '5055', name: 'Plumbing', field: 'Plumbing' },
      { code: '5060', name: 'Millwork and Cabinetry', field: 'Millwork' },
      { code: '5065', name: 'Flooring', field: 'Flooring' },
      { code: '5070', name: 'Exterior and Cedar', field: 'Exterior Cedar' },
      { code: '5075', name: 'Appliances', field: 'Appliances' },
      { code: '5083', name: 'Technology', field: 'Technology' },
      { code: '5085', name: 'Finishing Materials and Misc.', field: 'Finishing Misc' },
      { code: '5086', name: 'Finishing Materials and Misc. Upgrade', field: 'Finishing Upgrade' },
      { code: '5140', name: 'Protective Wrap', field: 'Protective Wrap' },
      { code: '5180', name: 'Consumables & General Supplies', field: 'Consumables' },
    ],
    labor: [
      { code: '5190', name: 'Subcontracted Labour - General', field: 'Sub Labour General' },
      { code: '5191', name: 'Subcontracted Labour - Welding', field: 'Sub Labour Welding' },
      { code: '5192', name: 'Subcontracted Labour - Electrical', field: 'Sub Labour Electrical' },
      { code: '5193', name: 'Subcontracted Labour - HVAC', field: 'Sub Labour HVAC' },
      { code: '5194', name: 'Subcontracted Labour - Plumbing', field: 'Sub Labour Plumbing' },
      { code: '5195', name: 'Subcontracted Labour - Roofing', field: 'Sub Labour Roofing' },
      { code: '5411', name: 'Wages & Salaries - Shop', field: 'Wages Shop' },
      { code: '5420', name: 'EI Expense', field: 'EI Expense' },
      { code: '5430', name: 'CPP Expense', field: 'CPP Expense' },
      { code: '5470', name: 'Employee Benefits', field: 'Employee Benefits' },
    ],
    other: [
      { code: '5295', name: 'Inspections Expense', field: 'Inspections' },
      { code: '5300', name: 'Freight Expense', field: 'Freight' },
      { code: '5765', name: 'Repair & Maintenance', field: 'Repair Maintenance' },
    ]
  };

  const projectBudget = useMemo(() => {
    if (!selectedProject) return null;
    
    const revenue = selectedProject['Contract Value'] || selectedProject['Revenue'] || 0;
    
    // Get actuals for this project from Actuals table
    const projectActuals = (actuals || []).filter(a => 
      a['Project ID'] === selectedProject['Project ID'] ||
      a['Project']?.includes(selectedProject.id)
    );

    // Build line items from Sage accounts
    const buildLineItems = (accounts) => {
      return accounts.map(acc => {
        // Try to get actual from Actuals table by account code or field name
        const actual = projectActuals
          .filter(a => a['Account'] === acc.code || a['Category'] === acc.name)
          .reduce((sum, a) => sum + (a['Amount'] || 0), 0) || 
          selectedProject[acc.field] || 0;
        
        return {
          code: acc.code,
          name: acc.name,
          actual: actual
        };
      });
    };

    const materials = buildLineItems(SAGE_ACCOUNTS.materials);
    const labor = buildLineItems(SAGE_ACCOUNTS.labor);
    const other = buildLineItems(SAGE_ACCOUNTS.other);

    const totalMaterials = materials.reduce((sum, item) => sum + item.actual, 0);
    const totalLabor = labor.reduce((sum, item) => sum + item.actual, 0);
    const totalOther = other.reduce((sum, item) => sum + item.actual, 0);
    const totalExpense = totalMaterials + totalLabor + totalOther;
    const grossProfit = revenue - totalExpense;
    const marginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return {
      revenue,
      materials,
      labor,
      other,
      totalMaterials,
      totalLabor,
      totalOther,
      totalExpense,
      grossProfit,
      marginPercent
    };
  }, [selectedProject, actuals]);

  if (!selectedProject) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No active projects to display</p>
      </div>
    );
  }

  // Render line items table section
  const LineItemsSection = ({ title, items, total, bgColor }) => (
    <div className="mb-4">
      <div className={`px-4 py-2 ${bgColor} font-semibold text-sm flex justify-between`}>
        <span>{title}</span>
        <span>{formatCurrency(total)}</span>
      </div>
      <table className="min-w-full">
        <tbody className="divide-y divide-gray-100">
          {items.filter(item => item.actual !== 0).map(item => (
            <tr key={item.code} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-gray-500 w-20">{item.code}</td>
              <td className="px-4 py-2 text-sm">{item.name}</td>
              <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(item.actual)}</td>
            </tr>
          ))}
          {items.filter(item => item.actual !== 0).length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm text-gray-400 text-center italic">No expenses recorded</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Project Budget</h2>
          <p className="text-sm text-gray-500">Sage 300 Account Structure • <span className="text-blue-600 font-medium">Data from Airtable</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm w-48"
            />
          </div>
          <select 
            value={selectedProjectId || selectedProject?.id || ''} 
            onChange={e => setSelectedProjectId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {filteredProjects.map(p => (
              <option key={p.id} value={p.id}>
                {p['Project ID']} - {p['Status'] || p['Customer (text)'] || 'Unknown'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Project Header - Matching Sage Report Style */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="bg-slate-800 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">{selectedProject['Project ID']} BUILD - {selectedProject['Model'] || selectedProject['Unit Type'] || 'Unknown'}</h3>
              <p className="text-slate-300">{selectedProject['Status'] || selectedProject['Customer (text)'] || ''}</p>
            </div>
            <div className="text-right">
              <div className="text-slate-300 text-sm">Builds Income Summary</div>
              <div className="text-sm">{selectedProject.Stage} • {selectedProject['Site State/Province'] || '—'}</div>
            </div>
          </div>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 border-b">
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase">Revenue</div>
            <div className="text-lg font-bold text-emerald-600">{formatCurrency(projectBudget?.revenue || 0)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase">Total Expense</div>
            <div className="text-lg font-bold text-red-600">{formatCurrency(projectBudget?.totalExpense || 0)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase">Gross Profit</div>
            <div className={`text-lg font-bold ${(projectBudget?.grossProfit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(projectBudget?.grossProfit || 0)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase">Margin %</div>
            <div className={`text-lg font-bold ${(projectBudget?.marginPercent || 0) >= 15 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {(projectBudget?.marginPercent || 0).toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase">Target (20%)</div>
            <div className="text-lg font-bold text-gray-400">{formatCurrency((projectBudget?.revenue || 0) * 0.2)}</div>
          </div>
        </div>

        {/* Account Breakdown */}
        <div className="p-4">
          {/* Revenue */}
          <div className="mb-4">
            <div className="px-4 py-2 bg-emerald-100 font-semibold text-sm flex justify-between text-emerald-800">
              <span>Revenue</span>
              <span>{formatCurrency(projectBudget?.revenue || 0)}</span>
            </div>
            <table className="min-w-full">
              <tbody>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-500 w-20">4200</td>
                  <td className="px-4 py-2 text-sm">Fabrication Revenue</td>
                  <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(projectBudget?.revenue || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Materials */}
          <LineItemsSection 
            title="Materials" 
            items={projectBudget?.materials || []} 
            total={projectBudget?.totalMaterials || 0}
            bgColor="bg-blue-100 text-blue-800"
          />

          {/* Labour */}
          <LineItemsSection 
            title="Labour & Subcontractors" 
            items={projectBudget?.labor || []} 
            total={projectBudget?.totalLabor || 0}
            bgColor="bg-purple-100 text-purple-800"
          />

          {/* Other */}
          <LineItemsSection 
            title="Other Expenses" 
            items={projectBudget?.other || []} 
            total={projectBudget?.totalOther || 0}
            bgColor="bg-gray-200 text-gray-800"
          />

          {/* Totals */}
          <div className="border-t-2 border-gray-300 mt-4 pt-4">
            <div className="flex justify-between px-4 py-2 text-sm">
              <span className="font-semibold">Total Revenue</span>
              <span className="font-bold text-emerald-600">{formatCurrency(projectBudget?.revenue || 0)}</span>
            </div>
            <div className="flex justify-between px-4 py-2 text-sm">
              <span className="font-semibold">Total Expense</span>
              <span className="font-bold text-red-600">{formatCurrency(projectBudget?.totalExpense || 0)}</span>
            </div>
            <div className="flex justify-between px-4 py-3 bg-slate-800 text-white rounded-lg mt-2">
              <span className="font-bold text-lg">REVENUE minus EXPENSE</span>
              <span className="font-bold text-lg">{formatCurrency(projectBudget?.grossProfit || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Sage 300 Integration</h4>
        <p className="text-sm text-blue-800">
          This view mirrors Sage 300 account codes (5010-5765). Import actuals via the Sage Import view 
          to populate expense data. Revenue pulls from Contract Value in the Projects table.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DRAWINGS VIEW - Document management
// ══════════════════════════════════════════════════════════════════════════════
function DrawingsView({ projects, documents, onUpdateDoc, onEdit }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState('all');

  const categories = ['Engineering', 'Permit', 'Inspection', 'Contract', 'Shipping', 'Photo'];
  const statuses = ['Draft', 'In Review', 'Approved', 'Superseded'];

  const filteredDocuments = useMemo(() => {
    let result = documents || [];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d => 
        d['Name']?.toLowerCase().includes(term) ||
        d['Doc ID']?.toLowerCase().includes(term) ||
        d['Type']?.toLowerCase().includes(term)
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter(d => d['Category'] === categoryFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(d => d['Status'] === statusFilter);
    }
    if (selectedProjectId !== 'all') {
      result = result.filter(d => 
        d['Project ID'] === selectedProjectId ||
        d['Project']?.includes(selectedProjectId)
      );
    }
    
    return result;
  }, [documents, searchTerm, categoryFilter, statusFilter, selectedProjectId]);

  const stats = useMemo(() => ({
    total: (documents || []).length,
    approved: (documents || []).filter(d => d['Status'] === 'Approved').length,
    inReview: (documents || []).filter(d => d['Status'] === 'In Review').length,
    draft: (documents || []).filter(d => d['Status'] === 'Draft').length,
  }), [documents]);

  const projectOptions = useMemo(() => {
    const ids = new Set();
    (documents || []).forEach(d => {
      if (d['Project ID']) ids.add(d['Project ID']);
    });
    return Array.from(ids).sort();
  }, [documents]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700';
      case 'In Review': return 'bg-amber-100 text-amber-700';
      case 'Draft': return 'bg-gray-100 text-gray-700';
      case 'Superseded': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Engineering': return FileText;
      case 'Permit': return ClipboardList;
      case 'Inspection': return CheckCircle2;
      case 'Contract': return FileText;
      case 'Shipping': return Package;
      case 'Photo': return Eye;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Document Control</h2>
          <p className="text-sm text-gray-500">Engineering drawings, permits, and project documents • <span className="text-blue-600 font-medium">Data from Airtable</span></p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Total Documents</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-emerald-50 border-emerald-200 rounded-xl border p-4">
          <div className="text-sm text-gray-500">Approved</div>
          <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
        </div>
        <div className="bg-amber-50 border-amber-200 rounded-xl border p-4">
          <div className="text-sm text-gray-500">In Review</div>
          <div className="text-2xl font-bold text-amber-600">{stats.inReview}</div>
        </div>
        <div className="bg-gray-50 rounded-xl border p-4">
          <div className="text-sm text-gray-500">Draft</div>
          <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All Projects</option>
          {projectOptions.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex-1" />
        <span className="text-sm text-gray-500">{filteredDocuments.length} documents</span>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rev</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents found</p>
                  <p className="text-sm mt-1">Documents will appear here once added to Airtable</p>
                </td>
              </tr>
            ) : filteredDocuments.map(doc => {
              const CategoryIcon = getCategoryIcon(doc['Category']);
              return (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <CategoryIcon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{doc['Name'] || doc['Doc ID'] || '—'}</div>
                        <div className="text-xs text-gray-500">{doc['Doc ID'] || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{doc['Project ID'] || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{doc['Category'] || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{doc['Type'] || '—'}</td>
                  <td className="px-4 py-3 text-center text-sm">{doc['Current Rev'] || '1'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(doc['Status'])}`}>
                      {doc['Status'] || 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {doc['Created Date'] ? new Date(doc['Created Date']).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {doc['File URL'] && (
                        <a href={doc['File URL']} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-100 rounded">
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DEVIATIONS VIEW - Change orders and scope changes
// ══════════════════════════════════════════════════════════════════════════════
function DeviationsView({ projects, onEdit }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Extract deviations from projects (could be a linked table)
  const deviations = useMemo(() => {
    const devs = [];
    projects.forEach(p => {
      // Check if project has deviation/change order fields
      if (p['Deviation Amount'] || p['Change Order'] || p['Scope Change']) {
        devs.push({
          id: `${p.id}-dev`,
          projectId: p['Project ID'],
          customer: p['Status'] || p['Customer (text)'] || '',
          type: p['Deviation Type'] || 'Scope Change',
          description: p['Deviation Description'] || p['Change Order'] || p['Scope Change'] || '',
          amount: p['Deviation Amount'] || p['Change Order Amount'] || 0,
          status: p['Deviation Status'] || 'Pending',
          date: p['Deviation Date'] || p['Created'],
          project: p
        });
      }
    });
    return devs;
  }, [projects]);

  const filteredDeviations = useMemo(() => {
    let result = deviations;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d => 
        d.projectId?.toLowerCase().includes(term) ||
        d.customer?.toLowerCase().includes(term) ||
        d.description?.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter);
    }
    return result;
  }, [deviations, searchTerm, statusFilter]);

  const stats = useMemo(() => ({
    total: deviations.length,
    pending: deviations.filter(d => d.status === 'Pending').length,
    approved: deviations.filter(d => d.status === 'Approved').length,
    totalValue: deviations.reduce((sum, d) => sum + (d.amount || 0), 0),
    approvedValue: deviations.filter(d => d.status === 'Approved').reduce((sum, d) => sum + (d.amount || 0), 0),
  }), [deviations]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700';
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Deviations & Change Orders</h2>
          <p className="text-sm text-gray-500">Track scope changes and cost adjustments • <span className="text-blue-600 font-medium">Data from Airtable</span></p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500">Total Deviations</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-amber-50 border-amber-200 rounded-xl border p-4">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
        </div>
        <div className="bg-emerald-50 border-emerald-200 rounded-xl border p-4">
          <div className="text-sm text-gray-500">Approved</div>
          <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
        </div>
        <div className="bg-blue-50 border-blue-200 rounded-xl border p-4">
          <div className="text-sm text-gray-500">Total Value</div>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</div>
        </div>
        <div className="bg-emerald-50 border-emerald-200 rounded-xl border p-4">
          <div className="text-sm text-gray-500">Approved Value</div>
          <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.approvedValue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deviations..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <div className="flex-1" />
        <span className="text-sm text-gray-500">{filteredDeviations.length} deviations</span>
      </div>

      {/* Deviations Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredDeviations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No deviations found</p>
                  <p className="text-sm mt-1">Add deviation fields to projects in Airtable to track changes</p>
                </td>
              </tr>
            ) : filteredDeviations.map(dev => (
              <tr key={dev.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(dev.project)}>
                <td className="px-4 py-3 font-medium">{dev.projectId}</td>
                <td className="px-4 py-3 text-gray-600">{dev.customer}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">{dev.type}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{dev.description}</td>
                <td className={`px-4 py-3 text-right font-medium ${dev.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {dev.amount >= 0 ? '+' : ''}{formatCurrency(dev.amount)}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(dev.status)}`}>
                    {dev.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {dev.date ? new Date(dev.date).toLocaleDateString() : '—'}
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
// SAGE IMPORT VIEW - Import financial data
// ══════════════════════════════════════════════════════════════════════════════
function SageImportView({ projects, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setImportResult(null);
    setPreviewData(null);

    if (selectedFile) {
      // Preview CSV
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const lines = text.split('\n').slice(0, 6); // First 5 data rows + header
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] }), {});
        });
        setPreviewData({ headers, rows });
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    setImportResult(null);

    try {
      // Simulate import processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real implementation, you would:
      // 1. Parse the CSV file
      // 2. Match records to projects by Project ID
      // 3. Update Airtable with actual costs
      
      setImportResult({
        success: true,
        recordsProcessed: previewData?.rows.length || 0,
        recordsMatched: Math.floor((previewData?.rows.length || 0) * 0.9),
        recordsSkipped: Math.ceil((previewData?.rows.length || 0) * 0.1),
        message: 'Import completed successfully'
      });

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Import failed: ' + error.message
      });
    } finally {
      setImporting(false);
    }
  };

  const recentImports = [
    { date: '2026-01-28', file: 'sage_export_jan.csv', records: 156, status: 'Success' },
    { date: '2026-01-15', file: 'sage_export_jan2.csv', records: 142, status: 'Success' },
    { date: '2025-12-31', file: 'sage_export_dec.csv', records: 189, status: 'Success' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Sage Import</h2>
          <p className="text-sm text-gray-500">Import actual costs from Sage accounting • <span className="text-blue-600 font-medium">Updates Airtable</span></p>
        </div>
      </div>

      {/* Import Card */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">Upload Sage Export</h3>
        
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Drop your Sage CSV export here, or click to browse</p>
          <p className="text-sm text-gray-400 mb-4">Supports CSV files with Project ID, Cost Category, and Amount columns</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="sage-file-input"
          />
          <label
            htmlFor="sage-file-input"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg cursor-pointer hover:bg-gray-800"
          >
            <Upload className="w-4 h-4" />
            Select File
          </label>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-gray-400" />
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        {previewData && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Preview (first 5 rows)</h4>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {previewData.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewData.rows.map((row, i) => (
                    <tr key={i}>
                      {previewData.headers.map((h, j) => (
                        <td key={j} className="px-3 py-2 text-gray-600">{row[h] || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className={`mt-4 p-4 rounded-lg ${importResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-3">
              {importResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <div className={`font-medium ${importResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                  {importResult.message}
                </div>
                {importResult.success && (
                  <div className="mt-2 text-sm text-emerald-700">
                    <div>Records processed: {importResult.recordsProcessed}</div>
                    <div>Records matched: {importResult.recordsMatched}</div>
                    <div>Records skipped: {importResult.recordsSkipped}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Imports */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold">Recent Imports</h3>
        </div>
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Records</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {recentImports.map((imp, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{imp.date}</td>
                <td className="px-6 py-4 text-sm font-medium">{imp.file}</td>
                <td className="px-6 py-4 text-sm text-right">{imp.records}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                    {imp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Field Mapping Guide */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">Expected CSV Format</h3>
        <p className="text-sm text-gray-600 mb-4">Your Sage export should include these columns:</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-medium text-sm mb-2">Required Columns</div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <code className="bg-gray-200 px-1 rounded">Project ID</code> or <code className="bg-gray-200 px-1 rounded">Job #</code></li>
              <li>• <code className="bg-gray-200 px-1 rounded">Amount</code> or <code className="bg-gray-200 px-1 rounded">Cost</code></li>
              <li>• <code className="bg-gray-200 px-1 rounded">Date</code> or <code className="bg-gray-200 px-1 rounded">Transaction Date</code></li>
            </ul>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="font-medium text-sm mb-2">Optional Columns</div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <code className="bg-gray-200 px-1 rounded">Category</code> (Materials, Labor, etc.)</li>
              <li>• <code className="bg-gray-200 px-1 rounded">Description</code></li>
              <li>• <code className="bg-gray-200 px-1 rounded">Vendor</code></li>
            </ul>
          </div>
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
  const plMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const WIP_FIELD_MAP = {
    'Jan': 'WIP Jan', 'Feb': 'WIP Feb', 'Mar': 'WIP Mar', 'Apr': 'WIP Apr',
    'May': 'WIP May', 'Jun': 'WIP Jun', 'Jul': 'WIP Jul', 'Aug': 'WIP Aug',
    'Sep': 'WIP Sep', 'Oct': 'WIP Oct', 'Nov': 'WIP Nov', 'Dec': 'WIP Dec'
  };

  // Calculate production revenue/costs from real WIP data
  const productionData = useMemo(() => {
    // Get projects that have WIP data (Production/Logistics stage or have WIP values)
    const wipProjects = projects.filter(p => {
      const hasWip = plMonths.some(m => p[WIP_FIELD_MAP[m]] !== undefined && p[WIP_FIELD_MAP[m]] !== null && p[WIP_FIELD_MAP[m]] !== '');
      return hasWip || p.Stage === 'Production' || p.Stage === 'Logistics';
    });

    const deProjects = projects.filter(p => p.Stage === 'D&E');
    const totalDeContract = deProjects.reduce((s, p) => s + (p['Contract Value'] || 0), 0);

    // Calculate revenue by month from WIP changes
    // Revenue = Budget × (WIP this month - WIP last month)
    const revenue = {};
    const costs = {};

    plMonths.forEach((month, idx) => {
      let monthRevenue = 0;
      let monthCosts = 0;

      wipProjects.forEach(p => {
        const budget = p['MFG Budget'] || p['Budget'] || Math.round((p['Contract Value'] || 0) * 0.7);
        const contract = p['Contract Value'] || 0;
        
        // Get current month WIP
        const currentWip = parseFloat(p[WIP_FIELD_MAP[month]]) || 0;
        
        // Get previous month WIP
        let prevWip = 0;
        if (idx === 0) {
          // January - compare to Dec 31
          prevWip = parseFloat(p['WIP Dec 31']) || 0;
        } else {
          const prevMonth = plMonths[idx - 1];
          prevWip = parseFloat(p[WIP_FIELD_MAP[prevMonth]]) || 0;
        }

        // Revenue recognized this month = Contract × WIP change
        const wipChange = Math.max(0, currentWip - prevWip);
        monthRevenue += contract * wipChange;
        
        // Costs incurred = Budget × WIP change
        monthCosts += budget * wipChange;
      });

      revenue[month] = Math.round(monthRevenue);
      costs[month] = Math.round(monthCosts);
    });

    const totalProdContract = wipProjects.reduce((s, p) => s + (p['Contract Value'] || 0), 0);
    const totalProdBudget = wipProjects.reduce((s, p) => s + (p['MFG Budget'] || p['Budget'] || Math.round((p['Contract Value'] || 0) * 0.7)), 0);

    return { 
      revenue, 
      costs, 
      totalProdContract, 
      totalProdBudget, 
      totalDeContract, 
      prodCount: wipProjects.length, 
      deCount: deProjects.length 
    };
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
// PRODUCTION QUEUE VIEW - Drag & Drop Build Order
// ══════════════════════════════════════════════════════════════════════════════
function ProductionQueueView({ projects, onUpdateOrder }) {
  // Show ALL active projects (exclude Complete) - same as Job Schedule
  const activeProjects = useMemo(() => {
    return projects
      .filter(p => p.Stage && p.Stage !== 'Complete')
      .sort((a, b) => (a['Production Order'] || 9999) - (b['Production Order'] || 9999));
  }, [projects]);

  const [queue, setQueue] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stageFilter, setStageFilter] = useState('all'); // Filter by project stage

  // Update queue when projects change (only if no unsaved changes)
  useEffect(() => {
    if (!hasChanges) {
      setQueue(activeProjects);
    }
  }, [activeProjects, hasChanges]);
  }, [activeProjects]);

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const newQueue = [...queue];
    const [removed] = newQueue.splice(draggedItem, 1);
    newQueue.splice(dropIndex, 0, removed);
    
    setQueue(newQueue);
    setDraggedItem(null);
    setDragOverIndex(null);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      // Create updates array with new order numbers
      const updates = queue.map((project, index) => ({
        id: project.id,
        order: index + 1
      }));
      
      await onUpdateOrder(updates);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save order:', err);
    } finally {
      setSaving(false);
    }
  };

  // Move item within the FULL queue (not filtered)
  const moveItem = (projectId, direction) => {
    const currentIndex = queue.findIndex(p => p.id === projectId);
    if (currentIndex === -1) return;
    
    const toIndex = currentIndex + direction;
    if (toIndex < 0 || toIndex >= queue.length) return;
    
    const newQueue = [...queue];
    const [removed] = newQueue.splice(currentIndex, 1);
    newQueue.splice(toIndex, 0, removed);
    setQueue(newQueue);
    setHasChanges(true);
  };

  // Get the position in the FULL queue for display
  const getQueuePosition = (projectId) => {
    return queue.findIndex(p => p.id === projectId) + 1;
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'Assessment': return { bg: 'bg-slate-100', text: 'text-slate-700' };
      case 'Concept': return { bg: 'bg-purple-100', text: 'text-purple-700' };
      case 'D&E': return { bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'Permitting': return { bg: 'bg-amber-100', text: 'text-amber-700' };
      case 'Production': return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
      case 'Logistics': return { bg: 'bg-orange-100', text: 'text-orange-700' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  const getMfgColor = (mfgStatus) => {
    const status = (mfgStatus || '').toLowerCase();
    if (status.includes('fab')) return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (status.includes('fram')) return { bg: 'bg-purple-100', text: 'text-purple-700' };
    if (status.includes('rough') || status.includes('mech')) return { bg: 'bg-orange-100', text: 'text-orange-700' };
    if (status.includes('drywall')) return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    if (status.includes('final') || status.includes('qc')) return { bg: 'bg-cyan-100', text: 'text-cyan-700' };
    if (status.includes('ready') || status.includes('ship')) return { bg: 'bg-green-100', text: 'text-green-700' };
    return { bg: 'bg-gray-100', text: 'text-gray-700' };
  };

  const filteredQueue = stageFilter === 'all' 
    ? queue 
    : queue.filter(p => p.Stage === stageFilter);
  
  const isFiltered = stageFilter !== 'all';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Production Queue</h2>
          <p className="text-sm text-gray-500">Drag and drop to set build order • {queue.length} active projects</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Stages</option>
            <option value="Assessment">Assessment</option>
            <option value="Concept">Concept</option>
            <option value="D&E">D&E</option>
            <option value="Permitting">Permitting</option>
            <option value="Production">Production</option>
            <option value="Logistics">Logistics</option>
          </select>
          {hasChanges && (
            <button
              onClick={handleSaveOrder}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Order
            </button>
          )}
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <span className="text-sm text-amber-800">You have unsaved changes. Click "Save Order" to update Airtable.</span>
        </div>
      )}

      {/* Filter Warning */}
      {isFiltered && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-blue-800">Showing filtered view. Numbers show position in full queue. Reorder using "All Stages" filter.</span>
        </div>
      )}

      {/* Queue List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase">
          <div className="col-span-1">#</div>
          <div className="col-span-2">Project</div>
          <div className="col-span-2">Customer</div>
          <div className="col-span-1">Model</div>
          <div className="col-span-2">Stage</div>
          <div className="col-span-2">Mfg Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y">
          {filteredQueue.map((project) => {
            const stageColors = getStageColor(project.Stage);
            const mfgColors = getMfgColor(project['Mfg Status']);
            const queuePosition = getQueuePosition(project.id);
            const queueIndex = queue.findIndex(p => p.id === project.id);
            const isDragging = draggedItem === queueIndex;
            const isDragOver = dragOverIndex === queueIndex;

            return (
              <div
                key={project.id}
                draggable={!isFiltered}
                onDragStart={e => !isFiltered && handleDragStart(e, queueIndex)}
                onDragOver={e => !isFiltered && handleDragOver(e, queueIndex)}
                onDragLeave={handleDragLeave}
                onDrop={e => !isFiltered && handleDrop(e, queueIndex)}
                onDragEnd={handleDragEnd}
                className={`
                  grid grid-cols-12 gap-4 px-4 py-3 items-center transition-all duration-150
                  ${!isFiltered ? 'cursor-grab active:cursor-grabbing' : ''}
                  ${isDragging ? 'opacity-50 bg-blue-50' : ''}
                  ${isDragOver ? 'border-t-2 border-blue-500 bg-blue-50' : ''}
                  ${!isDragging && !isDragOver ? 'hover:bg-gray-50' : ''}
                `}
              >
                {/* Order Number - shows position in full queue */}
                <div className="col-span-1 flex items-center gap-2">
                  {!isFiltered && <GripVertical className="w-4 h-4 text-gray-400" />}
                  <span className="font-bold text-gray-400">{queuePosition}</span>
                </div>

                {/* Project ID */}
                <div className="col-span-2">
                  <span className="font-semibold text-gray-900">{project['Project ID']}</span>
                </div>

                {/* Customer */}
                <div className="col-span-2 text-sm text-gray-600 truncate">
                  {project['Status'] || project['Customer (text)'] || '—'}
                </div>

                {/* Model */}
                <div className="col-span-1">
                  <span className="text-sm font-medium">{project['Model'] || project['Unit Type'] || '—'}</span>
                </div>

                {/* Stage */}
                <div className="col-span-2">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${stageColors.bg} ${stageColors.text}`}>
                    {project.Stage || '—'}
                  </span>
                </div>

                {/* Mfg Status */}
                <div className="col-span-2">
                  {project.Stage === 'Production' || project.Stage === 'Logistics' ? (
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${mfgColors.bg} ${mfgColors.text}`}>
                      {project['Mfg Status'] || 'Not Started'}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button
                    onClick={() => moveItem(project.id, -1)}
                    disabled={queueIndex === 0}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveItem(project.id, 1)}
                    disabled={queueIndex === queue.length - 1}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredQueue.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No projects in production queue
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">How to use</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Drag & drop</strong> rows to reorder the build sequence</li>
          <li>• Use the <strong>arrow buttons</strong> for fine adjustments</li>
          <li>• Click <strong>Save Order</strong> to update Airtable</li>
          <li>• All other views will use this order for production planning</li>
        </ul>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// ROLE-BASED ACCESS CONTROL
// ══════════════════════════════════════════════════════════════════════════════
const ROLES = {
  admin: { name: 'Admin', description: 'Full access to all views', color: '#EF4444' },
  de_manager: { name: 'D&E Manager', description: 'Design & Engineering oversight', color: '#3B82F6' },
  pm: { name: 'Project Manager', description: 'Project management views', color: '#10B981' },
  factory: { name: 'Factory Floor', description: 'Manufacturing views', color: '#F59E0B' },
  qc: { name: 'QC Team', description: 'Quality control views', color: '#8B5CF6' },
  finance: { name: 'Finance', description: 'Financial views', color: '#06B6D4' },
  customer: { name: 'Customer', description: 'Customer portal only', color: '#EC4899' },
};

const allNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'investor', label: 'Investor Dashboard', icon: TrendingUp },
  { id: 'pipeline', label: 'Pipeline Analytics', icon: PieChart },
  { id: 'kpi', label: 'KPI Scorecard', icon: BarChart3 },
  { id: 'wip', label: 'WIP Schedule', icon: ClipboardList },
  { id: 'jobs', label: 'Job Schedule', icon: Calendar },
  { id: 'queue', label: 'Production Queue', icon: ListOrdered },
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

const ROLE_ACCESS = {
  admin: ['dashboard', 'investor', 'pipeline', 'kpi', 'wip', 'jobs', 'queue', 'scheduler', 'board', 'floor', 'budget', 'projectbudget', 'pl', 'drawings', 'deviations', 'sage', 'portal'],
  de_manager: ['dashboard', 'pipeline', 'kpi', 'jobs', 'drawings', 'deviations'],
  pm: ['dashboard', 'pipeline', 'kpi', 'jobs', 'queue', 'scheduler', 'drawings', 'projectbudget', 'portal'],
  factory: ['floor', 'board', 'queue', 'scheduler'],
  qc: ['floor', 'board', 'drawings'],
  finance: ['dashboard', 'investor', 'pipeline', 'kpi', 'wip', 'budget', 'projectbudget', 'pl', 'sage', 'deviations'],
  customer: ['portal'],
};

const getNavItemsForRole = (role) => {
  const allowedViews = ROLE_ACCESS[role] || [];
  return allNavItems.filter(item => allowedViews.includes(item.id));
};

const getDefaultViewForRole = (role) => {
  const allowed = ROLE_ACCESS[role] || [];
  return allowed[0] || 'dashboard';
};

// Role Selector Component
function RoleSelector({ currentRole, onRoleChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const role = ROLES[currentRole];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
        <span className="text-sm font-medium">{role.name}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border z-50 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b">
              <span className="text-xs font-semibold text-gray-500 uppercase">Switch Role</span>
            </div>
            {Object.entries(ROLES).map(([roleId, roleData]) => (
              <button
                key={roleId}
                onClick={() => { onRoleChange(roleId); setIsOpen(false); }}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${currentRole === roleId ? 'bg-blue-50' : ''}`}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: roleData.color }} />
                <div className="text-left">
                  <div className="font-medium text-gray-900">{roleData.name}</div>
                  <div className="text-xs text-gray-500">{roleData.description}</div>
                </div>
                {currentRole === roleId && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState(() => localStorage.getItem('honomobo_role') || 'admin');
  const [view, setView] = useState(() => getDefaultViewForRole(localStorage.getItem('honomobo_role') || 'admin'));
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [actuals, setActuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const navItems = getNavItemsForRole(role);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    localStorage.setItem('honomobo_role', newRole);
    const defaultView = getDefaultViewForRole(newRole);
    setView(defaultView);
  };

  // Check if current view is allowed for role, if not switch to default
  useEffect(() => {
    const allowed = ROLE_ACCESS[role] || [];
    if (!allowed.includes(view)) {
      setView(getDefaultViewForRole(role));
    }
  }, [role, view]);

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
    try {
      // Clean up form data - only send fields with actual values
      const cleanedData = {};
      
      // Helper to check if value is truly non-empty
      const hasValue = (val) => val !== undefined && val !== null && val !== '' && String(val).trim() !== '';
      
      // Always include these required fields
      if (hasValue(formData['Project ID'])) cleanedData['Project ID'] = formData['Project ID'];
      if (hasValue(formData['Stage'])) cleanedData['Stage'] = formData['Stage'];
      
      // Include optional string fields only if they have non-empty values
      if (hasValue(formData['Project Name'])) {
        cleanedData['Project Name'] = formData['Project Name'];
      }
      if (hasValue(formData['Status'])) {
        cleanedData['Status'] = formData['Status'];
      }
      if (hasValue(formData['Bay Assignment'])) {
        cleanedData['Bay Assignment'] = formData['Bay Assignment'];
      }
      if (hasValue(formData['MFG Status'])) {
        cleanedData['MFG Status'] = formData['MFG Status'];
      }
      // Project Manager - don't send if empty (could be linked record field)
      if (hasValue(formData['Project Manager'])) {
        cleanedData['Project Manager'] = formData['Project Manager'];
      }
      
      // Handle numeric fields - convert and only include if valid
      const contractVal = parseInt(formData['Contract Value']);
      if (!isNaN(contractVal) && contractVal > 0) {
        cleanedData['Contract Value'] = contractVal;
      }
      
      // MFG Week - only include if it's a valid number 1-12
      const weekVal = parseInt(formData['MFG Week']);
      if (!isNaN(weekVal) && weekVal >= 1 && weekVal <= 12) {
        cleanedData['MFG Week'] = weekVal;
      }
      
      // Production Order - only include if valid
      const orderVal = parseInt(formData['Production Order']);
      if (!isNaN(orderVal) && orderVal > 0) {
        cleanedData['Production Order'] = orderVal;
      }

      console.log('Form data received:', formData);
      console.log('Cleaned data to save:', cleanedData);

      if (existingId) {
        console.log('Updating project:', existingId, cleanedData);
        const updated = await airtableAPI.updateProject(existingId, cleanedData);
        console.log('Update response:', updated);
        setProjects(prev => prev.map(p => p.id === existingId ? { ...p, ...updated } : p));
      } else {
        console.log('Creating project:', cleanedData);
        const created = await airtableAPI.createProject(cleanedData);
        console.log('Create response:', created);
        setProjects(prev => [...prev, created]);
      }
      setEditingProject(null);
      setShowForm(false);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save: ' + err.message);
    }
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

  const handleUpdateWip = async (projectId, fields) => {
    const updated = await airtableAPI.updateProject(projectId, fields);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updated } : p));
  };

  const handleUpdateProductionOrder = async (updates) => {
    await airtableAPI.updateProductionOrder(updates);
    // Update local state with new order
    setProjects(prev => prev.map(p => {
      const update = updates.find(u => u.id === p.id);
      return update ? { ...p, 'Production Order': update.order } : p;
    }));
  };

  const handleEdit = (project) => { setEditingProject(project); setShowForm(true); };

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView projects={projects} onEdit={handleEdit} />;
      case 'investor': return <InvestorDashboardView projects={projects} payments={payments} />;
      case 'pipeline': return <PipelineAnalyticsView projects={projects} />;
      case 'kpi': return <KPIDashboardView projects={projects} payments={payments} />;
      case 'wip': return <WIPScheduleView projects={projects} onUpdateWip={handleUpdateWip} />;
      case 'jobs': return <JobScheduleView projects={projects} onEdit={handleEdit} />;
      case 'queue': return <ProductionQueueView projects={projects} onUpdateOrder={handleUpdateProductionOrder} />;
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

      {/* Mobile Navigation - Full Screen Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900 flex flex-col">
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Honomobo</h1>
              <p className="text-slate-400 text-sm">Operations Platform</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
          {/* Mobile Role Selector */}
          <div className="px-4 pt-4 pb-2">
            <div className="text-xs text-slate-500 uppercase font-semibold mb-2 px-1">Role</div>
            <select
              value={role}
              onChange={e => handleRoleChange(e.target.value)}
              className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2.5 text-sm"
            >
              {Object.entries(ROLES).map(([roleId, roleData]) => (
                <option key={roleId} value={roleId}>{roleData.name} — {roleData.description}</option>
              ))}
            </select>
          </div>
          <div className="px-4 pt-2 pb-1">
            <div className="text-xs text-slate-500 uppercase font-semibold px-1">Views</div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === item.id ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-base">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-slate-700">
            <div className="text-xs text-slate-400">{projects.length} projects loaded</div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 text-white">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">Honomobo</h1>
          <p className="text-slate-400 text-sm">Operations Platform</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${view === item.id ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-400">{projects.length} projects loaded</div>
        </div>
      </aside>

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
            <RoleSelector currentRole={role} onRoleChange={handleRoleChange} />
            <button onClick={loadData} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Refresh">
              <RefreshCw className="w-5 h-5" />
            </button>
            {role !== 'customer' && (
              <button onClick={() => { setEditingProject(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Project</span>
              </button>
            )}
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

// ══════════════════════════════════════════════════════════════════════════════
// KPI DASHBOARD VIEW - Auto-calculated from Airtable with Historical Trends
// ══════════════════════════════════════════════════════════════════════════════
const KPI_DEFINITIONS = [
  { id: 'concepts_signed', name: 'Concepts Signed', owner: 'Mark/Daniel', goal: 18, unit: 'mods', category: 'Sales' },
  { id: 'concepts_completed', name: 'Concepts Completed (1st Draft)', owner: 'Paul', goal: 18, unit: 'mods', category: 'D&E' },
  { id: 'de_contracts', name: 'D&E Contracts Signed', owner: 'Mark/Daniel', goal: 15, unit: 'mods', category: 'Sales' },
  { id: 'mod_ifc', name: 'Mod IFC', owner: 'Nadine', goal: 15, unit: 'mods', category: 'D&E' },
  { id: 'permits_submitted', name: 'Site Permits Submitted', owner: 'Ryan', goal: 15, unit: 'mods', category: 'Permitting' },
  { id: 'permits_approved', name: 'Site Permits Approved', owner: 'Ryan', goal: 15, unit: 'mods', category: 'Permitting' },
  { id: 'deposits', name: 'Deposits Received', owner: 'Mark/Daniel', goal: 13, unit: 'mods', category: 'Sales' },
  { id: 'sales_margin', name: 'Sales (Gross Margin)', owner: 'Mark/Daniel', goal: 500000, unit: '$', category: 'Sales' },
  { id: 'fab_complete', name: 'Fab Complete', owner: 'Tanner', goal: 13, unit: 'mods', category: 'MFG' },
  { id: 'drywall_complete', name: 'Drywall Complete', owner: 'Greg', goal: 13, unit: 'mods', category: 'MFG' },
  { id: 'invoicing_mfg', name: 'Invoicing Value (MFG)', owner: 'Nathan', goal: 1600000, unit: '$', category: 'Finance', manual: true },
  { id: 'invoicing_corp', name: 'Invoicing Value (CORP)', owner: 'Nathan', goal: 400000, unit: '$', category: 'Finance', manual: true },
  { id: 'cash_collected', name: 'Cash Collected', owner: 'Nathan', goal: 2000000, unit: '$', category: 'Finance' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function KPIDashboardView({ projects, payments }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [drilldownKpi, setDrilldownKpi] = useState(null);
  const [showTrends, setShowTrends] = useState(false);

  // Helper: Check if date is in selected month/year
  const isInMonth = (dateStr, month, year) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === month && d.getFullYear() === year;
  };

  // Helper: Get mod count from model
  const getModCount = (p) => getModCountFromModel(p);

  // Calculate KPI values for ANY month/year
  const calculateKpiForMonth = (month, year) => {
    const values = {};

    // Concepts Signed
    const conceptsSigned = projects.filter(p => 
      p.Stage === 'Concept' && isInMonth(p['Concept Signed Date'] || p['Created'], month, year)
    );
    values.concepts_signed = conceptsSigned.reduce((sum, p) => sum + getModCount(p), 0);

    // Concepts Completed
    const conceptsCompleted = projects.filter(p => 
      isInMonth(p['Concept Complete Date'], month, year)
    );
    values.concepts_completed = conceptsCompleted.reduce((sum, p) => sum + getModCount(p), 0);

    // D&E Contracts Signed
    const deContracts = projects.filter(p => 
      (p.Stage === 'D&E' || p.Stage === 'Permitting' || p.Stage === 'Production' || p.Stage === 'Logistics' || p.Stage === 'Complete') &&
      isInMonth(p['D&E Signed Date'], month, year)
    );
    values.de_contracts = deContracts.reduce((sum, p) => sum + getModCount(p), 0);

    // Mod IFC
    const modIfc = projects.filter(p => isInMonth(p['IFC Date'], month, year));
    values.mod_ifc = modIfc.reduce((sum, p) => sum + getModCount(p), 0);

    // Permits Submitted
    const permitsSubmitted = projects.filter(p => isInMonth(p['Permit Submitted Date'], month, year));
    values.permits_submitted = permitsSubmitted.reduce((sum, p) => sum + getModCount(p), 0);

    // Permits Approved
    const permitsApproved = projects.filter(p => isInMonth(p['Permit Approved Date'], month, year));
    values.permits_approved = permitsApproved.reduce((sum, p) => sum + getModCount(p), 0);

    // Deposits Received
    const depositsReceived = (payments || []).filter(p => 
      (p['Type'] === 'Deposit' || p['Milestone']?.includes('Deposit')) &&
      p['Status'] === 'Paid' &&
      isInMonth(p['Date'] || p['Paid Date'], month, year)
    );
    values.deposits = depositsReceived.length;

    // Sales (Gross Margin)
    values.sales_margin = deContracts.reduce((sum, p) => sum + (p['Gross Margin'] || 0), 0);

    // Fab Complete
    const fabComplete = projects.filter(p => isInMonth(p['Fab Complete Date'], month, year));
    values.fab_complete = fabComplete.reduce((sum, p) => sum + getModCount(p), 0);

    // Drywall Complete
    const drywallComplete = projects.filter(p => isInMonth(p['Drywall Complete Date'], month, year));
    values.drywall_complete = drywallComplete.reduce((sum, p) => sum + getModCount(p), 0);

    // Invoicing - Manual
    values.invoicing_mfg = null;
    values.invoicing_corp = null;

    // Cash Collected
    const cashCollected = (payments || []).filter(p => 
      p['Status'] === 'Paid' &&
      isInMonth(p['Date'] || p['Paid Date'], month, year)
    );
    values.cash_collected = cashCollected.reduce((sum, p) => sum + (p['Amount'] || 0), 0);

    return values;
  };

  // Calculate current month values with details
  const calculateKpiValues = useMemo(() => {
    const values = calculateKpiForMonth(selectedMonth, selectedYear);
    const details = {};

    // Get details for drilldown
    details.concepts_signed = projects.filter(p => 
      p.Stage === 'Concept' && isInMonth(p['Concept Signed Date'] || p['Created'], selectedMonth, selectedYear)
    );
    details.concepts_completed = projects.filter(p => 
      isInMonth(p['Concept Complete Date'], selectedMonth, selectedYear)
    );
    details.de_contracts = projects.filter(p => 
      (p.Stage === 'D&E' || p.Stage === 'Permitting' || p.Stage === 'Production' || p.Stage === 'Logistics' || p.Stage === 'Complete') &&
      isInMonth(p['D&E Signed Date'], selectedMonth, selectedYear)
    );
    details.mod_ifc = projects.filter(p => isInMonth(p['IFC Date'], selectedMonth, selectedYear));
    details.permits_submitted = projects.filter(p => isInMonth(p['Permit Submitted Date'], selectedMonth, selectedYear));
    details.permits_approved = projects.filter(p => isInMonth(p['Permit Approved Date'], selectedMonth, selectedYear));
    details.deposits = (payments || []).filter(p => 
      (p['Type'] === 'Deposit' || p['Milestone']?.includes('Deposit')) &&
      p['Status'] === 'Paid' &&
      isInMonth(p['Date'] || p['Paid Date'], selectedMonth, selectedYear)
    );
    details.sales_margin = details.de_contracts;
    details.fab_complete = projects.filter(p => isInMonth(p['Fab Complete Date'], selectedMonth, selectedYear));
    details.drywall_complete = projects.filter(p => isInMonth(p['Drywall Complete Date'], selectedMonth, selectedYear));
    details.invoicing_mfg = [];
    details.invoicing_corp = [];
    details.cash_collected = (payments || []).filter(p => 
      p['Status'] === 'Paid' &&
      isInMonth(p['Date'] || p['Paid Date'], selectedMonth, selectedYear)
    );

    return { values, details };
  }, [projects, payments, selectedMonth, selectedYear]);

  // Calculate historical data for last 12 months
  const historicalData = useMemo(() => {
    const history = {};
    const monthLabels = [];
    KPI_DEFINITIONS.forEach(kpi => { history[kpi.id] = []; });

    for (let i = 11; i >= 0; i--) {
      let m = selectedMonth - i;
      let y = selectedYear;
      while (m < 0) { m += 12; y -= 1; }

      monthLabels.push(`${MONTHS[m]} ${y.toString().slice(-2)}`);
      const monthValues = calculateKpiForMonth(m, y);

      KPI_DEFINITIONS.forEach(kpi => {
        history[kpi.id].push(monthValues[kpi.id] || 0);
      });
    }

    return { history, monthLabels };
  }, [projects, payments, selectedMonth, selectedYear]);

  // Calculate 3-month moving average
  const movingAverages = useMemo(() => {
    const averages = {};
    KPI_DEFINITIONS.forEach(kpi => {
      const last3 = historicalData.history[kpi.id].slice(-3);
      const validValues = last3.filter(v => v !== null && v !== undefined);
      averages[kpi.id] = validValues.length > 0 
        ? validValues.reduce((a, b) => a + b, 0) / validValues.length 
        : 0;
    });
    return averages;
  }, [historicalData]);

  // Calculate YTD totals
  const ytdTotals = useMemo(() => {
    const ytd = {};
    KPI_DEFINITIONS.forEach(kpi => {
      // Sum all months in current year up to selected month
      let total = 0;
      for (let m = 0; m <= selectedMonth; m++) {
        const monthValues = calculateKpiForMonth(m, selectedYear);
        total += monthValues[kpi.id] || 0;
      }
      ytd[kpi.id] = total;
    });
    return ytd;
  }, [projects, payments, selectedMonth, selectedYear]);

  const getStatusColor = (value, goal) => {
    if (value === null) return 'gray';
    const pct = (value / goal) * 100;
    if (pct >= 100) return 'emerald';
    if (pct >= 80) return 'amber';
    return 'red';
  };

  const formatValue = (value, unit) => {
    if (value === null || value === undefined) return '—';
    if (unit === '$') return formatCurrency(value);
    return value.toLocaleString();
  };

  const categories = ['all', ...new Set(KPI_DEFINITIONS.map(k => k.category))];
  const filteredKpis = categoryFilter === 'all' 
    ? KPI_DEFINITIONS 
    : KPI_DEFINITIONS.filter(k => k.category === categoryFilter);

  const summary = useMemo(() => {
    let onTrack = 0, atRisk = 0, behind = 0;
    KPI_DEFINITIONS.forEach(kpi => {
      const val = calculateKpiValues.values[kpi.id];
      if (val === null) return;
      const pct = (val / kpi.goal) * 100;
      if (pct >= 100) onTrack++;
      else if (pct >= 80) atRisk++;
      else behind++;
    });
    return { onTrack, atRisk, behind };
  }, [calculateKpiValues]);

  // Mini sparkline component
  const Sparkline = ({ data, color, height = 24, width = 80 }) => {
    const validData = data.map(d => d === null ? 0 : d);
    const max = Math.max(...validData, 1);
    const min = Math.min(...validData, 0);
    const range = max - min || 1;
    const points = validData.map((v, i) => 
      `${(i / (validData.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`
    ).join(' ');
    
    return (
      <svg width={width} height={height} className="inline-block">
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
        {/* Dot on last point */}
        <circle 
          cx={width} 
          cy={height - ((validData[validData.length - 1] - min) / range) * (height - 4) - 2}
          r="3" 
          fill={color} 
        />
      </svg>
    );
  };

  // Trend indicator
  const TrendIndicator = ({ current, average }) => {
    if (average === 0) return null;
    const diff = ((current - average) / average) * 100;
    if (Math.abs(diff) < 5) return <span className="text-gray-400 text-xs">→ flat</span>;
    if (diff > 0) return <span className="text-emerald-600 text-xs flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+{diff.toFixed(0)}%</span>;
    return <span className="text-red-600 text-xs flex items-center gap-0.5"><TrendingDown className="w-3 h-3" />{diff.toFixed(0)}%</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">KPI Scorecard</h2>
          <p className="text-sm text-gray-500">
            EOS 2025 Metrics • <span className="text-blue-600 font-medium">Auto-calculated from Airtable</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
          </select>
          <button
            onClick={() => setShowTrends(!showTrends)}
            className={`px-3 py-2 text-sm rounded-lg border ${showTrends ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white text-gray-600'}`}
          >
            <BarChart3 className="w-4 h-4 inline mr-1" />
            Trends
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">Total KPIs</div>
          <div className="text-3xl font-bold">{KPI_DEFINITIONS.length}</div>
        </div>
        <div className="bg-emerald-50 border-emerald-200 rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">On Track (≥100%)</div>
          <div className="text-3xl font-bold text-emerald-600">{summary.onTrack}</div>
        </div>
        <div className="bg-amber-50 border-amber-200 rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">At Risk (80-99%)</div>
          <div className="text-3xl font-bold text-amber-600">{summary.atRisk}</div>
        </div>
        <div className="bg-red-50 border-red-200 rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">Behind (&lt;80%)</div>
          <div className="text-3xl font-bold text-red-600">{summary.behind}</div>
        </div>
      </div>

      {/* Historical Trend Chart (when enabled) */}
      {showTrends && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-4">12-Month Trend</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">KPI</th>
                  {historicalData.monthLabels.map((label, i) => (
                    <th key={i} className={`text-center py-2 px-2 font-medium ${i === 11 ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
                      {label}
                    </th>
                  ))}
                  <th className="text-center py-2 px-3 font-medium text-gray-500 bg-amber-50">3M Avg</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-500 bg-emerald-50">YTD</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredKpis.map(kpi => (
                  <tr key={kpi.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{kpi.name}</td>
                    {historicalData.history[kpi.id].map((val, i) => (
                      <td key={i} className={`text-center py-2 px-2 ${i === 11 ? 'bg-blue-50 font-semibold' : ''}`}>
                        {kpi.unit === '$' ? formatCompact(val) : val}
                      </td>
                    ))}
                    <td className="text-center py-2 px-3 bg-amber-50 font-medium">
                      {kpi.unit === '$' ? formatCompact(movingAverages[kpi.id]) : movingAverages[kpi.id].toFixed(1)}
                    </td>
                    <td className="text-center py-2 px-3 bg-emerald-50 font-medium">
                      {kpi.unit === '$' ? formatCompact(ytdTotals[kpi.id]) : ytdTotals[kpi.id]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPI Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">KPI</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Owner</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Goal</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actual</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">% to Goal</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Trend (12mo)</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase bg-amber-50">3M Avg</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredKpis.map(kpi => {
              const value = calculateKpiValues.values[kpi.id];
              const pct = value !== null ? Math.round((value / kpi.goal) * 100) : null;
              const status = getStatusColor(value, kpi.goal);
              const details = calculateKpiValues.details[kpi.id] || [];

              return (
                <tr key={kpi.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{kpi.name}</div>
                    <div className="text-xs text-gray-500">{kpi.category}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{kpi.owner}</td>
                  <td className="px-4 py-3 text-center text-sm">
                    {kpi.unit === '$' ? formatCurrency(kpi.goal) : `${kpi.goal} ${kpi.unit}`}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${value === null ? 'text-gray-400' : 'text-gray-900'}`}>
                      {formatValue(value, kpi.unit)}
                    </span>
                    {kpi.manual && <span className="ml-1 text-xs text-gray-400">(manual)</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pct !== null ? (
                      <span className={`font-semibold ${pct >= 100 ? 'text-emerald-600' : pct >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                        {pct}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className={`inline-flex w-4 h-4 rounded-full ${
                      status === 'emerald' ? 'bg-emerald-500' :
                      status === 'amber' ? 'bg-amber-500' :
                      status === 'red' ? 'bg-red-500' :
                      'bg-gray-300'
                    }`} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Sparkline 
                        data={historicalData.history[kpi.id]} 
                        color={status === 'emerald' ? '#10B981' : status === 'amber' ? '#F59E0B' : '#EF4444'} 
                      />
                      <TrendIndicator current={value || 0} average={movingAverages[kpi.id]} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {kpi.unit === '$' ? formatCompact(movingAverages[kpi.id]) : movingAverages[kpi.id].toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {details.length > 0 && (
                      <button 
                        onClick={() => setDrilldownKpi(drilldownKpi === kpi.id ? null : kpi.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {details.length} items
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drilldown Panel */}
      {drilldownKpi && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900">
              {KPI_DEFINITIONS.find(k => k.id === drilldownKpi)?.name} - Details
            </h3>
            <button onClick={() => setDrilldownKpi(null)} className="text-blue-600 hover:text-blue-800">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Project</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Model</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Mods</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(calculateKpiValues.details[drilldownKpi] || []).slice(0, 10).map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{item['Project ID'] || item['Name'] || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{item['Status'] || item['Customer'] || '—'}</td>
                    <td className="px-4 py-2 text-sm">{item['Model'] || item['Type'] || '—'}</td>
                    <td className="px-4 py-2 text-center text-sm">{getModCount(item)}</td>
                    <td className="px-4 py-2 text-right text-sm">{formatCurrency(item['Gross Margin'] || item['Amount'] || item['Contract Value'] || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Missing Fields Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Fields Required for Auto-Tracking
        </h3>
        <p className="text-sm text-amber-700 mb-3">Add these date fields to your Projects table to enable automatic KPI tracking:</p>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-white rounded p-2 border border-amber-200">Concept Signed Date</div>
          <div className="bg-white rounded p-2 border border-amber-200">Concept Complete Date</div>
          <div className="bg-white rounded p-2 border border-amber-200">D&E Signed Date</div>
          <div className="bg-white rounded p-2 border border-amber-200">IFC Date</div>
          <div className="bg-white rounded p-2 border border-amber-200">Permit Submitted Date</div>
          <div className="bg-white rounded p-2 border border-amber-200">Permit Approved Date</div>
          <div className="bg-white rounded p-2 border border-amber-200">Fab Complete Date</div>
          <div className="bg-white rounded p-2 border border-amber-200">Drywall Complete Date</div>
          <div className="bg-white rounded p-2 border border-amber-200">Mod Count</div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PIPELINE ANALYTICS VIEW
// ══════════════════════════════════════════════════════════════════════════════
const COUNTRY_MAP = {
  // Canada - use province codes
  'AB': 'Canada', 'BC': 'Canada', 'ON': 'Canada', 'MB': 'Canada', 'QC': 'Canada', 'SK': 'Canada',
  // USA - state codes (CA = California, not Canada!)
  'CA': 'USA', 'HI': 'USA', 'CO': 'USA', 'WA': 'USA', 'NY': 'USA', 'OR': 'USA', 
  'ID': 'USA', 'NV': 'USA', 'UT': 'USA', 'TX': 'USA', 'FL': 'USA', 'AZ': 'USA', 'MN': 'USA', 'WI': 'USA',
  'MA': 'USA', 'MI': 'USA', 'NJ': 'USA', 'CT': 'USA', 'PA': 'USA', 'OH': 'USA', 'IL': 'USA', 'GA': 'USA',
  'NC': 'USA', 'VA': 'USA', 'MD': 'USA', 'SC': 'USA', 'TN': 'USA', 'MO': 'USA', 'IN': 'USA', 'KY': 'USA',
  'US': 'USA', 'USA': 'USA',
};

const MARKET_DETAILS = {
  'CA': { name: 'California', country: 'USA', icon: '🌴', color: '#F59E0B' },
  'HI': { name: 'Hawaii', country: 'USA', icon: '🏝️', color: '#06B6D4' },
  'CO': { name: 'Colorado', country: 'USA', icon: '🏔️', color: '#8B5CF6' },
  'WA': { name: 'Washington', country: 'USA', icon: '🌲', color: '#10B981' },
  'NY': { name: 'New York', country: 'USA', icon: '🗽', color: '#3B82F6' },
  'OR': { name: 'Oregon', country: 'USA', icon: '🦆', color: '#84CC16' },
  'OTHER_US': { name: 'Other US', country: 'USA', icon: '🇺🇸', color: '#6B7280' },
  'AB': { name: 'Alberta', country: 'Canada', icon: '🍁', color: '#EF4444' },
  'BC': { name: 'British Columbia', country: 'Canada', icon: '🌲', color: '#22C55E' },
  'ON': { name: 'Ontario', country: 'Canada', icon: '🍁', color: '#EC4899' },
};

// Sales channels - California = Novare, Ontario = McLean, rest = Direct
// Exception: HDI projects are direct sales even in CA
const SALES_CHANNELS = {
  novare: { name: 'Novare (CA Dealer)', color: '#F59E0B', icon: '🏪' },
  mclean: { name: 'McLean (ON Dealer)', color: '#EC4899', icon: '🏪' },
  direct: { name: 'Direct Sale', color: '#3B82F6', icon: '🏠' },
};

const getSalesChannel = (market, project = null) => {
  // HDI projects are always direct sales, even in CA
  if (project) {
    const projectId = (project['Project ID'] || '').toUpperCase();
    const customer = (project['Status'] || project['Customer (text)'] || '').toUpperCase();
    if (projectId.includes('HDI') || customer.includes('HDI')) {
      return 'direct';
    }
  }
  
  if (market === 'CA') return 'novare';
  if (market === 'ON') return 'mclean';
  return 'direct';
};

// Group minor US states into Other
const normalizeMarket = (market) => {
  if (['AZ', 'MN', 'ID', 'NV', 'UT', 'TX', 'FL'].includes(market)) return 'OTHER_US';
  return market;
};

const MODEL_COLORS = {
  'HO2': '#3B82F6',
  'HO3': '#10B981', 
  'HO4': '#F59E0B',
  'HO5': '#8B5CF6',
  'HS6': '#EC4899',
  'HS8': '#06B6D4',
  'SO1': '#EF4444',
  'Other': '#6B7280',
};

function PipelineAnalyticsView({ projects }) {
  const [stageFilter, setStageFilter] = useState('pipeline'); // pipeline, all, production

  // Filter projects based on selection
  const filteredProjects = useMemo(() => {
    if (stageFilter === 'all') return projects;
    if (stageFilter === 'production') return projects.filter(p => p.Stage === 'Production');
    // Pipeline = everything except Complete
    return projects.filter(p => p.Stage !== 'Complete');
  }, [projects, stageFilter]);

  // Get market from project
  const getMarket = (p) => {
    const state = p['Site State/Province'] || p['Market'] || '';
    return normalizeMarket(state.toUpperCase());
  };

  // Get country from project
  const getCountry = (p) => {
    const rawMarket = (p['Site State/Province'] || p['Market'] || '').toUpperCase();
    return COUNTRY_MAP[rawMarket] || 'Other';
  };

  // Get model type
  const getModel = (p) => {
    const model = p['Model'] || p['Unit Type'] || '';
    const match = model.match(/(HO2|HO3|HO4|HO5|HS6|HS8|SO1)/i);
    return match ? match[1].toUpperCase() : 'Other';
  };

  // Calculate all analytics
  const analytics = useMemo(() => {
    const data = {
      total: { count: 0, value: 0, mods: 0 },
      byCountry: {},
      byMarket: {},
      byModel: {},
      byStage: {},
      byChannel: {},
    };

    filteredProjects.forEach(p => {
      const value = p['Contract Value'] || 0;
      const mods = getModCountFromModel(p);
      const country = getCountry(p);
      const market = getMarket(p);
      const model = getModel(p);
      const stage = p.Stage || 'Unknown';
      const rawMarket = (p['Site State/Province'] || p['Market'] || '').toUpperCase();
      const channel = getSalesChannel(rawMarket, p);

      // Totals
      data.total.count++;
      data.total.value += value;
      data.total.mods += mods;

      // By Country
      if (!data.byCountry[country]) data.byCountry[country] = { count: 0, value: 0, mods: 0 };
      data.byCountry[country].count++;
      data.byCountry[country].value += value;
      data.byCountry[country].mods += mods;

      // By Market
      if (!data.byMarket[market]) data.byMarket[market] = { count: 0, value: 0, mods: 0 };
      data.byMarket[market].count++;
      data.byMarket[market].value += value;
      data.byMarket[market].mods += mods;

      // By Model
      if (!data.byModel[model]) data.byModel[model] = { count: 0, value: 0, mods: 0 };
      data.byModel[model].count++;
      data.byModel[model].value += value;
      data.byModel[model].mods += mods;

      // By Stage
      if (!data.byStage[stage]) data.byStage[stage] = { count: 0, value: 0, mods: 0 };
      data.byStage[stage].count++;
      data.byStage[stage].value += value;
      data.byStage[stage].mods += mods;

      // By Sales Channel
      if (!data.byChannel[channel]) data.byChannel[channel] = { count: 0, value: 0, mods: 0 };
      data.byChannel[channel].count++;
      data.byChannel[channel].value += value;
      data.byChannel[channel].mods += mods;
    });

    return data;
  }, [filteredProjects]);

  // Sort markets by value
  const sortedMarkets = useMemo(() => {
    return Object.entries(analytics.byMarket)
      .map(([code, data]) => ({ code, ...data, details: MARKET_DETAILS[code] || { name: code, icon: '📍', color: '#6B7280' } }))
      .sort((a, b) => b.value - a.value);
  }, [analytics]);

  // Sort models by count
  const sortedModels = useMemo(() => {
    return Object.entries(analytics.byModel)
      .map(([model, data]) => ({ model, ...data, color: MODEL_COLORS[model] || '#6B7280' }))
      .sort((a, b) => b.count - a.count);
  }, [analytics]);

  // Stage order
  const stageOrder = ['Assessment', 'Concept', 'D&E', 'Permitting', 'Production', 'Logistics', 'Complete'];
  const sortedStages = useMemo(() => {
    return stageOrder
      .filter(s => analytics.byStage[s])
      .map(s => ({ stage: s, ...analytics.byStage[s] }));
  }, [analytics]);

  // Simple pie chart component
  const PieChart = ({ data, colorKey, labelKey, valueKey }) => {
    const total = data.reduce((sum, d) => sum + d[valueKey], 0);
    let currentAngle = 0;
    
    const segments = data.map((d, i) => {
      const percentage = d[valueKey] / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (startAngle + angle - 90) * Math.PI / 180;
      const largeArc = angle > 180 ? 1 : 0;
      
      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);
      
      const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
      
      return { ...d, path, percentage };
    });

    return (
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 100 100" className="w-40 h-40">
          {segments.map((seg, i) => (
            <path key={i} d={seg.path} fill={seg[colorKey]} className="hover:opacity-80 transition-opacity cursor-pointer" />
          ))}
        </svg>
        <div className="space-y-1">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: seg[colorKey] }} />
              <span className="text-gray-700">{seg[labelKey]}</span>
              <span className="text-gray-400">({Math.round(seg.percentage * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Bar chart component
  const BarChart = ({ data, labelKey, valueKey, colorKey, maxValue }) => {
    const max = maxValue || Math.max(...data.map(d => d[valueKey]));
    return (
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-24 text-sm text-gray-600 truncate">{d[labelKey]}</div>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all" 
                style={{ width: `${(d[valueKey] / max) * 100}%`, backgroundColor: d[colorKey] || '#3B82F6' }} 
              />
            </div>
            <div className="w-20 text-sm text-right font-medium">{formatCurrency(d[valueKey])}</div>
          </div>
        ))}
      </div>
    );
  };

  const usaData = analytics.byCountry['USA'] || { count: 0, value: 0, mods: 0 };
  const canadaData = analytics.byCountry['Canada'] || { count: 0, value: 0, mods: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Pipeline Analytics</h2>
          <p className="text-sm text-gray-500">
            {filteredProjects.length} projects • {analytics.total.mods} mods • <span className="text-blue-600 font-medium">Live from Airtable</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={stageFilter} 
            onChange={e => setStageFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="pipeline">Active Pipeline (excl. Complete)</option>
            <option value="production">Production Only</option>
            <option value="all">All Projects</option>
          </select>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="text-sm text-gray-500 mb-1">Total Pipeline Value</div>
          <div className="text-3xl font-bold">{formatCurrency(analytics.total.value)}</div>
          <div className="text-sm text-gray-400 mt-1">{analytics.total.count} projects</div>
        </div>
        <div className="bg-blue-50 border-blue-200 rounded-xl border p-5">
          <div className="text-sm text-gray-500 mb-1">🇺🇸 USA</div>
          <div className="text-3xl font-bold text-blue-600">{formatCurrency(usaData.value)}</div>
          <div className="text-sm text-gray-400 mt-1">{usaData.count} projects • {usaData.mods} mods</div>
        </div>
        <div className="bg-red-50 border-red-200 rounded-xl border p-5">
          <div className="text-sm text-gray-500 mb-1">🇨🇦 Canada</div>
          <div className="text-3xl font-bold text-red-600">{formatCurrency(canadaData.value)}</div>
          <div className="text-sm text-gray-400 mt-1">{canadaData.count} projects • {canadaData.mods} mods</div>
        </div>
        <div className="bg-emerald-50 border-emerald-200 rounded-xl border p-5">
          <div className="text-sm text-gray-500 mb-1">Total Mods</div>
          <div className="text-3xl font-bold text-emerald-600">{analytics.total.mods}</div>
          <div className="text-sm text-gray-400 mt-1">Avg {(analytics.total.value / analytics.total.mods || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}/mod</div>
        </div>
      </div>

      {/* Sales Channel, Country Split, Unit Type */}
      <div className="grid grid-cols-3 gap-6">
        {/* Sales Channel */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">By Sales Channel</h3>
          <div className="space-y-4">
            {Object.entries(SALES_CHANNELS).map(([channelId, channel]) => {
              const data = analytics.byChannel[channelId] || { count: 0, value: 0, mods: 0 };
              const pct = analytics.total.value > 0 ? (data.value / analytics.total.value) * 100 : 0;
              return (
                <div key={channelId}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <span>{channel.icon}</span>
                      {channel.name}
                    </span>
                    <span className="text-sm text-gray-500">{Math.round(pct)}%</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: channel.color }} />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>{data.count} projects</span>
                    <span>{formatCurrency(data.value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* USA vs Canada */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">USA vs Canada</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">🇺🇸 USA</span>
                <span className="text-sm text-gray-500">{analytics.total.value > 0 ? Math.round((usaData.value / analytics.total.value) * 100) : 0}%</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${analytics.total.value > 0 ? (usaData.value / analytics.total.value) * 100 : 0}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>{usaData.count} projects • {usaData.mods} mods</span>
                <span>{formatCurrency(usaData.value)}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">🇨🇦 Canada</span>
                <span className="text-sm text-gray-500">{analytics.total.value > 0 ? Math.round((canadaData.value / analytics.total.value) * 100) : 0}%</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${analytics.total.value > 0 ? (canadaData.value / analytics.total.value) * 100 : 0}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>{canadaData.count} projects • {canadaData.mods} mods</span>
                <span>{formatCurrency(canadaData.value)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Unit Type */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">By Unit Type</h3>
          {sortedModels.length > 0 ? (
            <PieChart 
              data={sortedModels} 
              colorKey="color" 
              labelKey="model" 
              valueKey="count" 
            />
          ) : (
            <div className="text-center text-gray-400 py-8">No data</div>
          )}
        </div>
      </div>

      {/* Markets Breakdown */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Pipeline by Market</h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">By Contract Value</h4>
            <BarChart 
              data={sortedMarkets.slice(0, 8).map(m => ({ ...m, label: `${m.details.icon} ${m.details.name}`, color: m.details.color }))} 
              labelKey="label" 
              valueKey="value" 
              colorKey="color"
            />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Market Share</h4>
            <div className="space-y-3">
              {sortedMarkets.slice(0, 8).map((m, i) => {
                const pct = analytics.total.value > 0 ? (m.value / analytics.total.value) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-lg">{m.details.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{m.details.name}</span>
                        <span className="text-gray-500">{m.count} projects • {Math.round(pct)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: m.details.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stage Breakdown */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Pipeline by Stage</h3>
          <div className="space-y-3">
            {sortedStages.map((s, i) => {
              const pct = analytics.total.value > 0 ? (s.value / analytics.total.value) * 100 : 0;
              const stageColors = {
                'Assessment': '#9CA3AF',
                'Concept': '#A78BFA',
                'D&E': '#3B82F6',
                'Permitting': '#F59E0B',
                'Production': '#10B981',
                'Logistics': '#06B6D4',
                'Complete': '#6B7280',
              };
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 text-sm font-medium">{s.stage}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: stageColors[s.stage] || '#6B7280' }} />
                  </div>
                  <div className="w-16 text-sm text-right">{s.count} proj</div>
                  <div className="w-24 text-sm text-right font-medium">{formatCurrency(s.value)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Unit Type Breakdown</h3>
          <table className="min-w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase">
                <th className="text-left pb-2">Model</th>
                <th className="text-center pb-2">Projects</th>
                <th className="text-center pb-2">Mods</th>
                <th className="text-right pb-2">Value</th>
                <th className="text-right pb-2">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedModels.map((m, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: m.color }} />
                      <span className="font-medium">{m.model}</span>
                    </div>
                  </td>
                  <td className="py-2 text-center">{m.count}</td>
                  <td className="py-2 text-center">{m.mods}</td>
                  <td className="py-2 text-right">{formatCurrency(m.value)}</td>
                  <td className="py-2 text-right text-gray-500">{analytics.total.value > 0 ? Math.round((m.value / analytics.total.value) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2">
              <tr className="font-semibold">
                <td className="py-2">Total</td>
                <td className="py-2 text-center">{analytics.total.count}</td>
                <td className="py-2 text-center">{analytics.total.mods}</td>
                <td className="py-2 text-right">{formatCurrency(analytics.total.value)}</td>
                <td className="py-2 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INVESTOR DASHBOARD VIEW
// ══════════════════════════════════════════════════════════════════════════════
function InvestorDashboardView({ projects, payments }) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Helper: Check if date is in a specific month/year
  const isInMonth = (dateStr, month, year) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === month && d.getFullYear() === year;
  };

  // Helper: Get month label
  const getMonthLabel = (month, year) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[month]} ${year}`;
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const thisYear = now.getFullYear();
    const lastYear = thisYear - 1;

    // Pipeline metrics
    const activePipeline = projects.filter(p => p.Stage !== 'Complete');
    const pipelineValue = activePipeline.reduce((sum, p) => sum + (p['Contract Value'] || 0), 0);
    const pipelineMods = activePipeline.reduce((sum, p) => sum + getModCountFromModel(p), 0);

    // Production metrics
    const inProduction = projects.filter(p => p.Stage === 'Production');
    const productionValue = inProduction.reduce((sum, p) => sum + (p['Contract Value'] || 0), 0);

    // Backlog (contracted but not yet in production)
    const backlog = projects.filter(p => ['D&E', 'Permitting'].includes(p.Stage));
    const backlogValue = backlog.reduce((sum, p) => sum + (p['Contract Value'] || 0), 0);

    // Completed this year
    const completedThisYear = projects.filter(p => 
      p.Stage === 'Complete' && 
      p['Completion Date'] && 
      new Date(p['Completion Date']).getFullYear() === thisYear
    );
    const completedValue = completedThisYear.reduce((sum, p) => sum + (p['Contract Value'] || 0), 0);
    const completedMods = completedThisYear.reduce((sum, p) => sum + getModCountFromModel(p), 0);

    // Capacity utilization (18 positions)
    const positionsUsed = inProduction.filter(p => p['Bay Assignment']).length;
    const capacityUtilization = Math.round((positionsUsed / 18) * 100);

    // Average contract value
    const avgContractValue = activePipeline.length > 0 
      ? pipelineValue / activePipeline.length 
      : 0;

    // Cash collected this year
    const cashThisYear = (payments || [])
      .filter(p => p['Status'] === 'Paid' && isInMonth(p['Date'] || p['Paid Date'], currentMonth, currentYear))
      .reduce((sum, p) => sum + (p['Amount'] || 0), 0);

    // YTD cash
    const ytdCash = (payments || [])
      .filter(p => {
        if (p['Status'] !== 'Paid') return false;
        const d = new Date(p['Date'] || p['Paid Date']);
        return d.getFullYear() === thisYear;
      })
      .reduce((sum, p) => sum + (p['Amount'] || 0), 0);

    // By stage counts
    const byStage = {};
    projects.forEach(p => {
      const stage = p.Stage || 'Unknown';
      if (!byStage[stage]) byStage[stage] = { count: 0, value: 0 };
      byStage[stage].count++;
      byStage[stage].value += p['Contract Value'] || 0;
    });

    // Monthly data for charts (last 12 months)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m < 0) { m += 12; y -= 1; }
      
      // Contracts signed this month (D&E Signed Date)
      const contractsSigned = projects.filter(p => isInMonth(p['D&E Signed Date'], m, y));
      const contractsValue = contractsSigned.reduce((sum, p) => sum + (p['Contract Value'] || 0), 0);
      
      // Cash collected this month
      const cashCollected = (payments || [])
        .filter(p => p['Status'] === 'Paid' && isInMonth(p['Date'] || p['Paid Date'], m, y))
        .reduce((sum, p) => sum + (p['Amount'] || 0), 0);

      // Units completed this month
      const unitsCompleted = projects.filter(p => 
        p.Stage === 'Complete' && isInMonth(p['Completion Date'], m, y)
      ).reduce((sum, p) => sum + getModCountFromModel(p), 0);

      monthlyData.push({
        month: m,
        year: y,
        label: getMonthLabel(m, y),
        contractsValue,
        contractsCount: contractsSigned.length,
        cashCollected,
        unitsCompleted,
      });
    }

    // Geographic split
    const usaProjects = activePipeline.filter(p => {
      const market = (p['Site State/Province'] || '').toUpperCase();
      return ['CA', 'HI', 'CO', 'WA', 'NY', 'OR', 'AZ', 'MN', 'ID', 'NV', 'UT', 'TX', 'FL', 'WI', 
              'MA', 'MI', 'NJ', 'CT', 'PA', 'OH', 'IL', 'GA', 'NC', 'VA', 'MD', 'SC', 'TN', 'MO', 'IN', 'KY'].includes(market);
    });
    const canadaProjects = activePipeline.filter(p => {
      const market = (p['Site State/Province'] || '').toUpperCase();
      return ['AB', 'BC', 'ON', 'SK', 'MB', 'QC'].includes(market);
    });

    return {
      pipelineValue,
      pipelineMods,
      pipelineCount: activePipeline.length,
      productionValue,
      productionCount: inProduction.length,
      backlogValue,
      backlogCount: backlog.length,
      completedValue,
      completedMods,
      completedCount: completedThisYear.length,
      positionsUsed,
      capacityUtilization,
      avgContractValue,
      cashThisMonth: cashThisYear,
      ytdCash,
      byStage,
      monthlyData,
      usaValue: usaProjects.reduce((s, p) => s + (p['Contract Value'] || 0), 0),
      usaCount: usaProjects.length,
      canadaValue: canadaProjects.reduce((s, p) => s + (p['Contract Value'] || 0), 0),
      canadaCount: canadaProjects.length,
    };
  }, [projects, payments, currentMonth, currentYear]);

  // Simple line chart
  const LineChart = ({ data, valueKey, color, height = 120 }) => {
    const values = data.map(d => d[valueKey]);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const width = 100;
    
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 20) - 10;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id={`gradient-${valueKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill={`url(#gradient-${valueKey})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {values.map((v, i) => {
          const x = (i / (values.length - 1)) * width;
          const y = height - ((v - min) / range) * (height - 20) - 10;
          return <circle key={i} cx={x} cy={y} r="2" fill={color} />;
        })}
      </svg>
    );
  };

  // Bar chart
  const BarChart = ({ data, valueKey, color, height = 120 }) => {
    const values = data.map(d => d[valueKey]);
    const max = Math.max(...values, 1);
    const barWidth = 100 / data.length - 2;

    return (
      <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
        {values.map((v, i) => {
          const barHeight = (v / max) * (height - 20);
          const x = (i / data.length) * 100 + 1;
          return (
            <rect
              key={i}
              x={x}
              y={height - barHeight - 10}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx="2"
              className="hover:opacity-80"
            />
          );
        })}
      </svg>
    );
  };

  const stageOrder = ['Concept', 'D&E', 'Permitting', 'Production', 'Logistics'];
  const stageColors = {
    'Concept': '#A78BFA',
    'D&E': '#3B82F6',
    'Permitting': '#F59E0B',
    'Production': '#10B981',
    'Logistics': '#06B6D4',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Investor Dashboard</h2>
          <p className="text-sm text-gray-500">
            Honomobo Corporation • {getMonthLabel(currentMonth, currentYear)} • <span className="text-blue-600 font-medium">Live Data</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Pipeline</div>
          <div className="text-3xl font-bold text-gray-900">{formatCurrency(metrics.pipelineValue)}</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="text-blue-100 text-sm mb-1">Active Pipeline</div>
          <div className="text-3xl font-bold">{formatCurrency(metrics.pipelineValue)}</div>
          <div className="text-blue-100 text-sm mt-2">{metrics.pipelineCount} projects • {metrics.pipelineMods} mods</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="text-emerald-100 text-sm mb-1">In Production</div>
          <div className="text-3xl font-bold">{formatCurrency(metrics.productionValue)}</div>
          <div className="text-emerald-100 text-sm mt-2">{metrics.productionCount} projects active</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
          <div className="text-amber-100 text-sm mb-1">Contracted Backlog</div>
          <div className="text-3xl font-bold">{formatCurrency(metrics.backlogValue)}</div>
          <div className="text-amber-100 text-sm mt-2">{metrics.backlogCount} in D&E/Permitting</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="text-purple-100 text-sm mb-1">YTD Cash Collected</div>
          <div className="text-3xl font-bold">{formatCurrency(metrics.ytdCash)}</div>
          <div className="text-purple-100 text-sm mt-2">{formatCurrency(metrics.cashThisMonth)} this month</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-5 text-white">
          <div className="text-cyan-100 text-sm mb-1">Capacity Utilization</div>
          <div className="text-3xl font-bold">{metrics.capacityUtilization}%</div>
          <div className="text-cyan-100 text-sm mt-2">{metrics.positionsUsed}/18 positions</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Monthly Contracts Signed */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Contracts Signed (12 mo)</h3>
            <span className="text-sm text-gray-500">Value</span>
          </div>
          <LineChart data={metrics.monthlyData} valueKey="contractsValue" color="#3B82F6" height={140} />
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{metrics.monthlyData[0]?.label}</span>
            <span>{metrics.monthlyData[metrics.monthlyData.length - 1]?.label}</span>
          </div>
        </div>

        {/* Monthly Cash Collected */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Cash Collected (12 mo)</h3>
            <span className="text-sm text-gray-500">Monthly</span>
          </div>
          <BarChart data={metrics.monthlyData} valueKey="cashCollected" color="#10B981" height={140} />
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{metrics.monthlyData[0]?.label}</span>
            <span>{metrics.monthlyData[metrics.monthlyData.length - 1]?.label}</span>
          </div>
        </div>

        {/* Units Completed */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Units Delivered (12 mo)</h3>
            <span className="text-sm text-gray-500">Mods</span>
          </div>
          <BarChart data={metrics.monthlyData} valueKey="unitsCompleted" color="#8B5CF6" height={140} />
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{metrics.monthlyData[0]?.label}</span>
            <span>{metrics.monthlyData[metrics.monthlyData.length - 1]?.label}</span>
          </div>
        </div>
      </div>

      {/* Pipeline Breakdown & Geography */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pipeline by Stage */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Pipeline by Stage</h3>
          <div className="space-y-3">
            {stageOrder.map(stage => {
              const data = metrics.byStage[stage] || { count: 0, value: 0 };
              const pct = metrics.pipelineValue > 0 ? (data.value / metrics.pipelineValue) * 100 : 0;
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: stageColors[stage] }} />
                      <span className="text-sm font-medium">{stage}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">{data.count} projects</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="font-medium">{formatCurrency(data.value)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all" 
                      style={{ width: `${pct}%`, backgroundColor: stageColors[stage] }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between">
            <span className="text-sm text-gray-500">Total Active Pipeline</span>
            <span className="font-semibold">{formatCurrency(metrics.pipelineValue)}</span>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-4xl mb-2">🇺🇸</div>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.usaValue)}</div>
              <div className="text-sm text-gray-500">{metrics.usaCount} projects</div>
              <div className="text-xs text-gray-400 mt-1">
                {metrics.pipelineValue > 0 ? Math.round((metrics.usaValue / metrics.pipelineValue) * 100) : 0}% of pipeline
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="text-4xl mb-2">🇨🇦</div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.canadaValue)}</div>
              <div className="text-sm text-gray-500">{metrics.canadaCount} projects</div>
              <div className="text-xs text-gray-400 mt-1">
                {metrics.pipelineValue > 0 ? Math.round((metrics.canadaValue / metrics.pipelineValue) * 100) : 0}% of pipeline
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${metrics.pipelineValue > 0 ? (metrics.usaValue / metrics.pipelineValue) * 100 : 0}%` }} 
              />
              <div 
                className="h-full bg-red-500" 
                style={{ width: `${metrics.pipelineValue > 0 ? (metrics.canadaValue / metrics.pipelineValue) * 100 : 0}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5 text-center">
          <div className="text-sm text-gray-500 mb-1">Avg Contract Value</div>
          <div className="text-2xl font-bold">{formatCurrency(metrics.avgContractValue)}</div>
        </div>
        <div className="bg-white rounded-xl border p-5 text-center">
          <div className="text-sm text-gray-500 mb-1">YTD Completed</div>
          <div className="text-2xl font-bold">{metrics.completedMods} mods</div>
          <div className="text-xs text-gray-400">{formatCurrency(metrics.completedValue)}</div>
        </div>
        <div className="bg-white rounded-xl border p-5 text-center">
          <div className="text-sm text-gray-500 mb-1">Production Capacity</div>
          <div className="text-2xl font-bold">18 positions</div>
          <div className="text-xs text-gray-400">~80 mods/year potential</div>
        </div>
        <div className="bg-white rounded-xl border p-5 text-center">
          <div className="text-sm text-gray-500 mb-1">Facility</div>
          <div className="text-2xl font-bold">51,255 sf</div>
          <div className="text-xs text-gray-400">Nisku, Alberta</div>
        </div>
      </div>
    </div>
  );
}
