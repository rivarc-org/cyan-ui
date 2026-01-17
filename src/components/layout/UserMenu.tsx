import { LogOut, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ToolbarGroup,
    ToolbarItem,
} from '@/components/layout/EditorToolbar';
import { useAuthStore } from '@/stores/authStore';

export function UserMenu() {
    const { user, logout } = useAuthStore();

    if (!user) return null;

    return (
        <ToolbarGroup>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <ToolbarItem>
                        <User className="w-4 h-4" />
                    </ToolbarItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </ToolbarGroup>
    );
}
