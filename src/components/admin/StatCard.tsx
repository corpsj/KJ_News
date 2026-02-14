import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  sub?: string;
}

export default function StatCard({ label, value, icon, sub }: StatCardProps) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-[26px] font-bold text-gray-900 leading-tight mt-1 tracking-tight">{value}</p>
          {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );
}
