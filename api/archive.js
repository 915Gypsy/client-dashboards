/**
 * Serverless function to archive an opportunity
 * POST: Archive an opportunity (update stage to "Archived" + reason + date)
 */

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

// Field ID mapping
const FIELD_IDS = {
  stage: 'flddxrEquZH55byPZ',
  archiveReason: 'fldTq0SSBZgd6g7mD',
  archiveDate: 'fldS7w4Zp0JsUhPfg',
  lastUpdated: 'fld38Mix7OBLz82Cz'
};

// CORS headers helper
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * POST handler: Archive an opportunity
 */
async function handlePost(req, res) {
  const { recordId, reason } = req.body;

  if (!recordId) {
    res.status(400).json({ error: 'recordId is required' });
    return;
  }

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    res.status(500).json({ error: 'Airtable environment variables not configured' });
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const payload = {
      fields: {
        [FIELD_IDS.stage]: 'Archived',
        [FIELD_IDS.archiveReason]: reason || '',
        [FIELD_IDS.archiveDate]: today,
        [FIELD_IDS.lastUpdated]: today
      },
      typecast: true
    };

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${recordId}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error:', errorData);
      res.status(response.status).json({ error: errorData.error || 'Failed to archive record' });
      return;
    }

    res.status(200).json({ success: true, message: 'Opportunity archived successfully' });
  } catch (error) {
    console.error('Error archiving opportunity:', error);
    res.status(500).json({ error: 'Failed to archive opportunity' });
  }
}

/**
 * OPTIONS handler: CORS preflight
 */
function handleOptions(req, res) {
  res.status(200).end();
}

/**
 * Main handler
 */
export default function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
