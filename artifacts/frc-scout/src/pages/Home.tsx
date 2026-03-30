import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, ClipboardList, UserRound, Database } from "lucide-react";

export default function Home() {
  const links = [
    { href: "/match", title: "Match Scout", icon: Activity, desc: "Record live robot performance during matches", color: "text-primary" },
    { href: "/pit", title: "Pit Scout", icon: ClipboardList, desc: "Log robot specifications and capabilities", color: "text-orange-500" },
    { href: "/humanplayer", title: "Human Player Scout", icon: UserRound, desc: "Track human player shots and performance", color: "text-blue-500" },
  ];

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Link href="/data">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-white text-sm font-medium px-4 py-2 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all">
              <Database className="w-4 h-4" />
              Admin / Data
            </button>
          </Link>
        </motion.div>
      </div>
    </Layout>
  );
}
