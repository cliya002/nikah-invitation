/**
 * Nikah invitation — RSVP receiver.
 *
 * Paste this into Extensions → Apps Script of the Google Sheet you want to use as your
 * guest tracker, then deploy it as a Web app (see README → "RSVP tracking").
 *
 * Every reply from the invitation becomes one row on the "RSVPs" tab.
 * A "Summary" tab with live counts is created the first time a reply arrives.
 * If the same name replies again, the earlier row is updated instead of duplicated,
 * so the counts stay honest when a guest changes their mind.
 */

const RSVP_SHEET = 'RSVPs';
const SUMMARY_SHEET = 'Summary';
const HEADERS = ['Replied at', 'Name', 'Attending', 'Guests', 'Phone', 'Message', 'Sent from', 'Updates'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const data = parseBody_(e);
    if (!data.name) return json_({ ok: false, error: 'name is required' });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ensureRsvpSheet_(ss);
    ensureSummarySheet_(ss);

    const row = [
      new Date(),
      String(data.name).slice(0, 80),
      data.attending === 'Yes' ? 'Yes' : 'No',
      data.attending === 'Yes' ? Math.max(1, Math.min(20, Number(data.guests) || 1)) : 0,
      String(data.phone || '').slice(0, 30),
      String(data.message || '').slice(0, 400),
      String(data.source || '').slice(0, 200),
      0
    ];

    // same guest replying again → update their row rather than adding a second one
    const existing = findRowByName_(sh, row[1]);
    if (existing) {
      const updates = Number(sh.getRange(existing, 8).getValue()) || 0;
      row[7] = updates + 1;
      sh.getRange(existing, 1, 1, HEADERS.length).setValues([row]);
    } else {
      sh.appendRow(row);
    }
    return json_({ ok: true, updated: !!existing });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web app URL in a browser shows this, which is a handy way to confirm the deployment works.
function doGet() {
  return json_({ ok: true, service: 'nikah-rsvp', time: new Date().toISOString() });
}

/* ---------------- helpers ---------------- */

function parseBody_(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (_) { /* fall through */ }
  }
  return (e && e.parameter) || {};
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ensureRsvpSheet_(ss) {
  let sh = ss.getSheetByName(RSVP_SHEET);
  if (!sh) sh = ss.insertSheet(RSVP_SHEET, 0);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    const head = sh.getRange(1, 1, 1, HEADERS.length);
    head.setFontWeight('bold').setBackground('#f3e6da').setFontColor('#5d403a');
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, 1, 150);
    sh.setColumnWidths(2, 1, 200);
    sh.setColumnWidths(6, 1, 320);
    sh.getRange('A:A').setNumberFormat('dd mmm yyyy, hh:mm');
  }
  return sh;
}

function ensureSummarySheet_(ss) {
  if (ss.getSheetByName(SUMMARY_SHEET)) return;
  const s = ss.insertSheet(SUMMARY_SHEET, 1);
  const r = `'${RSVP_SHEET}'!`;
  s.getRange('A1:B6').setValues([
    ['Replies received', `=COUNTA(${r}B2:B)`],
    ['Accepting', `=COUNTIF(${r}C2:C,"Yes")`],
    ['Declining', `=COUNTIF(${r}C2:C,"No")`],
    ['Total guests attending', `=SUMIF(${r}C2:C,"Yes",${r}D2:D)`],
    ['Latest reply', `=IF(COUNTA(${r}A2:A)=0,"—",TEXT(MAX(${r}A2:A),"dd mmm yyyy, hh:mm"))`],
    ['Guests with a message', `=COUNTIF(${r}F2:F,"?*")`]
  ]);
  s.getRange('A1:A6').setFontWeight('bold').setFontColor('#5d403a');
  s.getRange('B1:B6').setHorizontalAlignment('right');
  s.setColumnWidths(1, 1, 220);
  s.setColumnWidths(2, 1, 160);
}

function findRowByName_(sh, name) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const names = sh.getRange(2, 2, last - 1, 1).getValues();
  const key = normalise_(name);
  for (let i = 0; i < names.length; i++) {
    if (normalise_(names[i][0]) === key) return i + 2;
  }
  return 0;
}

function normalise_(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Run this once from the editor (Run → testPost) to confirm the sheet wiring before deploying. */
function testPost() {
  const fake = { postData: { contents: JSON.stringify({ name: 'Test Guest', attending: 'Yes', guests: 2, message: 'Delete me' }) } };
  Logger.log(doPost(fake).getContent());
}
