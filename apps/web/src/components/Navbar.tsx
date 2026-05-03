'use client';

import Link from 'next/link';
import { ModeToggle } from '@/components/ModeToggle';
import { motion } from 'framer-motion';

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto h-full flex items-center justify-between max-w-7xl px-6 md:px-12">
        <Link href="/" className="group flex items-center gap-2 transition-all">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-1.5">
            <span className="text-sm font-black uppercase tracking-[0.5em] text-foreground leading-none">
              ShopPilot
            </span>
            <div className="h-1 w-1 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
          </motion.div>
        </Link>

        <div className="flex items-center gap-10">
          <nav className="hidden md:flex items-center gap-10">
            {[
              { name: 'Discovery', href: '/catalog' },
              { name: 'Intelligence', href: '/intel' },
              { name: 'Research', href: '/research' },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60 hover:text-foreground transition-all duration-300 relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>
          <div className="flex items-center pl-4 border-l border-border/40">
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
