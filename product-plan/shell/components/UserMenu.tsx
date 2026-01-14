'use client'

import { useState, useRef, useEffect } from 'react'
import { LogOut, User, ChevronDown } from 'lucide-react'

export interface UserMenuProps {
  /** User information */
  user?: {
    name: string
    avatarUrl?: string
  }
  /** Callback when user logs out */
  onLogout?: () => void
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get initials from name
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  if (!user) {
    return (
      <button
        className="
          flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-black
          bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300
          shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
          hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
          active:translate-y-2 active:shadow-none
          transition-all duration-100 font-body text-sm
        "
      >
        Sign In
      </button>
    )
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-black
          bg-white dark:bg-stone-800
          shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]
          hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
          active:translate-y-2 active:shadow-none
          transition-all duration-100
        "
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-8 h-8 rounded-full border-2 border-black object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full border-2 border-black bg-sky-100 dark:bg-sky-900 flex items-center justify-center">
            <span className="font-heading text-xs font-bold text-sky-700 dark:text-sky-300">
              {initials}
            </span>
          </div>
        )}

        {/* Name (hidden on small screens) */}
        <span className="hidden sm:block font-body text-sm text-stone-700 dark:text-stone-300 max-w-[100px] truncate">
          {user.name}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border-2 border-black bg-white dark:bg-stone-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] overflow-hidden z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b-2 border-black dark:border-stone-700">
            <p className="font-heading font-bold text-stone-900 dark:text-stone-50 truncate">
              {user.name}
            </p>
            <p className="font-body text-xs text-stone-500 dark:text-stone-400">
              Milwaukee Citizen
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false)
                // Profile action could go here
              }}
              className="w-full flex items-center gap-3 px-4 py-2 font-body text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => {
                setIsOpen(false)
                onLogout?.()
              }}
              className="w-full flex items-center gap-3 px-4 py-2 font-body text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
