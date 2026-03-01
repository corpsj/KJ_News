"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Video {
  id: number;
  youtube_url: string;
  video_id: string;
  title: string;
  thumbnail_url: string;
  video_type: "long" | "short";
}

/* 롱폼 4개 placeholder + 숏폼 5개 placeholder */
const LONG_PLACEHOLDERS: Video[] = Array.from({ length: 4 }, (_, i) => ({
  id: -(i + 1),
  youtube_url: "",
  video_id: "",
  title: "",
  thumbnail_url: "",
  video_type: "long",
}));

const SHORT_PLACEHOLDERS: Video[] = Array.from({ length: 5 }, (_, i) => ({
  id: -(i + 100),
  youtube_url: "",
  video_id: "",
  title: "",
  thumbnail_url: "",
  video_type: "short",
}));

export default function YoutubeSection() {
  const [longVideos, setLongVideos] = useState<Video[]>(LONG_PLACEHOLDERS);
  const [shortVideos, setShortVideos] = useState<Video[]>(SHORT_PLACEHOLDERS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/youtube")
      .then((r) => r.json())
      .then((data) => {
        const videos: Video[] = data.videos || [];
        const longs = videos.filter((v) => v.video_type === "long");
        const shorts = videos.filter((v) => v.video_type === "short");

        // 실제 영상 + 나머지 placeholder 채우기
        const filledLongs = [...longs.slice(0, 4)];
        while (filledLongs.length < 4) {
          filledLongs.push(LONG_PLACEHOLDERS[filledLongs.length]);
        }
        const filledShorts = [...shorts.slice(0, 5)];
        while (filledShorts.length < 5) {
          filledShorts.push(SHORT_PLACEHOLDERS[filledShorts.length]);
        }

        setLongVideos(filledLongs);
        setShortVideos(filledShorts);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider pb-2 mb-4 border-b-2 border-gray-900 flex items-center gap-2">
        <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
        광전타임즈 Youtube
      </h2>

      {/* 롱폼 4개 - 가로 배열 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {longVideos.map((video) => (
          <LongVideoCard key={video.id} video={video} loaded={loaded} />
        ))}
      </div>

      {/* 숏폼 5개 - 가로 배열 */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {shortVideos.map((video) => (
          <ShortVideoCard key={video.id} video={video} loaded={loaded} />
        ))}
      </div>
    </section>
  );
}

function LongVideoCard({ video, loaded }: { video: Video; loaded: boolean }) {
  const isEmpty = !video.video_id;

  if (!loaded || isEmpty) {
    return (
      <div className="group">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
        </div>
        <p className="mt-1.5 text-[12px] text-gray-400 line-clamp-2 leading-snug">영상을 등록해 주세요</p>
      </div>
    );
  }

  return (
    <a
      href={video.youtube_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
        <Image
          src={video.thumbnail_url}
          alt={video.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {/* 재생 아이콘 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <p className="mt-1.5 text-[12px] font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-gray-500 transition-colors">
        {video.title}
      </p>
    </a>
  );
}

function ShortVideoCard({ video, loaded }: { video: Video; loaded: boolean }) {
  const isEmpty = !video.video_id;

  if (!loaded || isEmpty) {
    return (
      <div className="group">
        <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.546 12 3.546 12 3.546s-7.505 0-9.377.504A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.504 9.376.504 9.376.504s7.505 0 9.377-.504a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400 line-clamp-2 leading-snug">숏폼 등록 대기</p>
      </div>
    );
  }

  return (
    <a
      href={video.youtube_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
        <Image
          src={video.thumbnail_url}
          alt={video.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 33vw, 20vw"
        />
        {/* 재생 아이콘 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
          <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* Shorts 뱃지 */}
        <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
          Shorts
        </div>
      </div>
      <p className="mt-1.5 text-[11px] font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-gray-500 transition-colors">
        {video.title}
      </p>
    </a>
  );
}
