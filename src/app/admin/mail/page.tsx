"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/contexts/ToastContext";
import { MESSAGE_STATUS_LABELS, type MessageStatus, type ContactMessage } from "@/lib/types";

interface DbContactMessage {
  id: number;
  sender_name: string;
  sender_email: string;
  subject: string;
  body: string;
  status: string;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapMessage(row: DbContactMessage): ContactMessage {
  return {
    id: String(row.id),
    senderName: row.sender_name,
    senderEmail: row.sender_email,
    subject: row.subject,
    body: row.body,
    status: row.status as MessageStatus,
    repliedAt: row.replied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default function AdminMailPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [tab, setTab] = useState<"inbox" | "compose">("inbox");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeSending, setComposeSending] = useState(false);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast("메시지를 불러오지 못했습니다.", "error");
      setLoading(false);
      return;
    }

    setMessages((data as DbContactMessage[]).map(mapMessage));
    setLoading(false);
  }, [supabase, toast]);

  const updateStatus = useCallback(
    async (id: string, status: MessageStatus) => {
      const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
      if (error) {
        console.error(error);
        toast("상태를 변경하지 못했습니다.", "error");
        return false;
      }

      setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, status } : msg)));
      setSelectedMessage((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
      return true;
    },
    [supabase, toast]
  );

  const handleBulkAction = useCallback(
    async (action: MessageStatus) => {
      for (const id of selected) {
        await updateStatus(id, action);
      }
      setSelected(new Set());
    },
    [selected, updateStatus]
  );

  const deleteMessages = useCallback(
    async (ids: string[]) => {
      if (!window.confirm("삭제하시겠습니까?")) return;
      const { error } = await supabase.from("contact_messages").delete().in("id", ids.map(Number));

      if (error) {
        console.error(error);
        toast("삭제하지 못했습니다.", "error");
        return;
      }

      setMessages((prev) => prev.filter((msg) => !ids.includes(msg.id)));
      setSelected(new Set());
      setSelectedMessage((prev) => (prev && ids.includes(prev.id) ? null : prev));
      toast("메시지를 삭제했습니다.", "success");
    },
    [supabase, toast]
  );

  const openMessage = useCallback(
    async (msg: ContactMessage) => {
      setSelectedMessage(msg);
      setReplyText("");
      if (msg.status === "unread") {
        await updateStatus(msg.id, "read");
      }
    },
    [updateStatus]
  );

  const handleReply = useCallback(async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setReplying(true);
    try {
      const emailRes = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedMessage.senderEmail,
          subject: `Re: ${selectedMessage.subject}`,
          html: replyText,
        }),
      });

      if (!emailRes.ok) {
        throw new Error("Failed to send reply");
      }

      const repliedAt = new Date().toISOString();
      const { error } = await supabase
        .from("contact_messages")
        .update({ replied_at: repliedAt })
        .eq("id", selectedMessage.id);

      if (error) {
        throw error;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === selectedMessage.id
            ? { ...msg, repliedAt, status: msg.status === "unread" ? "read" : msg.status }
            : msg
        )
      );
      setSelectedMessage((prev) =>
        prev
          ? {
              ...prev,
              repliedAt,
              status: prev.status === "unread" ? "read" : prev.status,
            }
          : prev
      );
      setReplyText("");
      toast("답장을 보냈습니다.", "success");
    } catch (error) {
      console.error(error);
      toast("답장 전송에 실패했습니다.", "error");
    } finally {
      setReplying(false);
    }
  }, [selectedMessage, replyText, supabase, toast]);

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
          html: composeBody,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send email");
      }

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

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((msg) => msg.id)));
    }
  }

  function statusBadgeClass(status: MessageStatus) {
    if (status === "unread") return "bg-blue-100 text-blue-700";
    if (status === "read") return "bg-gray-100 text-gray-600";
    return "bg-gray-100 text-gray-400";
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return messages.filter((msg) => {
      const matchesSearch =
        !q ||
        msg.senderName.toLowerCase().includes(q) ||
        msg.senderEmail.toLowerCase().includes(q) ||
        msg.subject.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || msg.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [messages, search, statusFilter]);

  const unreadCount = useMemo(
    () => messages.filter((msg) => msg.status === "unread").length,
    [messages]
  );

  useEffect(() => {
    fetchMessages().catch((error) => {
      console.error(error);
      toast("메시지를 불러오지 못했습니다.", "error");
      setLoading(false);
    });
  }, [fetchMessages, toast]);

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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">전체</option>
              <option value="unread">읽지않음</option>
              <option value="read">읽음</option>
              <option value="archived">보관됨</option>
            </select>
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{selected.size}개 선택</span>
              <button
                type="button"
                className="admin-btn admin-btn-ghost text-xs"
                onClick={() => handleBulkAction("read")}
              >
                읽음 처리
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-ghost text-xs"
                onClick={() => handleBulkAction("archived")}
              >
                보관
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-ghost text-xs text-red-500"
                onClick={() => deleteMessages([...selected])}
              >
                삭제
              </button>
            </div>
          )}

          <div className="admin-card overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400 text-sm">불러오는 중...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">메시지가 없습니다.</div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-400 text-[11px] uppercase tracking-wider">
                        <th className="p-3 w-10">
                          <input
                            type="checkbox"
                            checked={filtered.length > 0 && selected.size === filtered.length}
                            onChange={toggleAll}
                          />
                        </th>
                        <th className="p-3">발신자</th>
                        <th className="p-3">제목</th>
                        <th className="p-3 w-20">상태</th>
                        <th className="p-3 w-28">수신일</th>
                        <th className="p-3 w-20" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((msg) => (
                        <tr
                          key={msg.id}
                          onClick={() => {
                            openMessage(msg).catch((error) => {
                              console.error(error);
                            });
                          }}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${msg.status === "unread" ? "bg-blue-50/40 font-semibold" : ""}`}
                        >
                          <td className="p-3" onMouseDown={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selected.has(msg.id)}
                              onChange={() => toggleSelect(msg.id)}
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-gray-900 truncate max-w-[160px]">{msg.senderName}</div>
                            <div className="text-[11px] text-gray-400 truncate max-w-[160px]">
                              {msg.senderEmail}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="truncate block max-w-[300px]">{msg.subject || "(제목 없음)"}</span>
                          </td>
                          <td className="p-3">
                            <span className={`admin-badge ${statusBadgeClass(msg.status)}`}>
                              {MESSAGE_STATUS_LABELS[msg.status]}
                            </span>
                          </td>
                          <td className="p-3 text-gray-400">{formatDate(msg.createdAt)}</td>
                          <td className="p-3" onMouseDown={(e) => e.stopPropagation()}>
                            {msg.status !== "archived" && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateStatus(msg.id, "archived").catch((error) => {
                                    console.error(error);
                                  });
                                }}
                                className="text-gray-400 hover:text-gray-700"
                                title="보관"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                  >
                                    <title>보관</title>
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    d="M20.25 6.375c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 6.375v-1.5c0-.621.504-1.125 1.125-1.125h14.25c.621 0 1.125.504 1.125 1.125v1.5zM5.25 7.5v11.625c0 .621.504 1.125 1.125 1.125h11.25c.621 0 1.125-.504 1.125-1.125V7.5M10.5 11.25h3"
                                  />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y divide-gray-100">
                  {filtered.map((msg) => (
                    <div key={msg.id} className={`relative p-4 ${msg.status === "unread" ? "bg-blue-50/40" : ""}`}>
                      <button
                        type="button"
                        aria-label={`${msg.senderName} 메시지 열기`}
                        className="absolute inset-0 z-10"
                        onClick={() => {
                          openMessage(msg).catch((error) => {
                            console.error(error);
                          });
                        }}
                      />
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span
                          className={`text-sm ${msg.status === "unread" ? "font-semibold text-gray-900" : "text-gray-700"}`}
                        >
                          {msg.senderName}
                        </span>
                        <span className={`admin-badge text-[10px] ${statusBadgeClass(msg.status)}`}>
                          {MESSAGE_STATUS_LABELS[msg.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{msg.subject || "(제목 없음)"}</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {msg.senderEmail} · {formatDate(msg.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <p className="text-[12px] text-gray-400 text-right">총 {filtered.length}건</p>

          {selectedMessage && (
            <div
              className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center pt-20 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedMessage(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSelectedMessage(null);
              }}
              role="dialog"
              aria-modal="true"
            >
              <div className="admin-card w-full max-w-2xl max-h-[70vh] overflow-y-auto p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">{selectedMessage.subject || "(제목 없음)"}</h2>
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                  <span>
                    보낸 사람: <strong className="text-gray-900">{selectedMessage.senderName}</strong>
                  </span>
                  <span>{selectedMessage.senderEmail}</span>
                  <span>{formatDate(selectedMessage.createdAt)}</span>
                  <span className={`admin-badge ${statusBadgeClass(selectedMessage.status)}`}>
                    {MESSAGE_STATUS_LABELS[selectedMessage.status]}
                  </span>
                  {selectedMessage.repliedAt && <span className="text-green-600 text-xs">답장 완료</span>}
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">
                  {selectedMessage.body}
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <label htmlFor="reply-text" className="block text-sm font-medium text-gray-700 mb-2">
                    답장
                  </label>
                  <textarea
                    id="reply-text"
                    className="admin-input w-full h-32"
                    placeholder="답장 내용을 입력하세요..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {selectedMessage.status !== "archived" && (
                        <button
                          type="button"
                          className="admin-btn admin-btn-ghost text-xs"
                          onClick={() => {
                            updateStatus(selectedMessage.id, "archived").catch((error) => {
                              console.error(error);
                            });
                            setSelectedMessage(null);
                          }}
                        >
                          보관
                        </button>
                      )}
                      {selectedMessage.status === "read" && (
                        <button
                          type="button"
                          className="admin-btn admin-btn-ghost text-xs"
                          onClick={() => {
                            updateStatus(selectedMessage.id, "unread").catch((error) => {
                              console.error(error);
                            });
                          }}
                        >
                          읽지않음 표시
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary text-xs"
                      onClick={() => {
                        handleReply().catch((error) => {
                          console.error(error);
                        });
                      }}
                      disabled={!replyText.trim() || replying}
                    >
                      {replying ? "전송 중..." : "답장 보내기"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "compose" && (
        <div className="admin-card p-6 max-w-2xl">
          <div className="space-y-4">
            <div>
              <label htmlFor="compose-to" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="compose-subject" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="compose-body" className="block text-sm font-medium text-gray-700 mb-1">
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
                  handleComposeSend().catch((error) => {
                    console.error(error);
                  });
                }}
                disabled={!composeTo.trim() || !composeBody.trim() || composeSending}
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
