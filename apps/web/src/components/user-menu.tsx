"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useClerk, SignInButton } from "@clerk/nextjs";
import { LogOut, User, ChevronDown } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/**
 * UserMenu component with Clerk authentication integration.
 * Displays user avatar and dropdown menu with sign out functionality.
 * Follows RetroUI neobrutalist styling with 2px borders and 4px shadows.
 */
export function UserMenu() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch by waiting for client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut({ redirectUrl: "/" });
  };

  // Get user initials from name
  const getInitials = () => {
    if (!user) return "?";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();

    if (!fullName) {
      return user.emailAddresses[0]?.emailAddress?.charAt(0)?.toUpperCase() || "?";
    }

    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get display name
  const getDisplayName = () => {
    if (!user) return "";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.emailAddresses[0]?.emailAddress || "User";
  };

  // Loading state - show skeleton until mounted and loaded to prevent hydration mismatch
  if (!isMounted || !isLoaded) {
    return (
      <div className="w-10 h-10 border-2 border-black dark:border-white bg-stone-100 dark:bg-stone-800 animate-pulse" />
    );
  }

  // Not signed in - show sign in button
  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="outline" size="sm">
          Sign In
        </Button>
      </SignInButton>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border-2 border-black dark:border-white bg-white dark:bg-stone-800 shadow-[4px_4px_0_black] dark:shadow-[4px_4px_0_white] hover:shadow-[2px_2px_0_black] dark:hover:shadow-[2px_2px_0_white] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-100"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.imageUrl} alt={getDisplayName()} />
          <AvatarFallback className="text-xs font-bold bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
            {getInitials()}
          </AvatarFallback>
        </Avatar>

        {/* Name (hidden on small screens) */}
        <span className="hidden sm:block text-sm text-stone-700 dark:text-stone-300 max-w-[100px] truncate">
          {getDisplayName()}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 border-2 border-black dark:border-white bg-white dark:bg-stone-800 shadow-[4px_4px_0_black] dark:shadow-[4px_4px_0_white] overflow-hidden z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b-2 border-black dark:border-stone-600">
            <p className="font-head font-bold text-stone-900 dark:text-stone-50 truncate text-sm">
              {getDisplayName()}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
              {user.emailAddresses[0]?.emailAddress}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                // Profile action - could open Clerk user profile modal
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
