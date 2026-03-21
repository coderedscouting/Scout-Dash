import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateMatchEntry, CreateMatchEntry } from "@/hooks/use-scout-api";
import { Play, Square, Pause, RotateCcw, Save, ShieldAlert, Crosshair, MapPin, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Helper components
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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMatch = useCreateMatchEntry();

  const [formData, setFormData] = useState<CreateMatchEntry>(emptyForm);
  const [currentPage, setCurrentPage] = useState(0); // 0: Pre, 1: Auto, 2: Teleop, 3: Post
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // States derived from cycle arrays
  const [isShooting, setIsShooting] = useState(false);
  const [isClimbing, setIsClimbing] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev === 19 && currentPage === 1) {
            setIsPaused(true);
            setTimeout(() => {
              setIsPaused(false);
              setCurrentPage(2);
            }, 2000);
            return 19;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, currentPage]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleStartTimer = () => {
    if (timer === 0) {
      setCurrentPage(1); // Jump to Auto
    }
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => setIsPaused(!isPaused);
  
  const handleReset = () => {
    if (confirm("Reset current match? All progress will be lost.")) {
      setTimer(0);
      setIsActive(false);
      setIsPaused(false);
      setCurrentPage(0);
      setIsShooting(false);
      setIsClimbing(false);
      setFormData(emptyForm);
    }
  };

  const handleSubmit = async () => {
    if (!formData.scouter || !formData.teamNum) {
      toast({ title: "Validation Error", description: "Scouter and Team Number are required.", variant: "destructive" });
      return;
    }
    
    try {
      await createMatch.mutateAsync(formData);
      toast({ title: "Success!", description: `Match ${formData.matchNum} submitted for team ${formData.teamNum}` });
      setFormData(prev => ({
        ...emptyForm,
        scouter: prev.scouter,
        matchNum: prev.matchNum + 1
      }));
      setTimer(0);
      setIsActive(false);
      setCurrentPage(0);
      setIsShooting(false);
      setIsClimbing(false);
    } catch (e) {
      toast({ title: "Error", description: "Failed to submit match", variant: "destructive" });
    }
  };

  // Generic phase actions (Auto/Teleop)
  const isAuto = currentPage === 1;
  const cycleKey = isAuto ? "autoCycles" : "teleCycles";
  const climbKey = isAuto ? "autoClimb" : "teleClimb";

  const handleStartShooting = () => {
    setIsShooting(true);
    setFormData(prev => ({
      ...prev,
      [cycleKey]: {
        ...prev[cycleKey],
        starts: [...prev[cycleKey].starts, timer]
      }
    }));
  };

  const handleStopShooting = () => {
    setIsShooting(false);
    setFormData(prev => ({
      ...prev,
      [cycleKey]: {
        ...prev[cycleKey],
        stops: [...prev[cycleKey].stops, timer]
      }
    }));
  };

  const handleStartClimbing = () => {
    setIsClimbing(true);
    setFormData(prev => ({
      ...prev,
      [climbKey]: {
        ...prev[climbKey],
        startTime: timer
      }
    }));
  };

  const pages = [
    { title: "Pre-Match", icon: MapPin },
    { title: "Auto", icon: Zap },
    { title: "Teleop", icon: Crosshair },
    { title: "Post-Match", icon: ShieldAlert }
  ];

  return (
    <Layout title="MATCH SCOUT">
      
      {/* Wizard Header / Clock */}
      <div className="mb-8 sticky top-20 z-30">
        <Card className="border-primary/30 overflow-hidden relative">
          {isActive && (
            <div className={`absolute top-0 left-0 h-1 bg-primary transition-all duration-1000 ease-linear`} style={{ width: `${Math.min(100, (timer / 150) * 100)}%` }} />
          )}
          <div className="p-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex gap-2 w-full md:w-auto">
              {pages.map((p, idx) => (
                <div key={idx} className="flex-1 md:w-24 text-center relative">
                  <div className={`h-1.5 w-full rounded-full mb-2 transition-colors ${idx <= currentPage ? "bg-primary shadow-[0_0_8px_rgba(230,0,0,0.8)]" : "bg-white/10"}`} />
                  <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${idx === currentPage ? "text-white" : "text-white/40"}`}>{p.title}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center font-display">
                <div className={`text-4xl md:text-5xl font-bold tabular-nums tracking-tighter ${isPaused ? "text-yellow-500" : isActive ? "text-primary text-shadow-red" : "text-white"}`}>
                  {formatTime(timer)}
                </div>
                {isPaused && <div className="text-xs text-yellow-500 uppercase font-bold animate-pulse">Paused</div>}
              </div>

              <div className="flex gap-2">
                {!isActive && timer === 0 ? (
                  <Button size="icon" className="h-12 w-12 rounded-full" onClick={handleStartTimer}>
                    <Play className="h-6 w-6 ml-1" />
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-white/20" onClick={handlePause}>
                      {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                    </Button>
                    <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={handleReset}>
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>

          </div>
        </Card>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {/* ================= PAGE 0: PRE-MATCH ================= */}
          {currentPage === 0 && (
            <motion.div
              key="page0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 max-w-2xl mx-auto"
            >
              <Card>
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase text-muted-foreground">Scouter Name</label>
                      <Input 
                        placeholder="John D." 
                        value={formData.scouter} 
                        onChange={e => setFormData({...formData, scouter: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase text-muted-foreground">Team Number</label>
                      <Input 
                        placeholder="2771" 
                        type="number"
                        value={formData.teamNum} 
                        onChange={e => setFormData({...formData, teamNum: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold uppercase text-muted-foreground">Match Number</label>
                      <Input 
                        type="number" 
                        value={formData.matchNum} 
                        onChange={e => setFormData({...formData, matchNum: parseInt(e.target.value) || 0})} 
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <BigToggle 
                      label="Starting Position" 
                      options={["A", "B", "C", "D", "E"]} 
                      selected={formData.startPos} 
                      onChange={val => setFormData({...formData, startPos: val})} 
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button size="lg" onClick={() => setCurrentPage(1)} className="w-full md:w-auto">
                  Next: Auto Phase
                </Button>
              </div>
            </motion.div>
          )}

          {/* ================= PAGE 1 & 2: AUTO / TELEOP ================= */}
          {(currentPage === 1 || currentPage === 2) && (
            <motion.div
              key={`page${currentPage}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 max-w-2xl mx-auto relative"
            >
              {!isActive && (
                <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Button size="lg" onClick={handleStartTimer} className="text-xl px-8 py-6 rounded-full shadow-[0_0_30px_rgba(230,0,0,0.5)]">
                    <Play className="mr-2 h-6 w-6" /> Start Timer to Enable
                  </Button>
                </div>
              )}

              <Card className="border-t-4 border-t-primary">
                <CardContent className="p-6 md:p-8 space-y-8">
                  {/* Shooting Section */}
                  <div className="space-y-4">
                    <h3 className="font-display text-2xl border-b border-white/10 pb-2">Shooting Cycles</h3>
                    <div className="flex gap-4">
                      <Button 
                        size="lg" 
                        className={`flex-1 h-24 text-xl font-display uppercase tracking-wide ${isShooting ? 'bg-green-600 hover:bg-green-700 shadow-[0_0_20px_rgba(22,163,74,0.5)]' : ''}`}
                        disabled={isShooting || isClimbing || isPaused}
                        onClick={handleStartShooting}
                      >
                        Start Cycle
                      </Button>
                      <Button 
                        size="lg" 
                        variant="secondary"
                        className={`flex-1 h-24 text-xl font-display uppercase tracking-wide`}
                        disabled={!isShooting || isPaused}
                        onClick={handleStopShooting}
                      >
                        <Square className="mr-2 h-5 w-5" /> Stop Cycle
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground flex justify-between">
                      <span>Completed Cycles: {formData[cycleKey].stops.length}</span>
                      {isShooting && <span className="text-green-500 font-bold animate-pulse">Shooting in progress...</span>}
                    </div>
                  </div>

                  {/* Climbing Section */}
                  <div className="space-y-6 pt-6 border-t border-white/10">
                    <h3 className="font-display text-2xl border-b border-white/10 pb-2">Climbing</h3>
                    
                    <Button 
                      size="lg" 
                      variant="outline"
                      className={`w-full h-16 text-xl font-display uppercase tracking-wide border-2 ${isClimbing ? 'border-primary text-primary' : 'border-white/20'}`}
                      disabled={isShooting || isClimbing || isPaused}
                      onClick={handleStartClimbing}
                    >
                      {isClimbing ? `Climb Started at ${formatTime(formData[climbKey].startTime as number)}` : 'Start Climbing'}
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <BigToggle 
                        label="Location" 
                        options={["Center", "Side"]} 
                        selected={formData[climbKey].location || ""} 
                        disabled={!isClimbing || isPaused}
                        onChange={val => setFormData(prev => ({ ...prev, [climbKey]: { ...prev[climbKey], location: val } }))} 
                      />
                      
                      {currentPage === 2 && (
                        <BigToggle 
                          label="Level" 
                          options={["L1", "L2", "L3"]} 
                          selected={formData[climbKey].level || ""} 
                          disabled={!isClimbing || isPaused}
                          onChange={val => setFormData(prev => ({ ...prev, [climbKey]: { ...prev[climbKey], level: val } }))} 
                        />
                      )}

                      <BigToggle 
                        label="Success" 
                        options={["Yes", "No"]} 
                        selected={formData[climbKey].success || ""} 
                        disabled={!isClimbing || isPaused}
                        onChange={val => setFormData(prev => ({ 
                          ...prev, 
                          [climbKey]: { 
                            ...prev[climbKey], 
                            success: val, 
                            successTime: val === "Yes" ? timer : "" 
                          } 
                        }))} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setCurrentPage(currentPage - 1)}>Back</Button>
                <Button size="lg" onClick={() => {
                  if (currentPage === 1) setCurrentPage(2);
                  else setCurrentPage(3);
                }}>
                  {currentPage === 1 ? "Next: Teleop" : "Next: Post-Match"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ================= PAGE 3: POST-MATCH ================= */}
          {currentPage === 3 && (
            <motion.div
              key="page3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 max-w-2xl mx-auto"
            >
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
