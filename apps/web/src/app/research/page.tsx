'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Search,
  ArrowRight,
  Trash2,
  ExternalLink,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { cn } from '@/lib/utils';

interface HistoryItem {
  query: string;
  timestamp: number;
}

export default function ResearchHistoryPage() {
  const [history, setHistory] = React.useState<HistoryItem[]>([
    { query: 'Best mechanical keyboards for coding', timestamp: Date.now() - 3600000 },
    { query: 'Mirrorless cameras under 1L', timestamp: Date.now() - 86400000 },
    { query: 'Ergonomic mice for small hands', timestamp: Date.now() - 172800000 },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      <Navbar />

      <main className="flex-1 flex flex-col pt-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-4xl mx-auto w-full space-y-16 pb-40">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border/40 pb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <History className="h-4 w-4 text-primary/60" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">
                  User Intelligence
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-medium tracking-tightest leading-none">
                Research <br />
                <span className="text-muted-foreground/30 italic font-serif font-light tracking-tighter">
                  archived.
                </span>
              </h1>
            </div>

            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-destructive transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
              Clear All History
            </button>
          </header>

          {/* History List */}
          <div className="space-y-4">
            {history.length > 0 ? (
              history.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex items-center justify-between p-8 rounded-2xl border border-border/20 hover:border-primary/20 bg-muted/[0.02] hover:bg-muted/[0.05] transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 rounded-xl bg-background border border-border/40 flex items-center justify-center group-hover:border-primary/20 transition-colors">
                      <Search className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/60 transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold tracking-tight uppercase group-hover:text-primary transition-colors">
                        {item.query}
                      </h3>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                        <Clock className="h-3 w-3" />
                        {new Date(item.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="h-10 px-6 rounded-xl border border-border/40 text-[9px] font-black uppercase tracking-widest hover:bg-background transition-colors flex items-center gap-2">
                      Resume <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-40 flex flex-col items-center justify-center gap-6 opacity-20">
                <History className="h-12 w-12 border-2 border-dashed border-border p-3 rounded-full" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">
                  No archived intelligence found
                </p>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="p-8 rounded-2xl border border-border/40 bg-primary/5 flex items-center gap-6">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest leading-relaxed">
              Your research history is stored locally in your browser. ShopPilot does not persist
              your queries on our servers.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
