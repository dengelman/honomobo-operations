/**
 * Wrike → Airtable Nightly Sync (Vercel Cron)
 *
 * Runs daily at 11 PM MST (06:00 UTC). Pulls manufacturing stage data from Wrike
 * and writes actual dates + status into Airtable project records.
 *
 * Architecture:
 *   1. Fetch all Wrike folders under the MFG space (each folder = one project)
 *   2. For each folder, get the 4 stage tasks (Fabrication, Rough-In, Finishing, Finalizing)
 *   3. Match folder name to Airtable Project ID (e.g., "HO709 - Smith Residence" → "HO709")
 *   4. Write actual start/end dates + current stage status into Airtable
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

// Wrike stage names → Airtable field mapping
// These match Curtis's Wrike Blueprint 1:1
const STAGE_MAP = {
  'Stage 1: Fabrication': {
    statusField: 'Wrike Stage 1 Status',
    startField:  'Wrike Stage 1 Start (Actual)',
    endField:    'Wrike Stage 1 End (Actual)',
    stageNum: 1,
  },
  'Stage 2: Rough-In': {
    statusField: 'Wrike Stage 2 Status',
    startField:  'Wrike Stage 2 Start (Actual)',
    endField:    'Wrike Stage 2 End (Actual)',
    stageNum: 2,
  },
  'Stage 3: Finishing': {
    statusField: 'Wrike Stage 3 Status',
    startField:  'Wrike Stage 3 Start (Actual)',
    endField:    'Wrike Stage 3 End (Actual)',
    stageNum: 3,
  },
  'Stage 4: Finalizing': {
    statusField: 'Wrike Stage 4 Status',
    startField:  'Wrike Stage 4 Start (Actual)',
    endField:    'Wrike Stage 4 End (Actual)',
    stageNum: 4,
  },
};

// Also accept shortened stage names (some Wrike setups may not prefix "Stage N:")
const STAGE_ALIASES = {
  'Fabrication':  'Stage 1: Fabrication',
  'Rough-In':    'Stage 2: Rough-In',
  'Finishing':   'Stage 3: Finishing',
  'Finalizing':  'Stage 4: Finalizing',
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
 * Matches patterns like: "HO709", "HS801", "SO103", "AO104", "BOXX 8X20"
 * from folder names like "HO709 - Smith Residence"
 */
function extractProjectId(folderTitle) {
  if (!folderTitle) return null;

  // Match BOXX patterns first (e.g., "BOXX 8X20 - Project Name")
  const boxxMatch = folderTitle.match(/\b(BOXX\s*\d+[Xx]\d+)\b/i);
  if (boxxMatch) return boxxMatch[1].toUpperCase();

  // Match BAR pattern
  const barMatch = folderTitle.match(/\b(BAR\d*)\b/i);
  if (barMatch) return barMatch[1].toUpperCase();

  // Match standard HO/HS/SO/AO + digits pattern
  const stdMatch = folderTitle.match(/\b([A-Z]{2}\d{3,4})\b/i);
  if (stdMatch) return stdMatch[1].toUpperCase();

  return null;
}

/**
 * Determine the current manufacturing stage from task statuses.
 * Returns the highest-numbered stage that has started but not completed,
 * or the last completed stage if all are done.
 */
function determineCurrentStage(stageTasks) {
  let currentStage = null;
  let highestCompleted = 0;

  for (const task of stageTasks) {
    const stageInfo = resolveStageInfo(task.title);
    if (!stageInfo) continue;

    const status = task.status?.toLowerCase() || '';

    if (status === 'active' || status === 'inprogress' || status === 'in progress') {
      // Active stage — this is the current one
      if (!currentStage || stageInfo.stageNum > currentStage.stageNum) {
        currentStage = stageInfo;
      }
    } else if (status === 'completed' || status === 'done') {
      if (stageInfo.stageNum > highestCompleted) {
        highestCompleted = stageInfo.stageNum;
      }
    }
  }

  // If no active stage found, next stage after highest completed is "current"
  if (!currentStage && highestCompleted > 0 && highestCompleted < 4) {
    const nextStageNum = highestCompleted + 1;
    const nextStageKey = Object.keys(STAGE_MAP).find(k => STAGE_MAP[k].stageNum === nextStageNum);
    if (nextStageKey) currentStage = STAGE_MAP[nextStageKey];
  }

  return currentStage;
}

function resolveStageInfo(taskTitle) {
  if (!taskTitle) return null;

  // Direct match
  if (STAGE_MAP[taskTitle]) return STAGE_MAP[taskTitle];

  // Alias match
  const aliasKey = Object.keys(STAGE_ALIASES).find(a => taskTitle.includes(a));
  if (aliasKey) return STAGE_MAP[STAGE_ALIASES[aliasKey]];

  // Partial match (e.g., "Fabrication" anywhere in the title)
  for (const [key, info] of Object.entries(STAGE_MAP)) {
    const stageName = key.split(': ')[1]; // "Fabrication", "Rough-In", etc.
    if (stageName && taskTitle.includes(stageName)) return info;
  }

  return null;
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
    const params = new URLSearchParams({
      'fields[]': ['Project ID', 'Wrike Project ID', 'Wrike Last Synced'].flat(),
      pageSize: '100',
    });
    if (offset) params.set('offset', offset);

    const data = await airtableFetch(`/${encodeURIComponent(AIRTABLE_TABLE)}?${params.toString()}`);

    for (const record of data.records || []) {
      const projectId = record.fields['Project ID'];
      if (projectId) {
        projectMap.set(projectId.toUpperCase(), {
          recordId: record.id,
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
 * Update an Airtable record with Wrike stage data.
 * Uses PATCH to only update specified fields.
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

  log.push(`[${new Date().toISOString()}] Starting Wrike → Airtable sync`);

  // Step 1: Get all Airtable projects for matching
  const airtableProjects = await getAllAirtableProjects();
  log.push(`Found ${airtableProjects.size} projects in Airtable`);

  // Step 2: Get Wrike space/folder structure
  // First, get all folders in account (we'll filter to manufacturing projects)
  const foldersData = await wrikeFetch('/folders', {
    fields: '["description"]',
  });

  const allFolders = foldersData.data || [];
  log.push(`Found ${allFolders.length} total Wrike folders`);

  // Step 3: For each folder, try to match to an Airtable project
  for (const folder of allFolders) {
    const projectId = extractProjectId(folder.title);
    if (!projectId) continue; // Skip non-project folders

    const airtableRecord = airtableProjects.get(projectId);
    if (!airtableRecord) {
      notFound++;
      continue; // No matching Airtable project
    }

    try {
      // Step 4: Get tasks in this folder (the stage tasks)
      const tasksData = await wrikeFetch(`/folders/${folder.id}/tasks`, {
        fields: '["dates","status"]',
      });

      const tasks = tasksData.data || [];
      if (tasks.length === 0) {
        skipped++;
        continue;
      }

      // Step 5: Extract stage data from tasks
      const updateFields = {
        'Wrike Project ID': folder.id,
        'Wrike Last Synced': new Date().toISOString(),
      };

      let hasStageData = false;

      for (const task of tasks) {
        const stageInfo = resolveStageInfo(task.title);
        if (!stageInfo) continue; // Not a stage task

        hasStageData = true;
        const status = task.status || 'Unknown';

        // Map Wrike status to our status values
        let mappedStatus = 'Not Started';
        const statusLower = status.toLowerCase();
        if (statusLower === 'completed' || statusLower === 'done') {
          mappedStatus = 'Complete';
        } else if (statusLower === 'active' || statusLower === 'inprogress' || statusLower === 'in progress') {
          mappedStatus = 'In Progress';
        } else if (statusLower === 'deferred' || statusLower === 'cancelled') {
          mappedStatus = 'Deferred';
        }

        updateFields[stageInfo.statusField] = mappedStatus;

        // Write dates if available
        if (task.dates) {
          if (task.dates.start) {
            updateFields[stageInfo.startField] = task.dates.start;
          }
          if (task.dates.due) {
            updateFields[stageInfo.endField] = task.dates.due;
          }
        }
      }

      // Determine current overall MFG stage
      const currentStage = determineCurrentStage(tasks);
      if (currentStage) {
        const stageKey = Object.keys(STAGE_MAP).find(k => STAGE_MAP[k].stageNum === currentStage.stageNum);
        if (stageKey) {
          updateFields['Wrike MFG Status'] = stageKey;
        }
      }

      if (hasStageData) {
        await updateAirtableProject(airtableRecord.recordId, updateFields);
        synced++;
        log.push(`✓ Synced ${projectId} (${Object.keys(updateFields).length - 2} stage fields)`);
      } else {
        skipped++;
      }

    } catch (err) {
      errors.push(`Error syncing ${projectId}: ${err.message}`);
    }

    // Respect Wrike rate limits (100 req/min)
    await new Promise(r => setTimeout(r, 150));
  }

  log.push(`\n── SYNC COMPLETE ──`);
  log.push(`Synced: ${synced} | Skipped: ${skipped} | Not in Airtable: ${notFound} | Errors: ${errors.length}`);

  if (errors.length > 0) {
    log.push(`\nErrors:\n${errors.join('\n')}`);
  }

  return {
    synced,
    skipped,
    notFound,
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
