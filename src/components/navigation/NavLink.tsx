"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  prefetch?: boolean;
}

export default function NavLink({
  href,
  children,
  className = "",
  activeClassName = "bg-[#E50046] text-white",
  prefetch = true,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={`${className} ${isActive ? activeClassName : ""}`}>
      {children}
    </Link>
  );
}
