import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Save, ChevronDown, Search, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreatePitEntry, usePitEntries, useEventSettings, CreatePitEntry } from "@/hooks/use-scout-api";
import { useOfflineQueue } from "@/context/OfflineQueueContext";
import { getEventTeams, type TBATeam } from "@/lib/tba";

const BigToggle = ({
  label, options, selected, onChange,
}: {
  label: string; options: string[]; selected: string; onChange: (val: string) => void;
}) => (
  <div className="space-y-3">
    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 min-w-[80px] py-3 px-4 rounded-md font-display text-lg transition-all duration-200 border ${
            selected === opt
              ? "bg-primary border-primary text-white shadow-[0_0_15px_-3px_rgba(230,0,0,0.5)]"
              : "bg-black/40 border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

// Multi-select toggle — selected values stored as comma-separated string
const MultiToggle = ({
  label, options, selected, onChange,
}: {
  label: string; options: string[]; selected: string; onChange: (val: string) => void;
}) => {
  const active = selected ? selected.split(", ").filter(Boolean) : [];
  const toggle = (opt: string) => {
    const next = active.includes(opt) ? active.filter(v => v !== opt) : [...active, opt];
    onChange(next.join(", "));
  };
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        <span className="ml-2 text-xs font-normal text-white/40 normal-case">select all that apply</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`flex-1 min-w-[80px] py-3 px-4 rounded-md font-display text-lg transition-all duration-200 border ${
              active.includes(opt)
                ? "bg-primary border-primary text-white shadow-[0_0_15px_-3px_rgba(230,0,0,0.5)]"
                : "bg-black/40 border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

// Searchable team dropdown — renders panel via portal so it floats above all cards
function TeamDropdown({
  teams,
  scoutedNums,
  selected,
  onSelect,
}: {
  teams: TBATeam[];
  scoutedNums: Set<string>;
  selected: TBATeam | null;
  onSelect: (team: TBATeam) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showScouted, setShowScouted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPanelStyle({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPanelStyle({
          top: rect.bottom + 6,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  const pool = showScouted ? teams : teams.filter(t => !scoutedNums.has(String(t.team_number)));
  const filtered = pool.filter(t => {
    const q = search.toLowerCase();
    return String(t.team_number).includes(q) || (t.nickname ?? "").toLowerCase().includes(q);
  });

  const doneCount = scoutedNums.size;
  const totalCount = teams.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold uppercase text-muted-foreground">
          Select Team
          {totalCount > 0 && (
            <span className="ml-2 text-xs font-normal text-white/40 normal-case">
              {doneCount}/{totalCount} scouted
            </span>
          )}
        </label>
        {doneCount > 0 && (
          <button
            type="button"
            onClick={() => setShowScouted(v => !v)}
            className="text-xs text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors"
          >
            {showScouted ? "Hide scouted" : "Show scouted"}
          </button>
        )}
      </div>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => open ? setOpen(false) : openDropdown()}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all ${
          selected
            ? "border-primary/50 bg-primary/10 text-white"
            : "border-white/15 bg-black/40 text-white/40 hover:border-white/30 hover:text-white/70"
        }`}
      >
        <span className="font-semibold">
          {selected ? `${selected.team_number} — ${selected.nickname}` : "Pick a team…"}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && createPortal(
        <AnimatePresence>
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            style={{ position: "fixed", top: panelStyle.top, left: panelStyle.left, width: panelStyle.width, zIndex: 9999 }}
            className="rounded-lg border border-white/15 bg-[#111] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
              <Search className="h-4 w-4 text-white/30 shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by number or name…"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              />
            </div>

            <div
              className="max-h-64 overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-white/30">
                  {pool.length === 0 ? "All teams scouted!" : "No teams match your search."}
                </div>
              ) : (
                filtered.map(team => {
                  const isScouted = scoutedNums.has(String(team.team_number));
                  return (
                    <button
                      key={team.key}
                      type="button"
                      onClick={() => { onSelect(team); setOpen(false); setSearch(""); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      <span className="font-display font-bold text-lg text-primary w-14 shrink-0">
                        {team.team_number}
                      </span>
                      <span className="text-sm text-white/80 truncate flex-1">{team.nickname}</span>
                      {isScouted && (
                        <span className="text-xs text-green-400 shrink-0 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> re-scout
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {doneCount > 0 && !showScouted && (
              <div className="px-4 py-2 border-t border-white/10 text-xs text-white/30 flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {doneCount} team{doneCount !== 1 ? "s" : ""} already scouted — tap "Show scouted" to re-scout
              </div>
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

const emptyForm: CreatePitEntry = {
  scouter: "",
  teamNum: "",
  teamName: "",
  drivetrain: "",
  avgCapacity: "",
  autoPiecesScored: "",
  canClimb: "",
  climbLevels: "",
  comments: "",
};

export default function PitScout() {
  const { toast } = useToast();
  const createPit = useCreatePitEntry();
  const { data: pitEntries = [] } = usePitEntries();
  const { data: eventSettings } = useEventSettings();

  const [formData, setFormData] = useState<CreatePitEntry>(emptyForm);
  const [selectedTeam, setSelectedTeam] = useState<TBATeam | null>(null);
  const [teams, setTeams] = useState<TBATeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState(false);

  // Build set of already-scouted team numbers for this event
  const scoutedNums = new Set(pitEntries.map(e => e.teamNum));

  // Load teams from TBA when event is ready
  useEffect(() => {
    const eventKey = eventSettings?.eventKey;
    if (!eventKey) return;
    setTeamsLoading(true);
    setTeamsError(false);
    getEventTeams(eventKey)
      .then(setTeams)
      .catch(() => setTeamsError(true))
      .finally(() => setTeamsLoading(false));
  }, [eventSettings?.eventKey]);

  const set = (field: keyof CreatePitEntry) => (val: string) =>
    setFormData(prev => ({ ...prev, [field]: val }));

  const handleTeamSelect = (team: TBATeam) => {
    setSelectedTeam(team);
    setFormData(prev => ({
      ...prev,
      teamNum: String(team.team_number),
      teamName: team.nickname ?? "",
    }));
  };

  const { addToQueue } = useOfflineQueue();

  const handleSubmit = async () => {
    if (!formData.scouter || !formData.teamNum) {
      toast({ title: "Validation Error", description: "Scouter name and Team are required.", variant: "destructive" });
      return;
    }
    try {
      await createPit.mutateAsync(formData);
      toast({ title: "Success!", description: `Pit data for team ${formData.teamNum} submitted.` });
      setFormData(prev => ({ ...emptyForm, scouter: prev.scouter }));
      setSelectedTeam(null);
    } catch {
      addToQueue("pit", "/api/pit-entries", formData);
      toast({ title: "Saved locally", description: "No connection — data saved on this device. Tap Send Data when back online." });
      setFormData(prev => ({ ...emptyForm, scouter: prev.scouter }));
      setSelectedTeam(null);
    }
  };

  const eventConfigured = !!eventSettings?.eventKey;

  return (
    <Layout showBack={true}>
      <div className="min-h-screen flex flex-col relative z-0 overflow-x-hidden overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-display font-bold uppercase tracking-wider text-shadow-red"
          >
            Pit Scout
          </motion.h1>

          {/* Scouter */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-display text-xl border-b border-white/10 pb-2">Scouter</h3>
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase text-muted-foreground">Scouter Name</label>
                <Input placeholder="John D." value={formData.scouter} onChange={e => set("scouter")(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Team selector */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-display text-xl border-b border-white/10 pb-2">Team</h3>

              {!eventConfigured ? (
                <div className="flex items-center gap-2 text-yellow-400 text-sm py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  No event configured — contact your team lead to set the active event.
                </div>
              ) : teamsLoading ? (
                <div className="flex items-center gap-2 text-white/40 text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading teams…
                </div>
              ) : teamsError ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Couldn't load team list — enter manually below.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase text-muted-foreground">Team Number</label>
                      <Input placeholder="2771" type="number" value={formData.teamNum} onChange={e => set("teamNum")(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase text-muted-foreground">Team Name</label>
                      <Input placeholder="Code Red Robotics" value={formData.teamName} onChange={e => set("teamName")(e.target.value)} />
                    </div>
                  </div>
                </div>
              ) : (
                <TeamDropdown
                  teams={teams}
                  scoutedNums={scoutedNums}
                  selected={selectedTeam}
                  onSelect={handleTeamSelect}
                />
              )}
            </CardContent>
          </Card>

          {/* Robot */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <h3 className="font-display text-xl border-b border-white/10 pb-2">Robot</h3>
              <BigToggle
                label="Drive Train"
                options={["Swerve", "Tank", "Mecanum", "Other"]}
                selected={formData.drivetrain}
                onChange={set("drivetrain")}
              />
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase text-muted-foreground">Avg. Capacity <span className="normal-case font-normal text-white/40">(coral + algae per match)</span></label>
                <Input
                  placeholder="e.g. 3"
                  type="number"
                  value={formData.avgCapacity}
                  onChange={e => set("avgCapacity")(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Auto */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <h3 className="font-display text-xl border-b border-white/10 pb-2">Auto</h3>
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase text-muted-foreground">Game pieces scored in Auto</label>
                <Input
                  placeholder="e.g. 3"
                  type="number"
                  value={formData.autoPiecesScored}
                  onChange={e => set("autoPiecesScored")(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Climb */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <h3 className="font-display text-xl border-b border-white/10 pb-2">Climb</h3>
              <BigToggle
                label="Can they climb?"
                options={["Yes", "No"]}
                selected={formData.canClimb}
                onChange={val => setFormData(prev => ({ ...prev, canClimb: val, climbLevels: "" }))}
              />
              <AnimatePresence>
                {formData.canClimb === "Yes" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <MultiToggle
                      label="Which levels?"
                      options={["L1", "L2", "L3"]}
                      selected={formData.climbLevels}
                      onChange={set("climbLevels")}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-display text-xl border-b border-white/10 pb-2">Notes</h3>
              <Textarea
                placeholder="Additional observations..."
                value={formData.comments}
                onChange={e => set("comments")(e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={createPit.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-xl py-6 shadow-[0_0_20px_rgba(230,0,0,0.6)]"
          >
            <Save className="mr-2 h-5 w-5" />
            {createPit.isPending ? "Submitting..." : "Submit Pit Data"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
