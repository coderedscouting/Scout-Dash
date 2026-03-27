import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Activity, ClipboardList, UserRound, Settings, CheckCircle, Loader2, X } from "lucide-react";
import { getTeamEvents, TBA_STORAGE, type TBAEvent } from "@/lib/tba";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const links = [
    { href: "/match", title: "Match Scout", icon: Activity, desc: "Record live robot performance during matches", color: "text-primary" },
    { href: "/pit", title: "Pit Scout", icon: ClipboardList, desc: "Log offline robot specifications and photos", color: "text-orange-500" },
    { href: "/humanplayer", title: "Human Player Scout", icon: UserRound, desc: "Track human player shots and performance", color: "text-blue-500" },
  ];

  const [showSetup, setShowSetup] = useState(false);
  const [apiKey, setApiKey] = useState(TBA_STORAGE.getApiKey);
  const [eventKey, setEventKey] = useState(TBA_STORAGE.getEventKey);
  const [eventName, setEventName] = useState(TBA_STORAGE.getEventName);
  const [events, setEvents] = useState<TBAEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const isConfigured = !!eventKey;

  const handleLoadEvents = async () => {
    if (!apiKey.trim()) {
      toast({ title: "API Key Required", description: "Enter your TBA API key first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      TBA_STORAGE.setApiKey(apiKey.trim());
      const year = new Date().getFullYear();
      const data = await getTeamEvents(apiKey.trim(), "frc2771", year);
      setEvents(data);
      if (data.length === 0) {
        toast({ title: "No Events Found", description: `No events found for team 2771 in ${year}.` });
      }
    } catch (e) {
      toast({ title: "Failed to load events", description: "Check your API key and try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: TBAEvent) => {
    TBA_STORAGE.setEventKey(event.key);
    TBA_STORAGE.setEventName(event.name);
    setEventKey(event.key);
    setEventName(event.name);
    toast({ title: "Event Set!", description: `Now scouting: ${event.name}` });
    setShowSetup(false);
  };

  const handleClearEvent = () => {
    TBA_STORAGE.clear();
    setEventKey("");
    setEventName("");
    setEvents([]);
  };

  return (
    <Layout showBack={false}>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4 tracking-wider uppercase text-shadow-red">
            Code Red 2771
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            2026 FRC Scouting Application
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-8">
          {links.map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={link.href} className="block group">
                <Card className="h-full border-white/5 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(230,0,0,0.3)] bg-gradient-to-br from-card/80 to-background/90">
                  <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                    <div className={`p-4 rounded-xl bg-white/5 group-hover:bg-primary/10 transition-colors ${link.color}`}>
                      <link.icon className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-semibold mb-2 group-hover:text-primary transition-colors">
                        {link.title}
                      </h2>
                      <p className="text-muted-foreground text-sm">{link.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Event Configuration */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="w-full max-w-4xl">
          {!showSetup ? (
            <button
              onClick={() => setShowSetup(true)}
              className="w-full flex items-center justify-between px-5 py-4 rounded-xl border border-white/10 bg-black/30 hover:border-primary/40 hover:bg-black/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                {isConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Settings className="h-5 w-5 text-white/40 group-hover:text-white/70 transition-colors" />
                )}
                <span className="text-sm font-semibold uppercase tracking-wider">
                  {isConfigured ? (
                    <span className="text-green-400">Event: <span className="text-white">{eventName}</span></span>
                  ) : (
                    <span className="text-white/50">Configure TBA Event</span>
                  )}
                </span>
              </div>
              <span className="text-xs text-white/30 group-hover:text-white/50">
                {isConfigured ? "Change" : "Set up →"}
              </span>
            </button>
          ) : (
            <Card className="border-white/10">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg uppercase tracking-wider">TBA Event Setup</h3>
                  <button onClick={() => setShowSetup(false)} className="text-white/40 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex gap-3">
                  <Input
                    placeholder="TBA API Key"
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleLoadEvents} disabled={loading} variant="outline">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load Events"}
                  </Button>
                </div>

                {events.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Select Your Event
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {events.map(ev => (
                        <button
                          key={ev.key}
                          onClick={() => handleSelectEvent(ev)}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                            ev.key === eventKey
                              ? "border-primary bg-primary/10 text-white"
                              : "border-white/10 bg-black/30 text-white/70 hover:border-white/30 hover:text-white"
                          }`}
                        >
                          <div className="font-semibold text-sm">{ev.name}</div>
                          <div className="text-xs text-white/40 mt-0.5">{ev.city}, {ev.state_prov} · {ev.start_date}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isConfigured && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-sm text-green-400 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> {eventName}
                    </span>
                    <button onClick={handleClearEvent} className="text-xs text-white/40 hover:text-red-400 transition-colors">
                      Clear
                    </button>
                  </div>
                )}

                <p className="text-xs text-white/30">
                  Get a free API key at <span className="text-white/50">thebluealliance.com/account</span>
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
