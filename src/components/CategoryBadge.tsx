import type { Category } from "@/lib/types";

export default function CategoryBadge({
  category,
  size = "sm",
}: {
  category: Category;
  size?: "sm" | "md";
}) {
  const sizeClasses =
    size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-block font-semibold bg-gray-900 text-white rounded ${sizeClasses}`}
    >
      {category.name}
    </span>
  );
}
