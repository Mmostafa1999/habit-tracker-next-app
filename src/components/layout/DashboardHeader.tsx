"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { Cog6ToothIcon, MoonIcon, SunIcon } from "@heroicons/react/24/outline";

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white  py-4 px-6 shadow-md z-10">
      <div className="flex items-center justify-between">
        <div>
          {title ? (
            <h1 className="text-gray-700  text-lg font-medium">
              {title}
            </h1>
          ) : (
            <h1 className="text-gray-700  text-lg font-medium">
              Hi There,
              <span className="text-[#E50046] font-bold">
                {user?.displayName || "Mahmoud"}
              </span>
            </h1>
          )}
          {subtitle ? (
            <p className="text-sm text-gray-500 ">
              {subtitle}
            </p>
          ) : (
            <p className="text-sm text-gray-500 ">
              Welcome back to your habits
            </p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search..."
              className="py-2 pl-10 pr-4 rounded-lg bg-gray-100  text-gray-900  border border-gray-200  focus:outline-none focus:ring-2 focus:ring-[#E50046] focus:border-transparent transition-colors w-64"
            />
          </div>

         

          <button
            className="p-2 rounded-full text-gray-600  hover:text-gray-900  hover:bg-gray-100  transition-colors"
            aria-label="Settings">
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
