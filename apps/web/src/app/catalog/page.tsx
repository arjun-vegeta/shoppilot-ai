'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Sparkles, Filter, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ProductWidget } from '@/components/ProductWidget';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

export default function DiscoveryPage() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeCategory, setActiveCategory] = React.useState('All');

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Use a generic query to get initial catalog
        const response = await api.searchProducts('electronics', 20);
        setProducts(response.results);
      } catch (error) {
        console.error('Failed to fetch catalog:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = ['All', 'Peripherals', 'Audio', 'Laptops', 'Monitors'];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      <Navbar />

      <main className="flex-1 flex flex-col pt-32 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto w-full space-y-16">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border/40 pb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <LayoutGrid className="h-4 w-4 text-primary/60" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">
                  Global Catalog
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-medium tracking-tightest leading-none">
                Discovery <br />
                <span className="text-muted-foreground/30 italic font-serif font-light tracking-tighter">
                  unfiltered.
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-4 bg-muted/20 p-1 rounded-2xl border border-border/40">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                    activeCategory === cat
                      ? 'bg-background text-foreground shadow-sm border border-border/40'
                      : 'text-muted-foreground/40 hover:text-foreground'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </header>

          {/* Grid */}
          {isLoading ? (
            <div className="py-40 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/40 animate-pulse">
                Synchronizing Catalog Data...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-20 pb-40">
              {products.map((product) => (
                <ProductWidget key={product.id} {...product} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
