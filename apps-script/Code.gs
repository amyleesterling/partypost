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
const INVITES_SHEET = 'Invitations';

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
  ['banner_image_url',    ''],
  ['invite_image_url',    ''],
  ['profile_image_url',   ''],
  // Required for invitation emails (so the email link knows the party URL).
  // Should match the slug used in src/config/parties.ts in the PartyPost repo.
  ['slug',                ''],
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

const INVITE_HEADERS = [
  'id', 'token', 'name', 'email',
  'sent_at', 'opened_at', 'clicked_at', 'rsvp_id', 'notes',
];

// ----- One-time setup -----

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open the bound Google Sheet, then run setupSheet from there.');

  ensureSettingsTab_(ss);
  ensureTabWithHeaders_(ss, RSVPS_SHEET, RSVP_HEADERS);
  ensureTabWithHeaders_(ss, NOTES_SHEET, NOTE_HEADERS);
  ensureTabWithHeaders_(ss, INVITES_SHEET, INVITE_HEADERS);

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
    if (action === 'getInvitee')      return getInviteeByToken_(e.parameter.i);
    if (action === 'trackClick')      return trackInviteClick_(e.parameter.i);
    // Pixel tracker: returns 1x1 GIF, marks opened_at on the invitee row.
    if (action === 'trackOpen') {
      trackInviteOpen_(e.parameter.i);
      return { _pixel: true };
    }
    throw new Error('Unknown GET action: ' + action);
  });
}

function doPost(e) {
  return handle_(function () {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action;
    if (action === 'submitRsvp')  return submitRsvp_(body.data || {}, body.siteUrl || '', body.slug || '', body.inviteToken || '');
    if (action === 'submitNote')  return submitNote_(body.data || {});
    if (action === 'editRsvp')    return editRsvp_(body.token, body.data || {});
    // Admin actions — all require a matching ADMIN_KEY script property.
    if (action === 'adminListInvitations') return adminListInvitations_(body.key || '');
    if (action === 'adminAddInvitees')     return adminAddInvitees_(body.key || '', body.invitees || []);
    if (action === 'adminSendPending')     return adminSendPending_(body.key || '');
    throw new Error('Unknown POST action: ' + action);
  });
}

function _checkAdminKey_(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!expected) {
    throw new Error("Admin not configured. Set ADMIN_KEY in Project Settings → Script properties.");
  }
  if (String(provided || '') !== expected) {
    throw new Error("Wrong password.");
  }
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

function submitRsvp_(data, siteUrl, slug, inviteToken) {
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
      public_note_consent: true,
      created_at: now,
      updated_at: now,
    });

    if (data.public_note) {
      appendRow_(ss, NOTES_SHEET, NOTE_HEADERS, {
        id: Utilities.getUuid(),
        rsvp_id: id,
        display_name: data.parent_names,
        message: data.public_note,
        is_public: true,
        is_approved: true,
        created_at: now,
      });
    }

    // Tie RSVP back to the invitation row, if the URL had ?i=TOKEN.
    if (inviteToken) {
      try { linkRsvpToInvite_(ss, inviteToken, id); } catch (_e) { /* ignore */ }
    }

    const settings = readSettings_(ss);
    sendConfirmationEmails_(settings, data, editToken, siteUrl, slug);

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
    is_approved: true,
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
  if (['yes', 'no'].indexOf(d.status) === -1) throw new Error('Invalid status');
  if (!d.parent_names || !String(d.parent_names).trim()) throw new Error('Name required');
  if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.email).trim())) {
    throw new Error('Valid email required');
  }
  if (d.status === 'yes') {
    const total = Number(d.kids_count || 0) + Number(d.adults_count || 0);
    if (total <= 0) throw new Error('Add at least one attendee');
  }
}

// ----- Email helpers -----

function buildPartyDate_(settings) {
  if (!settings.date) return null;
  const startT = settings.start_time && /^\d{1,2}:\d{2}/.test(settings.start_time)
    ? settings.start_time.slice(0, 5) : '12:00';
  const start = new Date(settings.date + 'T' + startT + ':00');
  if (isNaN(start.getTime())) return null;
  let end;
  if (settings.end_time && /^\d{1,2}:\d{2}/.test(settings.end_time)) {
    end = new Date(settings.date + 'T' + settings.end_time.slice(0, 5) + ':00');
    if (isNaN(end.getTime())) end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  } else {
    end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  }
  return { start: start, end: end };
}

function googleCalendarUrl_(settings, partyUrl) {
  const dates = buildPartyDate_(settings);
  if (!dates) return '';
  const fmt = function (d) { return Utilities.formatDate(d, 'UTC', "yyyyMMdd'T'HHmmss'Z'"); };
  const params = [
    'action=TEMPLATE',
    'text=' + encodeURIComponent(settings.party_title || 'Birthday Party'),
    'dates=' + fmt(dates.start) + '/' + fmt(dates.end),
    'details=' + encodeURIComponent(
      [settings.description || '', partyUrl].filter(Boolean).join('\n\n')
    ),
    'location=' + encodeURIComponent(
      [settings.location_name, settings.location_address].filter(Boolean).join(', ')
    ),
  ];
  return 'https://calendar.google.com/calendar/render?' + params.join('&');
}

function googleMapsUrl_(settings) {
  const q = (settings.location_address || settings.location_name || '').trim();
  if (!q) return '';
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
}

function formatPartyDateHuman_(settings) {
  if (!settings.date) return '';
  const dates = buildPartyDate_(settings);
  if (!dates) return settings.date;
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || 'America/New_York';
  const dateStr = Utilities.formatDate(dates.start, tz, 'EEEE, MMMM d');
  const startStr = settings.start_time ? Utilities.formatDate(dates.start, tz, 'h:mm a') : '';
  const endStr = settings.end_time ? Utilities.formatDate(dates.end, tz, 'h:mm a') : '';
  const time = startStr && endStr ? startStr + ' – ' + endStr : (startStr || '');
  return time ? dateStr + ' · ' + time : dateStr;
}

function escapeHtml_(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function guestEmailHtml_(settings, data, partyUrl, editUrl, gcalUrl, mapsUrl) {
  const heroImg = settings.invite_image_url || settings.hero_image_url || settings.banner_image_url || '';
  const accent = '#2F80ED';
  const ink = '#0B3A57';
  const muted = '#3F6280';
  const heading = '#3B2A6B';
  const partyTitle = settings.party_title || 'the party';
  const whenStr = formatPartyDateHuman_(settings);
  const where = [settings.location_name, settings.location_address].filter(Boolean).join(', ');

  const button = function (href, label, primary) {
    if (!href) return '';
    const bg = primary ? accent : '#ffffff';
    const fg = primary ? '#ffffff' : accent;
    const border = primary ? accent : '#cdd9e6';
    return '<a href="' + escapeHtml_(href) + '" style="display:inline-block;margin:6px 6px 0 0;padding:10px 18px;background:' + bg + ';color:' + fg + ';text-decoration:none;border-radius:9999px;font-weight:600;border:1px solid ' + border + ';font-size:14px;">' + label + '</a>';
  };

  return ''
    + '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#eaf4fb;padding:24px 12px;color:' + ink + ';">'
    + '<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 6px 20px rgba(15,30,60,0.10);">'
    + (heroImg ? '<img src="' + escapeHtml_(heroImg) + '" alt="' + escapeHtml_(partyTitle) + '" style="display:block;width:100%;height:auto;">' : '')
    + '<div style="padding:24px;">'
    +   '<h1 style="margin:0 0 6px;font-size:24px;color:' + heading + ';font-family:Georgia,serif;">Yay! Your RSVP is in.</h1>'
    +   '<p style="margin:0 0 18px;color:' + muted + ';font-size:15px;">The snack-counting fairies have been notified.</p>'
    +   '<div style="background:#f4f8fb;border-radius:14px;padding:14px 18px;margin:0 0 16px;font-size:14px;line-height:1.6;">'
    +     '<div><strong>Status:</strong> ' + escapeHtml_(data.status) + '</div>'
    +     (data.status === 'yes'
            ? '<div><strong>Adults:</strong> ' + Number(data.adults_count || 0) + ' · <strong>Kids:</strong> ' + Number(data.kids_count || 0) + '</div>'
            : '')
    +     (data.child_names ? '<div><strong>Children:</strong> ' + escapeHtml_(data.child_names) + '</div>' : '')
    +   '</div>'
    +   '<h2 style="margin:18px 0 6px;font-size:16px;color:' + heading + ';font-family:Georgia,serif;">' + escapeHtml_(partyTitle) + '</h2>'
    +   (whenStr ? '<div style="color:' + muted + ';font-size:14px;">' + escapeHtml_(whenStr) + '</div>' : '')
    +   (where ? '<div style="color:' + muted + ';font-size:14px;">' + escapeHtml_(where) + '</div>' : '')
    +   '<div style="margin-top:20px;">'
    +     button(partyUrl, '🎈 View party page', true)
    +     button(gcalUrl, '📅 Add to Calendar', false)
    +     button(mapsUrl, '📍 Map &amp; Directions', false)
    +   '</div>'
    +   '<div style="margin-top:24px;padding-top:18px;border-top:1px solid #e0e7ee;font-size:13px;color:' + muted + ';">'
    +     'Need to change your RSVP? <a href="' + escapeHtml_(editUrl) + '" style="color:' + accent + ';">Update it here</a>.'
    +   '</div>'
    + '</div>'
    + '</div>'
    + '</div>';
}

function guestEmailText_(settings, data, partyUrl, editUrl, gcalUrl, mapsUrl) {
  const partyTitle = settings.party_title || 'the party';
  const whenStr = formatPartyDateHuman_(settings);
  const where = [settings.location_name, settings.location_address].filter(Boolean).join(', ');
  return [
    'Yay! Your RSVP for ' + partyTitle + ' is in.',
    '',
    'Status: ' + data.status,
    data.status === 'yes' ? 'Adults: ' + (data.adults_count || 0) + ', Kids: ' + (data.kids_count || 0) : '',
    data.child_names ? 'Children: ' + data.child_names : '',
    '',
    whenStr ? 'When: ' + whenStr : '',
    where ? 'Where: ' + where : '',
    '',
    partyUrl ? 'Party page: ' + partyUrl : '',
    gcalUrl ? 'Add to Calendar: ' + gcalUrl : '',
    mapsUrl ? 'Map & Directions: ' + mapsUrl : '',
    '',
    'Need to change your RSVP? ' + editUrl,
  ].filter(Boolean).join('\n');
}

function sendConfirmationEmails_(settings, data, editToken, siteUrl, slug) {
  const base = (siteUrl || 'https://partypost.vercel.app').replace(/\/$/, '');
  const partyUrl = slug ? base + '/party/' + slug : base;
  const editUrl = slug
    ? base + '/party/' + slug + '/rsvp/edit/' + editToken
    : base;
  const gcalUrl = googleCalendarUrl_(settings, partyUrl);
  const mapsUrl = googleMapsUrl_(settings);
  const partyTitle = settings.party_title || 'the party';

  // Guest confirmation
  try {
    MailApp.sendEmail({
      to: data.email,
      subject: 'RSVP saved: ' + partyTitle,
      htmlBody: guestEmailHtml_(settings, data, partyUrl, editUrl, gcalUrl, mapsUrl),
      body: guestEmailText_(settings, data, partyUrl, editUrl, gcalUrl, mapsUrl),
    });
  } catch (e) { /* ignore */ }

  // Host notification
  if (settings.host_email) {
    try {
      const subject = 'New RSVP for ' + partyTitle + ': ' + data.parent_names + ' (' + data.status + ')';
      const lines = [
        data.parent_names + ' just RSVP\'d "' + data.status + '" for ' + partyTitle + '.',
        '',
        data.status === 'yes' ? 'Adults: ' + (data.adults_count || 0) + ', Kids: ' + (data.kids_count || 0) : '',
        'Email: ' + data.email + (data.phone ? ' · Phone: ' + data.phone : ''),
        data.child_names ? 'Children: ' + data.child_names : '',
        data.allergy_notes ? 'Allergies: ' + data.allergy_notes : '',
        data.private_note ? 'Note to host: ' + data.private_note : '',
        data.public_note ? 'Public birthday wish: ' + data.public_note : '',
        '',
        partyUrl ? 'Party page: ' + partyUrl : '',
      ].filter(Boolean).join('\n');
      MailApp.sendEmail(settings.host_email, subject, lines);
    } catch (e) { /* ignore */ }
  }
}

// ============================================================================
// INVITATIONS
// ----------------------------------------------------------------------------
// Workflow:
//   1. Open the Sheet, switch to the "Invitations" tab
//   2. Add rows: just `name` and `email` per guest (leave the other columns
//      blank — they fill in automatically)
//   3. From the Apps Script editor, run sendPendingInvitations()
//      (function dropdown → sendPendingInvitations → ▶ Run)
//   4. Each guest gets a personalized email with a link like
//      https://partypost.vercel.app/party/<slug>?i=<TOKEN>
//   5. As guests open / click / RSVP, the Invitations row updates in real time
// ============================================================================

/**
 * Manual entry point. Run this from the Apps Script editor (or wire it to a
 * sheet menu / time trigger) after adding new rows to the Invitations tab.
 *
 * Reads the SITE_URL Script Property if set, otherwise falls back to the
 * compiled-in default. Uses Settings.party_title for the email subject.
 */
function sendPendingInvitations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = readSettings_(ss);
  const slug = _readSiteSlug_(ss);
  const siteUrl = _readSiteUrl_();
  const scriptUrl = ScriptApp.getService().getUrl();

  if (!slug) {
    SpreadsheetApp.getActive().toast(
      'Set the "slug" row in Settings (e.g. "sophia-7") before sending invites.',
      'PartyPost', 6
    );
    throw new Error('Settings.slug is required to build invitation URLs.');
  }

  const sheet = ss.getSheetByName(INVITES_SHEET);
  if (!sheet) throw new Error('Invitations tab missing. Run setupSheet().');
  const last = sheet.getLastRow();
  if (last < 2) {
    SpreadsheetApp.getActive().toast('No invitations to send.', 'PartyPost', 4);
    return;
  }

  const rows = sheet.getRange(2, 1, last - 1, INVITE_HEADERS.length).getValues();
  let sent = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rowToObj_(INVITE_HEADERS)(rows[i]);
    if (row.sent_at) continue; // already sent
    if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(row.email).trim())) {
      skipped++;
      continue;
    }

    const id = row.id || Utilities.getUuid();
    const token = row.token || randomToken_(20);
    try {
      sendInvitationEmail_({
        settings: settings,
        siteUrl: siteUrl,
        scriptUrl: scriptUrl,
        slug: slug,
        name: row.name || '',
        email: String(row.email).trim(),
        token: token,
      });
      // Update the row: id, token, sent_at
      const rowIndex = i + 2;
      sheet.getRange(rowIndex, 1).setValue(id);
      sheet.getRange(rowIndex, 2).setValue(token);
      sheet.getRange(rowIndex, 5).setValue(new Date()); // sent_at
      sent++;
    } catch (err) {
      const rowIndex = i + 2;
      sheet.getRange(rowIndex, 9).setValue('send failed: ' + err.message); // notes
      skipped++;
    }
  }

  SpreadsheetApp.getActive().toast(
    'Sent ' + sent + ', skipped ' + skipped, 'PartyPost', 6
  );
}

function _readSiteSlug_(ss) {
  const settings = readSettings_(ss);
  if (settings.slug) return String(settings.slug).trim();
  // Fall back to the spreadsheet name lowercased, dashed.
  return null;
}

function _readSiteUrl_() {
  const props = PropertiesService.getScriptProperties();
  const v = props.getProperty('SITE_URL');
  return (v || 'https://partypost.vercel.app').replace(/\/$/, '');
}

function sendInvitationEmail_(opts) {
  const settings = opts.settings;
  const partyTitle = settings.party_title || 'a birthday party';
  const partyUrl = opts.siteUrl + '/party/' + opts.slug + '?i=' + encodeURIComponent(opts.token);
  const pixelUrl = opts.scriptUrl + '?action=trackOpen&i=' + encodeURIComponent(opts.token);
  const greeting = opts.name ? ('Hi ' + opts.name + ',') : 'Hi!';
  const heroImg = settings.invite_image_url || settings.banner_image_url || settings.hero_image_url || '';
  const accent = '#2F80ED';
  const ink = '#0B3A57';
  const heading = '#3B2A6B';
  const muted = '#3F6280';
  const whenStr = formatPartyDateHuman_(settings);
  const where = [settings.location_name, settings.location_address].filter(Boolean).join(', ');

  const html = ''
    + '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#eaf4fb;padding:24px 12px;color:' + ink + ';">'
    + '<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 6px 20px rgba(15,30,60,0.10);">'
    + (heroImg ? '<img src="' + escapeHtml_(heroImg) + '" alt="' + escapeHtml_(partyTitle) + '" style="display:block;width:100%;height:auto;">' : '')
    + '<div style="padding:24px;">'
    +   '<p style="margin:0 0 12px;font-size:16px;color:' + ink + ';">' + escapeHtml_(greeting) + '</p>'
    +   '<h1 style="margin:0 0 8px;font-size:24px;color:' + heading + ';font-family:Georgia,serif;">You&rsquo;re invited!</h1>'
    +   '<h2 style="margin:0 0 14px;font-size:18px;color:' + ink + ';font-weight:600;">' + escapeHtml_(partyTitle) + '</h2>'
    +   (whenStr ? '<div style="color:' + muted + ';font-size:14px;">' + escapeHtml_(whenStr) + '</div>' : '')
    +   (where ? '<div style="color:' + muted + ';font-size:14px;margin-top:2px;">' + escapeHtml_(where) + '</div>' : '')
    +   '<div style="margin-top:22px;">'
    +     '<a href="' + escapeHtml_(partyUrl) + '" style="display:inline-block;padding:13px 28px;background:' + accent + ';color:#ffffff;text-decoration:none;border-radius:9999px;font-weight:700;font-size:15px;">View invitation &amp; RSVP →</a>'
    +   '</div>'
    +   '<div style="margin-top:24px;padding-top:18px;border-top:1px solid #e0e7ee;font-size:12px;color:' + muted + ';">'
    +     'Tap the button above to view the full invite and RSVP. No account needed.'
    +   '</div>'
    + '</div>'
    + '</div>'
    + '<img src="' + escapeHtml_(pixelUrl) + '" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;">'
    + '</div>';

  const text = [
    greeting,
    '',
    "You're invited to " + partyTitle + '.',
    whenStr,
    where,
    '',
    'View invitation & RSVP: ' + partyUrl,
  ].filter(Boolean).join('\n');

  MailApp.sendEmail({
    to: opts.email,
    subject: "You're invited: " + partyTitle,
    htmlBody: html,
    body: text,
  });
}

function trackInviteOpen_(token) {
  if (!token) return;
  const found = findInviteRow_(token);
  if (!found) return;
  if (!found.data.opened_at) {
    SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(INVITES_SHEET)
      .getRange(found.rowIndex, 6) // opened_at column
      .setValue(new Date());
  }
}

function trackInviteClick_(token) {
  if (!token) throw new Error('Missing token');
  const found = findInviteRow_(token);
  if (!found) return { ok: false }; // unknown invite
  if (!found.data.clicked_at) {
    SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(INVITES_SHEET)
      .getRange(found.rowIndex, 7) // clicked_at column
      .setValue(new Date());
  }
  return { ok: true };
}

function getInviteeByToken_(token) {
  if (!token) throw new Error('Missing token');
  const found = findInviteRow_(token);
  if (!found) throw new Error('Unknown invite');
  return {
    name: found.data.name || '',
    email: found.data.email || '',
  };
}

function findInviteRow_(token) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(INVITES_SHEET);
  if (!sheet) return null;
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const rows = sheet.getRange(2, 1, last - 1, INVITE_HEADERS.length).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][1] || '') === token) {
      return { rowIndex: i + 2, data: rowToObj_(INVITE_HEADERS)(rows[i]) };
    }
  }
  return null;
}

function linkRsvpToInvite_(ss, token, rsvpId) {
  const sheet = ss.getSheetByName(INVITES_SHEET);
  if (!sheet) return;
  const found = findInviteRow_(token);
  if (!found) return;
  sheet.getRange(found.rowIndex, 8).setValue(rsvpId); // rsvp_id column
  if (!found.data.clicked_at) {
    sheet.getRange(found.rowIndex, 7).setValue(new Date());
  }
}
