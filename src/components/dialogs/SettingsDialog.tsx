import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sun,
    Moon,
    Monitor,
    Copy,
    Check,
    Trash2,
    Loader2,
    Palette,
    Code2,
    FolderCog,
    Settings,
    AlertTriangle,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ToolbarGroup, ToolbarItem } from '@/components/layout/EditorToolbar';
import { useThemeStore } from '@/stores/themeStore';
import { useGraphStore } from '@/stores/graphStore';
import { useDeleteProject } from '@/queries/useProjects';
import { flowToBackend } from '@/lib/transformers';
import { cn } from '@/lib/utils';

interface SettingsDialogProps {
    projectId?: string;
    projectName?: string;
}

type Theme = 'light' | 'dark' | 'system';

interface ThemeButtonProps {
    theme: Theme;
    currentTheme: Theme;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

function ThemeButton({
    theme,
    currentTheme,
    icon,
    label,
    onClick,
}: ThemeButtonProps) {
    const isActive = currentTheme === theme;
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200',
                'hover:border-primary/50 hover:bg-primary/5',
                isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/50 bg-muted/30 text-muted-foreground'
            )}
        >
            <div
                className={cn(
                    'p-3 rounded-lg transition-colors',
                    isActive ? 'bg-primary/20' : 'bg-muted'
                )}
            >
                {icon}
            </div>
            <span className={cn('text-sm font-medium', isActive && 'text-primary')}>
                {label}
            </span>
        </button>
    );
}

interface ConfirmDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectName?: string;
    onConfirm: () => void;
    isDeleting: boolean;
}

function ConfirmDeleteDialog({
    open,
    onOpenChange,
    projectName,
    onConfirm,
    isDeleting,
}: ConfirmDeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <DialogTitle>Delete Project</DialogTitle>
                    </div>
                    <DialogDescription className="text-left">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold text-foreground">{projectName || 'this project'}</span>?
                        This action cannot be undone. All revisions and deployments will be permanently deleted.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Project
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function SettingsDialog({ projectId, projectName }: SettingsDialogProps) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const theme = useThemeStore((s) => s.theme);
    const setTheme = useThemeStore((s) => s.setTheme);
    const deleteProjectMutation = useDeleteProject();

    const handleCopy = useCallback(async () => {
        const nodes = useGraphStore.getState().nodes;
        const edges = useGraphStore.getState().edges;
        const graphState = flowToBackend(nodes, edges);

        await navigator.clipboard.writeText(JSON.stringify(graphState, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, []);

    const handleDelete = useCallback(async () => {
        if (!projectId) return;

        setIsDeleting(true);
        try {
            await deleteProjectMutation.mutateAsync(projectId);
            setShowDeleteConfirm(false);
            setOpen(false);
            navigate('/');
        } catch (err) {
            console.error('Failed to delete project:', err);
            setIsDeleting(false);
        }
    }, [projectId, deleteProjectMutation, navigate]);

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <ToolbarGroup>
                        <ToolbarItem title="Settings">
                            <Settings className="w-6 h-6" />
                        </ToolbarItem>
                    </ToolbarGroup>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Settings
                        </DialogTitle>
                        <DialogDescription>
                            {projectName ? (
                                <>
                                    Configure settings for <span className="font-medium">{projectName}</span>
                                </>
                            ) : (
                                'Configure your project settings'
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="project" className="mt-2 flex-1 flex flex-col">
                        <TabsList className="w-full grid grid-cols-3 shrink-0">
                            <TabsTrigger value="project" className="gap-1.5">
                                <FolderCog className="w-4 h-4" />
                                Project
                            </TabsTrigger>
                            <TabsTrigger value="editor" className="gap-1.5">
                                <Palette className="w-4 h-4" />
                                Editor
                            </TabsTrigger>
                            <TabsTrigger value="developer" className="gap-1.5">
                                <Code2 className="w-4 h-4" />
                                Developer
                            </TabsTrigger>
                        </TabsList>

                        {/* Editor Tab */}
                        <TabsContent value="editor" className="mt-4 space-y-4 min-h-[200px]">
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-sm font-medium mb-1">Theme</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Choose your preferred color scheme
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <ThemeButton
                                        theme="light"
                                        currentTheme={theme}
                                        icon={<Sun className="w-5 h-5" />}
                                        label="Light"
                                        onClick={() => setTheme('light')}
                                    />
                                    <ThemeButton
                                        theme="dark"
                                        currentTheme={theme}
                                        icon={<Moon className="w-5 h-5" />}
                                        label="Dark"
                                        onClick={() => setTheme('dark')}
                                    />
                                    <ThemeButton
                                        theme="system"
                                        currentTheme={theme}
                                        icon={<Monitor className="w-5 h-5" />}
                                        label="System"
                                        onClick={() => setTheme('system')}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Developer Tab */}
                        <TabsContent value="developer" className="mt-4 space-y-4 min-h-[200px]">
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-sm font-medium mb-1">Export Graph</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Copy the current graph state as JSON for debugging
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 h-11"
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span className="text-green-500">Copied to clipboard!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy Graph JSON
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Project Tab */}
                        <TabsContent value="project" className="mt-4 space-y-4 min-h-[200px]">
                            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-destructive">
                                            Danger Zone
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Irreversible actions that require extra caution
                                        </p>
                                    </div>
                                </div>
                                <div className="pl-11">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-2 h-11 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Project
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmDeleteDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                projectName={projectName}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
            />
        </>
    );
}
