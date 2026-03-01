"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

interface Video {
  id: number;
  youtube_url: string;
  video_id: string;
  title: string;
  thumbnail_url: string;
  video_type: "long" | "short";
  sort_order: number;
  is_active: boolean;
}

export default function YoutubePage() {
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [typeInput, setTypeInput] = useState<"long" | "short">("long");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Video | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/youtube");
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  async function handleAdd() {
    if (!urlInput.trim()) { toast("YouTube URL을 입력하세요.", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: urlInput, video_type: typeInput }),
      });
      if (res.ok) {
        toast("영상이 추가되었습니다.", "success");
        setUrlInput("");
        setShowForm(false);
        fetchVideos();
      } else {
        const data = await res.json();
        toast(data.error || "추가 실패", "error");
      }
    } catch {
      toast("네트워크 오류", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/youtube/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        toast("영상이 삭제되었습니다.", "success");
        fetchVideos();
      } else {
        toast("삭제 실패", "error");
      }
    } catch {
      toast("네트워크 오류", "error");
    }
    setDeleteTarget(null);
  }

  async function toggleActive(video: Video) {
    try {
      await fetch(`/api/admin/youtube/${video.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...video, is_active: !video.is_active }),
      });
      fetchVideos();
    } catch { /* ignore */ }
  }

  async function changeType(video: Video, newType: "long" | "short") {
    try {
      await fetch(`/api/admin/youtube/${video.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...video, video_type: newType }),
      });
      fetchVideos();
    } catch { /* ignore */ }
  }

  const longVideos = videos.filter((v) => v.video_type === "long");
  const shortVideos = videos.filter((v) => v.video_type === "short");
  const filteredVideos = filterType === "all" ? videos : filterType === "long" ? longVideos : shortVideos;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">YouTube 영상 관리</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            메인페이지에 표시되는 YouTube 영상을 관리합니다 (롱폼 {longVideos.length}개 / 숏폼 {shortVideos.length}개)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="admin-btn admin-btn-primary text-[13px] px-4 py-2"
        >
          + 영상 추가
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div className="admin-card p-6">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">새 영상 추가</h2>
          <p className="text-[12px] text-gray-400 mb-4">YouTube URL을 입력하면 제목과 썸네일이 자동으로 가져와집니다.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">YouTube URL *</label>
              <input
                className="admin-input"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... 또는 https://youtube.com/shorts/..."
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">영상 유형</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="vtype" checked={typeInput === "long"} onChange={() => setTypeInput("long")} className="w-4 h-4" />
                  <span className="text-[13px] text-gray-700">롱폼 (가로)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="vtype" checked={typeInput === "short"} onChange={() => setTypeInput("short")} className="w-4 h-4" />
                  <span className="text-[13px] text-gray-700">숏폼 (세로)</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-6 pt-5 border-t border-gray-100">
            <button type="button" onClick={() => { setShowForm(false); setUrlInput(""); }} className="admin-btn admin-btn-ghost text-[13px] px-4 py-2">취소</button>
            <button type="button" onClick={handleAdd} disabled={saving} className="admin-btn admin-btn-primary text-[13px] px-4 py-2">
              {saving ? "추가 중..." : "추가"}
            </button>
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setFilterType("all")} className={`text-[12px] px-3 py-1.5 rounded-full transition-colors ${filterType === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>전체 ({videos.length})</button>
        <button type="button" onClick={() => setFilterType("long")} className={`text-[12px] px-3 py-1.5 rounded-full transition-colors ${filterType === "long" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>롱폼 ({longVideos.length})</button>
        <button type="button" onClick={() => setFilterType("short")} className={`text-[12px] px-3 py-1.5 rounded-full transition-colors ${filterType === "short" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>숏폼 ({shortVideos.length})</button>
      </div>

      {/* 영상 목록 */}
      {loading ? (
        <div className="admin-card p-6">
          {[1, 2, 3].map((k) => <div key={k} className="nf-skeleton h-20 w-full rounded-lg mb-3" />)}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="admin-card p-8 text-center">
          <p className="text-[13px] text-gray-400">등록된 영상이 없습니다</p>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">영상</th>
                <th className="text-center py-2.5 px-4 font-semibold text-gray-600 w-20">유형</th>
                <th className="text-center py-2.5 px-4 font-semibold text-gray-600 w-20">상태</th>
                <th className="text-right py-2.5 px-4 font-semibold text-gray-600 w-32">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredVideos.map((video) => (
                <tr key={video.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 rounded overflow-hidden border border-gray-200 ${video.video_type === "short" ? "w-10 h-16" : "w-20 h-12"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 line-clamp-1">{video.title || "제목 없음"}</div>
                        <span className="text-[11px] text-gray-400 line-clamp-1">{video.youtube_url}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <select
                      value={video.video_type}
                      onChange={(e) => changeType(video, e.target.value as "long" | "short")}
                      className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 bg-white"
                    >
                      <option value="long">롱폼</option>
                      <option value="short">숏폼</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button type="button" onClick={() => toggleActive(video)} className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${video.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {video.is_active ? "활성" : "비활성"}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a href={video.youtube_url} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-ghost text-[11px] py-1 px-2">보기</a>
                      <button type="button" onClick={() => setDeleteTarget(video)} className="admin-btn admin-btn-ghost text-[11px] py-1 px-2 text-red-500 hover:text-red-700">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="영상 삭제"
          message={`"${deleteTarget.title || "이 영상"}"을 삭제하시겠습니까?`}
          confirmLabel="삭제"
          cancelLabel="취소"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
