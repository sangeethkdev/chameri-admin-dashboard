import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Save, Loader2, Image as ImageIcon, CheckCircle2, UploadCloud } from "lucide-react";
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

// --- Image Upload Field ---
const ImageUploadField = ({ label, preview, existingUrl, fileInputRef, onChange }) => (
  <div>
    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">{label}</label>
    <div
      onClick={() => fileInputRef.current?.click()}
      className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group"
    >
      {(preview || existingUrl) ? (
        <>
          <img src={preview || existingUrl} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
            <UploadCloud size={24} className="mb-2" />
            <span className="text-sm font-semibold">Change Image</span>
          </div>
        </>
      ) : (
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-400">
            <UploadCloud size={20} />
          </div>
          <span className="text-sm font-medium text-gray-500">Click to upload</span>
        </div>
      )}
    </div>
    <input type="file" ref={fileInputRef} onChange={onChange} accept="image/*" className="hidden" />
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const ContactHero = () => {
  const qc = useQueryClient();
  const heroFlash = useFlashSuccess();

  const imageRef = useRef(null);

  const [heading, setHeading] = useState("");
  const [existingImage, setExistingImage] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["contact-main"],
    queryFn: async () => {
      const res = await api.get("/contact-main/main");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setHeading(data?.heroSection?.heading || "");
    setExistingImage(data?.heroSection?.image || "");
  }, [data]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const heroMutation = useMutation({
    mutationFn: async () => {
      // New images go straight to Cloudinary from the browser — this avoids
      // routing large photos through the backend's serverless function,
      // which rejects anything over ~4.5MB.
      const image = newImage
        ? (await uploadToCloudinary(newImage, { folder: "chameri/contact" })).url
        : existingImage;

      return api.put("/contact-main/main/hero", { heading, image });
    },
    onSuccess: () => {
      heroFlash.flash();
      setNewImage(null);
      setPreviewImage("");
      qc.invalidateQueries(["contact-main"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to save Contact Hero section"),
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
        <h1 className="text-2xl font-bold text-white">Contacts — Hero Section</h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage the hero image and heading for the Contact page.
        </p>
      </div>

      <FormCard
        title="Hero Section Settings"
        icon={ImageIcon}
        onSave={() => heroMutation.mutate()}
        isSaving={heroMutation.isPending}
        saved={heroFlash.saved}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            label="Heading"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="e.g. Let's Build The Perfect Home Together"
          />
          <div className="md:col-span-2">
            <ImageUploadField
              label="Hero Image"
              preview={previewImage}
              existingUrl={existingImage}
              fileInputRef={imageRef}
              onChange={handleFile}
            />
          </div>
        </div>
      </FormCard>
    </div>
  );
};

export default ContactHero;
