import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, ClipboardList, UserRound, Settings, CheckCircle, Loader2, X, ChevronRight } from "lucide-react";
import { getCuratedEvents, TBA_STORAGE, type TBAEvent } from "@/lib/tba";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const links = [
    { href: "/match", title: "Match Scout", icon: Activity, desc: "Record live robot performance during matches", color: "text-primary" },
    { href: "/pit", title: "Pit Scout", icon: ClipboardList, desc: "Log offline robot specifications and photos", color: "text-orange-500" },
    { href: "/humanplayer", title: "Human Player Scout", icon: UserRound, desc: "Track human player shots and performance", color: "text-blue-500" },
  ];

  const [showSetup, setShowSetup] = useState(false);
  const [eventKey, setEventKey] = useState(TBA_STORAGE.getEventKey);
  const [eventName, setEventName] = useState(TBA_STORAGE.getEventName);
  const [events, setEvents] = useState<TBAEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isConfigured = !!eventKey;

  // Auto-fetch events when setup panel opens
  useEffect(() => {
    if (!showSetup || loaded) return;
    setLoading(true);
    getCuratedEvents()
      .then(data => { setEvents(data); setLoaded(true); })
      .catch(() => toast({ title: "Couldn't load events", description: "Check your internet connection.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [showSetup]);

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
  };

  // Group events: district events first, then state champs
  const districtEvents = events.filter(e => e.event_type === 1 || e.event_type === 0);
  const champEvents = events.filter(e => e.event_type === 2 || e.event_type === 5);

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
                {isConfigured
                  ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  : <Settings className="h-5 w-5 text-white/40 group-hover:text-white/70 transition-colors shrink-0" />}
                <span className="text-sm font-semibold uppercase tracking-wider">
                  {isConfigured
                    ? <span className="text-green-400">Event: <span className="text-white">{eventName}</span></span>
                    : <span className="text-white/50">Select Event</span>}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/50" />
            </button>
          ) : (
            <Card className="border-white/10">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg uppercase tracking-wider">Select Event</h3>
                  <button onClick={() => setShowSetup(false)} className="text-white/40 hover:text-white transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {loading && (
                  <div className="flex items-center justify-center gap-2 py-8 text-white/40">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading events...</span>
                  </div>
                )}

                {!loading && events.length > 0 && (
                  <div className="space-y-4">
                    {districtEvents.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-widest text-white/30">District Events</div>
                        {districtEvents.map(ev => (
                          <EventButton key={ev.key} event={ev} selected={ev.key === eventKey} onSelect={handleSelectEvent} />
                        ))}
                      </div>
                    )}
                    {champEvents.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-widest text-white/30">Michigan State Championship</div>
                        {champEvents.map(ev => (
                          <EventButton key={ev.key} event={ev} selected={ev.key === eventKey} onSelect={handleSelectEvent} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!loading && events.length === 0 && loaded && (
                  <div className="text-center py-6 text-white/40 text-sm">No events found.</div>
                )}

                {isConfigured && (
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-sm text-green-400 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> {eventName}
                    </span>
                    <button onClick={handleClearEvent} className="text-xs text-white/40 hover:text-red-400 transition-colors">
                      Clear
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}

function EventButton({ event, selected, onSelect }: { event: TBAEvent; selected: boolean; onSelect: (e: TBAEvent) => void }) {
  return (
    <button
      onClick={() => onSelect(event)}
      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
        selected
          ? "border-primary bg-primary/10 text-white"
          : "border-white/10 bg-black/30 text-white/70 hover:border-white/30 hover:text-white"
      }`}
    >
      <div className="font-semibold text-sm">{event.name}</div>
      <div className="text-xs text-white/40 mt-0.5">{event.city}, {event.state_prov} · {event.start_date}</div>
    </button>
  );
}
