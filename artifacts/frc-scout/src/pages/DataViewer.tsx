import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { useMatchEntries, useHpEntries } from "@/hooks/use-scout-api";
import { format } from "date-fns";
import * as Tabs from "@radix-ui/react-tabs";

export default function DataViewer() {
  const { data: matches, isLoading: matchesLoading, isError: matchesError } = useMatchEntries();
  const { data: hps, isLoading: hpLoading } = useHpEntries();
  const [activeTab, setActiveTab] = useState("match");

  return (
    <Layout title="DATA VIEWER">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-6">
        <Tabs.List className="flex w-full md:w-fit p-1 bg-black/50 border border-white/10 rounded-lg backdrop-blur-md">
          <Tabs.Trigger 
            value="match"
            className={`flex-1 md:w-48 py-3 text-sm font-semibold rounded-md transition-all ${activeTab === 'match' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-white'}`}
          >
            Match Scouting
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="hp"
            className={`flex-1 md:w-48 py-3 text-sm font-semibold rounded-md transition-all ${activeTab === 'hp' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-white'}`}
          >
            Human Player
          </Tabs.Trigger>
        </Tabs.List>

        <Card className="overflow-hidden border-white/10">
          <Tabs.Content value="match" className="p-0 m-0 outline-none">
            {matchesLoading ? (
              <div className="p-12 text-center text-muted-foreground">Loading match data...</div>
            ) : matchesError ? (
              <div className="p-12 text-center text-destructive">Failed to load match data.</div>
            ) : !matches?.length ? (
              <div className="p-12 text-center text-muted-foreground">No match entries found.</div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs uppercase bg-black/60 text-muted-foreground border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-display">Match</th>
                      <th className="px-6 py-4 font-display">Team</th>
                      <th className="px-6 py-4 font-display">Scouter</th>
                      <th className="px-6 py-4 font-display">Pos</th>
                      <th className="px-6 py-4 font-display text-center">Auto Cycles</th>
                      <th className="px-6 py-4 font-display text-center">Auto Climb</th>
                      <th className="px-6 py-4 font-display text-center">Tele Cycles</th>
                      <th className="px-6 py-4 font-display text-center">Tele Climb</th>
                      <th className="px-6 py-4 font-display">Defense</th>
                      <th className="px-6 py-4 font-display">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m, i) => (
                      <tr key={m.id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-3 font-bold text-primary">{m.matchNum}</td>
                        <td className="px-6 py-3 font-bold">{m.teamNum}</td>
                        <td className="px-6 py-3">{m.scouter}</td>
                        <td className="px-6 py-3">{m.startPos}</td>
                        <td className="px-6 py-3 text-center">{m.autoCycles?.starts?.length || 0}</td>
                        <td className="px-6 py-3 text-center">
                          {m.autoClimb?.success === "Yes" ? <span className="text-green-500 font-bold">Yes</span> : "No"}
                        </td>
                        <td className="px-6 py-3 text-center">{m.teleCycles?.starts?.length || 0}</td>
                        <td className="px-6 py-3 text-center">
                          {m.teleClimb?.success === "Yes" ? <span className="text-green-500 font-bold">{m.teleClimb.level || 'Yes'}</span> : "No"}
                        </td>
                        <td className="px-6 py-3">
                          {m.defensePlayed === "Yes" ? `Yes (${m.defenseRating}/5)` : "No"}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground text-xs">
                          {m.createdAt ? format(new Date(m.createdAt), 'MMM d, HH:mm') : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="hp" className="p-0 m-0 outline-none">
            {hpLoading ? (
              <div className="p-12 text-center text-muted-foreground">Loading HP data...</div>
            ) : !hps?.length ? (
              <div className="p-12 text-center text-muted-foreground">No human player entries found.</div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs uppercase bg-black/60 text-muted-foreground border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-display">Match</th>
                      <th className="px-6 py-4 font-display">Alliance</th>
                      <th className="px-6 py-4 font-display">Scouter</th>
                      <th className="px-6 py-4 font-display text-center">Shots Made</th>
                      <th className="px-6 py-4 font-display">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hps.map((hp, i) => (
                      <tr key={hp.id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-primary">{hp.matchNum}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${hp.alliance === 'Red' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {hp.alliance}
                          </span>
                        </td>
                        <td className="px-6 py-4">{hp.scouter}</td>
                        <td className="px-6 py-4 text-center font-display text-xl">{hp.scores}</td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {hp.createdAt ? format(new Date(hp.createdAt), 'MMM d, HH:mm') : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tabs.Content>
        </Card>
      </Tabs.Root>
    </Layout>
  );
}
