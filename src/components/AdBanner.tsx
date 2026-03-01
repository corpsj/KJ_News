"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface BannerData {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  slot: string;
}

type BannersMap = Record<string, BannerData[]>;

let cachedBanners: BannersMap | null = null;
let fetchPromise: Promise<BannersMap> | null = null;

function fetchBanners(): Promise<BannersMap> {
  if (cachedBanners) return Promise.resolve(cachedBanners);
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/banners")
    .then((r) => r.json())
    .then((data) => {
      cachedBanners = data.banners || {};
      return cachedBanners!;
    })
    .catch(() => {
      cachedBanners = {};
      return cachedBanners;
    });

  return fetchPromise;
}

interface AdBannerProps {
  slot: "main_news_below" | "category_below" | "latest_below";
}

export default function AdBanner({ slot }: AdBannerProps) {
  const [banners, setBanners] = useState<BannerData[]>([]);

  useEffect(() => {
    fetchBanners().then((map) => {
      setBanners(map[slot] || []);
    });
  }, [slot]);

  if (banners.length === 0) return null;

  const banner = banners[0];

  const img = (
    <div className="relative w-full aspect-[6/1] rounded-lg overflow-hidden bg-gray-100">
      <Image
        src={banner.image_url}
        alt={banner.title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 1280px"
      />
    </div>
  );

  if (banner.link_url) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-3">
        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition-opacity">
          {img}
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      {img}
    </div>
  );
}
