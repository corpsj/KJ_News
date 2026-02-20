"use client";

import { useEffect, useRef } from "react";

interface ViewCounterProps {
  articleId: string;
}

export default function ViewCounter({ articleId }: ViewCounterProps) {
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    fetch(`/api/articles/${articleId}/view`, { method: "POST" }).catch((err) => {
      console.warn("[ViewCounter] Failed to record view:", err);
    });
  }, [articleId]);

  return null;
}
