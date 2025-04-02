"use client";

import NavLink from "@/components/navigation/NavLink";
import { useAuth } from "@/lib/context/AuthContext";
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  TrophyIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { memo, useCallback } from "react";

const navItems = [
  {
    name: "All Habits",
    href: "/dashboard",
    icon: ClipboardDocumentListIcon,
  },
  {
    name: "Statistics",
    href: "/dashboard/statistics",
    icon: ChartBarIcon,
  },

  {
    name: "Achievements",
    href: "/dashboard/achievements",
    icon: TrophyIcon,
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: UserIcon,
  },
  {
    name: "AI Assistant",
    href: "/dashboard/assistant",
    icon: SparklesIcon,
  },
];

const Sidebar = () => {
  const { logOut } = useAuth();

  const handleLogout = useCallback(() => {
    logOut();
  }, [logOut]);

  return (
    <div className="h-screen w-64 bg-white  flex flex-col shadow-md z-10">
      <div className="p-6">
        <Link href="/dashboard" prefetch={true} className="flex items-center">
          <svg
            className="h-8 w-8 text-[#E50046] mr-2"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.24 16.83L11 13.69V7H12.5V12.87L17 15.5L16.24 16.83Z"
              fill="currentColor"></path>
          </svg>
          <span className="font-bold text-xl text-[#E50046]">
            Habit Tracker
          </span>
        </Link>
      </div>
      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-1">
          {navItems.map(item => (
            <li key={item.name}>
              <NavLink
                href={item.href}
                prefetch={true}
                className="flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-700   "
                activeClassName="bg-[#E50046] text-white hover:bg-[#E50046] ">
                <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-700  hover:bg-gray-100  transition-colors">
          <span className="mr-3 text-xl">👋</span>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default memo(Sidebar);
