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

  const formatDate = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    if (isToday) {
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">메일</h1>
        {unreadCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {unreadCount} 읽지않음
          </span>
        )}
      </div>

      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTab("inbox")}
          className={`px-4 py-2 text-sm transition-colors ${
            tab === "inbox"
              ? "border-b-2 border-gray-900 text-gray-900 font-semibold"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          수신함
        </button>
        <button
          type="button"
          onClick={() => setTab("compose")}
          className={`px-4 py-2 text-sm transition-colors ${
            tab === "compose"
              ? "border-b-2 border-gray-900 text-gray-900 font-semibold"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          작성
        </button>
      </div>

      {tab === "inbox" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="admin-input flex-1"
              placeholder="이름, 이메일, 제목 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="admin-input sm:w-36"
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value)}
            >
              <option value="">전체</option>
              <option value="unread">읽지않음</option>
              <option value="read">읽음</option>
            </select>
            <button
              type="button"
              className="admin-btn admin-btn-ghost text-sm"
              onClick={() => {
                fetchEmails().catch(console.error);
              }}
              disabled={loading}
            >
              {loading ? "불러오는 중..." : "새로고침"}
            </button>
          </div>

          <div className="admin-card overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                불러오는 중...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                메일이 없습니다.
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-400 text-[11px] uppercase tracking-wider">
                        <th className="p-3">발신자</th>
                        <th className="p-3">제목</th>
                        <th className="p-3 w-20">상태</th>
                        <th className="p-3 w-28">수신일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((email) => (
                        <tr
                          key={email.uid}
                          onClick={() => {
                            openEmail(email).catch(console.error);
                          }}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !email.seen ? "bg-blue-50/40 font-semibold" : ""
                          }`}
                        >
                          <td className="p-3">
                            <div className="font-medium text-gray-900 truncate max-w-[160px]">
                              {email.fromName || email.fromAddress}
                            </div>
                            {email.fromName && (
                              <div className="text-[11px] text-gray-400 truncate max-w-[160px]">
                                {email.fromAddress}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="truncate block max-w-[300px]">
                              {email.subject || "(제목 없음)"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`admin-badge ${
                                email.seen
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {email.seen ? "읽음" : "읽지않음"}
                            </span>
                          </td>
                          <td className="p-3 text-gray-400">
                            {formatDate(email.date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y divide-gray-100">
                  {filtered.map((email) => (
                    <button
                      type="button"
                      key={email.uid}
                      className={`w-full text-left p-4 ${
                        !email.seen ? "bg-blue-50/40" : ""
                      }`}
                      onClick={() => {
                        openEmail(email).catch(console.error);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span
                          className={`text-sm ${
                            !email.seen
                              ? "font-semibold text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {email.fromName || email.fromAddress}
                        </span>
                        <span
                          className={`admin-badge text-[10px] ${
                            email.seen
                              ? "bg-gray-100 text-gray-600"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {email.seen ? "읽음" : "읽지않음"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {email.subject || "(제목 없음)"}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {email.fromAddress} · {formatDate(email.date)}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <p className="text-[12px] text-gray-400 text-right">
            총 {filtered.length}건
          </p>

          {(selectedEmail || detailLoading) && (
            <div
              className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center pt-20 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedEmail(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSelectedEmail(null);
              }}
              role="dialog"
              aria-modal="true"
            >
              <div className="admin-card w-full max-w-2xl max-h-[70vh] overflow-y-auto p-6">
                {detailLoading ? (
                  <div className="p-12 text-center text-gray-400 text-sm">
                    불러오는 중...
                  </div>
                ) : selectedEmail ? (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-900">
                        {selectedEmail.subject || "(제목 없음)"}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setSelectedEmail(null)}
                        className="p-1 text-gray-400 hover:text-gray-700"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <title>닫기</title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                      <span>
                        보낸 사람:{" "}
                        <strong className="text-gray-900">
                          {selectedEmail.fromName || selectedEmail.fromAddress}
                        </strong>
                      </span>
                      {selectedEmail.fromName && (
                        <span>{selectedEmail.fromAddress}</span>
                      )}
                      <span>{formatDate(selectedEmail.date)}</span>
                      {selectedEmail.to.length > 0 && (
                        <span>
                          받는 사람:{" "}
                          {selectedEmail.to
                            .map((t) => t.name || t.address)
                            .join(", ")}
                        </span>
                      )}
                    </div>

                    {selectedEmail.html ? (
                      <div
                        className="text-sm text-gray-700 leading-relaxed mb-6 [&_a]:text-blue-600 [&_a]:underline [&_img]:max-w-full [&_img]:h-auto"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(selectedEmail.html, {
                            ADD_TAGS: ["style"],
                            ADD_ATTR: ["target", "class", "style"],
                          }),
                        }}
                      />
                    ) : (
                      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">
                        {selectedEmail.text}
                      </div>
                    )}

                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-2 mb-4">
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
                      </div>

                      <label
                        htmlFor="reply-text"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        답장
                      </label>
                      <textarea
                        id="reply-text"
                        className="admin-input w-full h-32"
                        placeholder="답장 내용을 입력하세요..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div className="flex justify-end mt-3">
                        <button
                          type="button"
                          className="admin-btn admin-btn-primary text-xs"
                          onClick={() => {
                            handleReply().catch(console.error);
                          }}
                          disabled={!replyText.trim() || replying}
                        >
                          {replying ? "전송 중..." : "답장 보내기"}
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </>
      )}

      {tab === "compose" && (
        <div className="admin-card p-6 max-w-2xl">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="compose-to"
                className="block text-sm font-medium text-gray-700 mb-1"
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
                className="block text-sm font-medium text-gray-700 mb-1"
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
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                내용
              </label>
              <textarea
                id="compose-body"
                className="admin-input w-full h-64"
                placeholder="이메일 내용을 입력하세요..."
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
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
                {composeSending ? "발송 중..." : "발송"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
