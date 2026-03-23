/**
 * Serverless function to handle Airtable API calls
 * GET: List opportunities for a client
 * POST: Create a new opportunity
 * PUT: Update an existing opportunity
 * Airtable PAT is kept in Vercel environment variables only
 */

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;

// CORS headers helper
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Field ID mapping
const FIELD_IDS = {
  opportunityName: 'fldPGzXzyZq4H5Q2O',
  client: 'fldFFk6zmBUHaPKSf',
  agency: 'fld3EVoNIoqdD4t1u',
  solicitationNumber: 'fld7QcghfJg2ydPpA',
  naics: 'fld9f08ZaZbXKls45',
  estimatedValue: 'fldZIvBd9kSGuja1Y',
  deadline: 'fldfY6NcB3jJKyqLQ',
  stage: 'flddxrEquZH55byPZ',
  setAsideType: 'fldEeZkYIXcLsJT3s',
  source: 'fldfHL9V9ZdoQEyyB',
  sourceUrl: 'fldh7g98wD83JMUw7',
  notes: 'fldntyjxdTUElpE4m',
  dateAdded: 'fldAxG4rJXtAY6ZkG',
  lastUpdated: 'fld38Mix7OBLz82Cz'
};

/**
 * Parse Airtable records into opportunity objects
 */
function parseOpportunity(record) {
  return {
    id: record.id,
    name: record.fields[FIELD_IDS.opportunityName] || '',
    agency: record.fields[FIELD_IDS.agency] || '',
    solicitationNumber: record.fields[FIELD_IDS.solicitationNumber] || '',
    naics: record.fields[FIELD_IDS.naics] || '',
    value: record.fields[FIELD_IDS.estimatedValue] || '',
    deadline: record.fields[FIELD_IDS.deadline] || '',
    stage: record.fields[FIELD_IDS.stage] || '',
    setAside: record.fields[FIELD_IDS.setAsideType] || '',
    source: record.fields[FIELD_IDS.source] || '',
    sourceUrl: record.fields[FIELD_IDS.sourceUrl] || '',
    notes: record.fields[FIELD_IDS.notes] || ''
  };
}

/**
 * GET handler: List opportunities for a client
 */
async function handleGet(req, res) {
  const { clientId } = req.query;

  if (!clientId) {
    res.status(400).json({ error: 'clientId query parameter is required' });
    return;
  }

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    res.status(500).json({ error: 'Airtable environment variables not configured' });
    return;
  }

  try {
    // Use filterByFormula to find records matching the client AND exclude Archived stage
    const filterFormula = encodeURIComponent(
      `AND(FIND('${clientId}', {client}), {stage} != 'Archived')`
    );

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=${filterFormula}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error:', errorData);
      res.status(response.status).json({ error: errorData.error || 'Airtable API error' });
      return;
    }

    const data = await response.json();
    const opportunities = data.records.map(parseOpportunity);

    res.status(200).json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
}

/**
 * POST handler: Create a new opportunity
 */
async function handlePost(req, res) {
  const {
    clientId,
    name,
    agency,
    solicitationNumber,
    naics,
    value,
    deadline,
    stage,
    setAside,
    source,
    sourceUrl,
    notes
  } = req.body;

  if (!clientId || !name) {
    res.status(400).json({ error: 'clientId and name are required' });
    return;
  }

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    res.status(500).json({ error: 'Airtable environment variables not configured' });
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Build fields object - only include non-empty fields
    const fields = {
      [FIELD_IDS.opportunityName]: name,
      [FIELD_IDS.client]: [clientId], // multipleRecordLinks expects array
      [FIELD_IDS.dateAdded]: today,
      [FIELD_IDS.lastUpdated]: today
    };

    if (agency) fields[FIELD_IDS.agency] = agency;
    if (solicitationNumber) fields[FIELD_IDS.solicitationNumber] = solicitationNumber;
    if (naics) fields[FIELD_IDS.naics] = naics;
    if (value) fields[FIELD_IDS.estimatedValue] = value;
    if (deadline) fields[FIELD_IDS.deadline] = deadline;
    if (stage) fields[FIELD_IDS.stage] = stage;
    if (setAside) fields[FIELD_IDS.setAsideType] = setAside;
    if (source) fields[FIELD_IDS.source] = source;
    if (sourceUrl) fields[FIELD_IDS.sourceUrl] = sourceUrl;
    if (notes) fields[FIELD_IDS.notes] = notes;

    const payload = {
      fields: fields,
      typecast: true
    };

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error:', errorData);
      res.status(response.status).json({ error: errorData.error || 'Failed to create record' });
      return;
    }

    const record = await response.json();
    const opportunity = parseOpportunity(record);

    res.status(201).json(opportunity);
  } catch (error) {
    console.error('Error creating opportunity:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
}

/**
 * PUT handler: Update an existing opportunity
 */
async function handlePut(req, res) {
  const {
    recordId,
    name,
    agency,
    solicitationNumber,
    naics,
    value,
    deadline,
    stage,
    setAside,
    source,
    sourceUrl,
    notes
  } = req.body;

  if (!recordId || !name) {
    res.status(400).json({ error: 'recordId and name are required' });
    return;
  }

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    res.status(500).json({ error: 'Airtable environment variables not configured' });
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const fields = {
      [FIELD_IDS.opportunityName]: name,
      [FIELD_IDS.lastUpdated]: today
    };

    if (agency) fields[FIELD_IDS.agency] = agency;
    if (solicitationNumber) fields[FIELD_IDS.solicitationNumber] = solicitationNumber;
    if (naics) fields[FIELD_IDS.naics] = naics;
    if (value) fields[FIELD_IDS.estimatedValue] = value;
    if (deadline) fields[FIELD_IDS.deadline] = deadline;
    if (stage) fields[FIELD_IDS.stage] = stage;
    if (setAside) fields[FIELD_IDS.setAsideType] = setAside;
    if (source) fields[FIELD_IDS.source] = source;
    if (sourceUrl) fields[FIELD_IDS.sourceUrl] = sourceUrl;
    if (notes) fields[FIELD_IDS.notes] = notes;

    const payload = {
      fields: fields,
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
      res.status(response.status).json({ error: errorData.error || 'Failed to update record' });
      return;
    }

    const record = await response.json();
    const opportunity = parseOpportunity(record);

    res.status(200).json(opportunity);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
}

/**
 * OPTIONS handler: CORS preflight
 */
function handleOptions(req, res) {
  res.status(200).end();
}

/**
 * Main handler - routes to appropriate method
 */
export default function handler(req, res) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  if (req.method === 'PUT') {
    return handlePut(req, res);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
