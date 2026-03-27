import type { CreateMatchEntry, CreateHpEntry, CreatePitEntry } from "@/hooks/use-scout-api";

// Paste your Google Apps Script Web App URL here after deploying it
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx6-L2P7hGM0nvSQy4hQxR3IACO_npXeOQARuuType-4dgURGjiGWzsrZeUE8Rd_BNR/exec";

async function postToSheets(type: "match" | "pit" | "hp", data: unknown) {
  if (!WEB_APP_URL || WEB_APP_URL === "PASTE_YOUR_APPS_SCRIPT_URL_HERE") return;
  await fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, data }),
  });
}

export async function sendMatchToSheets(data: CreateMatchEntry): Promise<void> {
  await postToSheets("match", {
    scouter: data.scouter,
    teamNum: data.teamNum,
    matchNum: data.matchNum,
    startPos: data.startPos,
    autoCycles: data.autoCycles.stops.length,
    autoClimbLocation: data.autoClimb.location,
    autoClimbSuccess: data.autoClimb.success,
    teleCycles: data.teleCycles.stops.length,
    teleClimbLocation: data.teleClimb.location,
    teleClimbLevel: data.teleClimb.level,
    teleClimbSuccess: data.teleClimb.success,
    defensePlayed: data.defensePlayed,
    defenseRating: data.defenseRating,
    comments: data.comments,
  });
}

export async function sendHpToSheets(data: CreateHpEntry): Promise<void> {
  await postToSheets("hp", {
    scouter: data.scouter,
    matchNum: data.matchNum,
    alliance: data.alliance,
    scores: data.scores,
  });
}

export async function sendPitToSheets(data: CreatePitEntry): Promise<void> {
  await postToSheets("pit", {
    scouter: data.scouter,
    teamNum: data.teamNum,
    teamName: data.teamName,
    drivetrain: data.drivetrain,
    avgCapacity: data.avgCapacity,
    autoFuelCount: data.autoFuelCount,
    canClimb: data.canClimb,
    climbLocation: data.climbLocation,
    comments: data.comments,
  });
}
