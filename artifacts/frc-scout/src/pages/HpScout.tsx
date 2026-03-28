import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateHpEntry, useEventSettings, CreateHpEntry } from "@/hooks/use-scout-api";
import { useOfflineQueue } from "@/context/OfflineQueueContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Save } from "lucide-react";
import { getEventMatches, type TBAMatch } from "@/lib/tba";

function getNextMatchNum(matches: TBAMatch[]): number {
  const qm = matches
    .filter((m) => m.comp_level === "qm")
    .sort((a, b) => a.match_number - b.match_number);
  const next = qm.find((m) => !m.actual_time);
  return next?.match_number ?? (qm.length > 0 ? qm[qm.length - 1].match_number : 1);
}

export default function HpScout() {
  const { toast } = useToast();
  const createHp = useCreateHpEntry();
  const { data: eventSettings } = useEventSettings();

  const [formData, setFormData] = useState<CreateHpEntry>({
    scouter: "",
    matchNum: 1,
    alliance: "",
    scores: 0,
  });

  const [tbaMatches, setTbaMatches] = useState<TBAMatch[]>([]);
  const [tbaLoading, setTbaLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMatches = async (eventKey: string, autoAdvance = false) => {
    try {
      const matches = await getEventMatches(eventKey);
      setTbaMatches(matches);
      if (autoAdvance) {
        const next = getNextMatchNum(matches);
        setFormData((prev) => ({ ...prev, matchNum: next }));
      }
    } catch {
      // silently fail — manual entry still works
    }
  };

  // Initial load + polling every 30 seconds
  useEffect(() => {
    const eventKey = eventSettings?.eventKey;
    if (!eventKey) return;

    setTbaLoading(true);
    loadMatches(eventKey, true).finally(() => setTbaLoading(false));

    pollRef.current = setInterval(() => loadMatches(eventKey, false), 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [eventSettings?.eventKey]);

  // Auto-advance when TBA shows a match just completed
  const prevCompletedRef = useRef<number>(0);
  useEffect(() => {
    if (tbaMatches.length === 0) return;
    const qm = tbaMatches.filter((m) => m.comp_level === "qm");
    const completed = qm.filter((m) => !!m.actual_time).length;
    if (completed > prevCompletedRef.current) {
      prevCompletedRef.current = completed;
      const next = getNextMatchNum(tbaMatches);
      setFormData((prev) => ({ ...prev, matchNum: next }));
    }
  }, [tbaMatches]);

  const { addToQueue } = useOfflineQueue();

  const handleSubmit = async () => {
    if (!formData.scouter || !formData.alliance) {
      toast({ title: "Error", description: "Scouter name and Alliance are required.", variant: "destructive" });
      return;
    }
    try {
      await createHp.mutateAsync(formData);
      toast({ title: "Success", description: `HP Entry for Match ${formData.matchNum} submitted.` });
      setFormData((prev) => ({ ...prev, scores: 0 }));
    } catch {
      addToQueue("hp", "/api/hp-entries", formData);
      toast({ title: "Saved locally", description: "No connection — data saved on this device. Tap Send Data when back online." });
      setFormData((prev) => ({ ...prev, scores: 0 }));
    }
  };

  return (
    <Layout title="HUMAN PLAYER SCOUT">
      <div className="max-w-xl mx-auto mt-8">
        <Card className="border-t-4 border-t-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
          <CardHeader>
            <CardTitle>Human Player Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">

            {/* Scouter + Match */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase text-muted-foreground">Scouter Name</label>
                <Input
                  placeholder="Jane D."
                  value={formData.scouter}
                  onChange={(e) => setFormData({ ...formData, scouter: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase text-muted-foreground">Match Number</label>
                <Input
                  type="number"
                  value={formData.matchNum}
                  onChange={(e) =>
                    setFormData({ ...formData, matchNum: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>

            {/* Alliance */}
            <div className="space-y-3">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Alliance</label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.alliance === "Red" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, alliance: "Red" })}
                  className={`flex-1 h-16 text-xl font-display ${
                    formData.alliance === "Red"
                      ? "bg-red-600 hover:bg-red-700 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                      : "border-white/10"
                  }`}
                >
                  Red
                </Button>
                <Button
                  type="button"
                  variant={formData.alliance === "Blue" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, alliance: "Blue" })}
                  className={`flex-1 h-16 text-xl font-display ${
                    formData.alliance === "Blue"
                      ? "bg-blue-600 hover:bg-blue-700 border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                      : "border-white/10 text-white"
                  }`}
                >
                  Blue
                </Button>
              </div>
            </div>

            {/* Shots counter */}
            <div className="space-y-4 pt-6 border-t border-white/10 text-center">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground block">
                Shots Made
              </label>
              <div className="flex items-center justify-center gap-8">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-20 w-20 rounded-full border-white/20 hover:bg-white/10"
                  onClick={() => setFormData((prev) => ({ ...prev, scores: Math.max(0, prev.scores - 1) }))}
                >
                  <Minus className="h-10 w-10 text-white/70" />
                </Button>
                <div className="w-32 h-32 flex items-center justify-center bg-black/50 border-4 border-primary rounded-full shadow-[0_0_20px_rgba(230,0,0,0.3)]">
                  <span className="text-6xl font-display font-bold text-white">{formData.scores}</span>
                </div>
                <Button
                  size="icon"
                  className="h-20 w-20 rounded-full"
                  onClick={() => setFormData((prev) => ({ ...prev, scores: prev.scores + 1 }))}
                >
                  <Plus className="h-10 w-10" />
                </Button>
              </div>
            </div>

            <Button size="lg" className="w-full h-16 text-xl mt-8" onClick={handleSubmit}>
              <Save className="mr-2 h-6 w-6" /> Submit HP Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
