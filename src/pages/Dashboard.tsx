import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Clock, Trash2, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Project {
  id: string;
  name: string;
  rooms: number;
  updatedAt: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Modern Apartment', rooms: 5, updatedAt: '2 hours ago' },
    { id: '2', name: 'Studio Loft', rooms: 2, updatedAt: '1 day ago' },
    { id: '3', name: 'Family Home', rooms: 8, updatedAt: '3 days ago' },
  ]);

  const createProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: `New Project ${projects.length + 1}`,
      rooms: 0,
      updatedAt: 'Just now',
    };
    setProjects([newProject, ...projects]);
    navigate('/editor');
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-display mb-2">My Projects</h1>
            <p className="text-muted-foreground font-sans">Manage your floor plan layouts</p>
          </div>
          <Button onClick={createProject} className="gap-2 gradient-accent text-accent-foreground border-0 font-sans font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create new card */}
          <motion.button
            onClick={createProject}
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-border hover:border-secondary/50 transition-colors min-h-[200px] cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Plus className="w-7 h-7 text-secondary" />
            </div>
            <span className="text-muted-foreground font-sans font-medium">Create New Layout</span>
          </motion.button>

          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="group bg-card rounded-2xl border border-border/40 p-6 hover:shadow-lg hover:border-secondary/30 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <PenTool className="w-5 h-5 text-primary-foreground" />
                </div>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-display mb-1">{project.name}</h3>
              <p className="text-sm text-muted-foreground font-sans mb-4">{project.rooms} rooms</p>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
                  <Clock className="w-3.5 h-3.5" />
                  {project.updatedAt}
                </span>
                <Link to="/editor">
                  <Button variant="outline" size="sm" className="font-sans text-xs">
                    Open
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
