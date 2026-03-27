import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

export interface CreatePitEntry {
  scouter: string;
  teamNum: string;
  teamName: string;
  drivetrain: string;
  avgCapacity: string;
  autoFuelCount: string;
  canClimb: string;
  climbLocation: string;
  comments: string;
}

export interface PitEntry extends CreatePitEntry {
  id: number;
  createdAt: string;
}

// Settings hook
export interface EventSettings {
  eventKey: string;
  eventName: string;
}

export function useEventSettings() {
  return useQuery<EventSettings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
    staleTime: 30_000,
  });
}

// Match hooks
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/match-entries"] }),
  });
}

// HP hooks
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/hp-entries"] }),
  });
}

// Pit hooks
export function usePitEntries() {
  return useQuery<PitEntry[]>({
    queryKey: ["/api/pit-entries"],
    queryFn: async () => {
      const res = await fetch("/api/pit-entries");
      if (!res.ok) throw new Error("Failed to fetch pit entries");
      return res.json();
    },
  });
}

export function useCreatePitEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePitEntry) => {
      const res = await fetch("/api/pit-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create pit entry");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/pit-entries"] }),
  });
}
