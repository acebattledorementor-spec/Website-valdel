// Maps a stored website enquiry to one row of Valdel One's MI lead inbox (valdel-one/mi.py LEAD_COLS).
// Keep LEAD_COLS identical to mi.py: Valdel One reads the sheet "Leads" by these exact header names.

export const LEAD_COLS = ['Lead ID', 'Found Date', 'Category', 'End User', 'EPC / Contractor', 'Project', 'Scope', 'Facility', 'Location', 'Region',
  'Sector', 'Service', 'Est Value USD', 'Timeline', 'Project Status', 'Suggested Class', 'Fit Rating', 'Competition Rating',
  'Location Rating', 'Resource Rating', 'MI Ref', 'Participants', 'Awarded To', 'Market Award Date', 'Key Person',
  'Engineering SOW', 'VDE Angle', 'Source Link', 'Source Date', 'Status', 'BDOS Opp ID', 'Reviewed On'];

export const FORM_LABELS = {
  tender: 'Tender package / RFQ', prebid: 'Pre-bid support request', general: 'General enquiry',
  prequal: 'Prequalification pack request', vendor_docs: 'Vendor registration documents request', job_apply: 'Job application',
};
const ASSETS = {
  'wellhead-platforms-jackets': 'Wellhead platform / jacket', 'process-platforms': 'Process platform', 'fpso-topsides': 'FPSO topside modules',
  'subsea-pipelines': 'Subsea pipelines', brownfield: 'Brownfield', 'offshore-wind': 'Offshore wind substation', other: 'Other',
};
// Website service slugs -> Valdel One "Service" picklist (13_Lists). Exact strings, or Valdel One drops the value.
const SERVICES = {
  'pre-bid': 'Pre-bid engineering', 'concept-feed': 'FEED', 'detail-engineering': 'Detail engineering', 'installation-engineering': 'Installation engineering',
  'yard-support': 'Fabrication / yard support', 'procurement-expediting': 'Procurement assistance', verification: 'Review & verification',
  'as-built-3d': 'As-built drawings & 3D model', 'weight-control': 'Weight control',
};
// Website region options -> Valdel One "Region" picklist.
const REGIONS = {
  'Middle East': 'GCC', 'India / South Asia': 'India', 'Southeast Asia': 'SE Asia', 'East Asia': 'Other', Australia: 'Other',
  Europe: 'Europe', Africa: 'Africa', 'Americas / Caribbean': 'Americas', Other: 'Other',
};

/** Only business enquiries go to the MI inbox; job applications go to HR, never into BD records. */
export const isLead = (rec) => rec && rec.type !== 'job_apply' && !rec.spam;

export function toLeadRow(rec) {
  const f = rec.fields || {};
  const svc = [].concat(f.services || []);
  if (rec.type === 'prebid' && !svc.includes('pre-bid')) svc.unshift('pre-bid');
  const services = svc.map((s) => SERVICES[s] || s);
  const sow = [f.message, f.est_scope ? `Estimated scope: ${f.est_scope}` : '', f.portal ? `Portal: ${f.portal}` : '', f.deadline ? `Deadline: ${f.deadline}` : ''].filter(Boolean).join('\n');
  const angle = [
    FORM_LABELS[rec.type] || rec.type,
    f.asset ? `Asset: ${ASSETS[f.asset] || f.asset}` : '',
    services.length > 1 ? `Services: ${services.join(', ')}` : '',
    f.nda === 'yes' ? 'NDA requested before documents' : '',
    rec.file ? `Upload: ${rec.file.name} (${Math.round(rec.file.size / 1024)} KB, ${rec.file.scan || 'not scanned'})` : '',
    f.share_link ? `Share link: ${f.share_link}` : '',
    f.context ? `Context: ${f.context}` : '',
    rec.country ? `Visitor country: ${rec.country}` : '',
  ].filter(Boolean).join(' · ');
  const timeline = [f.bid_due_date ? `Bid due ${f.bid_due_date}` : '', f.timeline || ''].filter(Boolean).join('; ');
  const day = (rec.receivedAt || '').slice(0, 10);
  const row = {
    'Lead ID': rec.id,
    'Found Date': day,
    Category: 'Website enquiry',
    'End User': f.end_user || '',
    'EPC / Contractor': f.company || '',
    Project: f.project || `${FORM_LABELS[rec.type] || 'Website enquiry'} – ${f.company || f.email || ''}`.trim(),
    Scope: [ASSETS[f.asset] || f.asset, f.est_scope].filter(Boolean).join('; '),
    Facility: 'Offshore',
    Location: '',
    Region: REGIONS[f.region] || '',
    Sector: f.asset === 'offshore-wind' ? 'Renewables' : f.asset && f.asset !== 'other' ? 'Upstream' : '',
    Service: services[0] || '',
    Timeline: timeline,
    'Project Status': rec.type === 'prebid' || rec.type === 'tender' || f.bid_due_date ? 'Inquiry Floated' : '',
    'Key Person': [f.name, f.email].filter(Boolean).join(' <') + (f.name && f.email ? '>' : ''),
    'Engineering SOW': sow,
    'VDE Angle': angle,
    'Source Link': f.page_url || '',
    'Source Date': day,
    Status: '',
  };
  return LEAD_COLS.map((c) => row[c] ?? '');
}
