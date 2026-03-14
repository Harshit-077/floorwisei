import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background pt-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header strip */}
          <div className="gradient-accent px-8 py-6">
            <h1 className="font-display text-2xl text-accent-foreground">Welcome back</h1>
            <p className="text-sm text-accent-foreground/70 font-sans mt-1">Sign in to continue to FloorWise</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-sans">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-sans font-medium text-muted-foreground uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-muted rounded-xl text-sm font-sans outline-none focus:ring-2 focus:ring-ring border border-border/50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans font-medium text-muted-foreground uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-muted rounded-xl text-sm font-sans outline-none focus:ring-2 focus:ring-ring border border-border/50 transition-all pr-11"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full gradient-accent text-accent-foreground border-0 font-sans gap-2 py-6">
              <LogIn className="w-4 h-4" />
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>

            <p className="text-center text-sm font-sans text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-secondary font-medium hover:underline">Create one free</Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
