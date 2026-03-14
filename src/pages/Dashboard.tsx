import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Clock, Trash2, PenTool, LogIn, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { ProjectData } from '@/types/editor';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loadProjects, deleteProject } = useAuth();
  const [projects, setProjects] = useState<ProjectData[]>([]);

  useEffect(() => {
    if (user) setProjects(loadProjects());
  }, [user, loadProjects]);

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleOpen = (project: ProjectData) => {
    // Store the project to load in sessionStorage so editor can read it
    sessionStorage.setItem('floorwise_open_project', JSON.stringify(project));
    navigate('/editor');
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center">
          <LayoutGrid className="w-8 h-8 text-secondary" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-display mb-2">My Projects</h1>
          <p className="text-muted-foreground font-sans">Sign in to view and manage your saved floor plans</p>
        </div>
        <div className="flex gap-3">
          <Link to="/login">
            <Button className="gap-2 gradient-accent text-accent-foreground border-0 font-sans">
              <LogIn className="w-4 h-4" /> Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="outline" className="gap-2 font-sans">Create Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-display mb-2">My Projects</h1>
            <p className="text-muted-foreground font-sans">Welcome back, {user.name}</p>
          </div>
          <Button onClick={() => navigate('/editor')} className="gap-2 gradient-accent text-accent-foreground border-0 font-sans font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create new card */}
          <motion.button
            onClick={() => navigate('/editor')}
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-border hover:border-secondary/50 transition-colors min-h-[200px] cursor-pointer"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Plus className="w-7 h-7 text-secondary" />
            </div>
            <span className="text-muted-foreground font-sans font-medium">Create New Layout</span>
          </motion.button>

          {projects.length === 0 && (
            <div className="col-span-full mt-6 text-center text-muted-foreground font-sans">
              <p>No saved projects yet. Create a layout, then click <strong>Save</strong> in the editor toolbar.</p>
            </div>
          )}

          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              className="group bg-card rounded-2xl border border-border/40 p-6 hover:shadow-lg hover:border-secondary/30 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <PenTool className="w-5 h-5 text-primary-foreground" />
                </div>
                <button onClick={() => handleDelete(project.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-display mb-1">{project.name}</h3>
              <p className="text-sm text-muted-foreground font-sans mb-1">
                {project.rooms.length} room{project.rooms.length !== 1 ? 's' : ''} · {project.furniture.length} furniture · {project.doors.length} door{project.doors.length !== 1 ? 's' : ''}
              </p>

              <div className="flex items-center justify-between mt-4">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
                  <Clock className="w-3.5 h-3.5" />
                  {timeAgo(project.updatedAt)}
                </span>
                <Button variant="outline" size="sm" className="font-sans text-xs" onClick={() => handleOpen(project)}>
                  Open
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
