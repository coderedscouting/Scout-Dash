let nextId = 1;
const now = () => new Date().toISOString();

export type MemMatchEntry = {
  id: number; scouter: string; teamNum: number; matchNum: number;
  startPos: string; autoCycles: unknown; autoClimb: unknown;
  teleCycles: unknown; teleClimb: unknown; comments: string;
  defensePlayed: string; defenseRating: string; createdAt: string;
};
export type MemHpEntry = {
  id: number; scouter: string; matchNum: number; alliance: string;
  scores: unknown; createdAt: string;
};
export type MemPitEntry = {
  id: number; scouter: string; teamNum: number; teamName: string;
  drivetrain: string; avgCapacity: string; autoPiecesScored: string;
  canClimb: string; climbLevels: string; comments: string; createdAt: string;
};

export const matchStore: MemMatchEntry[] = [];
export const hpStore: MemHpEntry[] = [];
export const pitStore: MemPitEntry[] = [];

export function insertMatch(v: Omit<MemMatchEntry, "id" | "createdAt">): MemMatchEntry {
  const row: MemMatchEntry = { id: nextId++, createdAt: now(), ...v };
  matchStore.push(row);
  return row;
}
export function deleteMatch(id: number) {
  const i = matchStore.findIndex(r => r.id === id);
  if (i !== -1) matchStore.splice(i, 1);
}

export function insertHp(v: Omit<MemHpEntry, "id" | "createdAt">): MemHpEntry {
  const row: MemHpEntry = { id: nextId++, createdAt: now(), ...v };
  hpStore.push(row);
  return row;
}
export function deleteHp(id: number) {
  const i = hpStore.findIndex(r => r.id === id);
  if (i !== -1) hpStore.splice(i, 1);
}

export function insertPit(v: Omit<MemPitEntry, "id" | "createdAt">): MemPitEntry {
  const row: MemPitEntry = { id: nextId++, createdAt: now(), ...v };
  pitStore.push(row);
  return row;
}
export function deletePit(id: number) {
  const i = pitStore.findIndex(r => r.id === id);
  if (i !== -1) pitStore.splice(i, 1);
}
