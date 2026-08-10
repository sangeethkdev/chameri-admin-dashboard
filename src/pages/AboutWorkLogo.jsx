import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Save, Loader2, Image as ImageIcon, CheckCircle2, X, Plus } from "lucide-react";
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
const AboutWorkLogo = () => {
  const qc = useQueryClient();
  const logosInputRef = useRef(null);
  const logosFlash = useFlashSuccess();

  const [existingLogos, setExistingLogos] = useState([]);
  const [newLogos, setNewLogos] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ["about-main"],
    queryFn: async () => {
      const res = await api.get("/about/main");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setExistingLogos(data?.workLogos || []);
  }, [data]);

  const handleLogosChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setNewLogos(prev => [...prev, ...newPreviews]);
  };
  
  const removeExistingLogo = (url) => setExistingLogos(prev => prev.filter(u => u !== url));
  const removeNewLogo = (index) => setNewLogos(prev => prev.filter((_, i) => i !== index));

  const logosMutation = useMutation({
    mutationFn: async () => {
      // New logos go straight to Cloudinary from the browser — this avoids
      // routing multiple photos through the backend's serverless function,
      // which rejects anything over ~4.5MB.
      const uploaded = await Promise.all(
        newLogos.map(({ file }) => uploadToCloudinary(file, { folder: "chameri/about" }))
      );
      const newLogoUrls = uploaded.map((r) => r.url);

      return api.put("/about/main/logos", {
        workLogos: [...existingLogos, ...newLogoUrls],
      });
    },
    onSuccess: () => {
      logosFlash.flash();
      setNewLogos([]);
      qc.invalidateQueries(["about-main"]);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save Work Logos"),
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
      <div className="bg-dark-800 p-6 rounded-3xl mb-6 shadow-sm border border-surface-border">
        <h1 className="text-2xl font-bold text-white">About Us — Work Logo Section</h1>
        <p className="text-gray-400 text-sm mt-1">Manage the brand/work logos for the About page.</p>
      </div>

      <FormCard
        title="Work Logo Section"
        icon={ImageIcon}
        onSave={() => logosMutation.mutate()}
        isSaving={logosMutation.isLoading}
        saved={logosFlash.saved}
      >
        <div className="mb-2">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block">Brand / Work Logos</label>
          <p className="text-xs text-gray-500 mt-1">Upload the logos of brands or clients you have worked with.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {existingLogos.map((url) => (
            <div key={url} className="relative aspect-square bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center p-3 group">
              <img src={url} alt="Logo" className="max-w-full max-h-full object-contain mix-blend-multiply" />
              <button
                type="button"
                onClick={() => removeExistingLogo(url)}
                className="absolute -top-2 -right-2 w-7 h-7 bg-white text-red-500 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {newLogos.map((item, index) => (
            <div key={index} className="relative aspect-square bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center p-3 group">
              <img src={item.preview} alt="New Logo" className="max-w-full max-h-full object-contain mix-blend-multiply" />
              <button
                type="button"
                onClick={() => removeNewLogo(index)}
                className="absolute -top-2 -right-2 w-7 h-7 bg-white text-red-500 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
              >
                <X size={14} />
              </button>
              <div className="absolute bottom-1 right-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 rounded-sm">NEW</div>
            </div>
          ))}

          <div
            onClick={() => logosInputRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-brand-300 transition-colors flex flex-col items-center justify-center cursor-pointer text-gray-400 group"
          >
            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Plus size={20} className="text-gray-500" />
            </div>
            <span className="text-xs font-semibold text-gray-500">Add Logo</span>
          </div>
          <input type="file" ref={logosInputRef} onChange={handleLogosChange} accept="image/*" multiple className="hidden" />
        </div>
      </FormCard>
    </div>
  );
};

export default AboutWorkLogo;
