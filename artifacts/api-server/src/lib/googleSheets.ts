// Google Sheets integration via Replit connector (googleapis)
// WARNING: Never cache the client — tokens expire. Always call getUncachableGoogleSheetClient() fresh.
import { google } from "googleapis";
import { logger } from "./logger";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

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

async function ensureHeaders(
  sheets: Awaited<ReturnType<typeof getUncachableGoogleSheetClient>>,
  sheetName: string,
  headers: string[],
) {
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID!,
    range: `'${sheetName}'!1:1`,
  });
  if (!existing.data.values || existing.data.values.length === 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID!,
      range: `'${sheetName}'!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers] },
    });
  }
}

async function appendRow(sheetName: string, row: (string | number | boolean | null | undefined)[]) {
  if (!SHEET_ID) {
    logger.warn("GOOGLE_SHEET_ID not set — skipping Sheets write");
    return;
  }
  try {
    const sheets = await getUncachableGoogleSheetClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `'${sheetName}'!A:A`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
  } catch (err) {
    logger.warn({ err }, `Failed to write to Google Sheets tab: ${sheetName}`);
  }
}

export async function appendMatchRow(eventKey: string, body: any) {
  await appendRow("Match Data", [
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
  await appendRow("Human Player Data", [
    eventKey,
    body.scouter,
    body.matchNum,
    body.alliance,
    body.scores,
  ]);
}

export async function appendPitRow(eventKey: string, body: any) {
  await appendRow("Pit Scouting", [
    eventKey,
    body.scouter, body.teamNum, body.teamName ?? "",
    body.drivetrain ?? "", body.avgCapacity ?? "",
    body.autoFuelCount ?? "", body.canClimb ?? "",
    body.climbLocation ?? "", body.comments ?? "",
  ]);
}
