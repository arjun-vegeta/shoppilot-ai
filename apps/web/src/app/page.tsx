'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowRight,
  Loader2,
  Sparkles,
  Home as HomeIcon,
  LayoutGrid,
  Zap,
  ShieldCheck,
  Brain,
  Globe,
  Cpu,
  Database,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ChatInterface } from '@/components/ChatInterface';
import { ProductWidget } from '@/components/ProductWidget';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [hasStarted, setHasStarted] = React.useState(false);
  const [results, setResults] = React.useState<any[]>([]);

  const handleSearch = React.useCallback(
    async (e?: React.FormEvent, overrideQuery?: string) => {
      e?.preventDefault();
      const finalQuery = overrideQuery || query;
      if (!finalQuery.trim() || isSearching) return;

      setIsSearching(true);
      setHasStarted(true);

      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      params.set('q', finalQuery);
      router.push(`/?${params.toString()}`, { scroll: false });

      try {
        const response = await api.searchProducts(finalQuery);
        setResults(response.results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [query, isSearching, searchParams, router]
  );

  // Initial search from URL & Reset handling
  React.useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      if (!hasStarted) {
        setQuery(q);
        handleSearch(undefined, q);
      }
    } else if (hasStarted) {
      // If q is missing and we've started, reset to landing state
      setHasStarted(false);
      setQuery('');
      setResults([]);
    }
  }, [searchParams, hasStarted, handleSearch]);

  const handleReset = () => {
    setHasStarted(false);
    setQuery('');
    setResults([]);
    router.push('/', { scroll: false });
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden selection:bg-primary/10">
      <Navbar />

      <main className="flex-1 flex flex-col pt-16 min-h-0">
        <AnimatePresence mode="wait">
          {!hasStarted ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 flex flex-col items-center overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-24"
            >
              <div className="w-full max-w-5xl space-y-32 py-20">
                {/* Search Header Section */}
                <div className="space-y-16">
                  <div className="space-y-6 text-center">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex justify-center"
                    >
                      <span className="px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                        Next-Gen Shopping Intelligence
                      </span>
                    </motion.div>

                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-5xl md:text-8xl font-medium tracking-tightest leading-[0.95] text-balance"
                    >
                      Search with <br />
                      <span className="text-muted-foreground/30 italic font-serif font-light tracking-tighter mr-3">
                        unrivaled
                      </span>
                      depth.
                    </motion.h1>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative group max-w-2xl mx-auto w-full"
                  >
                    <form onSubmit={handleSearch} className="relative z-10">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2">
                        {isSearching ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <Search className="h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                        )}
                      </div>
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask for recommendations, compare specs, find deals..."
                        className="h-20 border-2 border-border bg-background/80 backdrop-blur-xl pl-16 pr-20 text-xl font-medium rounded-2xl transition-all hover:border-primary/30 group-focus-within:border-primary group-focus-within:ring-8 group-focus-within:ring-primary/5 placeholder:text-muted-foreground/50 shadow-[0_0_50px_-12px_rgba(var(--primary),0.1)]"
                        disabled={isSearching}
                      />
                      <button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-14 w-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                      >
                        <ArrowRight className="h-6 w-6" />
                      </button>
                    </form>
                    {/* Decorative Glow */}
                    <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  </motion.div>

                  <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 pt-4">
                    {[
                      { label: 'High-End Audio', query: 'Best audiophile headphones for mixing' },
                      { label: 'Performance Keyboards', query: 'Premium 75% mechanical keyboards' },
                      { label: 'Travel Optics', query: 'Compact mirrorless cameras for travel' },
                    ].map((item, i) => (
                      <motion.button
                        key={item.label}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.4 }}
                        whileHover={{ opacity: 1, y: -2 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        onClick={() => {
                          setQuery(item.query);
                          setTimeout(() => handleSearch(undefined, item.query), 100);
                        }}
                        className="text-[10px] font-black uppercase tracking-[0.3em] hover:text-primary transition-all flex items-center gap-2 group"
                      >
                        <div className="h-1 w-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
                        {item.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_480px] w-full mx-auto overflow-hidden"
            >
              {/* Results Area */}
              <div className="overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-16">
                <div className="max-w-6xl mx-auto space-y-16">
                  <header className="border-b border-border/40 pb-12 space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">
                        Analysis Pipeline Active
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="relative group w-full max-w-2xl">
                        <form onSubmit={handleSearch} className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            {isSearching ? (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                              <Search className="h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                            )}
                          </div>
                          <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Refine research or search new..."
                            className="h-14 border-2 border-border bg-background/50 backdrop-blur-md pl-14 pr-16 text-2xl font-bold tracking-tight rounded-2xl focus-visible:ring-8 focus-visible:ring-primary/5 focus-visible:border-primary transition-all placeholder:text-muted-foreground/40 shadow-sm"
                            disabled={isSearching}
                          />
                          <button
                            type="submit"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-primary text-primary-foreground rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/10"
                          >
                            <ArrowRight className="h-5 w-5" />
                          </button>
                        </form>
                      </div>

                      <button
                        onClick={handleReset}
                        className="flex items-center gap-3 h-14 px-8 rounded-2xl border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all group shrink-0"
                      >
                        <HomeIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-foreground transition-colors">
                          Reset
                        </span>
                      </button>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-24 pb-32">
                    {results.map((product) => (
                      <ProductWidget key={product.id} {...product} />
                    ))}

                    {results.length === 0 && !isSearching && (
                      <div className="col-span-full py-40 flex flex-col items-center justify-center gap-6 text-center opacity-30">
                        <div className="h-12 w-12 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] italic">
                          No matching intelligence in catalog
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Sidebar */}
              <div className="hidden lg:block border-l border-border/40 h-full overflow-hidden bg-muted/[0.03]">
                <ChatInterface />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!hasStarted && (
        <footer className="py-12 px-12 border-t border-border/40">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center max-w-7xl gap-8">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black uppercase tracking-[0.5em] opacity-40">
                ShopPilot
              </span>
              <div className="h-1 w-1 rounded-full bg-border" />
              <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                2026 Edition
              </span>
            </div>
            <div className="flex gap-12">
              {[{ name: 'GitHub', href: '#' }].map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/20 hover:text-primary transition-all"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <React.Suspense fallback={<div className="h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary/20" /></div>}>
      <HomeContent />
    </React.Suspense>
  );
}
