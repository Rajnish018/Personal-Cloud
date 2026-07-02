import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import { supportApi } from "../../api/supportApi";

const formatDateTime = (value) => {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatTime = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const statusTone = (status = "Open") => {
  const normalized = status.toLowerCase();
  if (normalized === "resolved") {
    return {
      dot: "bg-emerald-500",
      bar: "bg-emerald-500",
      pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
      panel: "border-emerald-100 bg-emerald-50 text-emerald-800",
    };
  }
  if (normalized === "in progress") {
    return {
      dot: "bg-amber-500",
      bar: "bg-amber-500",
      pill: "border-amber-200 bg-amber-50 text-amber-700",
      panel: "border-amber-100 bg-amber-50 text-amber-800",
    };
  }
  return {
    dot: "bg-blue-500",
    bar: "bg-blue-500",
    pill: "border-blue-200 bg-blue-50 text-blue-700",
    panel: "border-blue-100 bg-blue-50 text-blue-800",
  };
};

const LiveTicketChat = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadTicket = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const res = await supportApi.getTicket(id);
        if (isMounted) setTicket(res.data.ticket);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTicket();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

  const ticketId = ticket?.id || ticket?._id || id;
  const isResolved = ticket?.status?.toLowerCase() === "resolved";
  const tone = statusTone(ticket?.status);
  const messages = useMemo(() => ticket?.messages || [], [ticket?.messages]);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleReopenTicket = async () => {
    setIsReopening(true);
    try {
      const res = await supportApi.reopenTicket(ticketId);
      setTicket(res.data.ticket);
    } finally {
      setIsReopening(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || isResolved) return;

    setIsSending(true);
    try {
      const res = await supportApi.sendChatMessage(ticketId, text);
      setTicket(res.data.ticket);
      setMessage("");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
          <Loader2 size={16} className="animate-spin text-[#185FA5]" />
          Loading support thread
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <MessageSquare className="mx-auto text-slate-300" size={36} />
          <h1 className="mt-4 text-lg font-bold text-slate-900">Ticket not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            Open a recent ticket from Help & Support to start or continue a live thread.
          </p>
          <Link
            to="/help-support"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#14508c]"
          >
            <ArrowLeft size={16} />
            Back to support
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/help-support"
            className="inline-flex w-fit items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#185FA5]"
          >
            <ArrowLeft size={16} />
            Help & Support
          </Link>
          <div className="text-xs font-semibold text-slate-400">
            Last update {formatDateTime(ticket.lastMessageAt || ticket.updatedAt)}
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className={`h-1.5 ${tone.bar}`} />
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${tone.pill}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                    {ticket.status}
                  </span>
                  <button
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                    title="Copy ticket ID"
                  >
                    {ticketId}
                    {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                  {ticket.subject}
                </h1>
                <p className="text-sm text-slate-500">
                  Created {formatDateTime(ticket.createdAt)} in {ticket.category || "Other"}
                </p>
              </div>

              <div className={`rounded-lg border px-4 py-3 text-sm ${tone.panel}`}>
                <div className="flex items-start gap-2">
                  {isResolved ? <CheckCircle2 size={17} className="mt-0.5" /> : <Clock size={17} className="mt-0.5" />}
                  <div>
                    <p className="font-bold">{isResolved ? "Resolved" : "Support queue active"}</p>
                    <p className="mt-0.5 text-xs opacity-80">
                      {isResolved
                        ? "Reopen this thread if the problem returns."
                        : "Messages here are saved on the ticket for the support team."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-12">
            <div className="flex min-h-[560px] flex-col border-b border-slate-100 lg:col-span-8 lg:border-b-0 lg:border-r">
              <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
                {messages.map((item) => {
                  const isMe = item.sender === "user";
                  const isSystem = item.sender === "system";

                  if (isSystem) {
                    return (
                      <div key={item._id || item.createdAt} className="flex justify-center">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                          {item.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item._id || item.createdAt}
                      className={`flex max-w-[88%] gap-3 ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isMe ? "bg-[#185FA5]" : "bg-slate-900"} text-white`}>
                        <User size={15} />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className={`px-1 text-xs font-bold text-slate-400 ${isMe ? "text-right" : ""}`}>
                          {item.name} - {formatTime(item.createdAt)}
                        </div>
                        <div className={`rounded-lg px-4 py-3 text-sm leading-relaxed shadow-sm ${isMe ? "bg-[#185FA5] text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
                          {item.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-slate-100 bg-white p-4">
                {isResolved ? (
                  <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-600">
                      This ticket is resolved. Reopen it to continue messaging.
                    </p>
                    <button
                      onClick={handleReopenTicket}
                      disabled={isReopening}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#14508c] disabled:opacity-60"
                    >
                      {isReopening ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      Reopen ticket
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      rows={2}
                      maxLength={4000}
                      placeholder="Type your update..."
                      className="min-h-[48px] flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#185FA5]/40 focus:bg-white focus:ring-4 focus:ring-[#185FA5]/10"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || isSending}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#185FA5] text-white shadow-sm transition hover:bg-[#14508c] disabled:opacity-50"
                      title="Send message"
                    >
                      {isSending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <aside className="space-y-5 bg-white p-5 lg:col-span-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Requester
                </h2>
                <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <User size={16} className="shrink-0 text-slate-400" />
                    <span className="truncate font-bold text-slate-900">{ticket.name}</span>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <Mail size={16} className="shrink-0 text-slate-400" />
                    <span className="truncate font-semibold text-slate-600">{ticket.email}</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Original message
                </h2>
                <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                  {ticket.message}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={17} className="mt-0.5 text-[#185FA5]" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Private support thread</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Only you and authorized Personal Cloud support staff can access this ticket.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LiveTicketChat;
