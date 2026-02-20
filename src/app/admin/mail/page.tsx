"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/ToastContext";
import DOMPurify from "isomorphic-dompurify";

interface Email {
  uid: number;
  fromName: string;
  fromAddress: string;
  subject: string;
  date: string;
  seen: boolean;
  flagged: boolean;
}

interface EmailDetail {
  uid: number;
  fromName: string;
  fromAddress: string;
  to: { name: string; address: string }[];
  subject: string;
  date: string;
  html: string;
  text: string;
  seen: boolean;
}

const AVATAR_COLORS = [
  "bg-gray-300",
  "bg-gray-400",
  "bg-gray-500",
  "bg-stone-400",
  "bg-zinc-400",
  "bg-neutral-400",
];

function getInitials(name: string, address: string): string {
  const src = name || address;
  if (!src) return "?";
  const words = src.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return src[0].toUpperCase();
}

function getAvatarColor(str: string): string {
  let hash = 0;
  const s = str || "x";
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function relativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return "어제";
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminMailPage() {
  const { toast } = useToast();

  const [tab, setTab] = useState<"inbox" | "compose">("inbox");
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRead, setFilterRead] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeSending, setComposeSending] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const [closing, setClosing] = useState(false);

  const panelOpen = !!(selectedEmail || detailLoading);

  const closePanel = useCallback(() => {
    if (closing) return;
    setClosing(true);
  }, [closing]);

  const onPanelAnimEnd = useCallback(() => {
    if (closing) {
      setSelectedEmail(null);
      setDetailLoading(false);
      setClosing(false);
    }
  }, [closing]);

  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [panelOpen, closePanel]);

  useEffect(() => {
    if (panelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [panelOpen]);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mail?limit=50");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEmails(data.emails || []);
    } catch (error) {
      console.error(error);
      toast("메일을 불러오지 못했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const openEmail = useCallback(
    async (email: Email) => {
      setClosing(false);
      setDetailLoading(true);
      setSelectedEmail(null);
      setReplyText("");
      try {
        const res = await fetch(`/api/admin/mail/${email.uid}`);
        if (!res.ok) throw new Error("Failed to fetch detail");
        const detail: EmailDetail = await res.json();
        setSelectedEmail(detail);
        setEmails((prev) =>
          prev.map((e) => (e.uid === email.uid ? { ...e, seen: true } : e))
        );
      } catch (error) {
        console.error(error);
        toast("메일을 불러오지 못했습니다.", "error");
        setDetailLoading(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [toast]
  );

  const toggleSeen = useCallback(
    async (uid: number, seen: boolean) => {
      try {
        const res = await fetch("/api/admin/mail", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, seen }),
        });
        if (!res.ok) throw new Error("Failed to update");
        setEmails((prev) =>
          prev.map((e) => (e.uid === uid ? { ...e, seen } : e))
        );
        if (selectedEmail && selectedEmail.uid === uid) {
          setSelectedEmail((prev) => (prev ? { ...prev, seen } : prev));
        }
      } catch (error) {
        console.error(error);
        toast("상태 변경에 실패했습니다.", "error");
      }
    },
    [selectedEmail, toast]
  );

  const handleReply = useCallback(async () => {
    if (!selectedEmail || !replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedEmail.fromAddress,
          subject: `Re: ${selectedEmail.subject}`,
          html: replyText.replace(/\n/g, "<br>"),
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      toast("답장을 보냈습니다.", "success");
      setReplyText("");
    } catch (error) {
      console.error(error);
      toast("답장 전송에 실패했습니다.", "error");
    } finally {
      setReplying(false);
    }
  }, [selectedEmail, replyText, toast]);

  const handleComposeSend = useCallback(async () => {
    if (!composeTo.trim() || !composeBody.trim()) return;
    setComposeSending(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          html: composeBody.replace(/\n/g, "<br>"),
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      toast("이메일을 발송했습니다.", "success");
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
    } catch (error) {
      console.error(error);
      toast("이메일 발송에 실패했습니다.", "error");
    } finally {
      setComposeSending(false);
    }
  }, [composeTo, composeSubject, composeBody, toast]);

  const resetCompose = useCallback(() => {
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return emails.filter((e) => {
      const matchesSearch =
        !q ||
        e.fromName.toLowerCase().includes(q) ||
        e.fromAddress.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q);
      const matchesFilter =
        !filterRead ||
        (filterRead === "unread" && !e.seen) ||
        (filterRead === "read" && e.seen);
      return matchesSearch && matchesFilter;
    });
  }, [emails, search, filterRead]);

  const unreadCount = useMemo(
    () => emails.filter((e) => !e.seen).length,
    [emails]
  );

  useEffect(() => {
    fetchEmails().catch(console.error);
  }, [fetchEmails]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilterRead("");
  }, []);

  const showSkeleton = loading && emails.length === 0;
  const showEmpty = !loading && filtered.length === 0;
  const showList = !loading && filtered.length > 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">메일</h1>
        {unreadCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-900 text-white font-medium">
            {unreadCount}
          </span>
        )}
      </div>

      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTab("inbox")}
          className={`admin-tab ${tab === "inbox" ? "admin-tab-active" : ""}`}
        >
          수신함
        </button>
        <button
          type="button"
          onClick={() => setTab("compose")}
          className={`admin-tab ${tab === "compose" ? "admin-tab-active" : ""}`}
        >
          작성
        </button>
      </div>

      <div key={tab} className="animate-fade-in">
        {tab === "inbox" && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  className="admin-input pl-9"
                  placeholder="이름, 이메일, 제목 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                {(
                  [
                    ["", "전체"],
                    ["unread", "읽지않음"],
                    ["read", "읽음"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`nf-filter-chip ${filterRead === value ? "active" : ""}`}
                    onClick={() => setFilterRead(value)}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost p-2"
                  onClick={() => {
                    fetchEmails().catch(console.error);
                  }}
                  disabled={loading}
                  aria-label="새로고침"
                >
                  <svg
                    className={`w-4 h-4 ${loading ? "animate-mail-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {showSkeleton && (
              <div className="admin-card overflow-hidden">
                <div className="hidden md:block">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={`sk-d-${String(i)}`}
                      className="flex items-center gap-3 p-3 border-b border-gray-50"
                    >
                      <div className="nf-skeleton w-8 h-8 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="nf-skeleton h-3 w-24 rounded" />
                        <div className="nf-skeleton h-2.5 w-16 rounded mt-1.5" />
                      </div>
                      <div className="nf-skeleton h-3 w-48 rounded flex-shrink-0" />
                      <div className="nf-skeleton h-3 w-14 rounded flex-shrink-0" />
                    </div>
                  ))}
                </div>
                <div className="md:hidden">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`sk-m-${String(i)}`} className="p-4 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="nf-skeleton w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="nf-skeleton h-3.5 w-28 rounded" />
                          <div className="nf-skeleton h-3 w-full rounded mt-2" />
                          <div className="nf-skeleton h-2.5 w-20 rounded mt-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showEmpty && (
              <div className="nf-empty-state">
                <svg
                  className="w-12 h-12 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                <p className="text-sm text-gray-400 mt-3">
                  수신된 메일이 없습니다
                </p>
                {(search || filterRead) && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-ghost text-xs mt-3"
                    onClick={clearFilters}
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            )}

            {showList && (
              <>
                <div className="admin-card overflow-hidden">
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-gray-100 text-left text-gray-400 text-[11px] uppercase tracking-wider">
                          <th className="p-3 w-[200px]">발신자</th>
                          <th className="p-3">제목</th>
                          <th className="p-3 w-24 text-right">수신일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((email, index) => (
                          <tr
                            key={email.uid}
                            onClick={() => {
                              openEmail(email).catch(console.error);
                            }}
                            className={`border-b border-gray-50 hover:bg-gray-50/80 transition-colors cursor-pointer animate-fade-in opacity-0 ${
                              !email.seen ? "bg-gray-50/50" : ""
                            }`}
                            style={{
                              animationDelay: `${index * 0.03}s`,
                            }}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0 ${getAvatarColor(email.fromName || email.fromAddress)}`}
                                >
                                  {getInitials(
                                    email.fromName,
                                    email.fromAddress
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {!email.seen && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />
                                    )}
                                    <span
                                      className={`truncate text-sm ${!email.seen ? "font-semibold text-gray-900" : "text-gray-700"}`}
                                    >
                                      {email.fromName || email.fromAddress}
                                    </span>
                                  </div>
                                  {email.fromName && (
                                    <div className="text-[11px] text-gray-400 truncate">
                                      {email.fromAddress}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`truncate block max-w-[400px] ${!email.seen ? "font-medium text-gray-900" : "text-gray-600"}`}
                              >
                                {email.subject || "(제목 없음)"}
                              </span>
                            </td>
                            <td className="p-3 text-right text-gray-400 text-[12px] whitespace-nowrap">
                              {relativeTime(email.date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden divide-y divide-gray-50">
                    {filtered.map((email, index) => (
                      <button
                        type="button"
                        key={email.uid}
                        className="w-full text-left p-4 flex items-start gap-3 active:bg-gray-50 transition-colors animate-fade-in opacity-0"
                        style={{
                          animationDelay: `${index * 0.03}s`,
                        }}
                        onClick={() => {
                          openEmail(email).catch(console.error);
                        }}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0 mt-0.5 ${getAvatarColor(email.fromName || email.fromAddress)}`}
                        >
                          {getInitials(email.fromName, email.fromAddress)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {!email.seen && (
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />
                              )}
                              <span
                                className={`text-sm truncate ${!email.seen ? "font-semibold text-gray-900" : "text-gray-700"}`}
                              >
                                {email.fromName || email.fromAddress}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400 flex-shrink-0">
                              {relativeTime(email.date)}
                            </span>
                          </div>
                          <p
                            className={`text-sm truncate mt-0.5 ${!email.seen ? "text-gray-900" : "text-gray-500"}`}
                          >
                            {email.subject || "(제목 없음)"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[12px] text-gray-400 text-right mt-2">
                  총 {filtered.length}건
                  {unreadCount > 0 && ` · 읽지않음 ${unreadCount}건`}
                </p>
              </>
            )}

            {panelOpen && (
              <>
                <button
                  type="button"
                  className={`admin-overlay-backdrop ${closing ? "animate-fade-in" : "animate-fade-backdrop"}`}
                  style={closing ? { opacity: 0, animationDirection: "reverse" } : undefined}
                  onClick={closePanel}
                  aria-label="메일 상세 닫기"
                  tabIndex={-1}
                />

                <div
                  className={`hidden md:flex flex-col fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white z-[70] shadow-2xl ${
                    closing
                      ? "animate-slide-out-right"
                      : "animate-slide-in-right"
                  }`}
                  onAnimationEnd={onPanelAnimEnd}
                  role="dialog"
                  aria-modal="true"
                  aria-label="메일 상세"
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <button
                      type="button"
                      onClick={closePanel}
                      className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="닫기"
                    >
                      <svg
                        className="w-5 h-5 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                        />
                      </svg>
                    </button>
                    {selectedEmail && (
                      <button
                        type="button"
                        className="admin-btn admin-btn-ghost text-xs"
                        onClick={() => {
                          toggleSeen(
                            selectedEmail.uid,
                            !selectedEmail.seen
                          ).catch(console.error);
                        }}
                      >
                        {selectedEmail.seen ? "읽지않음 표시" : "읽음 표시"}
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-5">
                    {detailLoading && !selectedEmail ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="nf-skeleton w-10 h-10 rounded-full" />
                          <div>
                            <div className="nf-skeleton h-3.5 w-32 rounded" />
                            <div className="nf-skeleton h-2.5 w-24 rounded mt-1.5" />
                          </div>
                        </div>
                        <div className="nf-skeleton h-5 w-64 rounded mt-4" />
                        <div className="border-t border-gray-100 my-4" />
                        <div className="space-y-2.5">
                          <div className="nf-skeleton h-3 w-full rounded" />
                          <div className="nf-skeleton h-3 w-5/6 rounded" />
                          <div className="nf-skeleton h-3 w-4/6 rounded" />
                          <div className="nf-skeleton h-3 w-full rounded" />
                          <div className="nf-skeleton h-3 w-3/6 rounded" />
                        </div>
                      </div>
                    ) : selectedEmail ? (
                      <>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0 ${getAvatarColor(selectedEmail.fromName || selectedEmail.fromAddress)}`}
                          >
                            {getInitials(
                              selectedEmail.fromName,
                              selectedEmail.fromAddress
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {selectedEmail.fromName ||
                                selectedEmail.fromAddress}
                            </div>
                            {selectedEmail.fromName && (
                              <div className="text-sm text-gray-400">
                                {selectedEmail.fromAddress}
                              </div>
                            )}
                          </div>
                          <span className="text-[12px] text-gray-400 ml-auto flex-shrink-0">
                            {relativeTime(selectedEmail.date)}
                          </span>
                        </div>

                        <h2 className="text-lg font-bold text-gray-900 mt-4">
                          {selectedEmail.subject || "(제목 없음)"}
                        </h2>

                        {selectedEmail.to.length > 0 && (
                          <p className="text-sm text-gray-400 mt-1">
                            받는 사람:{" "}
                            {selectedEmail.to
                              .map((t) => t.name || t.address)
                              .join(", ")}
                          </p>
                        )}

                        <div className="border-t border-gray-100 my-5" />

                        {selectedEmail.html ? (
                          <div
                            className="text-sm text-gray-700 leading-relaxed [&_a]:text-blue-600 [&_a]:underline [&_img]:max-w-full [&_img]:h-auto"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(selectedEmail.html, {
                                ADD_TAGS: ["style"],
                                ADD_ATTR: ["target", "class", "style"],
                              }),
                            }}
                          />
                        ) : (
                          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {selectedEmail.text}
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>

                  {selectedEmail && (
                    <div className="border-t border-gray-100 px-6 py-4 flex-shrink-0 bg-white">
                      <textarea
                        className="admin-input w-full h-24 text-sm resize-none"
                        placeholder="답장 내용을 입력하세요..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          className="admin-btn admin-btn-primary text-xs"
                          onClick={() => {
                            handleReply().catch(console.error);
                          }}
                          disabled={!replyText.trim() || replying}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                            />
                          </svg>
                          {replying ? "전송 중..." : "답장"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`md:hidden fixed inset-x-0 bottom-0 z-[70] ${
                    closing ? "animate-slide-down" : ""
                  }`}
                  onAnimationEnd={onPanelAnimEnd}
                >
                  <div
                    className={`admin-bottom-sheet ${closing ? "" : "animate-slide-up"}`}
                    role="dialog"
                    aria-modal="true"
                    aria-label="메일 상세"
                  >
                    <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={closePanel}
                        className="text-sm text-gray-500"
                        aria-label="닫기"
                      >
                        닫기
                      </button>
                      {selectedEmail && (
                        <button
                          type="button"
                          className="text-sm text-gray-500"
                          onClick={() => {
                            toggleSeen(
                              selectedEmail.uid,
                              !selectedEmail.seen
                            ).catch(console.error);
                          }}
                        >
                          {selectedEmail.seen ? "읽지않음" : "읽음"}
                        </button>
                      )}
                    </div>

                    <div className="px-5 py-4 overflow-y-auto max-h-[70vh]">
                      {detailLoading && !selectedEmail ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="nf-skeleton w-10 h-10 rounded-full" />
                            <div>
                              <div className="nf-skeleton h-3.5 w-32 rounded" />
                              <div className="nf-skeleton h-2.5 w-24 rounded mt-1.5" />
                            </div>
                          </div>
                          <div className="nf-skeleton h-5 w-48 rounded mt-3" />
                          <div className="border-t border-gray-100 my-3" />
                          <div className="space-y-2">
                            <div className="nf-skeleton h-3 w-full rounded" />
                            <div className="nf-skeleton h-3 w-4/5 rounded" />
                            <div className="nf-skeleton h-3 w-3/5 rounded" />
                          </div>
                        </div>
                      ) : selectedEmail ? (
                        <>
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0 ${getAvatarColor(selectedEmail.fromName || selectedEmail.fromAddress)}`}
                            >
                              {getInitials(
                                selectedEmail.fromName,
                                selectedEmail.fromAddress
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {selectedEmail.fromName ||
                                  selectedEmail.fromAddress}
                              </div>
                              <div className="text-[12px] text-gray-400">
                                {relativeTime(selectedEmail.date)}
                              </div>
                            </div>
                          </div>

                          <h2 className="text-base font-bold text-gray-900 mt-3">
                            {selectedEmail.subject || "(제목 없음)"}
                          </h2>

                          <div className="border-t border-gray-100 my-4" />

                          {selectedEmail.html ? (
                            <div
                              className="text-sm text-gray-700 leading-relaxed [&_a]:text-blue-600 [&_a]:underline [&_img]:max-w-full [&_img]:h-auto"
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(
                                  selectedEmail.html,
                                  {
                                    ADD_TAGS: ["style"],
                                    ADD_ATTR: ["target", "class", "style"],
                                  }
                                ),
                              }}
                            />
                          ) : (
                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {selectedEmail.text}
                            </div>
                          )}

                          <div className="border-t border-gray-100 mt-5 pt-4">
                            <textarea
                              className="admin-input w-full h-24 text-sm resize-none"
                              placeholder="답장 내용을 입력하세요..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                type="button"
                                className="admin-btn admin-btn-primary text-xs"
                                onClick={() => {
                                  handleReply().catch(console.error);
                                }}
                                disabled={!replyText.trim() || replying}
                              >
                                {replying ? "전송 중..." : "답장"}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === "compose" && (
          <div className="admin-card p-6 max-w-2xl">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="compose-to"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  받는 사람
                </label>
                <input
                  id="compose-to"
                  className="admin-input w-full"
                  type="email"
                  placeholder="email@example.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="compose-subject"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  제목
                </label>
                <input
                  id="compose-subject"
                  className="admin-input w-full"
                  placeholder="이메일 제목"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="compose-body"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  내용
                </label>
                <textarea
                  id="compose-body"
                  className="admin-input w-full h-64 resize-none"
                  placeholder="이메일 내용을 입력하세요..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                />
                <p className="text-[11px] text-gray-400 text-right mt-1">
                  {composeBody.length}자
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  className="admin-btn admin-btn-ghost text-xs"
                  onClick={resetCompose}
                  disabled={
                    !composeTo && !composeSubject && !composeBody
                  }
                >
                  초기화
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => {
                    handleComposeSend().catch(console.error);
                  }}
                  disabled={
                    !composeTo.trim() || !composeBody.trim() || composeSending
                  }
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                  {composeSending ? "발송 중..." : "발송"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
