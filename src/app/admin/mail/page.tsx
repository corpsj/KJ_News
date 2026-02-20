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

const PER_PAGE = 20;

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

function formatFullDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMailPage() {
  const { toast } = useToast();

  const [tab, setTab] = useState<"inbox" | "compose">("inbox");
  const [view, setView] = useState<"list" | "detail">("list");
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRead, setFilterRead] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEmails, setTotalEmails] = useState(0);

  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeSending, setComposeSending] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchEmails = useCallback(
    async (p: number = page) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/mail?page=${p}&limit=${PER_PAGE}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setEmails(data.emails || []);
        setTotalPages(data.totalPages || 0);
        setTotalEmails(data.total || 0);
        setPage(data.page || 1);
      } catch (error) {
        console.error(error);
        toast("메일을 불러오지 못했습니다.", "error");
      } finally {
        setLoading(false);
      }
    },
    [page, toast]
  );

  const goToPage = useCallback(
    (p: number) => {
      if (p < 1 || p > totalPages || p === page) return;
      fetchEmails(p).catch(console.error);
    },
    [fetchEmails, page, totalPages]
  );

  const openEmail = useCallback(
    async (email: Email) => {
      setDetailLoading(true);
      setSelectedEmail(null);
      setReplyText("");
      setView("detail");
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
        setView("list");
      } finally {
        setDetailLoading(false);
      }
    },
    [toast]
  );

  const backToList = useCallback(() => {
    setView("list");
    setSelectedEmail(null);
    setReplyText("");
  }, []);

  useEffect(() => {
    if (view === "list") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") backToList();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [view, backToList]);

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
    fetchEmails(1).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilterRead("");
  }, []);

  const showSkeleton = loading && emails.length === 0;
  const showEmpty = !loading && filtered.length === 0;
  const showList = !loading && filtered.length > 0;

  const paginationRange = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);
    for (let i = left; i <= right; i++) {
      range.push(i);
    }
    return range;
  }, [page, totalPages]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">메일</h1>
          {unreadCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-900 text-white font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        {totalEmails > 0 && view === "list" && tab === "inbox" && (
          <span className="text-[12px] text-gray-400">
            전체 {totalEmails.toLocaleString()}건
          </span>
        )}
      </div>

      {view === "list" && (
        <>
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
              새 메일 작성
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
                        fetchEmails(page).catch(console.error);
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
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={`sk-${String(i)}`}
                        className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50"
                      >
                        <div className="nf-skeleton w-1.5 h-1.5 rounded-full flex-shrink-0" />
                        <div className="w-[180px] flex-shrink-0">
                          <div className="nf-skeleton h-3.5 w-24 rounded" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="nf-skeleton h-3.5 w-64 rounded" />
                        </div>
                        <div className="nf-skeleton h-3 w-16 rounded flex-shrink-0" />
                      </div>
                    ))}
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
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="border-b border-gray-100 text-left text-gray-400 text-[11px] uppercase tracking-wider">
                            <th className="pl-5 pr-2 py-3 w-8" />
                            <th className="px-3 py-3 w-[180px]">발신자</th>
                            <th className="px-3 py-3">제목</th>
                            <th className="px-5 py-3 w-28 text-right">수신일</th>
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
                                !email.seen ? "bg-white" : ""
                              }`}
                              style={{
                                animationDelay: `${index * 0.02}s`,
                              }}
                            >
                              <td className="pl-5 pr-2 py-3">
                                {!email.seen ? (
                                  <span className="block w-2 h-2 rounded-full bg-blue-500" />
                                ) : (
                                  <span className="block w-2 h-2" />
                                )}
                              </td>
                              <td className="px-3 py-3">
                                <div className="min-w-0">
                                  <span
                                    className={`block truncate text-sm leading-tight ${!email.seen ? "font-semibold text-gray-900" : "text-gray-600"}`}
                                  >
                                    {email.fromName || email.fromAddress}
                                  </span>
                                  {email.fromName && (
                                    <span className="block text-[11px] text-gray-400 truncate mt-0.5 leading-tight">
                                      {email.fromAddress}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={`block truncate ${!email.seen ? "font-medium text-gray-900" : "text-gray-500"}`}
                                >
                                  {email.subject || "(제목 없음)"}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right text-gray-400 text-[12px] whitespace-nowrap">
                                {relativeTime(email.date)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-1 mt-5">
                        <button
                          type="button"
                          className="admin-btn admin-btn-ghost p-2 text-xs"
                          onClick={() => goToPage(page - 1)}
                          disabled={page <= 1}
                          aria-label="이전 페이지"
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
                              d="M15.75 19.5L8.25 12l7.5-7.5"
                            />
                          </svg>
                        </button>

                        {paginationRange[0] > 1 && (
                          <>
                            <button
                              type="button"
                              className="admin-btn admin-btn-ghost px-3 py-1.5 text-xs"
                              onClick={() => goToPage(1)}
                            >
                              1
                            </button>
                            {paginationRange[0] > 2 && (
                              <span className="px-1 text-gray-400 text-xs">
                                ···
                              </span>
                            )}
                          </>
                        )}

                        {paginationRange.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={`admin-btn px-3 py-1.5 text-xs ${
                              p === page
                                ? "admin-btn-primary"
                                : "admin-btn-ghost"
                            }`}
                            onClick={() => goToPage(p)}
                          >
                            {p}
                          </button>
                        ))}

                        {paginationRange[paginationRange.length - 1] <
                          totalPages && (
                          <>
                            {paginationRange[paginationRange.length - 1] <
                              totalPages - 1 && (
                              <span className="px-1 text-gray-400 text-xs">
                                ···
                              </span>
                            )}
                            <button
                              type="button"
                              className="admin-btn admin-btn-ghost px-3 py-1.5 text-xs"
                              onClick={() => goToPage(totalPages)}
                            >
                              {totalPages}
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          className="admin-btn admin-btn-ghost p-2 text-xs"
                          onClick={() => goToPage(page + 1)}
                          disabled={page >= totalPages}
                          aria-label="다음 페이지"
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
                              d="M8.25 4.5l7.5 7.5-7.5 7.5"
                            />
                          </svg>
                        </button>
                      </div>
                    )}

                    <p className="text-[12px] text-gray-400 text-center mt-2">
                      {(page - 1) * PER_PAGE + 1}–
                      {Math.min(page * PER_PAGE, totalEmails)}건 / 전체{" "}
                      {totalEmails.toLocaleString()}건
                      {unreadCount > 0 && ` · 읽지않음 ${unreadCount}건`}
                    </p>
                  </>
                )}
              </>
            )}

            {tab === "compose" && (
              <div className="admin-card overflow-hidden max-w-3xl">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-sm font-semibold text-gray-900">
                    새 메일 작성
                  </h2>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    jebo@kjtimes.co.kr에서 발송됩니다
                  </p>
                </div>

                <div className="divide-y divide-gray-100">
                  <div className="flex items-center px-6">
                    <label
                      htmlFor="compose-to"
                      className="text-sm text-gray-400 w-20 flex-shrink-0 py-3"
                    >
                      받는 사람
                    </label>
                    <input
                      id="compose-to"
                      className="flex-1 py-3 text-sm text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
                      type="email"
                      placeholder="수신자 이메일 주소"
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center px-6">
                    <label
                      htmlFor="compose-subject"
                      className="text-sm text-gray-400 w-20 flex-shrink-0 py-3"
                    >
                      제목
                    </label>
                    <input
                      id="compose-subject"
                      className="flex-1 py-3 text-sm text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
                      placeholder="메일 제목을 입력하세요"
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                    />
                  </div>
                </div>

                <div className="px-6 pt-4 pb-2">
                  <textarea
                    id="compose-body"
                    className="w-full h-72 text-sm text-gray-700 leading-relaxed outline-none resize-none placeholder:text-gray-300"
                    placeholder="메일 내용을 입력하세요..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                  <div className="flex items-center gap-3">
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
                    <span className="text-[11px] text-gray-400">
                      {composeBody.length}자
                    </span>
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                      handleComposeSend().catch(console.error);
                    }}
                    disabled={
                      !composeTo.trim() ||
                      !composeBody.trim() ||
                      composeSending
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
            )}
          </div>
        </>
      )}

      {view === "detail" && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              className="admin-btn admin-btn-ghost text-xs"
              onClick={backToList}
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
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              목록으로
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
                {selectedEmail.seen ? "읽지않음으로 표시" : "읽음으로 표시"}
              </button>
            )}
          </div>

          {detailLoading && !selectedEmail ? (
            <div className="admin-card p-6 md:p-8">
              <div className="space-y-4">
                <div className="nf-skeleton h-6 w-80 rounded" />
                <div className="flex items-center gap-2 mt-3">
                  <div className="nf-skeleton h-3.5 w-32 rounded" />
                  <div className="nf-skeleton h-3 w-48 rounded" />
                </div>
                <div className="border-t border-gray-100 my-5" />
                <div className="space-y-2.5">
                  <div className="nf-skeleton h-3 w-full rounded" />
                  <div className="nf-skeleton h-3 w-5/6 rounded" />
                  <div className="nf-skeleton h-3 w-4/6 rounded" />
                  <div className="nf-skeleton h-3 w-full rounded" />
                  <div className="nf-skeleton h-3 w-3/6 rounded" />
                </div>
              </div>
            </div>
          ) : selectedEmail ? (
            <>
              <div className="admin-card overflow-hidden">
                <div className="px-6 py-5 md:px-8 md:py-6 border-b border-gray-100">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-snug">
                    {selectedEmail.subject || "(제목 없음)"}
                  </h2>
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedEmail.fromName || selectedEmail.fromAddress}
                      </span>
                      {selectedEmail.fromName && (
                        <span className="text-sm text-gray-400 ml-2">
                          &lt;{selectedEmail.fromAddress}&gt;
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] text-gray-400 flex-shrink-0">
                      {formatFullDate(selectedEmail.date)}
                    </span>
                  </div>
                  {selectedEmail.to.length > 0 && (
                    <p className="text-[12px] text-gray-400 mt-1.5">
                      받는 사람:{" "}
                      {selectedEmail.to
                        .map((t) =>
                          t.name
                            ? `${t.name} <${t.address}>`
                            : t.address
                        )
                        .join(", ")}
                    </p>
                  )}
                </div>

                <div className="px-6 py-6 md:px-8 md:py-8">
                  {selectedEmail.html ? (
                    <div
                      className="text-sm text-gray-700 leading-relaxed [&_a]:text-blue-600 [&_a]:underline [&_img]:max-w-full [&_img]:h-auto break-words"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(selectedEmail.html, {
                          ADD_TAGS: ["style"],
                          ADD_ATTR: ["target", "class", "style"],
                        }),
                      }}
                    />
                  ) : (
                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
                      {selectedEmail.text}
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-card overflow-hidden mt-4">
                <div className="px-6 py-4 md:px-8 border-b border-gray-100 bg-gray-50/30">
                  <span className="text-sm font-semibold text-gray-700">
                    답장
                  </span>
                  <span className="text-[12px] text-gray-400 ml-2">
                    {selectedEmail.fromName || selectedEmail.fromAddress}
                    에게
                  </span>
                </div>
                <div className="px-6 py-4 md:px-8">
                  <textarea
                    className="w-full h-32 text-sm text-gray-700 leading-relaxed outline-none resize-none placeholder:text-gray-300"
                    placeholder="답장 내용을 입력하세요..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                </div>
                <div className="flex justify-end px-6 py-3 md:px-8 border-t border-gray-100 bg-gray-50/30">
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
                    {replying ? "전송 중..." : "답장 보내기"}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
