"use client";

import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const { user, logOut } = useAuth();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="bg-white  shadow-sm backdrop-blur-md bg-opacity-90  sticky top-0 z-10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center group">
              <svg
                className="h-7 w-7 sm:h-8 sm:w-8 text-[#E50046]  mr-2"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.24 16.83L11 13.69V7H12.5V12.87L17 15.5L16.24 16.83Z"
                  fill="currentColor"></path>
              </svg>
              <span className="font-bold text-lg sm:text-xl text-[#E50046] ">
                HabitTracker
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <nav className="flex space-x-1 sm:space-x-2">
              {!user ? (
                <>
                  <Link
                    href="/auth/login"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive("/auth/login")
                        ? "text-primary bg-primary/5 "
                        : "text-gray-700  hover:text-primary  hover:bg-primary/5 "
                      }`}>
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive("/auth/signup")
                        ? "text-primary bg-primary/5 "
                        : "text-gray-700  hover:text-primary  hover:bg-primary/5 "
                      }`}>
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive("/dashboard")
                        ? "text-primary bg-primary/5 "
                        : "text-gray-700  hover:text-primary  hover:bg-primary/5 "
                      }`}>
                    Dashboard
                  </Link>
                  <button
                    onClick={() => logOut()}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary  hover:bg-primary/5  transition-all duration-200">
                    Log out
                  </button>
                </>
              )}
            </nav>


          </div>
        </div>
      </div>
    </header>
  );
}
