const TBA_BASE = "https://www.thebluealliance.com/api/v3";

export interface TBAEvent {
  key: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string;
  state_prov: string;
  event_type_string: string;
}

export interface TBAMatch {
  key: string;
  comp_level: string;
  match_number: number;
  set_number: number;
  alliances: {
    red: { team_keys: string[]; score: number };
    blue: { team_keys: string[]; score: number };
  };
}

export interface MatchTeams {
  red: string[];
  blue: string[];
}

async function tbaFetch<T>(apiKey: string, path: string): Promise<T> {
  const res = await fetch(`${TBA_BASE}${path}`, {
    headers: { "X-TBA-Auth-Key": apiKey },
  });
  if (!res.ok) throw new Error(`TBA API error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getTeamEvents(apiKey: string, teamKey: string, year: number): Promise<TBAEvent[]> {
  const events = await tbaFetch<TBAEvent[]>(apiKey, `/team/${teamKey}/events/${year}`);
  return events.sort((a, b) => a.start_date.localeCompare(b.start_date));
}

export async function getEventMatches(apiKey: string, eventKey: string): Promise<TBAMatch[]> {
  return tbaFetch<TBAMatch[]>(apiKey, `/event/${eventKey}/matches`);
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
  getApiKey: () => localStorage.getItem("tba_api_key") ?? "",
  setApiKey: (key: string) => localStorage.setItem("tba_api_key", key),
  getEventKey: () => localStorage.getItem("tba_event_key") ?? "",
  setEventKey: (key: string) => localStorage.setItem("tba_event_key", key),
  getEventName: () => localStorage.getItem("tba_event_name") ?? "",
  setEventName: (name: string) => localStorage.setItem("tba_event_name", name),
  clear: () => {
    localStorage.removeItem("tba_event_key");
    localStorage.removeItem("tba_event_name");
  },
};
