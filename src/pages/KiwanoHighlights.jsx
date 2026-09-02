import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import {
  Save,
  Loader2,
  Sparkles,
  CheckCircle2,
  UploadCloud,
  Film,
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import { uploadToCloudinary } from "../lib/cloudinaryUpload";

/* The site's thumb strip lays out exactly four images per stage, and the
   timeline row gets cramped past a year of labels. Both caps are mirrored
   by the backend controller. */
const MAX_IMAGES = 4;
const MAX_MONTHS = 12;

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

// --- Input Field ---
const InputField = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 transition-colors bg-gray-50/50 focus:bg-white"
    />
  </div>
);

// --- Video Upload Field ---
const VideoUploadField = ({ label, preview, existingUrl, onFile, onClear }) => {
  const fileInputRef = useRef(null);
  const hasVideo = Boolean(preview || existingUrl);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</label>
        {hasVideo && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <X size={12} /> Remove
          </button>
        )}
      </div>
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group"
      >
        {hasVideo ? (
          <>
            <video src={preview || existingUrl} className="w-full h-full object-cover" controls={false} autoPlay loop muted />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
              <UploadCloud size={24} className="mb-2" />
              <span className="text-sm font-semibold">Change Video</span>
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-400">
              <Film size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">Click to upload Video</span>
          </div>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
        accept="video/*"
        className="hidden"
      />
    </div>
  );
};

// --- Image Group Uploader (capped) ---
const ImageGroupUploader = ({ label, max, existingImages, newImages, onFilesAdded, onRemoveExisting, onRemoveNew }) => {
  const fileInputRef = useRef(null);
  const totalCount = existingImages.length + newImages.length;
  const remaining = Math.max(max - totalCount, 0);

  const addFiles = (files) => {
    if (remaining <= 0) {
      toast.error(`You can only upload up to ${max} images.`);
      return;
    }
    const allowed = files.slice(0, remaining);
    if (files.length > allowed.length) {
      toast.error(`Only ${max} images are allowed. Extra files were ignored.`);
    }
    onFilesAdded(allowed);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</label>
        <span className="text-xs font-semibold text-gray-400">{totalCount}/{max} images</span>
      </div>

      {remaining > 0 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-brand-400 cursor-pointer transition-colors"
        >
          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
            <UploadCloud className="text-gray-400" size={22} />
          </div>
          <p className="text-gray-600 font-medium text-sm">Click or drag images here to upload</p>
          <p className="text-xs text-gray-400 mt-1.5">Up to {max} images total &middot; JPG, PNG, WEBP</p>
        </div>
      )}
      <input
        type="file"
        multiple
        accept="image/*"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            addFiles(Array.from(e.target.files));
          }
          e.target.value = "";
        }}
        className="hidden"
      />

      {totalCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          {existingImages.map((url, idx) => (
            <div key={`existing-${url}-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-white">
              <img src={url} alt={`Existing ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <button
                type="button"
                onClick={() => onRemoveExisting(url)}
                className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {newImages.map((file, idx) => (
            <div key={`new-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-brand-200 bg-white">
              <img src={URL.createObjectURL(file)} alt={`New ${idx}`} className="w-full h-full object-cover opacity-80" />
              <div className="absolute top-2 left-2 bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">NEW</div>
              <button
                type="button"
                onClick={() => onRemoveNew(idx)}
                className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* A blank timeline stage. `key` is a client-only id so React keeps each card's
   identity (and its pending file objects) stable across reorders — it is
   stripped before the payload goes to the API. */
let monthKeySeed = 0;
const makeMonth = (overrides = {}) => ({
  key: `month-${Date.now()}-${monthKeySeed++}`,
  label: "",
  date: "",
  existingVideo: "",
  newVideo: null,
  previewVideo: "",
  existingImages: [],
  newImages: [],
  ...overrides,
});

// --- One timeline stage card ---
const MonthCard = ({ month, index, total, onChange, onRemove, onMove }) => {
  const patch = (fields) => onChange({ ...month, ...fields });

  return (
    <div className="border border-gray-200 rounded-2xl bg-gray-50/40 overflow-hidden">
      {/* Card header — label, position controls, delete */}
      <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center text-xs font-bold shrink-0">
          {index + 1}
        </div>
        <span className="font-bold text-gray-900 text-sm truncate">
          {month.label?.trim() || "Untitled month"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(index, index - 1)}
            disabled={index === 0}
            title="Move up"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, index + 1)}
            disabled={index === total - 1}
            title="Move down"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown size={16} />
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            title="Delete month"
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            label="Timeline Label"
            value={month.label}
            onChange={(e) => patch({ label: e.target.value })}
            placeholder="e.g. MAY"
          />
          <InputField
            label="Date Badge"
            value={month.date}
            onChange={(e) => patch({ date: e.target.value })}
            placeholder="e.g. May 2026"
          />
        </div>

        <VideoUploadField
          label="Month Video"
          preview={month.previewVideo}
          existingUrl={month.existingVideo}
          onFile={(file) =>
            patch({ newVideo: file, previewVideo: URL.createObjectURL(file) })
          }
          onClear={() => patch({ newVideo: null, previewVideo: "", existingVideo: "" })}
        />

        <ImageGroupUploader
          label="Month Images"
          max={MAX_IMAGES}
          existingImages={month.existingImages}
          newImages={month.newImages}
          onFilesAdded={(files) => patch({ newImages: [...month.newImages, ...files] })}
          onRemoveExisting={(url) =>
            patch({ existingImages: month.existingImages.filter((u) => u !== url) })
          }
          onRemoveNew={(idx) =>
            patch({ newImages: month.newImages.filter((_, i) => i !== idx) })
          }
        />
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const KiwanoHighlights = () => {
  const qc = useQueryClient();
  const flash = useFlashSuccess();

  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [months, setMonths] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ["kiwano-main"],
    queryFn: async () => {
      const res = await api.get("/kiwano/main");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    const section = data?.highlightsSection || {};
    setHeading(section.heading || "");
    setSubheading(section.subheading || "");

    const saved = Array.isArray(section.months) ? section.months : [];
    if (saved.length) {
      setMonths(
        saved.map((m) =>
          makeMonth({
            label: m?.label || "",
            date: m?.date || "",
            existingVideo: m?.video || "",
            existingImages: Array.isArray(m?.images) ? m.images : [],
          })
        )
      );
    } else if (section.video || section.images?.length || section.date) {
      /* Documents saved before the timeline existed carry one stage's worth
         of media at the top level — seed it as the first month so nothing
         has to be re-uploaded by hand. */
      setMonths([
        makeMonth({
          label: section.date || "MONTH 1",
          date: section.date || "",
          existingVideo: section.video || "",
          existingImages: Array.isArray(section.images) ? section.images : [],
        }),
      ]);
    } else {
      setMonths([]);
    }
  }, [data]);

  const updateMonth = (index, next) =>
    setMonths((prev) => prev.map((m, i) => (i === index ? next : m)));

  const removeMonth = (index) =>
    setMonths((prev) => prev.filter((_, i) => i !== index));

  const moveMonth = (from, to) =>
    setMonths((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  const addMonth = () => {
    if (months.length >= MAX_MONTHS) {
      toast.error(`You can add up to ${MAX_MONTHS} months.`);
      return;
    }
    setMonths((prev) => [...prev, makeMonth()]);
  };

  const highlightsMutation = useMutation({
    mutationFn: async () => {
      if (months.some((m) => !m.label.trim())) {
        throw new Error("Every month needs a timeline label.");
      }

      /* New media goes straight to Cloudinary from the browser — this avoids
         routing large or multiple files through the backend's serverless
         function, which rejects anything over ~4.5MB. */
      const payloadMonths = await Promise.all(
        months.map(async (month) => {
          let videoUrl = month.existingVideo;
          if (month.newVideo) {
            const uploaded = await uploadToCloudinary(month.newVideo, {
              folder: "chameri/kiwano",
              resourceType: "auto",
            });
            videoUrl = uploaded.url;
          }

          const uploadedImages = await Promise.all(
            month.newImages.map((file) =>
              uploadToCloudinary(file, { folder: "chameri/kiwano", resourceType: "auto" })
            )
          );

          return {
            label: month.label.trim(),
            date: month.date.trim(),
            video: videoUrl,
            images: [...month.existingImages, ...uploadedImages.map((r) => r.url)].slice(0, MAX_IMAGES),
          };
        })
      );

      return api.put("/kiwano/main/highlights-section", {
        heading,
        subheading,
        months: payloadMonths,
      });
    },
    onSuccess: () => {
      flash.flash();
      /* Clear pending files — the refetch below repopulates each card from
         the saved Cloudinary URLs. */
      setMonths((prev) =>
        prev.map((m) => ({ ...m, newVideo: null, previewVideo: "", newImages: [] }))
      );
      qc.invalidateQueries({ queryKey: ["kiwano-main"] });
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message || err.message || "Failed to save Highlights section"
      ),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Page Header */}
      <div className="bg-dark-800 p-6 rounded-3xl mb-6 shadow-sm border border-surface-border">
        <h1 className="text-2xl font-bold text-white">Kiwano — Highlights Section</h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage the Highlights heading and its month-by-month timeline. Each month holds
          its own video and up to {MAX_IMAGES} images — the site swaps both when a visitor
          moves along the timeline.
        </p>
      </div>

      <FormCard
        title="Highlights Settings"
        icon={Sparkles}
        onSave={() => highlightsMutation.mutate()}
        isSaving={highlightsMutation.isPending}
        saved={flash.saved}
      >
        <InputField
          label="Heading"
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          placeholder="e.g. Discover the Highlights"
        />
        <InputField
          label="Subheading"
          value={subheading}
          onChange={(e) => setSubheading(e.target.value)}
          placeholder="e.g. A closer look at what makes this property special..."
        />

        {/* ── Month timeline ─────────────────────────────────────────────── */}
        <div className="pt-2">
          <div className="flex items-center gap-3 mb-4 pt-4 border-t border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 shrink-0">
              <CalendarDays size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Timeline Months</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Shown left to right on the site, in this order.
              </p>
            </div>
            <span className="ml-auto text-xs font-semibold text-gray-400">
              {months.length}/{MAX_MONTHS}
            </span>
          </div>

          {months.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                <CalendarDays size={24} />
              </div>
              <p className="text-gray-600 font-medium text-sm">No months added yet</p>
              <p className="text-xs text-gray-400 mt-1.5">
                Add a month to start building the construction timeline.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {months.map((month, index) => (
                <MonthCard
                  key={month.key}
                  month={month}
                  index={index}
                  total={months.length}
                  onChange={(next) => updateMonth(index, next)}
                  onRemove={removeMonth}
                  onMove={moveMonth}
                />
              ))}
            </div>
          )}

          {months.length < MAX_MONTHS && (
            <button
              type="button"
              onClick={addMonth}
              className="mt-4 w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-2xl py-4 text-sm font-semibold text-gray-500 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50/30 transition-colors"
            >
              <Plus size={18} /> Add Month
            </button>
          )}
        </div>
      </FormCard>
    </div>
  );
};

export default KiwanoHighlights;
