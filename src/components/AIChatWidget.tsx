import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChatMessage, Room, FurnitureItem, DoorItem } from '@/types/editor';

interface Props {
  rooms?: Room[];
  furniture?: FurnitureItem[];
  doors?: DoorItem[];
}

function buildLayoutContext(rooms: Room[], furniture: FurnitureItem[], doors: DoorItem[]): string {
  if (rooms.length === 0 && furniture.length === 0) return '';
  const lines: string[] = [];
  lines.push(`Rooms (${rooms.length}):`);
  rooms.forEach(r => {
    const w = (r.width / 50 * 1.5).toFixed(1);
    const h = (r.height / 50 * 1.5).toFixed(1);
    lines.push(` - ${r.name}: ${w}m × ${h}m`);
  });
  lines.push(`Doors: ${doors.length}`);
  lines.push(`Furniture (${furniture.length}):`);
  furniture.forEach(f => lines.push(` - ${f.label} at (${f.x}, ${f.y})`));
  return lines.join('\n');
}

export default function AIChatWidget({ rooms = [], furniture = [], doors = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', content: "I'm FloorWise AI — your spatial design assistant. Ask me about your layout, furniture placement, circulation, or any design question!" },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response since we don't have the Supabase edge function
    const context = buildLayoutContext(rooms, furniture, doors);
    setTimeout(() => {
      const responses = [
        "Great question! Based on your layout, I'd recommend ensuring at least 0.9m clearance between furniture for comfortable circulation.",
        "Consider adding storage solutions like wardrobes or shelving to improve your storage score.",
        "The furniture density looks good. Make sure doors have at least 0.6m clearance for safe access.",
        "For natural light optimization, keep tall furniture away from windows and room edges.",
        context ? `I can see your layout has ${rooms.length} rooms and ${furniture.length} furniture items. Let me help you optimize it!` : "Start by adding some rooms to your canvas, then I can provide specific layout recommendations.",
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  }, [input, isTyping, rooms, furniture, doors]);

  return (
    <>
      {!isOpen && (
        <motion.button onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-accent shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <MessageCircle className="w-6 h-6 text-accent-foreground" />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div className="fixed bottom-6 right-6 z-50 w-80 h-[28rem] bg-card rounded-2xl border border-border/50 shadow-2xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}>
            {/* Header */}
            <div className="gradient-primary px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-display text-primary-foreground">FloorWise AI</p>
                <p className="text-xs text-primary-foreground/60 font-sans">Powered by AI</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} className="text-primary-foreground hover:bg-primary-foreground/10">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm font-sans ${msg.role === 'user' ? 'gradient-accent text-accent-foreground' : 'bg-muted text-foreground'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && !messages.some(m => m.id.startsWith('stream-')) && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-2 rounded-xl text-sm text-muted-foreground animate-pulse font-sans">Thinking...</div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50 flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about your layout..."
                className="flex-1 px-3 py-2 bg-muted rounded-xl text-sm font-sans outline-none focus:ring-2 focus:ring-secondary/50" />
              <Button size="icon" onClick={sendMessage} className="gradient-accent text-accent-foreground border-0 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
