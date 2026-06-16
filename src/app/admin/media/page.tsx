"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/contexts/ToastContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const BUCKET = "press_image";
const FOLDER = "articles"; // editor uploads go here (handleEditorImageUpload)
const PER_PAGE = 60;

interface MediaItem {
  name: string;
  url: string;
  size: number;
  createdAt: string | null;
}

export default function MediaPage() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKET).list(FOLDER, {
      limit: PER_PAGE,
      offset: page * PER_PAGE,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      toast("미디어 목록을 불러오지 못했습니다.", "error");
      setLoading(false);
      return;
    }
    const files = (data || []).filter((f) => f.id !== null); // skip sub-folders
    setHasMore(files.length === PER_PAGE);
    setItems(
      files.map((f) => ({
        name: f.name,
        url: supabase.storage.from(BUCKET).getPublicUrl(`${FOLDER}/${f.name}`).data.publicUrl,
        size: (f.metadata?.size as number) ?? 0,
        createdAt: (f.created_at as string) ?? null,
      }))
    );
    setLoading(false);
  }, [supabase, page, toast]);

  // load() sets a loading flag then fetches; safe data-fetch-on-mount pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.storage.from(BUCKET).remove([`${FOLDER}/${deleteTarget.name}`]);
    toast(error ? "삭제에 실패했습니다." : "이미지를 삭제했습니다.", error ? "error" : "success");
    setDeleteTarget(null);
    if (!error) load();
  }

  function fmtSize(b: number) {
    if (!b) return "-";
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">미디어 라이브러리</h1>
        <span className="text-[12px] text-gray-500">{BUCKET}/{FOLDER}</span>
      </div>
      <p className="text-[12px] text-gray-500">에디터로 업로드된 이미지 목록입니다. 사용하지 않는 이미지를 정리할 수 있습니다. (삭제된 이미지를 참조하던 기사에서는 깨질 수 있으니 주의)</p>

      <div className="admin-card p-4 relative min-h-[200px]">
        {loading && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center"><div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" aria-label="불러오는 중" /></div>}
        {!loading && items.length === 0 ? (
          <p className="py-16 text-center text-[13px] text-gray-500">이미지가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map((it) => (
              <div key={it.name} className="group relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <div className="aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.url} alt={it.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-1.5">
                  <p className="text-[10px] text-gray-500 truncate" title={it.name}>{it.name}</p>
                  <p className="text-[10px] text-gray-400">{fmtSize(it.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(it)}
                  className="absolute top-1 right-1 w-6 h-6 rounded bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  aria-label={`${it.name} 삭제`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <button type="button" className="admin-btn admin-btn-ghost text-[12px] py-1 px-3 disabled:opacity-40" disabled={page <= 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>이전</button>
        <span className="text-[12px] text-gray-500 px-1">{page + 1} 페이지</span>
        <button type="button" className="admin-btn admin-btn-ghost text-[12px] py-1 px-3 disabled:opacity-40" disabled={!hasMore || loading} onClick={() => setPage((p) => p + 1)}>다음</button>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="이미지 삭제"
          message={`"${deleteTarget.name}" 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제" cancelLabel="취소" onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
