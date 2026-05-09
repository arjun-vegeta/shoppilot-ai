'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  BarChart3,
  Loader2,
  X,
  ChevronRight,
  ShoppingCart,
  Star,
  Shield,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { ProductDetailsModal } from './ProductDetailsModal';

interface ProductWidgetProps {
  id: string;
  title: string;
  price: number;
  rating: number;
  reviewCount: number;
  image_url?: string;
  category?: string;
  reasoning?: string;
  specs?: Record<string, string>;
  description?: string;
}

export function ProductWidget({
  id,
  title,
  price,
  rating,
  image_url,
  category,
  specs,
  description,
  reviewCount,
}: ProductWidgetProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => setIsModalOpen(true)}
        className="group relative flex flex-col gap-5 cursor-pointer"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted/30 border border-border/5 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:border-primary/10">
          <img
            src={
              image_url ||
              'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop'
            }
            alt={title}
            className="h-full w-full object-cover transition-transform duration-1000 ease-[0.23,1,0.32,1] group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Subtle Research Indicator */}
          <div className="absolute bottom-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            <div className="h-8 px-3 rounded-full bg-background/80 backdrop-blur-md border border-white/10 flex items-center gap-2 shadow-lg">
              <Brain className="h-3.5 w-3.5 text-primary" />
              <span className="text-[9px] font-black uppercase tracking-widest">
                Research depth
              </span>
            </div>
          </div>

          {/* Info Badge */}
          <div className="absolute top-4 left-4">
            <div className="px-2.5 py-1 rounded-full bg-background/60 backdrop-blur-md border border-white/5 flex items-center gap-1.5">
              <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
              <span className="text-[9px] font-black tracking-widest">{rating}</span>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-2.5 px-1">
          <div className="flex items-start justify-between gap-6">
            <h3 className="text-sm font-bold leading-tight tracking-tight text-foreground/80 uppercase group-hover:text-primary transition-colors duration-300">
              {title}
            </h3>
            <span className="text-sm font-black tracking-tighter">₹{price.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 group-hover:text-primary/40 transition-colors duration-300">
              {category || 'Electronics'}
            </span>
            <div className="h-px w-6 bg-border/40" />
            <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">
              Available
            </span>
          </div>
        </div>
      </motion.div>

      <ProductDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={{ id, title, price, rating, image_url, category, specs, description, reviewCount }}
      />
    </>
  );
}
