"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bobashop/ui/components/dropdown-menu";
import { User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-semibold text-ink/60">
        <User className="w-[18px] h-[18px] stroke-[1.8]" />
        <span className="hidden sm:inline">Account</span>
      </div>
    );
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-ink hover:bg-card/50 transition-colors"
      >
        <User className="w-[18px] h-[18px] stroke-[1.8] text-ink lg:hidden" />
        <span className="hidden sm:inline">Log in</span>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold text-ink hover:bg-card/50 transition-colors cursor-pointer"
          />
        }
      >
        <User className="w-[18px] h-[18px] stroke-[1.8] text-brand" />
        <span className="hidden sm:inline">{session.user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card border border-gray-200 shadow-lg rounded-md min-w-[180px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-bold text-ink">
            My Account
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs text-gray-600">
            {session.user.email}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/");
                  },
                },
              });
            }}
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
