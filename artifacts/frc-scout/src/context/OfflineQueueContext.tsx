import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "scout_offline_queue";

export type QueueItemType = "match" | "pit" | "hp";

export interface QueueItem {
  id: string;
  type: QueueItemType;
  endpoint: string;
  data: unknown;
  timestamp: number;
}

interface OfflineQueueContextValue {
  queue: QueueItem[];
  addToQueue: (type: QueueItemType, endpoint: string, data: unknown) => void;
  flushQueue: () => Promise<{ sent: number; failed: number }>;
  isFlushing: boolean;
}

const OfflineQueueContext = createContext<OfflineQueueContextValue | null>(null);

function loadQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function OfflineQueueProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<QueueItem[]>(loadQueue);
  const [isFlushing, setIsFlushing] = useState(false);

  const syncFromStorage = useCallback(() => {
    setQueue(loadQueue());
  }, []);

  useEffect(() => {
    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, [syncFromStorage]);

  const addToQueue = useCallback((type: QueueItemType, endpoint: string, data: unknown) => {
    const item: QueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      endpoint,
      data,
      timestamp: Date.now(),
    };
    setQueue((prev) => {
      const next = [...prev, item];
      saveQueue(next);
      return next;
    });
  }, []);

  const flushQueue = useCallback(async () => {
    const current = loadQueue();
    if (current.length === 0) return { sent: 0, failed: 0 };
    setIsFlushing(true);
    let sent = 0;
    let failed = 0;
    const remaining: QueueItem[] = [];

    for (const item of current) {
      try {
        const res = await fetch(item.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.data),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        sent++;
      } catch {
        failed++;
        remaining.push(item);
      }
    }

    saveQueue(remaining);
    setQueue(remaining);
    setIsFlushing(false);
    return { sent, failed };
  }, []);

  return (
    <OfflineQueueContext.Provider value={{ queue, addToQueue, flushQueue, isFlushing }}>
      {children}
    </OfflineQueueContext.Provider>
  );
}

export function useOfflineQueue() {
  const ctx = useContext(OfflineQueueContext);
  if (!ctx) throw new Error("useOfflineQueue must be used within OfflineQueueProvider");
  return ctx;
}
