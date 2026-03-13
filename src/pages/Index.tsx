import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, Ruler, LayoutGrid, Shield, Download, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-floorplan.jpg';

const features = [
  { icon: LayoutGrid, title: 'Drag & Drop Editor', desc: 'Intuitive 2D floor plan editor with furniture library, room presets, and precision grid snapping.' },
  { icon: Brain, title: 'AI Layout Analysis', desc: 'Evaluate circulation, space efficiency, storage adequacy, and overall livability with smart scoring.' },
  { icon: Ruler, title: 'Smart Dimensions', desc: 'Manual input, image upload detection, or camera capture — three ways to get your room dimensions.' },
  { icon: Shield, title: 'Decision Validation', desc: 'Risk alerts for tight spaces, congestion zones, and long-term usability concerns before you commit.' },
  { icon: MessageCircle, title: 'AI Design Assistant', desc: 'Persistent AI chat that explains scores, suggests improvements, and guides you step by step.' },
  { icon: Download, title: 'Export & Share', desc: 'Download PDF reports with AI-generated evaluation, or share interactive layouts via link.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export default function Index() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center gradient-hero overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Modern interior design"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary font-sans text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              AI-Powered Spatial Validation
            </span>

            <h1 className="text-5xl lg:text-7xl font-display leading-tight mb-6">
              Design Smart.
              <br />
              <span className="text-gradient">Live Better.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg mb-8 font-sans leading-relaxed">
              FloorWise is not just a drawing tool — it's an intelligent spatial validation
              platform that evaluates usability, detects inefficiencies, and optimizes livability.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/editor">
                <Button size="lg" className="gap-2 gradient-accent text-accent-foreground border-0 font-sans font-semibold px-8 hover:opacity-90 transition-opacity">
                  Start Designing
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="font-sans font-semibold px-8">
                  View Projects
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/30">
              <img
                src={heroImage}
                alt="Beautiful interior design showcase"
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-display mb-4">More Than a Drawing Tool</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans">
              A digital functional architect that prioritizes function over decoration.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="group p-8 rounded-2xl bg-card border border-border/40 hover:border-secondary/40 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <h3 className="text-xl font-display mb-3">{f.title}</h3>
                  <p className="text-muted-foreground font-sans leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 gradient-primary">
        <motion.div
          className="max-w-4xl mx-auto px-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl lg:text-5xl font-display text-primary-foreground mb-6">
            Ready to validate your layout?
          </h2>
          <p className="text-lg text-primary-foreground/70 mb-10 font-sans max-w-2xl mx-auto">
            Stop guessing and start designing with confidence. FloorWise helps you make informed spatial decisions.
          </p>
          <Link to="/editor">
            <Button size="lg" className="gradient-accent text-accent-foreground border-0 font-sans font-semibold px-10 text-lg hover:opacity-90 transition-opacity">
              Create Your First Layout
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-muted-foreground font-sans text-sm">
            © {new Date().getFullYear()} FloorWise — Design Smarter, Live Better
          </p>
        </div>
      </footer>
    </div>
  );
}
