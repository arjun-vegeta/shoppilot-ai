'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Brain,
  BarChart3,
  Loader2,
  Star,
  ShieldCheck,
  ShoppingCart,
  ChevronRight,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    price: number;
    rating: number;
    reviewCount: number;
    image_url?: string;
    category?: string;
    specs?: Record<string, string>;
    description?: string;
  };
}

export function ProductDetailsModal({ isOpen, onClose, product }: ProductDetailsModalProps) {
  const [researchType, setResearchType] = React.useState<'sentiment' | 'compare' | null>(null);
  const [researchData, setResearchData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSentiment = async () => {
    setResearchType('sentiment');
    setIsLoading(true);
    try {
      const response = await api.getSentiment(product.title);
      setResearchData(response.sentiment);
    } catch (error) {
      setResearchData('Failed to analyze sentiment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompare = async () => {
    setResearchType('compare');
    setIsLoading(true);
    try {
      const response = await api.compareProduct(product.title);
      setResearchData(response.comparison);
    } catch (error) {
      setResearchData([{ error: 'Failed to fetch comparison data.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setResearchType(null);
      setResearchData(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl max-h-[90vh] bg-background border border-border/50 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-30 h-10 w-10 rounded-full bg-muted/20 hover:bg-muted/40 flex items-center justify-center transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left: Product Media */}
            <div className="md:w-1/2 bg-muted/20 flex items-center justify-center p-12 border-r border-border/20">
              <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={
                    product.image_url ||
                    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'
                  }
                  alt={product.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-6 left-6">
                  <div className="px-4 py-2 rounded-full bg-background/60 backdrop-blur-md border border-white/5 flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-[11px] font-black tracking-widest">{product.rating}</span>
                    <span className="text-[11px] font-bold text-muted-foreground/60">
                      ({product.reviewCount} Reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Info & Intelligence */}
            <div className="md:w-1/2 flex flex-col overflow-hidden bg-background">
              {/* Product Header & Info */}
              <div className="p-12 overflow-y-auto custom-scrollbar space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                      {product.category || 'Electronics'}
                    </span>
                    <div className="flex items-center gap-2 opacity-30">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        Verified Seller
                      </span>
                    </div>
                  </div>

                  <h2 className="text-4xl font-bold tracking-tight uppercase leading-[1.1]">
                    {product.title}
                  </h2>

                  <div className="flex items-baseline gap-4">
                    <span className="text-3xl font-black tracking-tighter">
                      ₹{product.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      Inclusive of all taxes
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground font-medium max-w-md">
                    {product.description ||
                      'Premium performance meets sophisticated design. This product is engineered for users who demand the absolute best in reliability and aesthetic depth.'}
                  </p>
                </div>

                {/* Specs Grid */}
                {product.specs && Object.keys(product.specs).length > 0 && (
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                      Technical Specifications
                    </h4>
                    <div className="grid grid-cols-2 gap-8">
                      {Object.entries(product.specs).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">
                            {key}
                          </span>
                          <p className="text-xs font-black uppercase tracking-tight text-foreground/80">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Research Actions */}
                <div className="space-y-8 pt-8 border-t border-border/40">
                  <div className="flex items-center gap-3">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                      Neural Deep Dive
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleSentiment}
                      className={cn(
                        'h-14 rounded-2xl border flex items-center justify-center gap-3 transition-all',
                        researchType === 'sentiment'
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                          : 'border-border/40 hover:border-primary/40 bg-muted/[0.02] hover:bg-primary/5'
                      )}
                    >
                      <Brain className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                        Sentiment Analysis
                      </span>
                    </button>
                    <button
                      onClick={handleCompare}
                      className={cn(
                        'h-14 rounded-2xl border flex items-center justify-center gap-3 transition-all',
                        researchType === 'compare'
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                          : 'border-border/40 hover:border-primary/40 bg-muted/[0.02] hover:bg-primary/5'
                      )}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                        Price Comparison
                      </span>
                    </button>
                  </div>

                  {/* Research Results Area */}
                  <AnimatePresence mode="wait">
                    {researchType && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-8 rounded-2xl border border-primary/10 bg-primary/[0.02] space-y-6"
                      >
                        {isLoading ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/40 animate-pulse">
                              Scanning Global Data...
                            </p>
                          </div>
                        ) : (
                          <div className="animate-in fade-in duration-700">
                            {researchType === 'sentiment' ? (
                              <div className="text-xs leading-relaxed text-foreground/80 font-medium whitespace-pre-wrap">
                                {researchData}
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {Array.isArray(researchData) &&
                                  researchData.map((item: any, i: number) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between p-4 bg-background border border-border/20 rounded-xl hover:border-primary/20 transition-all"
                                    >
                                      <div className="space-y-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                                          {item.platform}
                                        </span>
                                        <p className="text-sm font-black">{item.price || 'N/A'}</p>
                                      </div>
                                      <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-10 px-4 rounded-lg bg-muted/20 hover:bg-muted/40 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all"
                                      >
                                        Store <ArrowUpRight className="h-3 w-3" />
                                      </a>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sticky Footer Action */}
              <div className="mt-auto p-12 pt-0">
                <a
                  href={`https://www.amazon.in/s?k=${encodeURIComponent(product.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-16 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/20"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Buy this product
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
