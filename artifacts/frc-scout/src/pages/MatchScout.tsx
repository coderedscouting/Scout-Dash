import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateMatchEntry, CreateMatchEntry } from "@/hooks/use-scout-api";
import { Square, Save, ShieldAlert, Crosshair, MapPin, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendMatchToSheets } from "@/lib/googleSheets";

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
  const [currentPage, setCurrentPage] = useState(0); // 0: Pre, 1: Auto, 2: Teleop, 3: Post
  const [isShooting, setIsShooting] = useState(false);
  const [isClimbing, setIsClimbing] = useState(false);

  const handleSubmit = async () => {
    if (!formData.scouter || !formData.teamNum) {
      toast({ title: "Validation Error", description: "Scouter and Team Number are required.", variant: "destructive" });
      return;
    }
    try {
      await Promise.all([
        createMatch.mutateAsync(formData),
        sendMatchToSheets(formData),
      ]);
      toast({ title: "Success!", description: `Match ${formData.matchNum} submitted for team ${formData.teamNum} and sent to Google Sheets.` });
      setFormData(prev => ({ ...emptyForm, scouter: prev.scouter, matchNum: prev.matchNum + 1 }));
      setCurrentPage(0);
      setIsShooting(false);
      setIsClimbing(false);
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
      <div className="mb-8 sticky top-20 z-30">
        <Card className="border-primary/30 overflow-hidden">
          <div className="p-4 md:px-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase text-muted-foreground">Scouter Name</label>
                      <Input placeholder="John D." value={formData.scouter} onChange={e => setFormData({...formData, scouter: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase text-muted-foreground">Team Number</label>
                      <Input placeholder="2771" type="number" value={formData.teamNum} onChange={e => setFormData({...formData, teamNum: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase text-muted-foreground">Match Number</label>
                      <Input type="number" value={formData.matchNum} onChange={e => setFormData({...formData, matchNum: parseInt(e.target.value) || 0})} />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <BigToggle label="Starting Position" options={["A", "B", "C", "D", "E"]} selected={formData.startPos} onChange={val => setFormData({...formData, startPos: val})} />
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button size="lg" onClick={() => setCurrentPage(1)} className="w-full md:w-auto">Next: Auto Phase</Button>
              </div>
            </motion.div>
          )}

          {/* PAGE 1 & 2: AUTO / TELEOP */}
          {(currentPage === 1 || currentPage === 2) && (
            <motion.div key={`page${currentPage}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 max-w-2xl mx-auto">
              <Card className="border-t-4 border-t-primary">
                <CardContent className="p-6 md:p-8 space-y-8">

                  {/* Shooting Section */}
                  <div className="space-y-4">
                    <h3 className="font-display text-2xl border-b border-white/10 pb-2">Shooting Cycles</h3>
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
                    <h3 className="font-display text-2xl border-b border-white/10 pb-2">Climbing</h3>
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
                      <BigToggle
                        label="Location"
                        options={["Center", "Side"]}
                        selected={formData[climbKey].location || ""}
                        disabled={!isClimbing}
                        onChange={val => setFormData(prev => ({ ...prev, [climbKey]: { ...prev[climbKey], location: val } }))}
                      />
                      {currentPage === 2 && (
                        <BigToggle
                          label="Level"
                          options={["L1", "L2", "L3"]}
                          selected={formData[climbKey].level || ""}
                          disabled={!isClimbing}
                          onChange={val => setFormData(prev => ({ ...prev, [climbKey]: { ...prev[climbKey], level: val } }))}
                        />
                      )}
                      <BigToggle
                        label="Success"
                        options={["Yes", "No"]}
                        selected={formData[climbKey].success || ""}
                        disabled={!isClimbing}
                        onChange={val => setFormData(prev => ({ ...prev, [climbKey]: { ...prev[climbKey], success: val } }))}
                      />
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
                  <h3 className="font-display text-2xl border-b border-white/10 pb-2">Post Match Review</h3>
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
                <Button size="lg" onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-xl px-8 shadow-[0_0_20px_rgba(230,0,0,0.6)]">
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
