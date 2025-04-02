import { ReactNode } from "react";

type StatsCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export default function StatsCard({
  title,
  children,
  className = "",
}: StatsCardProps) {
  return (
    <div
      className={`bg-white  rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 ">
        <h3 className="text-lg font-semibold text-gray-900 ">
          {title}
        </h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
