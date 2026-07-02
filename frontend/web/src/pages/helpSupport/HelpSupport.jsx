import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  FolderOpen,
  HelpCircle,
  Loader2,
  Mail,
  MessageCircle,
  Search,
  Send,
  Shield,
  Sparkles,
  Ticket,
  User,
  Zap,
} from "lucide-react";
import { supportApi } from "../../api/supportApi";
import { useAuth } from "../../context/AuthContext";

const categories = [
  { id: "all", label: "All Topics", icon: HelpCircle },
  { id: "getting-started", label: "Getting Started", icon: Zap },
  { id: "files", label: "Files & Folders", icon: FolderOpen },
  { id: "sharing", label: "Sharing", icon: MessageCircle },
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: Sparkles },
];

const faqs = [
  {
    id: 1,
    category: "getting-started",
    question: "How do I upload files?",
    answer:
      "Open My Drive, use the upload control, and choose your files. You can also drag files into supported drive views.",
    popular: true,
  },
  {
    id: 2,
    category: "files",
    question: "Can I restore deleted files?",
    answer:
      "Deleted files move to Trash first. Restore them from Trash before they are permanently removed.",
    popular: true,
  },
  {
    id: 3,
    category: "sharing",
    question: "How do shared links work?",
    answer:
      "Create a share link from a file action menu. You can copy the link and revoke access later from the shared item.",
    popular: true,
  },
  {
    id: 4,
    category: "account",
    question: "Where can I update my profile?",
    answer:
      "Open Profile or Settings from the sidebar to manage account details, security settings, and preferences.",
    popular: false,
  },
  {
    id: 5,
    category: "security",
    question: "Is my account protected?",
    answer:
      "Your session uses authenticated API requests, protected routes, and server-side ownership checks for private drive resources.",
    popular: true,
  },
  {
    id: 6,
    category: "billing",
    question: "Where can I manage billing?",
    answer:
      "Open Billing from the sidebar to review your plan and upgrade options.",
    popular: false,
  },
];

const supportTypes = [
  { value: "Files", label: "Files" },
  { value: "Sharing", label: "Sharing" },
  { value: "Storage", label: "Storage" },
  { value: "Account", label: "Account" },
  { value: "Billing", label: "Billing" },
  { value: "Security", label: "Security" },
  { value: "Other", label: "Other" },
];

const priorities = [
  { value: "Normal", label: "Normal" },
  { value: "High", label: "High" },
  { value: "Low", label: "Low" },
];

const formatDate = (value) => {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const getTicketId = (ticket) => ticket?.id || ticket?._id;

const getStatusClasses = (status = "Open") => {
  const normalized = status.toLowerCase();
  if (normalized === "resolved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "in progress") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
};

const HelpSupport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    category: "Files",
    priority: "Normal",
    subject: "",
    message: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadTickets = async () => {
      try {
        const res = await supportApi.getTickets();
        if (isMounted) setTickets(res.data.tickets || []);
      } finally {
        if (isMounted) setTicketsLoading(false);
      }
    };

    loadTickets();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const popularFaqs = faqs.filter((faq) => faq.popular);

  const scrollToContact = () => {
    document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const copyTicketId = async (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const updateField = (field, value) => {
    setContactForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormSubmitting(true);
    try {
      const payload = {
        ...contactForm,
        name: contactForm.name || user?.name || "",
        email: contactForm.email || user?.email || "",
      };
      const res = await supportApi.createTicket(payload);
      const ticket = res.data.ticket;
      setTickets((current) => [ticket, ...current]);
      setCreatedTicket(ticket);
      setContactForm((current) => ({
        ...current,
        category: "Files",
        priority: "Normal",
        subject: "",
        message: "",
      }));
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-12">
            <div className="border-b border-slate-100 p-6 sm:p-8 lg:col-span-7 lg:border-b-0 lg:border-r">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#185FA5]/20 bg-[#185FA5]/5 px-3 py-1 text-xs font-bold text-[#185FA5]">
                <Sparkles size={13} />
                Personal Cloud Support
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Get help without leaving your workspace
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Search answers, create a ticket, and continue the conversation from a saved live support thread.
              </p>
              <div className="mt-6 max-w-xl">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search help articles..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#185FA5]/40 focus:bg-white focus:ring-4 focus:ring-[#185FA5]/10"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-3 sm:p-8 lg:col-span-5 lg:grid-cols-1">
              <QuickAction
                icon={MessageCircle}
                title="Live threads"
                description="Open any recent ticket and continue from the saved conversation."
                action="View tickets"
                onClick={() => document.getElementById("tickets-section")?.scrollIntoView({ behavior: "smooth" })}
              />
              <QuickAction
                icon={Mail}
                title="Create ticket"
                description="Send issue details with category and priority context."
                action="Contact support"
                onClick={scrollToContact}
              />
              <QuickAction
                icon={BookOpen}
                title="Knowledge base"
                description="Browse focused answers for common drive workflows."
                action="Browse FAQs"
                onClick={() => document.getElementById("faq-section")?.scrollIntoView({ behavior: "smooth" })}
              />
            </div>
          </div>
        </section>

        <section id="tickets-section" className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#185FA5]/10 text-[#185FA5]">
                <Ticket size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-950">Your Support Tickets</h2>
                <p className="text-xs text-slate-500">Track status and open live ticket conversations.</p>
              </div>
            </div>
            <button
              onClick={scrollToContact}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#185FA5] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#14508c]"
            >
              <Send size={15} />
              New ticket
            </button>
          </div>

          {ticketsLoading ? (
            <div className="flex items-center justify-center gap-3 p-8 text-sm font-semibold text-slate-500">
              <Loader2 size={16} className="animate-spin text-[#185FA5]" />
              Loading tickets
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center">
              <Ticket className="mx-auto text-slate-300" size={34} />
              <p className="mt-3 text-sm font-bold text-slate-900">No tickets yet</p>
              <p className="mt-1 text-sm text-slate-500">Create your first support ticket below.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tickets.map((ticket) => {
                const ticketId = getTicketId(ticket);
                return (
                  <Link
                    key={ticketId}
                    to={`/chat/${ticketId}`}
                    className="group flex flex-col gap-4 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-slate-950">{ticket.subject}</h3>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getStatusClasses(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
                        <span>{ticket.category || "Other"}</span>
                        <span>Created {formatDate(ticket.createdAt)}</span>
                        <button
                          onClick={(event) => copyTicketId(event, ticketId)}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600 transition hover:bg-slate-200"
                        >
                          {ticketId}
                          {copiedId === ticketId ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-[#185FA5]">
                      Open live chat
                      <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section id="faq-section" className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="sticky top-24 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <p className="px-3 pb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                Topics
              </p>
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${isActive ? "bg-[#185FA5]/10 text-[#185FA5]" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Icon size={16} />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-9">
            {!searchQuery && activeCategory === "all" && (
              <FaqPanel
                title="Popular Questions"
                subtitle="Frequently used support answers"
                faqs={popularFaqs}
                expandedFaq={expandedFaq}
                setExpandedFaq={setExpandedFaq}
              />
            )}

            <FaqPanel
              title={categories.find((category) => category.id === activeCategory)?.label || "All Topics"}
              subtitle={`${filteredFaqs.length} answer${filteredFaqs.length === 1 ? "" : "s"} found`}
              faqs={filteredFaqs}
              expandedFaq={expandedFaq}
              setExpandedFaq={setExpandedFaq}
              emptyAction={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
            />
          </div>
        </section>

        <section id="contact-section" className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#185FA5]/10 text-[#185FA5]">
                <Send size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-950">Contact Support</h2>
                <p className="text-xs text-slate-500">Create a ticket and continue in live chat once it is submitted.</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {createdTicket ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={30} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-950">Ticket created</h3>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Your support thread is ready. You can open live chat now or create another ticket.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => navigate(`/chat/${getTicketId(createdTicket)}`)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#185FA5] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#14508c]"
                  >
                    <MessageCircle size={16} />
                    Open live chat
                  </button>
                  <button
                    onClick={() => setCreatedTicket(null)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Create another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Name" icon={User} value={contactForm.name || user?.name || ""} onChange={(value) => updateField("name", value)} required />
                  <FormField label="Email" icon={Mail} type="email" value={contactForm.email || user?.email || ""} onChange={(value) => updateField("email", value)} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField label="Category" value={contactForm.category} options={supportTypes} onChange={(value) => updateField("category", value)} />
                  <SelectField label="Priority" value={contactForm.priority} options={priorities} onChange={(value) => updateField("priority", value)} />
                </div>
                <FormField label="Subject" icon={HelpCircle} value={contactForm.subject} onChange={(value) => updateField("subject", value)} required />
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <MessageCircle size={14} />
                    Message
                  </label>
                  <textarea
                    value={contactForm.message}
                    onChange={(event) => updateField("message", event.target.value)}
                    required
                    rows={5}
                    maxLength={4000}
                    placeholder="Describe the problem, what you expected, and any steps you already tried."
                    className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#185FA5]/40 focus:bg-white focus:ring-4 focus:ring-[#185FA5]/10"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#185FA5] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#14508c] disabled:opacity-60"
                  >
                    {formSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {formSubmitting ? "Creating ticket..." : "Create ticket"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const QuickAction = ({ icon: Icon, title, description, action, onClick }) => (
  <button
    onClick={onClick}
    className="group rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-[#185FA5]/30 hover:bg-white hover:shadow-sm"
  >
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#185FA5] shadow-sm">
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-950">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#185FA5]">
          {action}
          <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  </button>
);

const FaqPanel = ({ title, subtitle, faqs, expandedFaq, setExpandedFaq, emptyAction }) => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <BookOpen size={18} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-950">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>

    {faqs.length === 0 ? (
      <div className="p-8 text-center">
        <Search className="mx-auto text-slate-300" size={32} />
        <p className="mt-3 text-sm font-bold text-slate-900">No answers found</p>
        <button
          onClick={emptyAction}
          className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          Reset search
        </button>
      </div>
    ) : (
      <div className="divide-y divide-slate-100">
        {faqs.map((faq) => (
          <FaqItem
            key={faq.id}
            faq={faq}
            isExpanded={expandedFaq === faq.id}
            onToggle={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
          />
        ))}
      </div>
    )}
  </div>
);

const FaqItem = ({ faq, isExpanded, onToggle }) => (
  <div>
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
    >
      <span className="text-sm font-bold text-slate-800">{faq.question}</span>
      <ChevronDown size={16} className={`shrink-0 text-slate-400 transition ${isExpanded ? "rotate-180" : ""}`} />
    </button>
    <div className={`overflow-hidden transition-all ${isExpanded ? "max-h-44 border-t border-slate-100 bg-slate-50/70" : "max-h-0"}`}>
      <p className="px-5 py-4 text-sm leading-6 text-slate-600">{faq.answer}</p>
    </div>
  </div>
);

const FormField = ({ label, icon: Icon, type = "text", value, onChange, required }) => (
  <div>
    <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
      <Icon size={14} />
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#185FA5]/40 focus:bg-white focus:ring-4 focus:ring-[#185FA5]/10"
    />
  </div>
);

const SelectField = ({ label, value, options, onChange }) => (
  <div>
    <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
      <Clock size={14} />
      {label}
    </label>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-[#185FA5]/40 focus:bg-white focus:ring-4 focus:ring-[#185FA5]/10"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export default HelpSupport;
