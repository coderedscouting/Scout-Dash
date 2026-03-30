import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMatchEntries, useHpEntries, usePitEntries, useDeleteMatchEntry, useDeleteHpEntry, useDeletePitEntry, useEventSettings, useUpdateSettings } from "@/hooks/use-scout-api";
import { format } from "date-fns";
import * as Tabs from "@radix-ui/react-tabs";
import { Trash2, Check, X, Save, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function TabBtn({ value, active, count, children }: { value: string; active: boolean; count?: number; children: React.ReactNode }) {
  return (
    <Tabs.Trigger
      value={value}
      className={`flex items-center gap-2 flex-1 md:flex-none md:px-5 py-3 text-sm font-semibold rounded-md transition-all ${active ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"}`}
    >
      {children}
      {count !== undefined && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${active ? "bg-white/20" : "bg-white/10"}`}>{count}</span>
      )}
    </Tabs.Trigger>
  );
}

function DeleteBtn({ onDelete, isPending }: { onDelete: () => void; isPending: boolean }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button
          onClick={() => { onDelete(); setConfirming(false); }}
          disabled={isPending}
          className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors"
        >
          <Check className="w-3 h-3 inline mr-1" />Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-muted-foreground hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-3 h-3 inline mr-1" />No
        </button>
      </span>
    );
  }
  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-muted-foreground hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10"
      title="Delete row"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

export default function DataViewer() {
  const { data: matches = [], isLoading: matchLoading } = useMatchEntries();
  const { data: hps = [], isLoading: hpLoading } = useHpEntries();
  const { data: pits = [], isLoading: pitLoading } = usePitEntries();
  const { data: settings } = useEventSettings();

  const deleteMatch = useDeleteMatchEntry();
  const deleteHp = useDeleteHpEntry();
  const deletePit = useDeletePitEntry();
  const updateSettings = useUpdateSettings();

  const [activeTab, setActiveTab] = useState("match");
  const [eventKey, setEventKey] = useState("");
  const [eventName, setEventName] = useState("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { toast } = useToast();

  if (settings && !settingsLoaded) {
    setEventKey(settings.eventKey);
    setEventName(settings.eventName);
    setSettingsLoaded(true);
  }

  async function saveSettings() {
    try {
      await updateSettings.mutateAsync({ eventKey, eventName });
      toast({ title: "Settings saved", description: "Event key and name updated." });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  }

  return (
    <Layout title="ADMIN / DATA">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-6">
        <Tabs.List className="flex w-full md:w-fit flex-wrap gap-1 p-1 bg-black/50 border border-white/10 rounded-lg backdrop-blur-md">
          <TabBtn value="match" active={activeTab === "match"} count={matches.length}>Match</TabBtn>
          <TabBtn value="hp" active={activeTab === "hp"} count={hps.length}>Human Player</TabBtn>
          <TabBtn value="pit" active={activeTab === "pit"} count={pits.length}>Pit</TabBtn>
          <TabBtn value="settings" active={activeTab === "settings"}>
            <Settings className="w-4 h-4" />Settings
          </TabBtn>
        </Tabs.List>

        {/* ── Match ── */}
        <Tabs.Content value="match" className="outline-none">
          <Card className="overflow-hidden border-white/10">
            {matchLoading ? (
              <div className="p-12 text-center text-muted-foreground">Loading…</div>
            ) : !matches.length ? (
              <div className="p-12 text-center text-muted-foreground">No match entries yet.</div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs uppercase bg-black/60 text-muted-foreground border-b border-white/10">
                    <tr>
                      <th className="px-4 py-4" />
                      <th className="px-4 py-4 font-display">Match</th>
                      <th className="px-4 py-4 font-display">Team</th>
                      <th className="px-4 py-4 font-display">Scouter</th>
                      <th className="px-4 py-4 font-display">Pos</th>
                      <th className="px-4 py-4 font-display text-center">Auto Cyc.</th>
                      <th className="px-4 py-4 font-display text-center">Auto Climb</th>
                      <th className="px-4 py-4 font-display text-center">Tele Cyc.</th>
                      <th className="px-4 py-4 font-display text-center">Tele Climb</th>
                      <th className="px-4 py-4 font-display">Defense</th>
                      <th className="px-4 py-4 font-display">Comments</th>
                      <th className="px-4 py-4 font-display">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m, i) => (
                      <tr key={m.id ?? i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <DeleteBtn onDelete={() => deleteMatch.mutate(m.id)} isPending={deleteMatch.isPending} />
                        </td>
                        <td className="px-4 py-3 font-bold text-primary">{m.matchNum}</td>
                        <td className="px-4 py-3 font-bold">{m.teamNum}</td>
                        <td className="px-4 py-3">{m.scouter}</td>
                        <td className="px-4 py-3">{m.startPos}</td>
                        <td className="px-4 py-3 text-center">{m.autoCycles?.starts?.length ?? 0}</td>
                        <td className="px-4 py-3 text-center">
                          {m.autoClimb?.success === "Yes" ? <span className="text-green-500 font-bold">✓</span> : "–"}
                        </td>
                        <td className="px-4 py-3 text-center">{m.teleCycles?.starts?.length ?? 0}</td>
                        <td className="px-4 py-3 text-center">
                          {m.teleClimb?.success === "Yes" ? <span className="text-green-500 font-bold">{m.teleClimb.level || "✓"}</span> : "–"}
                        </td>
                        <td className="px-4 py-3">
                          {m.defensePlayed === "Yes" ? `Yes (${m.defenseRating}/5)` : "No"}
                        </td>
                        <td className="px-4 py-3 max-w-[180px] truncate text-muted-foreground">{m.comments || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {m.createdAt ? format(new Date(m.createdAt), "MMM d, HH:mm") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </Tabs.Content>

        {/* ── Human Player ── */}
        <Tabs.Content value="hp" className="outline-none">
          <Card className="overflow-hidden border-white/10">
            {hpLoading ? (
              <div className="p-12 text-center text-muted-foreground">Loading…</div>
            ) : !hps.length ? (
              <div className="p-12 text-center text-muted-foreground">No HP entries yet.</div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs uppercase bg-black/60 text-muted-foreground border-b border-white/10">
                    <tr>
                      <th className="px-4 py-4" />
                      <th className="px-4 py-4 font-display">Match</th>
                      <th className="px-4 py-4 font-display">Alliance</th>
                      <th className="px-4 py-4 font-display">Scouter</th>
                      <th className="px-4 py-4 font-display text-center">Shots Made</th>
                      <th className="px-4 py-4 font-display">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hps.map((hp, i) => (
                      <tr key={hp.id ?? i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <DeleteBtn onDelete={() => deleteHp.mutate(hp.id)} isPending={deleteHp.isPending} />
                        </td>
                        <td className="px-4 py-3 font-bold text-primary">{hp.matchNum}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${hp.alliance === "Red" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                            {hp.alliance}
                          </span>
                        </td>
                        <td className="px-4 py-3">{hp.scouter}</td>
                        <td className="px-4 py-3 text-center font-display text-xl">{hp.scores}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {hp.createdAt ? format(new Date(hp.createdAt), "MMM d, HH:mm") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </Tabs.Content>

        {/* ── Pit ── */}
        <Tabs.Content value="pit" className="outline-none">
          <Card className="overflow-hidden border-white/10">
            {pitLoading ? (
              <div className="p-12 text-center text-muted-foreground">Loading…</div>
            ) : !pits.length ? (
              <div className="p-12 text-center text-muted-foreground">No pit entries yet.</div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs uppercase bg-black/60 text-muted-foreground border-b border-white/10">
                    <tr>
                      <th className="px-4 py-4" />
                      <th className="px-4 py-4 font-display">Team #</th>
                      <th className="px-4 py-4 font-display">Team Name</th>
                      <th className="px-4 py-4 font-display">Scouter</th>
                      <th className="px-4 py-4 font-display">Drive Train</th>
                      <th className="px-4 py-4 font-display text-center">Avg Cap.</th>
                      <th className="px-4 py-4 font-display text-center">Auto Pcs.</th>
                      <th className="px-4 py-4 font-display text-center">Climb</th>
                      <th className="px-4 py-4 font-display text-center">Levels</th>
                      <th className="px-4 py-4 font-display">Comments</th>
                      <th className="px-4 py-4 font-display">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pits.map((p, i) => (
                      <tr key={p.id ?? i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <DeleteBtn onDelete={() => deletePit.mutate(p.id)} isPending={deletePit.isPending} />
                        </td>
                        <td className="px-4 py-3 font-bold text-primary">{p.teamNum}</td>
                        <td className="px-4 py-3 font-medium">{p.teamName || "—"}</td>
                        <td className="px-4 py-3">{p.scouter}</td>
                        <td className="px-4 py-3">{p.drivetrain || "—"}</td>
                        <td className="px-4 py-3 text-center">{p.avgCapacity || "—"}</td>
                        <td className="px-4 py-3 text-center">{p.autoPiecesScored || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          {p.canClimb === "Yes" ? <span className="text-green-500 font-bold">Yes</span> : p.canClimb === "No" ? "No" : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">{p.climbLevels || "—"}</td>
                        <td className="px-4 py-3 max-w-[180px] truncate text-muted-foreground">{p.comments || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {p.createdAt ? format(new Date(p.createdAt), "MMM d, HH:mm") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </Tabs.Content>

        {/* ── Settings ── */}
        <Tabs.Content value="settings" className="outline-none">
          <Card>
            <CardContent className="p-6 max-w-lg space-y-6">
              <div>
                <h3 className="font-display text-xl border-b border-white/10 pb-2 mb-4">Event Settings</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Event Key</label>
                    <input
                      className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="e.g. 2026mimus"
                      value={eventKey}
                      onChange={e => setEventKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">TBA event key — controls which matches are loaded for HP auto-advance.</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Event Name</label>
                    <input
                      className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="e.g. 2026 FIM District Muskegon Event"
                      value={eventName}
                      onChange={e => setEventName(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={saveSettings}
                    disabled={updateSettings.isPending}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateSettings.isPending ? "Saving…" : "Save Settings"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </Layout>
  );
}
