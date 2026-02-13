/**
 * Wrike → Airtable Nightly Sync (Vercel Cron)
 *
 * Runs daily at 11 PM MST (06:00 UTC). Pulls manufacturing project data from
 * Wrike's "Scheduled Builds" space and writes status + dates into Airtable.
 *
 * How Wrike is actually structured (discovered via API exploration):
 *   - "Scheduled Builds" space (ID: IEAEJ3HPI4TYP6UM) is the primary space
 *   - Projects are FOLDERS with a project.customStatusId from one of two workflows:
 *     • (Ops) Honomobo Workflow: lifecycle statuses (Manufacturing, Shipped, etc.)
 *     • (MFG) Manufacturing Workflow: stage statuses (STAGE 1-4, Ready To Ship, etc.)
 *   - Stage data lives at the PROJECT STATUS LEVEL (not as tasks inside folders)
 *   - Custom fields on projects provide dates: Target FAB Start, Ship Date, Build Spot, etc.
 *   - Project IDs are embedded in folder titles: "HO755 - Holland - G5 HO3 KL T1 - CA"
 *
 * Environment Variables (set in Vercel dashboard):
 *   WRIKE_ACCESS_TOKEN   — Wrike permanent access token
 *   AIRTABLE_API_KEY     — Airtable personal access token
 *   AIRTABLE_BASE_ID     — appkJr6ogN6O1nxxg
 *   CRON_SECRET          — Secret to verify cron requests (optional but recommended)
 */

// ── CONFIGURATION ──────────────────────────────────────────────────────────────

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appkJr6ogN6O1nxxg';
const AIRTABLE_TABLE = 'Projects';

// Wrike space ID for "Scheduled Builds"
const SCHEDULED_BUILDS_SPACE = 'IEAEJ3HPI4TYP6UM';

// ── WRIKE CUSTOM STATUS ID → STAGE MAPPING ──────────────────────────────────
// These are the actual custom status IDs from the (MFG) Manufacturing workflow
// discovered via the Wrike API /workflows endpoint

const MFG_STATUS_MAP = {
  // Pre-manufacturing statuses
  'IEAEJ3HPJMB6MDDY': { stage: 'PRE-IFC',                  stageNum: 0, group: 'pre' },
  'IEAEJ3HPJMCNYIR6': { stage: 'Waiting For Drawings',     stageNum: 0, group: 'pre' },
  'IEAEJ3HPJMDPUIWI': { stage: 'Waiting For Build Deposit', stageNum: 0, group: 'pre' },
  'IEAEJ3HPJMB6MDEC': { stage: 'IFC',                      stageNum: 0, group: 'pre' },
  'IEAEJ3HPJMGK57WS': { stage: 'Waiting on Build Spot',    stageNum: 0, group: 'pre' },
  'IEAEJ3HPJMDPT72G': { stage: 'BUILD SPOT EMPTY',         stageNum: 0, group: 'pre' },
  'IEAEJ3HPJMDPUDEY': { stage: 'EMPTY FAB SPOT',           stageNum: 0, group: 'pre' },

  // The 4 manufacturing stages
  'IEAEJ3HPJMB6MDEM': { stage: 'STAGE 1 (FABRICATION)',    stageNum: 1, group: 'mfg' },
  'IEAEJ3HPJMCIODZE': { stage: 'STAGE 2 (ROUGH-IN)',       stageNum: 2, group: 'mfg' },
  'IEAEJ3HPJMB6MDEW': { stage: 'STAGE 3 (FINISHING)',      stageNum: 3, group: 'mfg' },
  'IEAEJ3HPJMB6MDFA': { stage: 'Finishing',                stageNum: 3, group: 'mfg' },  // alternate
  'IEAEJ3HPJMCIODZO': { stage: 'STAGE 4 (FINALIZING)',     stageNum: 4, group: 'mfg' },

  // Post-manufacturing
  'IEAEJ3HPJMB6MDFK': { stage: 'Ready To Ship',           stageNum: 5, group: 'post' },
  'IEAEJ3HPJMDROQSU': { stage: 'In Storage',               stageNum: 5, group: 'post' },
  'IEAEJ3HPJMB6MDDZ': { stage: 'Shipped',                 stageNum: 6, group: 'done' },

  // Terminal
  'IEAEJ3HPJMCC4JQE': { stage: 'Not Scheduled',           stageNum: -1, group: 'hold' },
  'IEAEJ3HPJMCC4I66': { stage: 'On Hold',                  stageNum: -1, group: 'hold' },
  'IEAEJ3HPJMCNYIZR': { stage: 'Cancelled',                stageNum: -1, group: 'cancelled' },
};

// (Ops) Honomobo Workflow statuses that indicate manufacturing
const OPS_MFG_STATUSES = {
  'IEAEJ3HPJMB4LDAK': { stage: 'Manufacturing',             group: 'mfg' },
  'IEAEJ3HPJMCRCQQM': { stage: 'Manufacturing (without permit)', group: 'mfg' },
  'IEAEJ3HPJMB4LDAA': { stage: 'IFC',                       group: 'pre' },
  'IEAEJ3HPJMCRCQQC': { stage: 'IFC MOD (no permit)',       group: 'pre' },
  'IEAEJ3HPJMB6MFXQ': { stage: 'Wrapped & Waiting',        group: 'post' },
  'IEAEJ3HPJMCRCQQW': { stage: 'Wrapped & Waiting (no permit)', group: 'post' },
  'IEAEJ3HPJMB6MFX2': { stage: 'Shipped',                   group: 'done' },
  'IEAEJ3HPJMB6MFYE': { stage: 'Install',                   group: 'done' },
};

// ── WRIKE CUSTOM FIELD IDs ──────────────────────────────────────────────────
// Discovered via /customfields endpoint

const WRIKE_CUSTOM_FIELDS = {
  'IEAEJ3HPJUACGN6P': 'Target FAB Start',
  'IEAEJ3HPJUAHTBJW': 'Fab Target Start',
  'IEAEJ3HPJUAH55JD': 'Fab Target Start (alt)',
  'IEAEJ3HPJUAEBQH2': 'Mfg Start',
  'IEAEJ3HPJUAEBQHY': 'Fab End Date',
  'IEAEJ3HPJUAB75MX': 'Ship Date (Target)',
  'IEAEJ3HPJUAI7D3M': 'Ship Date (Confirmed)',
  'IEAEJ3HPJUAJDRW2': 'Projected Ship Ready Date',
  'IEAEJ3HPJUACGN6O': 'Build Deposit',
  'IEAEJ3HPJUACGNVY': 'MOD IFC Ready',
  'IEAEJ3HPJUAB5DCJ': 'Permit Issue (Target)',
  'IEAEJ3HPJUACYAPJ': 'Build Spot',
  'IEAEJ3HPJUACNW3P': 'Approved Concept',
  'IEAEJ3HPJUAHV4K2': 'Estimated IFC Date',
  'IEAEJ3HPJUAB2LEZ': 'Booked effort',
};

// Map Wrike custom field IDs → Airtable field names
const FIELD_TO_AIRTABLE = {
  'IEAEJ3HPJUAEBQH2': 'Wrike MFG Start',
  'IEAEJ3HPJUAEBQHY': 'Wrike Fab End Date',
  'IEAEJ3HPJUACGN6P': 'Wrike Target FAB Start',
  'IEAEJ3HPJUAHTBJW': 'Wrike Fab Target Start',
  'IEAEJ3HPJUAB75MX': 'Wrike Ship Date (Target)',
  'IEAEJ3HPJUAI7D3M': 'Wrike Ship Date (Confirmed)',
  'IEAEJ3HPJUAJDRW2': 'Wrike Projected Ship Ready',
  'IEAEJ3HPJUACYAPJ': 'Wrike Build Spot',
};

// ── API HELPERS ────────────────────────────────────────────────────────────────

async function wrikeFetch(endpoint, params = {}) {
  const url = new URL(`https://www.wrike.com/api/v4${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${process.env.WRIKE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Wrike API ${res.status}: ${body}`);
  }

  return res.json();
}

async function airtableFetch(endpoint, options = {}) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable API ${res.status}: ${body}`);
  }

  return res.json();
}

// ── WRIKE DATA EXTRACTION ──────────────────────────────────────────────────────

/**
 * Extract project ID from a Wrike folder title.
 * Handles patterns like:
 *   "HO755 - Holland - G5 HO3 KL T1 - CA"      → "HO755"
 *   "HO709 - Sooreddy - G4 HS8 CA"              → "HO709"
 *   "HO726-A - Hughes - G4 HO4 - Hawaii"        → "HO726A" (strip dash for sub-units)
 *   "[HO622 (Hakimimehr McAdams)] 3 D&E"         → "HO622"
 *   "HO762 - BOXX - 8x40 - Alberta"             → "HO762"
 *   "HO711 (BOXX Modular) 8x10 Seacan Lavs x5" → "HO711"
 */
function extractProjectId(folderTitle) {
  if (!folderTitle) return null;

  // Match HO### or HO###-A/B (sub-units) — first occurrence
  const hoMatch = folderTitle.match(/\b(HO\d{3,4})(?:-?([A-Z]))?\b/i);
  if (hoMatch) {
    const base = hoMatch[1].toUpperCase();
    const suffix = hoMatch[2] ? hoMatch[2].toUpperCase() : '';
    return base + suffix;
  }

  // Match HS### pattern
  const hsMatch = folderTitle.match(/\b(HS\d{3,4})\b/i);
  if (hsMatch) return hsMatch[1].toUpperCase();

  // Match SO### / AO### pattern
  const otherMatch = folderTitle.match(/\b([A-Z]{2}\d{3,4})\b/i);
  if (otherMatch) return otherMatch[1].toUpperCase();

  return null;
}

/**
 * Extract model type from folder title.
 * "HO755 - Holland - G5 HO3 KL T1 - CA" → "HO3"
 * "HO709 - Sooreddy - G4 HS8 CA"         → "HS8"
 */
function extractModelType(folderTitle) {
  if (!folderTitle) return null;

  // Match G# model patterns: "G4 HO5", "G5 HO3", "G4 HS8", etc.
  const modelMatch = folderTitle.match(/G\d+\s+(HO\d|HS\d|SO\d|AO\d)/i);
  if (modelMatch) return modelMatch[1].toUpperCase();

  // Match standalone model: "HO5+", "HO2", "MOBO", "BAR", "BOXX"
  const standaloneMatch = folderTitle.match(/\b(HO[1-5]\+?|HS[68]|MOBO|BAR|BOXX)\b/i);
  if (standaloneMatch) return standaloneMatch[1].toUpperCase().replace('+', '');

  return null;
}

/**
 * Resolve the manufacturing stage from a Wrike project's customStatusId.
 * Checks both (MFG) Manufacturing and (Ops) Honomobo workflows.
 */
function resolveWrikeStatus(customStatusId) {
  // Check MFG Manufacturing workflow first (more granular)
  if (MFG_STATUS_MAP[customStatusId]) {
    return MFG_STATUS_MAP[customStatusId];
  }

  // Fall back to (Ops) Honomobo Workflow
  if (OPS_MFG_STATUSES[customStatusId]) {
    return OPS_MFG_STATUSES[customStatusId];
  }

  return null;
}

/**
 * Parse custom fields from a Wrike project into a readable object.
 */
function parseCustomFields(customFields) {
  const result = {};
  if (!customFields) return result;

  for (const cf of customFields) {
    const fieldName = WRIKE_CUSTOM_FIELDS[cf.id];
    if (fieldName) {
      result[fieldName] = cf.value;
    }
  }
  return result;
}

// ── AIRTABLE HELPERS ───────────────────────────────────────────────────────────

/**
 * Get all Airtable project records with pagination.
 * Returns a Map of ProjectID → { airtableRecordId, existing fields }
 */
async function getAllAirtableProjects() {
  const projectMap = new Map();
  let offset = null;

  do {
    let url = `/${encodeURIComponent(AIRTABLE_TABLE)}?pageSize=100`;
    // Request specific fields to minimize payload
    url += '&fields%5B%5D=Project+ID&fields%5B%5D=Wrike+Project+ID&fields%5B%5D=Wrike+Last+Synced&fields%5B%5D=Name';
    if (offset) url += `&offset=${offset}`;

    const data = await airtableFetch(url);

    for (const record of data.records || []) {
      const projectId = record.fields['Project ID'];
      if (projectId) {
        projectMap.set(projectId.toUpperCase(), {
          recordId: record.id,
          name: record.fields['Name'] || '',
          wrikeProjectId: record.fields['Wrike Project ID'] || null,
          lastSynced: record.fields['Wrike Last Synced'] || null,
        });
      }
    }

    offset = data.offset || null;
  } while (offset);

  return projectMap;
}

/**
 * Update an Airtable record with Wrike data.
 */
async function updateAirtableProject(recordId, fields) {
  return airtableFetch(`/${encodeURIComponent(AIRTABLE_TABLE)}/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
}

// ── MAIN SYNC LOGIC ────────────────────────────────────────────────────────────

async function syncWrikeToAirtable() {
  const log = [];
  const errors = [];
  let synced = 0;
  let skipped = 0;
  let notFound = 0;
  let notMfg = 0;

  log.push(`[${new Date().toISOString()}] Starting Wrike → Airtable sync`);

  // Step 1: Get all Airtable projects for matching
  const airtableProjects = await getAllAirtableProjects();
  log.push(`Found ${airtableProjects.size} projects in Airtable`);

  // Step 2: Get all projects from "Scheduled Builds" space (bulk — no custom fields)
  const foldersData = await wrikeFetch(
    `/spaces/${SCHEDULED_BUILDS_SPACE}/folders`,
    { project: 'true' }
  );

  const allProjects = (foldersData.data || []).filter(f => f.project);
  log.push(`Found ${allProjects.length} Wrike projects in Scheduled Builds`);

  // Step 3: Filter to MFG-relevant projects, then fetch each individually for custom fields
  const candidates = [];
  for (const wp of allProjects) {
    const customStatusId = wp.project?.customStatusId;
    const statusInfo = resolveWrikeStatus(customStatusId);

    if (!statusInfo) { notMfg++; continue; }
    if (statusInfo.group === 'cancelled' || statusInfo.group === 'hold') { skipped++; continue; }

    const projectId = extractProjectId(wp.title);
    if (!projectId) { skipped++; continue; }

    const airtableRecord = airtableProjects.get(projectId);
    if (!airtableRecord) {
      notFound++;
      log.push(`⚠ No Airtable match for ${projectId} ("${wp.title}")`);
      continue;
    }

    candidates.push({ wrikeProject: wp, projectId, statusInfo, airtableRecord });
  }

  log.push(`Matched ${candidates.length} MFG projects to Airtable records`);

  // Step 4: For each matched project, fetch full details (with custom fields) and sync
  for (const { wrikeProject, projectId, statusInfo, airtableRecord } of candidates) {
    try {
      // Fetch individual folder to get custom fields (bulk endpoint doesn't include them)
      const detailData = await wrikeFetch(`/folders/${wrikeProject.id}`);
      const detail = detailData.data?.[0] || wrikeProject;

      // Build the update payload
      const updateFields = {
        'Wrike Project ID': wrikeProject.id,
        'Wrike MFG Status': statusInfo.stage,
        'Wrike Last Synced': new Date().toISOString(),
        'Wrike URL': detail.permalink || wrikeProject.permalink || '',
      };

      // Add project-level dates
      const proj = detail.project || wrikeProject.project || {};
      if (proj.startDate) {
        updateFields['Wrike Project Start'] = proj.startDate;
      }
      if (proj.endDate) {
        updateFields['Wrike Project End'] = proj.endDate;
      }

      // Parse and add custom field dates from the detailed response
      const customFields = detail.customFields || [];
      for (const [wrikeFieldId, airtableFieldName] of Object.entries(FIELD_TO_AIRTABLE)) {
        const cf = customFields.find(c => c.id === wrikeFieldId);
        if (cf && cf.value && cf.value !== '[]' && cf.value !== '0') {
          updateFields[airtableFieldName] = cf.value;
        }
      }

      // Extract model type from title if available
      const modelType = extractModelType(wrikeProject.title);
      if (modelType) {
        updateFields['Wrike Model Type'] = modelType;
      }

      // Write to Airtable
      await updateAirtableProject(airtableRecord.recordId, updateFields);
      synced++;

      const fieldCount = Object.keys(updateFields).length - 3;
      log.push(`✓ ${projectId} → ${statusInfo.stage} (${fieldCount} extra fields)`);

    } catch (err) {
      errors.push(`Error syncing ${projectId}: ${err.message}`);
    }

    // Respect Wrike rate limits (100 req/min) — 2 API calls per project (detail + Airtable)
    await new Promise(r => setTimeout(r, 200));
  }

  log.push(`\n── SYNC COMPLETE ──`);
  log.push(`Synced: ${synced} | Skipped: ${skipped} | Not in Airtable: ${notFound} | Not MFG: ${notMfg} | Errors: ${errors.length}`);

  if (errors.length > 0) {
    log.push(`\nErrors:\n${errors.join('\n')}`);
  }

  return {
    synced,
    skipped,
    notFound,
    notMfg,
    errors: errors.length,
    log: log.join('\n'),
  };
}

// ── VERCEL SERVERLESS HANDLER ──────────────────────────────────────────────────

export default async function handler(req, res) {
  // Verify cron secret (if configured)
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Only allow GET (Vercel Cron) and POST (manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate required env vars
  if (!process.env.WRIKE_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'WRIKE_ACCESS_TOKEN not configured' });
  }
  if (!process.env.AIRTABLE_API_KEY) {
    return res.status(500).json({ error: 'AIRTABLE_API_KEY not configured' });
  }

  try {
    const result = await syncWrikeToAirtable();

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err) {
    console.error('Sync failed:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}
