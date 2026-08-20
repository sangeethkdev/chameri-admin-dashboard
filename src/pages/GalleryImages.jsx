import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import {
  Save, Loader2, Image as ImageIcon, CheckCircle2, X, Plus, UploadCloud, CalendarDays,
} from "lucide-react";
import { uploadToCloudinary } from "../lib/cloudinaryUpload";

// --- Custom Hook ---
const useFlashSuccess = () => {
  const [saved, setSaved] = useState(false);
  const timerRef = useRef(null);
  const flash = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaved(true);
    timerRef.current = setTimeout(() => setSaved(false), 2000);
  }, []);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  return { saved, flash };
};

// --- Save Button ---
const SectionSaveBtn = ({ isLoading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    className={`ml-auto flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-glow-sm disabled:cursor-not-allowed
      ${isLoading ? "bg-amber-500 shadow-amber-200/40 scale-95" : "bg-brand-500 hover:bg-brand-400 hover:shadow-glow-md"}`}
  >
    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
    {isLoading ? "Saving..." : "Save"}
  </button>
);

// --- Form Card ---
const FormCard = ({ title, icon: Icon, onSave, isSaving, saved, children }) => (
  <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mb-6 animate-fade-in">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500">
        <Icon size={20} />
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <SectionSaveBtn isLoading={isSaving} onClick={onSave} />
    </div>
    <div className="space-y-5">{children}</div>
    <div
      className={`mt-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold transition-all duration-500
        ${saved ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"}`}
    >
      <CheckCircle2 size={16} className="shrink-0" /> Saved successfully!
    </div>
  </div>
);

const emptyEvent = () => ({ title: "", date: "", existingImages: [], newImages: [] });

// ── Main Component ───────────────────────────────────────────────────────────
const GalleryImages = () => {
  const qc = useQueryClient();
  const eventFileRefs = useRef([]);

  const [events, setEvents] = useState([]);
  const flash = useFlashSuccess();

  const { data, isLoading } = useQuery({
    queryKey: ["gallery-main"],
    queryFn: async () => {
      const res = await api.get("/gallery/main");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    const dbEvents = data?.galleryEvents || [];
    if (dbEvents.length > 0) {
      setEvents(
        dbEvents.map((e) => ({
          title: e.title || "",
          date: e.date || "",
          existingImages: e.images || [],
          newImages: [],
        }))
      );
      return;
    }
    // Migration fallback: older documents only have a flat `galleryImages`
    // pool with no event of their own — seed one event so those images
    // stay visible instead of disappearing once events take over.
    const legacyImages = data?.galleryImages || [];
    setEvents(
      legacyImages.length > 0
        ? [{ title: "Gallery", date: "", existingImages: legacyImages, newImages: [] }]
        : [emptyEvent()]
    );
  }, [data]);

  const updateEvent = (i, patch) =>
    setEvents((prev) => prev.map((ev, idx) => (idx === i ? { ...ev, ...patch } : ev)));

  const handleFilesChange = (i, fileList) => {
    const files = Array.from(fileList);
    const previews = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    updateEvent(i, { newImages: [...events[i].newImages, ...previews] });
  };

  const removeExistingImage = (i, url) =>
    updateEvent(i, { existingImages: events[i].existingImages.filter((u) => u !== url) });

  const removeNewImage = (i, idx) =>
    updateEvent(i, { newImages: events[i].newImages.filter((_, n) => n !== idx) });

  const eventsMutation = useMutation({
    mutationFn: async () => {
      // New images go straight to Cloudinary from the browser — this avoids
      // routing large or multiple photos through the backend's serverless
      // function, which rejects anything over ~4.5MB.
      const resolvedEvents = await Promise.all(
        events.map(async (ev) => {
          const uploaded = await Promise.all(
            ev.newImages.map(({ file }) => uploadToCloudinary(file, { folder: "chameri/gallery" }))
          );
          return {
            title: ev.title,
            date: ev.date,
            images: [...ev.existingImages, ...uploaded.map((r) => r.url)],
          };
        })
      );

      return api.put("/gallery/main/events", { galleryEvents: resolvedEvents });
    },
    onSuccess: () => {
      flash.flash();
      setEvents((prev) => prev.map((ev) => ({ ...ev, newImages: [] })));
      qc.invalidateQueries(["gallery-main"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to save Gallery Events"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl pb-10">
      {/* Page Header */}
      <div className="bg-dark-800 p-6 rounded-3xl mb-6 shadow-sm border border-surface-border">
        <h1 className="text-2xl font-bold text-white">Gallery — Events</h1>
        <p className="text-gray-400 text-sm mt-1">
          Group gallery photos into events. Each event gets its own title, date, and set of images.
        </p>
      </div>

      <FormCard
        title="Gallery Events"
        icon={CalendarDays}
        onSave={() => eventsMutation.mutate()}
        isSaving={eventsMutation.isPending}
        saved={flash.saved}
      >
        <div className="space-y-5">
          {events.map((ev, i) => {
            const totalCount = ev.existingImages.length + ev.newImages.length;
            return (
              <div key={i} className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100 relative space-y-4">
                <button
                  type="button"
                  onClick={() => setEvents((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove Event"
                >
                  <X size={18} />
                </button>

                <p className="text-xs font-black uppercase tracking-widest text-brand-500">
                  Event {String(i + 1).padStart(2, "0")}
                </p>

                {/* Title + Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-8">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
                      Event Title
                    </label>
                    <input
                      type="text"
                      value={ev.title}
                      onChange={(e) => updateEvent(i, { title: e.target.value })}
                      placeholder="e.g. Site Handover — May 2026"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 transition-colors bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
                      Date
                    </label>
                    <input
                      type="text"
                      value={ev.date}
                      onChange={(e) => updateEvent(i, { date: e.target.value })}
                      placeholder="e.g. May 2026"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 transition-colors bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Images for this event */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      Images
                    </label>
                    <span className="text-xs font-bold bg-brand-50 text-brand-500 px-2.5 py-0.5 rounded-full">
                      {totalCount} total
                    </span>
                    {ev.newImages.length > 0 && (
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full">
                        +{ev.newImages.length} new
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => eventFileRefs.current[i]?.click()}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
                  >
                    <UploadCloud size={14} />
                    Add Images
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {ev.existingImages.map((url, idx) => (
                    <div
                      key={`ex-${idx}`}
                      className="relative aspect-square bg-white rounded-xl border border-gray-100 overflow-hidden group shadow-sm"
                    >
                      <img src={url} alt={`event-${i}-${idx}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(i, url)}
                        className="absolute top-1 right-1 w-6 h-6 bg-white/90 text-red-500 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {ev.newImages.map((img, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="relative aspect-square bg-brand-50 rounded-xl border-2 border-brand-200 overflow-hidden group shadow-sm"
                    >
                      <img src={img.preview} alt={`event-${i}-new-${idx}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(i, idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-white/90 text-red-500 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110"
                      >
                        <X size={12} />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-brand-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none">
                        NEW
                      </div>
                    </div>
                  ))}

                  <div
                    onClick={() => eventFileRefs.current[i]?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-brand-300 transition-colors flex flex-col items-center justify-center cursor-pointer text-gray-400 group"
                  >
                    <Plus size={18} className="group-hover:scale-110 transition-transform" />
                  </div>
                </div>

                <input
                  type="file"
                  ref={(el) => (eventFileRefs.current[i] = el)}
                  onChange={(e) => {
                    if (e.target.files.length) handleFilesChange(i, e.target.files);
                    e.target.value = "";
                  }}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setEvents((prev) => [...prev, emptyEvent()])}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-semibold hover:bg-gray-50 hover:border-brand-300 transition-colors"
        >
          + Add Event
        </button>

        {/* Empty state */}
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
              <ImageIcon size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold text-sm">No events yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Click <span className="text-brand-500 font-semibold">+ Add Event</span> to create your first gallery event.
            </p>
          </div>
        )}
      </FormCard>
    </div>
  );
};

export default GalleryImages;
