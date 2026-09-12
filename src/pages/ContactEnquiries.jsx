import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import {
  Inbox, Loader2, Mail, Phone, Trash2, Search, RefreshCw,
  AlertTriangle, X, ChevronLeft, ChevronRight, Calendar, Tag,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUSES = [
  { value: "new",      label: "New",      badgeClass: "bg-blue-50 text-blue-600 border border-blue-200" },
  { value: "read",     label: "Read",     badgeClass: "bg-amber-50 text-amber-600 border border-amber-200" },
  { value: "replied",  label: "Replied",  badgeClass: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  { value: "archived", label: "Archived", badgeClass: "bg-gray-100 text-gray-500 border border-gray-200" },
];

const getStatusInfo = (status) =>
  STATUSES.find((s) => s.value === status) || STATUSES[0];

const formatDateTime = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ count, label, colorClass }) => (
  <div className="flex-1 bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm">
    <p className={`text-3xl font-bold ${colorClass}`}>{count ?? 0}</p>
    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">{label}</p>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const info = getStatusInfo(status);
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${info.badgeClass}`}>
      {info.label}
    </span>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ enquiry, onCancel, onConfirm, isDeleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
          <AlertTriangle size={20} />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Delete enquiry?</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        This permanently removes the enquiry from{" "}
        <span className="font-semibold text-gray-700">{enquiry?.name}</span>. This cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-60"
        >
          {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Enquiry Card ─────────────────────────────────────────────────────────────
const EnquiryCard = ({ item, onStatusChange, onDelete, isUpdating }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="text-base font-bold text-gray-900 truncate">{item.name}</h3>
          <StatusBadge status={item.status} />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1.5">
          <Calendar size={12} />
          {formatDateTime(item.createdAt)}
          {item.subject && (
            <>
              <span className="text-gray-300">·</span>
              <Tag size={12} />
              <span className="truncate">{item.subject}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Status is a plain select — these move between states freely
            (an archived enquiry can be reopened), so there is no workflow
            order to enforce here. */}
        <select
          value={item.status}
          onChange={(e) => onStatusChange(item._id, e.target.value)}
          disabled={isUpdating}
          className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50/50 outline-none focus:border-brand-500 transition-colors cursor-pointer disabled:opacity-60"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onDelete(item)}
          title="Delete enquiry"
          className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>

    {/* Contact details are click-to-act so the team can reply straight from
        the list without copy-pasting. */}
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-3">
      <a
        href={`mailto:${item.email}`}
        className="flex items-center gap-1.5 text-sm text-brand-600 hover:underline break-all"
      >
        <Mail size={14} className="shrink-0" /> {item.email}
      </a>
      {item.phone && (
        <a
          href={`tel:${item.phone}`}
          className="flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
        >
          <Phone size={14} className="shrink-0" /> {item.phone}
        </a>
      )}
    </div>

    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50/70 border border-gray-100 rounded-xl p-3.5">
      {item.message}
    </p>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const ContactEnquiries = () => {
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");
  // `search` is the live input; `appliedSearch` is what the query actually
  // uses, so typing doesn't fire a request per keystroke.
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["contacts", statusFilter, appliedSearch, page],
    queryFn: async () => {
      const res = await api.get("/contacts", {
        params: { status: statusFilter, search: appliedSearch, page, limit: 20 },
      });
      return res.data;
    },
    keepPreviousData: true,
  });

  const enquiries = data?.data || [];
  const meta = data?.meta || { page: 1, pages: 1, total: 0, newCount: 0 };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/contacts/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      // The dashboard shows a "new enquiries" count off the same records.
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/contacts/${id}`),
    onSuccess: () => {
      toast.success("Enquiry deleted");
      setPendingDelete(null);
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete enquiry"),
  });

  const applySearch = () => {
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const changeFilter = (value) => {
    setPage(1);
    setStatusFilter(value);
  };

  return (
    <div className="space-y-6 max-w-5xl pb-10">
      {/* Header */}
      <div className="bg-dark-800 p-6 rounded-3xl shadow-sm border border-surface-border">
        <h1 className="text-2xl font-bold text-white">Contacts — Enquiries</h1>
        <p className="text-gray-400 text-sm mt-1">
          Every enquiry submitted through the website&apos;s contact forms.
        </p>
      </div>

      {/* Stats */}
      <div className="flex flex-col sm:flex-row gap-4">
        <StatCard count={meta.total} label="Total Enquiries" colorClass="text-gray-800" />
        <StatCard count={meta.newCount} label="New / Unread" colorClass="text-brand-600" />
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            onBlur={applySearch}
            placeholder="Search name, email, phone or message…"
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 transition-colors bg-gray-50/50 focus:bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => changeFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50/50 outline-none focus:border-brand-500 transition-colors cursor-pointer"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => refetch()}
          title="Refresh"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-300" />
        </div>
      ) : enquiries.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl py-16 px-6 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mx-auto mb-4">
            <Inbox size={26} />
          </div>
          <p className="text-gray-800 font-bold">No enquiries found</p>
          <p className="text-gray-400 text-sm mt-1">
            {appliedSearch || statusFilter !== "all"
              ? "Try clearing the search or status filter."
              : "New submissions from the website will appear here."}
          </p>
          {(appliedSearch || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setAppliedSearch("");
                changeFilter("all");
              }}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <X size={15} /> Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {enquiries.map((item) => (
            <EnquiryCard
              key={item._id}
              item={item}
              onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
              onDelete={setPendingDelete}
              isUpdating={statusMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-3.5 shadow-sm">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-sm text-gray-500 font-medium">
            Page {meta.page} of {meta.pages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
            disabled={page >= meta.pages}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {pendingDelete && (
        <DeleteModal
          enquiry={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => deleteMutation.mutate(pendingDelete._id)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default ContactEnquiries;
