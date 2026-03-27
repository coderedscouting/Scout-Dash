import type { CreateMatchEntry, CreateHpEntry, CreatePitEntry } from "@/hooks/use-scout-api";

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx6-L2P7hGM0nvSQy4hQxR3IACO_npXeOQARuuType-4dgURGjiGWzsrZeUE8Rd_BNR/exec";

async function getEventKey(): Promise<string> {
  try {
    const res = await fetch("/api/settings");
    const data = await res.json();
    return data.eventKey ?? "";
  } catch {
    return "";
  }
}

async function postToSheets(payload: unknown) {
  if (!WEB_APP_URL || WEB_APP_URL === "PASTE_YOUR_APPS_SCRIPT_URL_HERE") return;
  await fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function sendMatchToSheets(data: CreateMatchEntry): Promise<void> {
  const eventKey = await getEventKey();
  await postToSheets({
    eventKey,
    matchData: [{
      scouter: data.scouter,
      teamNum: data.teamNum,
      matchNum: data.matchNum,
      startPos: data.startPos,
      autoCycles: {
        starts: data.autoCycles.starts,
        stops: data.autoCycles.stops,
      },
      autoClimb: {
        startTime: data.autoClimb.startTime,
        location: data.autoClimb.location,
        success: data.autoClimb.success,
        successTime: data.autoClimb.successTime,
      },
      teleCycles: {
        starts: data.teleCycles.starts,
        stops: data.teleCycles.stops,
      },
      teleClimb: {
        startTime: data.teleClimb.startTime,
        location: data.teleClimb.location,
        level: data.teleClimb.level,
        success: data.teleClimb.success,
        successTime: data.teleClimb.successTime,
      },
      comments: data.comments,
      defensePlayed: data.defensePlayed,
      defenseRating: data.defenseRating,
    }],
  });
}

export async function sendHpToSheets(data: CreateHpEntry): Promise<void> {
  const eventKey = await getEventKey();
  await postToSheets({
    eventKey,
    hpData: [{
      scouter: data.scouter,
      matchNum: data.matchNum,
      alliance: data.alliance,
      scores: data.scores,
    }],
  });
}

export async function sendPitToSheets(data: CreatePitEntry): Promise<void> {
  const eventKey = await getEventKey();
  await postToSheets({
    eventKey,
    pitData: [{
      scouter: data.scouter,
      teamNum: data.teamNum,
      teamName: data.teamName,
      drivetrain: data.drivetrain,
      avgCapacity: data.avgCapacity,
      autoFuelCount: data.autoFuelCount,
      canClimb: data.canClimb,
      climbLocation: data.climbLocation,
      comments: data.comments,
    }],
  });
}
