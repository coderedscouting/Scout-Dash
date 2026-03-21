import type { CreateMatchEntry, CreateHpEntry } from "@/hooks/use-scout-api";

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzo0CRIGmzzIkrSdPu0PD_spJY5Oo-C3zVy3HjerNahyf6twQcLK-Fru79RgPCjWnkE0Q/exec";

export async function sendMatchToSheets(matchData: CreateMatchEntry): Promise<void> {
  await fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchData: [matchData], hpData: [] }),
  });
}

export async function sendHpToSheets(hpData: CreateHpEntry): Promise<void> {
  await fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchData: [], hpData: [hpData] }),
  });
}
