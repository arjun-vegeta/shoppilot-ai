'use client';

import * as React from 'react';
import { ArrowUp, Loader2, Sparkles, User, MessageSquare, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isThinking?: boolean;
}

export function ChatInterface() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Welcome to ShopPilot. I'm your dedicated research agent. What can I help you find today?",
    },
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: 'assistant', content: '', isThinking: true }]);

    try {
      let fullContent = '';
      await api.chatStream(userMessage, [], (chunk) => {
        fullContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: fullContent, isThinking: false }];
          }
          return prev;
        });
      });
    } catch (error) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: 'I encountered a technical issue. Please try your request again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/[0.02] overflow-hidden relative">
      {/* Agent Header */}
      <div className="px-10 py-8 border-b border-border/40 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold tracking-tight text-foreground/90">
                Your Shopping AI Agent
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border border-border/40 shadow-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-foreground/60">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Thread Area */}
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="px-10 py-12 space-y-16 max-w-2xl mx-auto">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  'flex flex-col gap-6',
                  m.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div className="flex items-center gap-3">
                  {m.role === 'assistant' && <div className="h-1 w-6 bg-primary/20 rounded-full" />}
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
                    {m.role === 'user' ? 'Client Data' : 'Agent Response'}
                  </span>
                  {m.role === 'user' && <div className="h-1 w-6 bg-primary/20 rounded-full" />}
                </div>

                <div
                  className={cn(
                    'max-w-full text-[13px] leading-[1.8] tracking-wide font-medium',
                    m.role === 'user'
                      ? 'text-right text-foreground/70'
                      : 'text-left text-foreground/90 bg-background/50 p-6 rounded-2xl border border-border/20 shadow-xl shadow-primary/[0.02]'
                  )}
                >
                  {m.isThinking && !m.content ? (
                    <div className="flex items-center gap-4 py-1">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/60 animate-pulse">
                        Analyzing Catalog...
                      </span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-10 border-t border-border/40 bg-background/40 backdrop-blur-md">
        <div className="relative group max-w-2xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <Command className="h-4 w-4 text-muted-foreground/20 group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Refine parameters or request details..."
            className="h-14 border-0 bg-transparent pl-8 pr-16 focus-visible:ring-0 text-[13px] placeholder:text-muted-foreground/20 font-semibold transition-all"
            disabled={isLoading}
          />
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="h-10 w-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-20 disabled:scale-100 transition-all shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowUp className="h-5 w-5" />
              )}
            </button>
          </div>
          <div className="absolute -bottom-2 left-0 right-0 h-[1.5px] bg-border/20 group-focus-within:bg-primary/40 transition-all duration-500" />
        </div>
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary/20" />
          <p className="text-[8px] font-black uppercase tracking-[0.5em] text-muted-foreground/20">
            Neural Processing Active
          </p>
          <div className="h-1 w-1 rounded-full bg-primary/20" />
        </div>
      </div>
    </div>
  );
}
