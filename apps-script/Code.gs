/**
 * PartyPost — Google Apps Script backend for one party.
 *
 * Bind this script to a Google Sheet. The sheet stores all party data:
 *   - Settings tab: key/value rows of party config
 *   - RSVPs tab:    one row per RSVP
 *   - Notes tab:    birthday wishes (host moderates by setting is_approved=TRUE)
 *
 * First-time setup, in this order:
 *   1. Run setupSheet()                — creates the 3 tabs with headers + sample settings
 *   2. Fill in the Settings tab with your party details
 *   3. Deploy → New deployment → Web app, "Execute as: Me", "Anyone has access"
 *   4. Copy the Web App URL into src/config/parties.ts in the PartyPost repo
 */

// ----- TABS -----
const SETTINGS_SHEET = 'Settings';
const RSVPS_SHEET = 'RSVPs';
const NOTES_SHEET = 'Notes';

const SETTINGS_KEYS = [
  ['birthday_child_name', 'Sophia'],
  ['birthday_age',        '7'],
  ['party_title',         "Sophia's 7th Birthday Party"],
  ['description',         'Come celebrate with sunshine, snacks, and a heroic quantity of birthday joy.'],
  ['date',                '2026-08-16'],
  ['start_time',          '12:30'],
  ['end_time',            '15:00'],
  ['timezone',            'America/New_York'],
  ['location_name',       'Arlington Reservoir Beach'],
  ['location_address',    '422 Lowell St, Arlington, MA 02474'],
  ['map_url',             ''],
  ['rsvp_deadline',       '2026-08-09'],
  ['host_name',           'Amy'],
  ['host_email',          ''],
  ['host_phone',          ''],
  ['gift_note',           ''],
  ['food_note',           'Pizza, fruit, and cupcakes'],
  ['rain_plan',           'We will text everyone by 9am if we need to move indoors.'],
  ['theme',               'beach'],
  ['hero_image_url',      ''],
  ['profile_image_url',   ''],
];

const RSVP_HEADERS = [
  'id', 'edit_token', 'status', 'parent_names', 'email', 'phone',
  'child_names', 'kids_count', 'adults_count', 'allergy_notes',
  'private_note', 'public_note', 'public_note_consent',
  'created_at', 'updated_at',
];

const NOTE_HEADERS = [
  'id', 'rsvp_id', 'display_name', 'message',
  'is_public', 'is_approved', 'created_at',
];

// ----- One-time setup -----

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open the bound Google Sheet, then run setupSheet from there.');

  ensureSettingsTab_(ss);
  ensureTabWithHeaders_(ss, RSVPS_SHEET, RSVP_HEADERS);
  ensureTabWithHeaders_(ss, NOTES_SHEET, NOTE_HEADERS);

  // Remove the default "Sheet1" if it's still around and empty.
  const def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0) ss.deleteSheet(def);

  SpreadsheetApp.getActive().toast(
    'PartyPost tabs ready! Edit Settings → then Deploy as Web App.',
    'PartyPost', 5
  );
}

function ensureSettingsTab_(ss) {
  let s = ss.getSheetByName(SETTINGS_SHEET);
  if (!s) s = ss.insertSheet(SETTINGS_SHEET, 0);
  if (s.getLastRow() === 0) {
    s.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]).setFontWeight('bold');
    s.getRange(2, 1, SETTINGS_KEYS.length, 2).setValues(SETTINGS_KEYS);
    s.setColumnWidth(1, 200);
    s.setColumnWidth(2, 500);
    s.setFrozenRows(1);
  }
}

function ensureTabWithHeaders_(ss, name, headers) {
  let s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  if (s.getLastRow() === 0) {
    s.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    s.setFrozenRows(1);
  }
}

// ----- Web app endpoints -----

function doGet(e) {
  return handle_(function () {
    const action = (e && e.parameter && e.parameter.action) || 'getParty';
    if (action === 'getParty')        return getPartyData_();
    if (action === 'getNotes')        return getApprovedNotes_();
    if (action === 'getRsvpByToken')  return getRsvpByToken_(e.parameter.token);
    throw new Error('Unknown GET action: ' + action);
  });
}

function doPost(e) {
  return handle_(function () {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action;
    if (action === 'submitRsvp')  return submitRsvp_(body.data || {});
    if (action === 'submitNote')  return submitNote_(body.data || {});
    if (action === 'editRsvp')    return editRsvp_(body.token, body.data || {});
    throw new Error('Unknown POST action: ' + action);
  });
}

function handle_(fn) {
  let payload;
  try {
    payload = { ok: true, data: fn() };
  } catch (err) {
    payload = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// ----- Reads -----

function getPartyData_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = readSettings_(ss);
  return { party: settings, notes: getApprovedNotes_() };
}

function readSettings_(ss) {
  const s = ss.getSheetByName(SETTINGS_SHEET);
  if (!s) throw new Error('Settings tab missing. Run setupSheet().');
  const last = s.getLastRow();
  if (last < 2) return {};
  const rows = s.getRange(2, 1, last - 1, 2).getValues();
  const out = {};
  rows.forEach(function (r) {
    const key = String(r[0] || '').trim();
    if (!key) return;
    out[key] = r[1]; // keep raw Date objects for per-key formatting below
  });

  const tz = ss.getSpreadsheetTimeZone() || 'America/New_York';

  // Date-only fields → YYYY-MM-DD
  ['date', 'rsvp_deadline'].forEach(function (k) {
    const v = out[k];
    if (v instanceof Date) out[k] = Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  });

  // Time-only fields → HH:MM. Sheets stores time-only cells as Dates anchored
  // at 1899-12-30, so we format with the spreadsheet TZ rather than slicing.
  ['start_time', 'end_time'].forEach(function (k) {
    const v = out[k];
    if (v instanceof Date) out[k] = Utilities.formatDate(v, tz, 'HH:mm');
    else if (typeof v === 'string' && /^\d{1,2}:\d{2}/.test(v)) out[k] = v.slice(0, 5);
  });

  // Stringify any other unexpected Date so JSON.stringify doesn't drop type info.
  Object.keys(out).forEach(function (k) {
    if (out[k] instanceof Date) out[k] = Utilities.formatDate(out[k], tz, 'yyyy-MM-dd');
  });

  if (out.birthday_age !== undefined && out.birthday_age !== '') {
    out.birthday_age = Number(out.birthday_age);
  }
  return out;
}

function getApprovedNotes_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const s = ss.getSheetByName(NOTES_SHEET);
  if (!s) return [];
  const last = s.getLastRow();
  if (last < 2) return [];
  const rows = s.getRange(2, 1, last - 1, NOTE_HEADERS.length).getValues();
  return rows
    .map(rowToObj_(NOTE_HEADERS))
    .filter(function (n) {
      return truthy_(n.is_approved) && truthy_(n.is_public);
    })
    .map(function (n) {
      return {
        id: n.id,
        display_name: n.display_name,
        message: n.message,
        created_at: serializeDate_(n.created_at),
      };
    });
}

function getRsvpByToken_(token) {
  if (!token) throw new Error('Missing token');
  const row = findRsvpRow_(token);
  if (!row) throw new Error('Not found');
  return row.data;
}

// ----- Writes -----

function submitRsvp_(data) {
  validateRsvp_(data);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const id = Utilities.getUuid();
    const editToken = randomToken_(24);
    const now = new Date();

    appendRow_(ss, RSVPS_SHEET, RSVP_HEADERS, {
      id: id,
      edit_token: editToken,
      status: data.status,
      parent_names: data.parent_names,
      email: data.email,
      phone: data.phone || '',
      child_names: data.child_names || '',
      kids_count: Number(data.kids_count || 0),
      adults_count: Number(data.adults_count || 0),
      allergy_notes: data.allergy_notes || '',
      private_note: data.private_note || '',
      public_note: data.public_note || '',
      public_note_consent: !!data.public_note_consent,
      created_at: now,
      updated_at: now,
    });

    if (data.public_note && data.public_note_consent) {
      appendRow_(ss, NOTES_SHEET, NOTE_HEADERS, {
        id: Utilities.getUuid(),
        rsvp_id: id,
        display_name: data.parent_names,
        message: data.public_note,
        is_public: true,
        is_approved: false,
        created_at: now,
      });
    }

    const settings = readSettings_(ss);
    sendConfirmationEmails_(settings, data, editToken);

    return { id: id, edit_token: editToken };
  } finally {
    lock.releaseLock();
  }
}

function submitNote_(data) {
  if (!data.display_name || !String(data.display_name).trim()) {
    throw new Error('Name required');
  }
  if (!data.message || !String(data.message).trim()) {
    throw new Error('Message required');
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  appendRow_(ss, NOTES_SHEET, NOTE_HEADERS, {
    id: Utilities.getUuid(),
    rsvp_id: '',
    display_name: String(data.display_name).slice(0, 80),
    message: String(data.message).slice(0, 500),
    is_public: true,
    is_approved: false,
    created_at: new Date(),
  });
  return { ok: true };
}

function editRsvp_(token, data) {
  if (!token) throw new Error('Missing token');
  validateRsvp_(data);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const found = findRsvpRow_(token);
    if (!found) throw new Error('RSVP not found');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const s = ss.getSheetByName(RSVPS_SHEET);
    const updates = Object.assign({}, found.data, {
      status: data.status,
      parent_names: data.parent_names,
      // email is intentionally NOT editable via token
      phone: data.phone || '',
      child_names: data.child_names || '',
      kids_count: Number(data.kids_count || 0),
      adults_count: Number(data.adults_count || 0),
      allergy_notes: data.allergy_notes || '',
      private_note: data.private_note || '',
      public_note: data.public_note || '',
      public_note_consent: !!data.public_note_consent,
      updated_at: new Date(),
    });
    const row = RSVP_HEADERS.map(function (h) { return updates[h] !== undefined ? updates[h] : ''; });
    s.getRange(found.rowIndex, 1, 1, RSVP_HEADERS.length).setValues([row]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

// ----- Helpers -----

function findRsvpRow_(token) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const s = ss.getSheetByName(RSVPS_SHEET);
  if (!s) return null;
  const last = s.getLastRow();
  if (last < 2) return null;
  const data = s.getRange(2, 1, last - 1, RSVP_HEADERS.length).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][1] || '') === token) {
      const obj = rowToObj_(RSVP_HEADERS)(data[i]);
      obj.created_at = serializeDate_(obj.created_at);
      obj.updated_at = serializeDate_(obj.updated_at);
      return { rowIndex: i + 2, data: obj };
    }
  }
  return null;
}

function appendRow_(ss, name, headers, obj) {
  const s = ss.getSheetByName(name);
  if (!s) throw new Error(name + ' tab missing. Run setupSheet().');
  const row = headers.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  s.appendRow(row);
}

function rowToObj_(headers) {
  return function (row) {
    const o = {};
    for (let i = 0; i < headers.length; i++) o[headers[i]] = row[i];
    return o;
  };
}

function truthy_(v) {
  if (v === true) return true;
  if (typeof v === 'string') return /^(true|yes|1|y)$/i.test(v.trim());
  if (typeof v === 'number') return v !== 0;
  return !!v;
}

function serializeDate_(v) {
  if (v instanceof Date) return v.toISOString();
  return v || '';
}

function randomToken_(len) {
  const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += alpha.charAt(Math.floor(Math.random() * alpha.length));
  return s;
}

function validateRsvp_(d) {
  if (!d || typeof d !== 'object') throw new Error('Missing data');
  if (['yes', 'no', 'maybe'].indexOf(d.status) === -1) throw new Error('Invalid status');
  if (!d.parent_names || !String(d.parent_names).trim()) throw new Error('Name required');
  if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.email).trim())) {
    throw new Error('Valid email required');
  }
  if (d.status !== 'no') {
    const total = Number(d.kids_count || 0) + Number(d.adults_count || 0);
    if (total <= 0) throw new Error('Add at least one attendee');
  }
}

function sendConfirmationEmails_(settings, data, editToken) {
  const partyTitle = settings.party_title || 'the party';
  // Try to send guest confirmation. If quota exceeded or anything fails, swallow it.
  try {
    const subject = 'RSVP saved: ' + partyTitle;
    const body = [
      'Hi! Your RSVP for ' + partyTitle + ' is saved.',
      '',
      'Status: ' + data.status,
      'Adults: ' + (data.adults_count || 0) + ', Kids: ' + (data.kids_count || 0),
      settings.date ? 'When: ' + settings.date + (settings.start_time ? ' at ' + settings.start_time : '') : '',
      settings.location_name ? 'Where: ' + settings.location_name + (settings.location_address ? ', ' + settings.location_address : '') : '',
      '',
      'Need to update? Use the magic edit link from the confirmation page on the website.',
    ].filter(Boolean).join('\n');
    MailApp.sendEmail(data.email, subject, body);
  } catch (e) { /* ignore */ }

  if (settings.host_email) {
    try {
      const subject = 'New RSVP for ' + partyTitle + ': ' + data.parent_names + ' (' + data.status + ')';
      const body = [
        data.parent_names + ' just RSVP\'d "' + data.status + '" for ' + partyTitle + '.',
        '',
        'Adults: ' + (data.adults_count || 0) + ', Kids: ' + (data.kids_count || 0),
        'Email: ' + data.email + (data.phone ? ' · Phone: ' + data.phone : ''),
        data.child_names ? 'Children: ' + data.child_names : '',
        data.allergy_notes ? 'Allergies: ' + data.allergy_notes : '',
        data.private_note ? 'Note to host: ' + data.private_note : '',
        data.public_note ? 'Public birthday wish: ' + data.public_note : '',
      ].filter(Boolean).join('\n');
      MailApp.sendEmail(settings.host_email, subject, body);
    } catch (e) { /* ignore */ }
  }
}
