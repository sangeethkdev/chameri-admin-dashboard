import React, { useState, useEffect, useRef, useCallback, createRef } from "react";
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

// ── Main Component ───────────────────────────────────────────────────────────
const AboutSpecial = () => {
  const qc = useQueryClient();
  const specialFlash = useFlashSuccess();
  const SPECIAL_KEYS = ["first", "second", "third", "fourth", "fifth"];
  
  // Use createRef array to avoid hook ordering issues
  const specialImgRefs = useRef(SPECIAL_KEYS.map(() => createRef()));

  const [specialTitle, setSpecialTitle] = useState("");
  const [specialItems, setSpecialItems] = useState(
    SPECIAL_KEYS.map(() => ({ heading: "", subheading: "", existingImage: "", newImage: null, preview: "" }))
  );

  const { data, isLoading } = useQuery({
    queryKey: ["about-main"],
    queryFn: async () => {
      const res = await api.get("/about/main");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setSpecialTitle(data?.specialSection?.title || "");
    setSpecialItems(SPECIAL_KEYS.map(key => ({
      heading:       data?.specialSection?.[key]?.heading || "",
      subheading:    data?.specialSection?.[key]?.subheading || "",
      existingImage: data?.specialSection?.[key]?.image || "",
      newImage: null,
      preview: "",
    })));
  }, [data]);

  const specialMutation = useMutation({
    mutationFn: async () => {
      // New images go straight to Cloudinary from the browser — this avoids
      // routing large photos through the backend's serverless function,
      // which rejects anything over ~4.5MB. Each item's final image URL is
      // resolved up front (new upload or existing URL) before the request.
      const resolvedImages = await Promise.all(
        specialItems.map(async (item) => {
          if (!item.newImage) return item.existingImage;
          const uploaded = await uploadToCloudinary(item.newImage, { folder: "chameri/about" });
          return uploaded.url;
        })
      );

      const payload = { specialTitle };
      SPECIAL_KEYS.forEach((key, i) => {
        payload[`${key}Heading`] = specialItems[i].heading;
        payload[`${key}Subheading`] = specialItems[i].subheading;
        payload[`${key}Image`] = resolvedImages[i];
      });

      return api.put("/about/main/special-section", payload);
    },
    onSuccess: () => {
      specialFlash.flash();
      setSpecialItems(prev => prev.map(item => ({ ...item, newImage: null, preview: "" })));
      qc.invalidateQueries(["about-main"]);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save Special Section"),
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
        <h1 className="text-2xl font-bold text-white">About Us — Special Section</h1>
        <p className="text-gray-400 text-sm mt-1">Manage the "What Makes Us Special" content for the About page.</p>
      </div>

      <FormCard
        title="Special Section"
        icon={ImageIcon}
        onSave={() => specialMutation.mutate()}
        isSaving={specialMutation.isLoading}
        saved={specialFlash.saved}
      >
        <InputField
          label="Section Title"
          value={specialTitle}
          onChange={e => setSpecialTitle(e.target.value)}
          placeholder="e.g. What Makes Us Special"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
          {SPECIAL_KEYS.map((key, i) => (
            <div key={key} className="space-y-4 p-5 rounded-2xl bg-gray-50/70 border border-gray-100">
              <p className="text-xs font-black uppercase tracking-widest text-brand-500">{key}</p>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Image</label>
                <div
                  onClick={() => specialImgRefs.current[i].current?.click()}
                  className="relative w-full h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group"
                >
                  {(specialItems[i].preview || specialItems[i].existingImage) ? (
                    <>
                      <img
                        src={specialItems[i].preview || specialItems[i].existingImage}
                        alt={key}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                        <UploadCloud size={18} className="mb-1" />
                        <span className="text-xs font-semibold">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <UploadCloud size={18} className="mx-auto mb-1 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">Click to upload</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={specialImgRefs.current[i]}
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files[0];
                    if (!f) return;
                    setSpecialItems(prev => prev.map((item, idx) =>
                      idx === i ? { ...item, newImage: f, preview: URL.createObjectURL(f) } : item
                    ));
                  }}
                />
              </div>

              <InputField
                label="Heading"
                value={specialItems[i].heading}
                onChange={e => setSpecialItems(prev => prev.map((item, idx) =>
                  idx === i ? { ...item, heading: e.target.value } : item
                ))}
                placeholder="e.g. Expert Team"
              />
              <InputField
                label="Subheading"
                value={specialItems[i].subheading}
                onChange={e => setSpecialItems(prev => prev.map((item, idx) =>
                  idx === i ? { ...item, subheading: e.target.value } : item
                ))}
                placeholder="e.g. Skilled professionals dedicated to your project"
              />
            </div>
          ))}
        </div>
      </FormCard>
    </div>
  );
};

export default AboutSpecial;
