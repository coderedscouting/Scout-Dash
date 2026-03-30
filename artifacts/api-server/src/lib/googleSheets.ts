// Google Sheets integration via Replit connector (googleapis)
// WARNING: Never cache the client — tokens expire. Always call getUncachableGoogleSheetClient() fresh.
//
// Local dev fallback: if REPLIT_CONNECTORS_HOSTNAME is absent (i.e. not running on Replit),
// submissions are sent to APPS_SCRIPT_URL (a published Google Apps Script web app) instead.
import { google } from "googleapis";
import { logger } from "./logger";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const ON_REPLIT = !!process.env.REPLIT_CONNECTORS_HOSTNAME;

let connectionSettings: any;

async function getAccessToken() {
  if (
    connectionSettings &&
    connectionSettings.settings.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) throw new Error("X-Replit-Token not found for repl/depl");

  connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=google-sheet",
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    },
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) throw new Error("Google Sheet not connected");
  return accessToken;
}

async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth: oauth2Client });
}

// ── Local dev: Apps Script fallback ────────────────────────────────────────
// Posts the data as JSON to a published Google Apps Script web app.
// Format: { eventKey, type: "matchData"|"hpData"|"pitData", data: { ...fields } }
// The Apps Script receives this in doPost(e) and appends a row to the sheet.
async function sendViaAppsScript(
  type: "matchData" | "hpData" | "pitData",
  eventKey: string,
  data: Record<string, unknown>,
) {
  if (!APPS_SCRIPT_URL) {
    logger.warn("APPS_SCRIPT_URL not set — skipping local Sheets write");
    return;
  }
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" }, // GAS requires text/plain for no-cors
      body: JSON.stringify({ eventKey, [type]: [data] }),
    });
    logger.info({ type }, "Sent to Apps Script");
  } catch (err) {
    logger.warn({ err }, "Failed to send to Apps Script");
  }
}

// ── Replit: googleapis path ─────────────────────────────────────────────────
async function ensureTab(
  sheets: Awaited<ReturnType<typeof getUncachableGoogleSheetClient>>,
  tabName: string,
  headers: string[],
) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID! });
  const exists = meta.data.sheets?.some((s) => s.properties?.title === tabName);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID!,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID!,
      range: `${tabName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers] },
    });
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID! });
    const sheetId = sheetMeta.data.sheets?.find(
      (s) => s.properties?.title === tabName,
    )?.properties?.sheetId;
    if (sheetId !== undefined) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID!,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
                cell: { userEnteredFormat: { textFormat: { bold: true } } },
                fields: "userEnteredFormat(textFormat)",
              },
            },
            {
              updateSheetProperties: {
                properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
                fields: "gridProperties.frozenRowCount",
              },
            },
          ],
        },
      });
    }
  }
}

async function appendRow(
  tabName: string,
  headers: string[],
  row: (string | number | boolean | null | undefined)[],
) {
  if (!SHEET_ID) {
    logger.warn("GOOGLE_SHEET_ID not set — skipping Sheets write");
    return;
  }
  try {
    const sheets = await getUncachableGoogleSheetClient();
    await ensureTab(sheets, tabName, headers);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${tabName}!A:A`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
  } catch (err) {
    logger.warn({ err }, `Failed to write to Google Sheets tab: ${tabName}`);
  }
}

// ── Public API ──────────────────────────────────────────────────────────────
const MATCH_HEADERS = [
  "Event", "Scouter", "Team #", "Match #", "Start Pos",
  "Auto Cycle Starts", "Auto Cycle Stops",
  "Auto Climb Start", "Auto Climb Location", "Auto Climb Success", "Auto Climb Success Time",
  "Tele Cycle Starts", "Tele Cycle Stops",
  "Tele Climb Start", "Tele Climb Location", "Tele Climb Level", "Tele Climb Success", "Tele Climb Success Time",
  "Comments", "Defense Played", "Defense Rating",
];
const HP_HEADERS = ["Event", "Scouter", "Match #", "Alliance", "Shots Made"];
const PIT_HEADERS = [
  "Event", "Scouter", "Team #", "Team Name", "Drive Train",
  "Avg. Capacity (pieces)", "Auto Pieces Scored", "Can Climb", "Climb Levels", "Comments",
];

export async function appendMatchRow(eventKey: string, body: any) {
  if (!ON_REPLIT) {
    return sendViaAppsScript("matchData", eventKey, {
      scouter: body.scouter, teamNum: body.teamNum, matchNum: body.matchNum,
      startPos: body.startPos,
      autoCycleStarts: (body.autoCycles?.starts ?? []).join(", "),
      autoCycleStops: (body.autoCycles?.stops ?? []).join(", "),
      autoClimbStart: body.autoClimb?.startTime ?? "",
      autoClimbLocation: body.autoClimb?.location ?? "",
      autoClimbSuccess: body.autoClimb?.success ?? "",
      autoClimbSuccessTime: body.autoClimb?.successTime ?? "",
      teleCycleStarts: (body.teleCycles?.starts ?? []).join(", "),
      teleCycleStops: (body.teleCycles?.stops ?? []).join(", "),
      teleClimbStart: body.teleClimb?.startTime ?? "",
      teleClimbLocation: body.teleClimb?.location ?? "",
      teleClimbLevel: body.teleClimb?.level ?? "",
      teleClimbSuccess: body.teleClimb?.success ?? "",
      teleClimbSuccessTime: body.teleClimb?.successTime ?? "",
      comments: body.comments ?? "",
      defensePlayed: body.defensePlayed ?? "",
      defenseRating: body.defenseRating ?? "",
    });
  }
  await appendRow("Match Data", MATCH_HEADERS, [
    eventKey,
    body.scouter, body.teamNum, body.matchNum, body.startPos,
    (body.autoCycles?.starts ?? []).join(", "),
    (body.autoCycles?.stops ?? []).join(", "),
    body.autoClimb?.startTime ?? "",
    body.autoClimb?.location ?? "",
    body.autoClimb?.success ?? "",
    body.autoClimb?.successTime ?? "",
    (body.teleCycles?.starts ?? []).join(", "),
    (body.teleCycles?.stops ?? []).join(", "),
    body.teleClimb?.startTime ?? "",
    body.teleClimb?.location ?? "",
    body.teleClimb?.level ?? "",
    body.teleClimb?.success ?? "",
    body.teleClimb?.successTime ?? "",
    body.comments ?? "",
    body.defensePlayed ?? "",
    body.defenseRating ?? "",
  ]);
}

export async function appendHpRow(eventKey: string, body: any) {
  if (!ON_REPLIT) {
    return sendViaAppsScript("hpData", eventKey, {
      scouter: body.scouter, matchNum: body.matchNum,
      alliance: body.alliance, scores: body.scores,
    });
  }
  await appendRow("Human Player Data", HP_HEADERS, [
    eventKey, body.scouter, body.matchNum, body.alliance, body.scores,
  ]);
}

export async function appendPitRow(eventKey: string, body: any) {
  if (!ON_REPLIT) {
    return sendViaAppsScript("pitData", eventKey, {
      scouter: body.scouter, teamNum: body.teamNum, teamName: body.teamName ?? "",
      drivetrain: body.drivetrain ?? "", avgCapacity: body.avgCapacity ?? "",
      autoPiecesScored: body.autoPiecesScored ?? "", canClimb: body.canClimb ?? "",
      climbLevels: body.climbLevels ?? "", comments: body.comments ?? "",
    });
  }
  await appendRow("Pit Scouting", PIT_HEADERS, [
    eventKey,
    body.scouter, body.teamNum, body.teamName ?? "",
    body.drivetrain ?? "", body.avgCapacity ?? "",
    body.autoPiecesScored ?? "", body.canClimb ?? "",
    body.climbLevels ?? "", body.comments ?? "",
  ]);
}
