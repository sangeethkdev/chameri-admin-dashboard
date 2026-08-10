import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Save, Loader2, Camera, CheckCircle2, UploadCloud, Film } from "lucide-react";
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

// --- Media Upload Field ---
const MediaUploadField = ({ label, preview, existingUrl, fileInputRef, onChange }) => {
  const isVideo = (url) => url && (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') || url.includes('.avi') || url.startsWith('blob:http') && fileInputRef.current?.files?.[0]?.type?.startsWith('video'));
  
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">{label}</label>
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group"
      >
        {(preview || existingUrl) ? (
          <>
            {isVideo(preview || existingUrl) ? (
              <video src={preview || existingUrl} className="w-full h-full object-cover" controls={false} autoPlay loop muted />
            ) : (
              <img src={preview || existingUrl} className="w-full h-full object-cover" alt="Media Preview" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
              <UploadCloud size={24} className="mb-2" />
              <span className="text-sm font-semibold">Change Media</span>
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-400">
              <Film size={20} />
            </div>
            <span className="text-sm font-medium text-gray-500">Click to upload Video or Image</span>
          </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={onChange} accept="video/*,image/*" className="hidden" />
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const KiwanoTour360 = () => {
  const qc = useQueryClient();
  const tourFlash = useFlashSuccess();

  // Refs for file inputs
  const mediaRef = useRef(null);

  // State
  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [existingMedia, setExistingMedia] = useState("");
  const [newMedia, setNewMedia] = useState(null);
  const [previewMedia, setPreviewMedia] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["kiwano-main"],
    queryFn: async () => {
      const res = await api.get("/kiwano/main");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setHeading(data?.tour360Section?.heading || "");
    setSubheading(data?.tour360Section?.subheading || "");
    setExistingMedia(data?.tour360Section?.media || "");
  }, [data]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewMedia(file);
      setPreviewMedia(URL.createObjectURL(file));
    }
  };

  const tourMutation = useMutation({
    mutationFn: async () => {
      // New media goes straight to Cloudinary from the browser — this avoids
      // routing large photos/videos through the backend's serverless
      // function, which rejects anything over ~4.5MB.
      let mediaUrl = existingMedia;
      if (newMedia) {
        const uploaded = await uploadToCloudinary(newMedia, {
          folder: "chameri/kiwano",
          resourceType: "auto",
        });
        mediaUrl = uploaded.url;
      }

      return api.put("/kiwano/main/tour360-section", {
        heading,
        subheading,
        media: mediaUrl,
      });
    },
    onSuccess: () => {
      tourFlash.flash();
      setNewMedia(null);
      setPreviewMedia("");
      qc.invalidateQueries(["kiwano-main"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to save 360Tour section"),
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
        <h1 className="text-2xl font-bold text-white">Kiwano — 360Tour Section</h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage the 360 Tour section including its heading, subheading, and media file (Video or Image).
        </p>
      </div>

      <FormCard
        title="360Tour Settings"
        icon={Camera}
        onSave={() => tourMutation.mutate()}
        isSaving={tourMutation.isPending}
        saved={tourFlash.saved}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <InputField 
              label="Heading" 
              value={heading} 
              onChange={e => setHeading(e.target.value)} 
              placeholder="e.g. Explore our 360 Virtual Tour" 
            />
          </div>
          <div className="md:col-span-2">
            <InputField 
              label="Subheading" 
              value={subheading} 
              onChange={e => setSubheading(e.target.value)} 
              placeholder="e.g. Step inside our beautiful property..." 
            />
          </div>
          <div className="md:col-span-2">
            <MediaUploadField
              label="360 Tour Media (Video or Image)"
              preview={previewMedia}
              existingUrl={existingMedia}
              fileInputRef={mediaRef}
              onChange={handleFile}
            />
          </div>
        </div>
      </FormCard>
    </div>
  );
};

export default KiwanoTour360;
