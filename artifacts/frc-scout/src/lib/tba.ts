const TBA_BASE = "https://www.thebluealliance.com/api/v3";

// Pre-configured API key — no manual entry needed
export const DEFAULT_TBA_KEY = "AlUgcGuOhmRJgSq9DKmIfNy6GcoYVT1m7TchHj3ENOBTC2MscCGeAclWVifGqt2S";

// The specific district events Code Red 2771 attends
export const FIXED_EVENT_KEYS = ["2026mimus", "2026miken"];

export interface TBAEvent {
  key: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string;
  state_prov: string;
  event_type: number;
  event_type_string: string;
}

export interface TBAMatch {
  key: string;
  comp_level: string;
  match_number: number;
  set_number: number;
  actual_time: number | null;
  predicted_time: number | null;
  alliances: {
    red: { team_keys: string[]; score: number };
    blue: { team_keys: string[]; score: number };
  };
}

export interface MatchTeams {
  red: string[];
  blue: string[];
}

async function tbaFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${TBA_BASE}${path}`, {
    headers: { "X-TBA-Auth-Key": DEFAULT_TBA_KEY },
  });
  if (!res.ok) throw new Error(`TBA API error ${res.status}: ${res.statusText}`);
  return res.json();
}

/** Fetch details for a single event by key */
export async function getEvent(eventKey: string): Promise<TBAEvent> {
  return tbaFetch<TBAEvent>(`/event/${eventKey}`);
}

/**
 * Build the curated event list:
 * - 2026mimus and 2026miken (fixed)
 * - All 2026 FIM district championship events (event_type 2 = District Champ, 5 = District Champ Division)
 */
export async function getCuratedEvents(): Promise<TBAEvent[]> {
  // Fetch FIM district events (covers all Michigan events including state champs)
  const fimEvents = await tbaFetch<TBAEvent[]>("/district/2026fim/events");

  // Michigan state championship events: type 2 (District Championship) or 5 (District Championship Division)
  const miStateChamps = fimEvents
    .filter(e => e.event_type === 2 || e.event_type === 5)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  // Fetch the two fixed district events
  const fixedEvents = await Promise.all(FIXED_EVENT_KEYS.map(key => getEvent(key).catch(() => null)));

  // Combine: fixed events first, then state champs
  const combined: TBAEvent[] = [
    ...fixedEvents.filter((e): e is TBAEvent => e !== null),
    ...miStateChamps,
  ];

  // Deduplicate by key
  const seen = new Set<string>();
  return combined.filter(e => {
    if (seen.has(e.key)) return false;
    seen.add(e.key);
    return true;
  });
}

export interface TBATeam {
  key: string;
  team_number: number;
  nickname: string;
  name: string;
}

export async function getEventTeams(eventKey: string): Promise<TBATeam[]> {
  const teams = await tbaFetch<TBATeam[]>(`/event/${eventKey}/teams/simple`);
  return teams.sort((a, b) => a.team_number - b.team_number);
}

export async function getEventMatches(eventKey: string): Promise<TBAMatch[]> {
  return tbaFetch<TBAMatch[]>(`/event/${eventKey}/matches`);
}

export function teamKeyToNumber(teamKey: string): string {
  return teamKey.replace("frc", "");
}

export function getTeamsForMatch(matches: TBAMatch[], matchNum: number, compLevel = "qm"): MatchTeams | null {
  const match = matches.find(m => m.comp_level === compLevel && m.match_number === matchNum);
  if (!match) return null;
  return {
    red: match.alliances.red.team_keys.map(teamKeyToNumber),
    blue: match.alliances.blue.team_keys.map(teamKeyToNumber),
  };
}

// localStorage helpers
export const TBA_STORAGE = {
  getEventKey: () => localStorage.getItem("tba_event_key") ?? "",
  setEventKey: (key: string) => localStorage.setItem("tba_event_key", key),
  getEventName: () => localStorage.getItem("tba_event_name") ?? "",
  setEventName: (name: string) => localStorage.setItem("tba_event_name", name),
  clear: () => {
    localStorage.removeItem("tba_event_key");
    localStorage.removeItem("tba_event_name");
  },
};
