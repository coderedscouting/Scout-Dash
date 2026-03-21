import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// --- Types mapping to OpenAPI schema ---
export interface ClimbData {
  startTime?: number | "";
  location?: string;
  level?: string;
  success?: string;
  successTime?: number | "";
}

export interface CycleData {
  starts: number[];
  stops: number[];
}

export interface CreateMatchEntry {
  scouter: string;
  teamNum: string;
  matchNum: number;
  startPos: string;
  autoCycles: CycleData;
  autoClimb: ClimbData;
  teleCycles: CycleData;
  teleClimb: ClimbData;
  comments: string;
  defensePlayed: string;
  defenseRating: string;
}

export interface MatchEntry extends CreateMatchEntry {
  id: number;
  createdAt: string;
}

export interface CreateHpEntry {
  scouter: string;
  matchNum: number;
  alliance: string;
  scores: number;
}

export interface HpEntry extends CreateHpEntry {
  id: number;
  createdAt: string;
}

// --- Hooks ---

export function useMatchEntries() {
  return useQuery<MatchEntry[]>({
    queryKey: ["/api/match-entries"],
    queryFn: async () => {
      const res = await fetch("/api/match-entries");
      if (!res.ok) throw new Error("Failed to fetch match entries");
      return res.json();
    },
  });
}

export function useCreateMatchEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMatchEntry) => {
      const res = await fetch("/api/match-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create match entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/match-entries"] });
    },
  });
}

export function useHpEntries() {
  return useQuery<HpEntry[]>({
    queryKey: ["/api/hp-entries"],
    queryFn: async () => {
      const res = await fetch("/api/hp-entries");
      if (!res.ok) throw new Error("Failed to fetch HP entries");
      return res.json();
    },
  });
}

export function useCreateHpEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateHpEntry) => {
      const res = await fetch("/api/hp-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create HP entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hp-entries"] });
    },
  });
}
