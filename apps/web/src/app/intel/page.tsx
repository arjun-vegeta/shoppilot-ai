'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, ShieldCheck, Globe, Cpu, BarChart3, Database, Search } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function IntelligencePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      <Navbar />

      <main className="flex-1 flex flex-col pt-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-5xl mx-auto w-full space-y-32 pb-40">
          {/* Hero Section */}
          <div className="space-y-8 text-center max-w-3xl mx-auto">
            <div className="flex justify-center">
              <span className="px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                System Capabilities
              </span>
            </div>
            <h1 className="text-5xl md:text-8xl font-medium tracking-tightest leading-[0.95]">
              Neural <br />
              <span className="text-muted-foreground/30 italic font-serif font-light tracking-tighter mr-2">
                Architectures.
              </span>
            </h1>
            <p className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.5em] leading-relaxed max-w-xl mx-auto">
              ShopPilot leverages decentralized web scraping and generative models to provide the
              world&apos;s most accurate commerce intelligence.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { label: 'Neural Precision', value: '99.2%', icon: Brain },
              { label: 'Live Extraction', value: '< 2.4s', icon: Zap },
              { label: 'Data Integrity', value: 'Verified', icon: ShieldCheck },
              { label: 'Global Reach', value: 'Unlimited', icon: Globe },
            ].map((metric) => (
              <div
                key={metric.label}
                className="flex flex-col gap-4 p-8 rounded-2xl border border-border/40 bg-muted/[0.03]"
              >
                <metric.icon className="h-5 w-5 text-primary/40" />
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
                    {metric.label}
                  </span>
                  <p className="text-2xl font-black tracking-tighter">{metric.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Deep Feature Sections */}
          <div className="space-y-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
              <div className="space-y-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-3xl font-bold tracking-tight uppercase">Agentic Reasoning</h3>
                <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                  Our agent doesn&apos;t just search; it thinks. By autonomously selecting tools
                  like sentiment analysis and price cross-referencing, it builds a complete picture
                  of your potential purchase.
                </p>
              </div>
              <div className="aspect-video bg-muted/20 rounded-2xl border border-border/40 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                <div className="absolute inset-8 border border-white/5 rounded-lg flex flex-col justify-between p-6 bg-background/20 backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                      Agent Thinking...
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-1 w-full bg-border/40 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                        className="h-full w-1/3 bg-primary"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                      Cross-referencing Amazon vs Flipkart Specs
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
              <div className="aspect-video bg-muted/20 rounded-2xl border border-border/40 order-2 md:order-1 relative flex items-center justify-center p-12">
                <div className="grid grid-cols-4 gap-4 w-full">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [20, 60, 20] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.1 }}
                      className="h-8 bg-primary/20 rounded-sm"
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-6 order-1 md:order-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-3xl font-bold tracking-tight uppercase">
                  Hybrid Vector Retrieval
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                  Combining traditional full-text search with modern vector embeddings allows
                  ShopPilot to understand intent. It doesn&apos;t just find words; it finds
                  concepts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
