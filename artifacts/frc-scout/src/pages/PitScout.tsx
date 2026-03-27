import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreatePitEntry, CreatePitEntry } from "@/hooks/use-scout-api";
import { sendPitToSheets } from "@/lib/googleSheets";

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

const emptyForm: CreatePitEntry = {
  scouter: "",
  teamNum: "",
  drivetrain: "",
  autoScore: "",
  autoLocations: "",
  teleopScore: "",
  canClimb: "",
  climbLevel: "",
  climbLocation: "",
  robotWeight: "",
  comments: "",
};

export default function PitScout() {
  const { toast } = useToast();
  const createPit = useCreatePitEntry();
  const [formData, setFormData] = useState<CreatePitEntry>(emptyForm);

  const set = (field: keyof CreatePitEntry) => (val: string) =>
    setFormData(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async () => {
    if (!formData.scouter || !formData.teamNum) {
      toast({ title: "Validation Error", description: "Scouter name and Team Number are required.", variant: "destructive" });
      return;
    }
    try {
      await Promise.all([
        createPit.mutateAsync(formData),
        sendPitToSheets(formData),
      ]);
      toast({ title: "Success!", description: `Pit data for team ${formData.teamNum} submitted.` });
      setFormData(prev => ({ ...emptyForm, scouter: prev.scouter }));
    } catch {
      toast({ title: "Error", description: "Failed to submit pit entry.", variant: "destructive" });
    }
  };

  return (
    <Layout showBack={true}>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-display font-bold uppercase tracking-wider text-shadow-red"
        >
          Pit Scout
        </motion.h1>

        {/* Identity */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-display text-xl border-b border-white/10 pb-2">Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase text-muted-foreground">Scouter Name</label>
                <Input placeholder="John D." value={formData.scouter} onChange={e => set("scouter")(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold uppercase text-muted-foreground">Team Number</label>
                <Input placeholder="2771" type="number" value={formData.teamNum} onChange={e => set("teamNum")(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Robot */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-display text-xl border-b border-white/10 pb-2">Robot</h3>
            <BigToggle label="Drivetrain" options={["Swerve", "Tank", "Mecanum", "Other"]} selected={formData.drivetrain} onChange={set("drivetrain")} />
            <BigToggle label="Robot Weight" options={["Light", "Medium", "Heavy"]} selected={formData.robotWeight} onChange={set("robotWeight")} />
          </CardContent>
        </Card>

        {/* Auto */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-display text-xl border-b border-white/10 pb-2">Auto</h3>
            <BigToggle label="Can they score in Auto?" options={["Yes", "No"]} selected={formData.autoScore} onChange={set("autoScore")} />
            {formData.autoScore === "Yes" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                <BigToggle label="Scoring Locations" options={["Amp", "Speaker", "Both"]} selected={formData.autoLocations} onChange={set("autoLocations")} />
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Teleop */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-display text-xl border-b border-white/10 pb-2">Teleop</h3>
            <BigToggle label="Can they score in Teleop?" options={["Yes", "No"]} selected={formData.teleopScore} onChange={set("teleopScore")} />
          </CardContent>
        </Card>

        {/* Endgame */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-display text-xl border-b border-white/10 pb-2">Endgame / Climb</h3>
            <BigToggle label="Can they climb?" options={["Yes", "No"]} selected={formData.canClimb} onChange={val => setFormData(prev => ({ ...prev, canClimb: val, climbLevel: "", climbLocation: "" }))} />
            {formData.canClimb === "Yes" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-6">
                <BigToggle label="Max Climb Level" options={["L1", "L2", "L3"]} selected={formData.climbLevel} onChange={set("climbLevel")} />
                <BigToggle label="Climb Location" options={["Center", "Side"]} selected={formData.climbLocation} onChange={set("climbLocation")} />
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-display text-xl border-b border-white/10 pb-2">Notes</h3>
            <Textarea
              placeholder="Additional observations, unique mechanisms, notable features..."
              value={formData.comments}
              onChange={e => set("comments")(e.target.value)}
              className="min-h-[120px]"
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
    </Layout>
  );
}
