import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import {
  Save, Loader2, Image as ImageIcon, CheckCircle2, X, Plus, UploadCloud,
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

// ── Main Component ───────────────────────────────────────────────────────────
const GalleryImages = () => {
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const imagesFlash = useFlashSuccess();

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]); // [{ file, preview }]

  const { data, isLoading } = useQuery({
    queryKey: ["gallery-main"],
    queryFn: async () => {
      const res = await api.get("/gallery/main");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setExistingImages(data?.galleryImages || []);
  }, [data]);

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((prev) => [...prev, ...previews]);
    // Reset the input so the same file can be re-selected if removed
    e.target.value = "";
  };

  const removeExisting = (url) =>
    setExistingImages((prev) => prev.filter((u) => u !== url));

  const removeNew = (index) =>
    setNewImages((prev) => prev.filter((_, i) => i !== index));

  const imagesMutation = useMutation({
    mutationFn: async () => {
      // New images go straight to Cloudinary from the browser — this avoids
      // routing large or multiple photos through the backend's serverless
      // function, which rejects anything over ~4.5MB.
      const uploaded = await Promise.all(
        newImages.map(({ file }) => uploadToCloudinary(file, { folder: "chameri/gallery" }))
      );
      const newUrls = uploaded.map((r) => r.url);

      return api.put("/gallery/main/images", {
        galleryImages: [...existingImages, ...newUrls],
      });
    },
    onSuccess: () => {
      imagesFlash.flash();
      setNewImages([]);
      qc.invalidateQueries(["gallery-main"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to save Gallery Images"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    );
  }

  const totalCount = existingImages.length + newImages.length;

  return (
    <div className="space-y-6 max-w-5xl pb-10">
      {/* Page Header */}
      <div className="bg-dark-800 p-6 rounded-3xl mb-6 shadow-sm border border-surface-border">
        <h1 className="text-2xl font-bold text-white">Gallery — Images</h1>
        <p className="text-gray-400 text-sm mt-1">
          Add or remove images from the gallery. No limit — upload as many as you need.
        </p>
      </div>

      <FormCard
        title="Gallery Images"
        icon={ImageIcon}
        onSave={() => imagesMutation.mutate()}
        isSaving={imagesMutation.isPending}
        saved={imagesFlash.saved}
      >
        {/* Stats bar */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Images
            </label>
            <span className="text-xs font-bold bg-brand-50 text-brand-500 px-2.5 py-0.5 rounded-full">
              {totalCount} total
            </span>
            {newImages.length > 0 && (
              <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full">
                +{newImages.length} new
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
          >
            <UploadCloud size={14} />
            Add Images
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">

          {/* Existing images */}
          {existingImages.map((url, i) => (
            <div
              key={`ex-${i}`}
              className="relative aspect-square bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden group shadow-sm"
            >
              <img src={url} alt={`gallery-${i}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                type="button"
                onClick={() => removeExisting(url)}
                className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/90 text-red-500 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110"
              >
                <X size={13} />
              </button>
              <div className="absolute bottom-1.5 left-1.5 text-[10px] font-bold text-white/80 bg-black/40 px-1.5 py-0.5 rounded-md leading-none">
                #{i + 1}
              </div>
            </div>
          ))}

          {/* New (pending upload) images */}
          {newImages.map((img, i) => (
            <div
              key={`new-${i}`}
              className="relative aspect-square bg-brand-50 rounded-2xl border-2 border-brand-200 overflow-hidden group shadow-sm"
            >
              <img src={img.preview} alt={`new-${i}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                type="button"
                onClick={() => removeNew(i)}
                className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/90 text-red-500 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110"
              >
                <X size={13} />
              </button>
              {/* NEW badge */}
              <div className="absolute bottom-1.5 left-1.5 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none">
                NEW
              </div>
            </div>
          ))}

          {/* Add more button */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-brand-300 transition-colors flex flex-col items-center justify-center cursor-pointer text-gray-400 group"
          >
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Plus size={20} className="text-gray-500" />
            </div>
            <span className="text-xs font-semibold text-gray-500">Add Images</span>
          </div>
        </div>

        {/* Hidden file input — multiple, no limit */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFilesChange}
          accept="image/*"
          multiple
          className="hidden"
        />

        {/* Empty state */}
        {totalCount === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
              <ImageIcon size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold text-sm">No images yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Click <span className="text-brand-500 font-semibold">Add Images</span> to upload your first gallery image.
            </p>
          </div>
        )}
      </FormCard>
    </div>
  );
};

export default GalleryImages;
