"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { authStore } from "@/modules/auth/infrastructure/auth.store";
import { LogOut, ChevronDown } from "lucide-react";

export function AppTopbar() {
  const router = useRouter();
  const user = authStore.getState().user;
  const name = user?.name ?? "User";
  const initial = name.slice(0, 1).toUpperCase();

  async function handleLogout() {
    await authStore.logout();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center border-b bg-background px-4">
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm sm:inline">{name}</span>
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleLogout} variant="destructive">
            <LogOut className="mr-2 size-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
