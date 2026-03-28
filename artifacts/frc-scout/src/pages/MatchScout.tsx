import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateMatchEntry, useEventSettings, CreateMatchEntry } from "@/hooks/use-scout-api";
import { Square, Save, ShieldAlert, Crosshair, MapPin, Zap, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getEventMatches, getTeamsForMatch, type TBAMatch, type MatchTeams } from "@/lib/tba";

const BigToggle = ({
  label, options, selected, onChange, disabled = false
}: {
  label: string, options: string[], selected: string, onChange: (val: string) => void, disabled?: boolean
}) => (
  <div className={`space-y-3 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
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

// Team picker shows 6 teams from TBA in red/blue alliance layout
const TeamPicker = ({
  teams,
  selected,
  onSelect,
}: {
  teams: MatchTeams;
  selected: string;
  onSelect: (team: string) => void;
}) => (
  <div className="space-y-3">
    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Select Your Team</label>
    <div className="space-y-2">
      <div className="space-y-1.5">
        <div className="text-xs font-bold uppercase tracking-widest text-red-400">Red Alliance</div>
        <div className="flex gap-2">
          {teams.red.map(team => (
            <button
              key={team}
              type="button"
              onClick={() => onSelect(team)}
              className={`flex-1 py-3 rounded-lg font-display text-xl font-bold border-2 transition-all ${
                selected === team
                  ? "bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                  : "bg-red-950/40 border-red-900/50 text-red-300 hover:bg-red-900/40 hover:border-red-700"
              }`}
            >
              {team}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="text-xs font-bold uppercase tracking-widest text-blue-400">Blue Alliance</div>
        <div className="flex gap-2">
          {teams.blue.map(team => (
            <button
              key={team}
              type="button"
              onClick={() => onSelect(team)}
              className={`flex-1 py-3 rounded-lg font-display text-xl font-bold border-2 transition-all ${
                selected === team
                  ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                  : "bg-blue-950/40 border-blue-900/50 text-blue-300 hover:bg-blue-900/40 hover:border-blue-700"
              }`}
            >
              {team}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const emptyForm: CreateMatchEntry = {
  scouter: "",
  teamNum: "",
  matchNum: 1,
  startPos: "",
  autoCycles: { starts: [], stops: [] },
  autoClimb: { startTime: "", location: "", success: "", successTime: "" },
  teleCycles: { starts: [], stops: [] },
  teleClimb: { startTime: "", location: "", level: "", success: "", successTime: "" },
  comments: "",
  defensePlayed: "No",
  defenseRating: ""
};

export default function MatchScout() {
  const { toast } = useToast();
  const createMatch = useCreateMatchEntry();

  const [formData, setFormData] = useState<CreateMatchEntry>(emptyForm);
  const [currentPage, setCurrentPage] = useState(0);
  const [isShooting, setIsShooting] = useState(false);
  const [isClimbing, setIsClimbing] = useState(false);

  // TBA state
  const [tbaMatches, setTbaMatches] = useState<TBAMatch[]>([]);
  const [tbaLoading, setTbaLoading] = useState(false);
  const [matchTeams, setMatchTeams] = useState<MatchTeams | null>(null);

  // Event key/name from the database (set by team lead)
  const { data: eventSettings } = useEventSettings();
  const tbaEventName = eventSettings?.eventName ?? "";
  const tbaConfigured = !!eventSettings?.eventKey;

  // Load all matches for the event once we have the event key
  useEffect(() => {
    const eventKey = eventSettings?.eventKey;
    if (!eventKey) return;

    setTbaLoading(true);
    getEventMatches(eventKey)
      .then(setTbaMatches)
      .catch(() => {}) // silently fail, will fall back to manual
      .finally(() => setTbaLoading(false));
  }, [eventSettings?.eventKey]);

  // Update team picker when match number changes
  useEffect(() => {
    if (tbaMatches.length === 0) return;
    const teams = getTeamsForMatch(tbaMatches, formData.matchNum);
    setMatchTeams(teams);
    // Clear team if it's not in the new match
    if (teams && formData.teamNum) {
      const allTeams = [...teams.red, ...teams.blue];
      if (!allTeams.includes(formData.teamNum)) {
        setFormData(prev => ({ ...prev, teamNum: "" }));
      }
    }
  }, [formData.matchNum, tbaMatches]);

  const handleSubmit = async () => {
    if (!formData.scouter || !formData.teamNum) {
      toast({ title: "Validation Error", description: "Scouter and Team Number are required.", variant: "destructive" });
      return;
    }
    try {
      await createMatch.mutateAsync(formData);
      toast({ title: "Success!", description: `Match ${formData.matchNum} submitted for team ${formData.teamNum}.` });
      const nextMatch = formData.matchNum + 1;
      setFormData(prev => ({ ...emptyForm, scouter: prev.scouter, matchNum: nextMatch }));
      setCurrentPage(0);
      setIsShooting(false);
      setIsClimbing(false);
      // Update teams for next match
      if (tbaMatches.length > 0) {
        setMatchTeams(getTeamsForMatch(tbaMatches, nextMatch));
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to submit match", variant: "destructive" });
    }
  };

  const isAuto = currentPage === 1;
  const cycleKey = isAuto ? "autoCycles" : "teleCycles";
  const climbKey = isAuto ? "autoClimb" : "teleClimb";

  const handleStartShooting = () => {
    setIsShooting(true);
    setFormData(prev => ({ ...prev, [cycleKey]: { ...prev[cycleKey], starts: [...prev[cycleKey].starts, prev[cycleKey].starts.length + 1] } }));
  };

  const handleStopShooting = () => {
    setIsShooting(false);
    setFormData(prev => ({ ...prev, [cycleKey]: { ...prev[cycleKey], stops: [...prev[cycleKey].stops, prev[cycleKey].stops.length + 1] } }));
  };

  const handleStartClimbing = () => {
    setIsClimbing(true);
    setFormData(prev => ({ ...prev, [climbKey]: { ...prev[climbKey], startTime: 1 } }));
  };

  const pages = [
    { title: "Pre-Match", icon: MapPin },
    { title: "Auto", icon: Zap },
    { title: "Teleop", icon: Crosshair },
    { title: "Post-Match", icon: ShieldAlert }
  ];

  return (
    <Layout title="MATCH SCOUT">
      {/* Page Progress Header */}
      <div className="mb-8 sticky top-4 z-30">
        <Card className="border-primary/30 overflow-hidden">
          <div className="p-3 md:px-6">
            {tbaConfigured && (
              <div className="text-center text-xs text-white/40 font-semibold uppercase tracking-widest mb-2">
                {tbaLoading ? <span className="flex items-center justify-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading match data...</span> : tbaEventName}
              </div>
            )}
            <div className="flex gap-2">
              {pages.map((p, idx) => (
                <div key={idx} className="flex-1 text-center">
                  <div className={`h-1.5 w-full rounded-full mb-2 transition-colors ${idx <= currentPage ? "bg-primary shadow-[0_0_8px_rgba(230,0,0,0.8)]" : "bg-white/10"}`} />
                  <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${idx === currentPage ? "text-white" : "text-white/40"}`}>{p.title}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">

          {/* PAGE 0: PRE-MATCH */}
          {currentPage === 0 && (
            <motion.div key="page0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-6 md:p-8 space-y-6">

                  {/* Scouter + Match # */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase text-muted-foreground">Scouter Name</label>
                      <Input placeholder="John D." value={formData.scouter} onChange={e => setFormData({...formData, scouter: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase text-muted-foreground">Match Number</label>
                      <div className="flex gap-2 items-center">
                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => setFormData(p => ({ ...p, matchNum: Math.max(1, p.matchNum - 1) }))}>−</Button>
                        <Input
                          type="number"
                          value={formData.matchNum}
                          onChange={e => setFormData({...formData, matchNum: parseInt(e.target.value) || 1})}
                          className="text-center font-display text-xl"
                        />
                        <Button variant="outline" size="icon" className="shrink-0" onClick={() => setFormData(p => ({ ...p, matchNum: p.matchNum + 1 }))}>+</Button>
                      </div>
                    </div>
                  </div>

                  {/* Team Number — TBA picker or manual */}
                  <div className="pt-2 border-t border-white/10 space-y-4">
                    {tbaConfigured && matchTeams ? (
                      <TeamPicker
                        teams={matchTeams}
                        selected={formData.teamNum}
                        onSelect={team => setFormData(prev => ({ ...prev, teamNum: team }))}
                      />
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold uppercase text-muted-foreground">Team Number</label>
                        {tbaConfigured && !matchTeams && !tbaLoading && (
                          <div className="flex items-center gap-2 text-xs text-yellow-500/80 mb-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            Match {formData.matchNum} not found in TBA — enter manually
                          </div>
                        )}
                        {!tbaConfigured && (
                          <div className="flex items-center gap-2 text-xs text-white/30 mb-1">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            Set up TBA on the home screen to auto-fill teams
                          </div>
                        )}
                        <Input placeholder="2771" type="number" value={formData.teamNum} onChange={e => setFormData({...formData, teamNum: e.target.value})} />
                      </div>
                    )}
                  </div>

                  {/* Starting Position */}
                  <div className="pt-4 border-t border-white/10">
                    <BigToggle label="Starting Position" options={["A", "B", "C", "D", "E"]} selected={formData.startPos} onChange={val => setFormData({...formData, startPos: val})} />
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button size="lg" onClick={() => setCurrentPage(1)} className="w-full md:w-auto" disabled={!formData.teamNum}>
                  Next: Auto Phase
                </Button>
              </div>
            </motion.div>
          )}

          {/* PAGE 1 & 2: AUTO / TELEOP */}
          {(currentPage === 1 || currentPage === 2) && (
            <motion.div key={`page${currentPage}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 max-w-2xl mx-auto">
              <Card className="border-t-4 border-t-primary">
                <CardContent className="p-6 md:p-8 space-y-8">

                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-3xl">{currentPage === 1 ? "Auto" : "Teleop"}</h2>
                    <span className="text-sm text-white/50 font-semibold">Team {formData.teamNum} · Match {formData.matchNum}</span>
                  </div>

                  {/* Shooting Section */}
                  <div className="space-y-4">
                    <h3 className="font-display text-xl border-b border-white/10 pb-2">Shooting Cycles</h3>
                    <div className="flex gap-4">
                      <Button
                        size="lg"
                        className={`flex-1 h-24 text-xl font-display uppercase tracking-wide ${isShooting ? 'bg-green-600 hover:bg-green-700 shadow-[0_0_20px_rgba(22,163,74,0.5)]' : ''}`}
                        disabled={isShooting || isClimbing}
                        onClick={handleStartShooting}
                      >
                        Start Cycle
                      </Button>
                      <Button
                        size="lg"
                        variant="secondary"
                        className="flex-1 h-24 text-xl font-display uppercase tracking-wide"
                        disabled={!isShooting}
                        onClick={handleStopShooting}
                      >
                        <Square className="mr-2 h-5 w-5" /> Stop Cycle
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground flex justify-between">
                      <span>Completed Cycles: {formData[cycleKey].stops.length}</span>
                      {isShooting && <span className="text-green-500 font-bold animate-pulse">Cycle in progress...</span>}
                    </div>
                  </div>

                  {/* Climbing Section */}
                  <div className="space-y-6 pt-6 border-t border-white/10">
                    <h3 className="font-display text-xl border-b border-white/10 pb-2">Climbing</h3>
                    <Button
                      size="lg"
                      variant="outline"
                      className={`w-full h-16 text-xl font-display uppercase tracking-wide border-2 ${isClimbing ? 'border-primary text-primary' : 'border-white/20'}`}
                      disabled={isShooting || isClimbing}
                      onClick={handleStartClimbing}
                    >
                      {isClimbing ? "Climbing Started" : "Start Climbing"}
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <BigToggle label="Location" options={["Center", "Side"]} selected={formData[climbKey].location || ""} disabled={!isClimbing} onChange={val => setFormData(prev => ({ ...prev, [climbKey]: { ...prev[climbKey], location: val } }))} />
                      {currentPage === 2 && (
                        <BigToggle label="Level" options={["L1", "L2", "L3"]} selected={formData[climbKey].level || ""} disabled={!isClimbing} onChange={val => setFormData(prev => ({ ...prev, [climbKey]: { ...prev[climbKey], level: val } }))} />
                      )}
                      <BigToggle label="Success" options={["Yes", "No"]} selected={formData[climbKey].success || ""} disabled={!isClimbing} onChange={val => setFormData(prev => ({ ...prev, [climbKey]: { ...prev[climbKey], success: val } }))} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => { setCurrentPage(currentPage - 1); setIsShooting(false); setIsClimbing(false); }}>Back</Button>
                <Button size="lg" onClick={() => { setCurrentPage(currentPage === 1 ? 2 : 3); setIsShooting(false); setIsClimbing(false); }}>
                  {currentPage === 1 ? "Next: Teleop" : "Next: Post-Match"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* PAGE 3: POST-MATCH */}
          {currentPage === 3 && (
            <motion.div key="page3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-6 md:p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl border-b border-white/10 pb-2 flex-1">Post Match Review</h3>
                    <span className="text-sm text-white/50 font-semibold">Team {formData.teamNum} · Match {formData.matchNum}</span>
                  </div>
                  <BigToggle
                    label="Did they play defense?"
                    options={["Yes", "No"]}
                    selected={formData.defensePlayed}
                    onChange={val => setFormData(prev => ({ ...prev, defensePlayed: val, defenseRating: val === "No" ? "" : prev.defenseRating }))}
                  />
                  {formData.defensePlayed === "Yes" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <BigToggle
                        label="Defense Rating (5 is best)"
                        options={["1", "2", "3", "4", "5"]}
                        selected={formData.defenseRating}
                        onChange={val => setFormData(prev => ({ ...prev, defenseRating: val }))}
                      />
                    </motion.div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Comments & Observations</label>
                    <Textarea
                      placeholder="Fast cycle times, good driver control..."
                      value={formData.comments}
                      onChange={e => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                      className="min-h-[150px]"
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setCurrentPage(2)}>Back</Button>
                <Button size="lg" onClick={handleSubmit} disabled={createMatch.isPending} className="bg-primary hover:bg-primary/90 text-xl px-8 shadow-[0_0_20px_rgba(230,0,0,0.6)]">
                  <Save className="mr-2 h-5 w-5" /> Submit Match
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </Layout>
  );
}
