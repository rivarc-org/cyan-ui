import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateProjectDialog } from '@/components/dialogs/CreateProjectDialog';
import {
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
  ToolbarLabel,
  ToolbarSeparator,
} from '@/components/layout/EditorToolbar';
import { UserMenu } from '@/components/layout/UserMenu';
import { useProjects } from '@/queries/useProjects';
import type { ProjectResponse } from '@/api/types';

export function Dashboard() {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Use React Query for projects
  const { data: projects = [], isLoading } = useProjects();

  const handleProjectCreated = (project: ProjectResponse) => {
    setIsCreateOpen(false);
    navigate(`/project/${project.id}`);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <Toolbar className="mb-8 justify-between w-full">
        <ToolbarGroup>
          <ToolbarLabel className="font-bold text-xl">CyanStack</ToolbarLabel>
          <ToolbarSeparator />
          <ToolbarLabel className="text-muted-foreground font-normal text-sm hidden sm:flex">
            Visual orchestration made simple
          </ToolbarLabel>
        </ToolbarGroup>

        <div className="flex items-center gap-2">
          <ToolbarGroup>
            <ToolbarItem onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </ToolbarItem>
          </ToolbarGroup>

          <UserMenu />
        </div>
      </Toolbar>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-600 mb-2">
            No projects yet
          </h2>
          <p className="text-muted-foreground mb-6">
            Create your first project to get started
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg truncate text-card-foreground">
                  {project.name}
                </CardTitle>
                <CardDescription className="mt-1 text-muted-foreground">
                  Created{' '}
                  {new Date(project.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}
