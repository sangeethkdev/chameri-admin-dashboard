import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Save, Loader2, Sparkles, CheckCircle2, UploadCloud, Film, X } from "lucide-react";

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
const VideoUploadField = ({ label, preview, existingUrl, fileInputRef, onChange }) => (
  <div>
    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">{label}</label>
    <div
      onClick={() => fileInputRef.current?.click()}
      className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group"
    >
      {(preview || existingUrl) ? (
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
    <input type="file" ref={fileInputRef} onChange={onChange} accept="video/*" className="hidden" />
  </div>
);

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
        <label className="text-sm font-bold uppercase tracking-widest text-gray-500">{label}</label>
        <span className="text-xs font-semibold text-gray-400">{totalCount}/{max} images</span>
      </div>

      {remaining > 0 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-brand-400 cursor-pointer transition-colors"
        >
          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
            <UploadCloud className="text-gray-400" size={28} />
          </div>
          <p className="text-gray-600 font-medium">Click or drag images here to upload</p>
          <p className="text-xs text-gray-400 mt-2">Up to {max} images total &middot; JPG, PNG, WEBP</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          {existingImages.map((url, idx) => (
            <div key={`existing-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-white">
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

const MAX_IMAGES = 4;

// ── Main Component ───────────────────────────────────────────────────────────
const KiwanoVHighlights = () => {
  const qc = useQueryClient();
  const flash = useFlashSuccess();

  const videoRef = useRef(null);

  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");

  const [existingVideo, setExistingVideo] = useState("");
  const [newVideo, setNewVideo] = useState(null);
  const [previewVideo, setPreviewVideo] = useState("");

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ["kiwano-villament-main"],
    queryFn: async () => {
      const res = await api.get("/kiwano-villament/main");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setHeading(data?.highlightsSection?.heading || "");
    setSubheading(data?.highlightsSection?.subheading || "");
    setExistingVideo(data?.highlightsSection?.video || "");
    setExistingImages(data?.highlightsSection?.images || []);
  }, [data]);

  const handleVideoFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewVideo(file);
      setPreviewVideo(URL.createObjectURL(file));
    }
  };

  const highlightsMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("heading", heading);
      formData.append("subheading", subheading);
      if (newVideo) formData.append("video", newVideo);

      formData.append("existingImages", JSON.stringify(existingImages));
      newImages.forEach((file) => formData.append("images", file));

      return api.put("/kiwano-villament/main/highlights-section", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      flash.flash();
      setNewVideo(null);
      setPreviewVideo("");
      setNewImages([]);
      qc.invalidateQueries(["kiwano-villament-main"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to save Highlights section"),
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
        <h1 className="text-2xl font-bold text-white">Kiwano Villament — Highlights Section</h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage the Highlights section including its heading, subheading, video, and up to 4 images.
        </p>
      </div>

      <FormCard
        title="Highlights Settings"
        icon={Sparkles}
        onSave={() => highlightsMutation.mutate()}
        isSaving={highlightsMutation.isPending}
        saved={flash.saved}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <InputField
              label="Heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="e.g. Discover the Highlights"
            />
          </div>
          <div className="md:col-span-2">
            <InputField
              label="Subheading"
              value={subheading}
              onChange={(e) => setSubheading(e.target.value)}
              placeholder="e.g. A closer look at what makes this property special..."
            />
          </div>
          <div className="md:col-span-2">
            <VideoUploadField
              label="Highlights Video"
              preview={previewVideo}
              existingUrl={existingVideo}
              fileInputRef={videoRef}
              onChange={handleVideoFile}
            />
          </div>
          <div className="md:col-span-2">
            <ImageGroupUploader
              label="Highlights Images"
              max={MAX_IMAGES}
              existingImages={existingImages}
              newImages={newImages}
              onFilesAdded={(files) => setNewImages((prev) => [...prev, ...files])}
              onRemoveExisting={(url) => setExistingImages((prev) => prev.filter((u) => u !== url))}
              onRemoveNew={(idx) => setNewImages((prev) => prev.filter((_, i) => i !== idx))}
            />
          </div>
        </div>
      </FormCard>
    </div>
  );
};

export default KiwanoVHighlights;
