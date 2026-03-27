import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, ClipboardList, UserRound, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useEventSettings } from "@/hooks/use-scout-api";

export default function Home() {
  const { data: settings, isLoading } = useEventSettings();

  const links = [
    { href: "/match", title: "Match Scout", icon: Activity, desc: "Record live robot performance during matches", color: "text-primary" },
    { href: "/pit", title: "Pit Scout", icon: ClipboardList, desc: "Log offline robot specifications and photos", color: "text-orange-500" },
    { href: "/humanplayer", title: "Human Player Scout", icon: UserRound, desc: "Track human player shots and performance", color: "text-blue-500" },
  ];

  const eventConfigured = !!settings?.eventKey;

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

        {/* Active Event — read-only, set via database */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full max-w-4xl"
        >
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-white/10 bg-black/30">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 text-white/30 animate-spin shrink-0" />
                <span className="text-sm text-white/30">Loading event…</span>
              </>
            ) : eventConfigured ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                <span className="text-sm">
                  <span className="font-bold uppercase tracking-wider text-white/50 mr-2">Active Event</span>
                  <span className="text-white font-semibold">{settings.eventName}</span>
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />
                <span className="text-sm text-yellow-400">No event set — ask your team lead to configure the event in the database.</span>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
