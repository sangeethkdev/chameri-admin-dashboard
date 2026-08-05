import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Save, Loader2, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import RichTextEditor from "../components/RichTextEditor";
import { normalizeToHtml } from "../utils/sanitizeHtml";

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
const AboutStory = () => {
  const qc = useQueryClient();
  const storyFlash = useFlashSuccess();

  const [storyHeading, setStoryHeading] = useState("");
  const [storyDescription, setStoryDescription] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["about-main"],
    queryFn: async () => {
      const res = await api.get("/about/main");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setStoryHeading(data?.story?.heading || "");
    // Legacy rows hold plain text — lift them into HTML so the editor and the
    // website stay in sync from the first save onward.
    setStoryDescription(normalizeToHtml(data?.story?.description || ""));
  }, [data]);

  const storyMutation = useMutation({
    mutationFn: async () => api.put("/about/main/story", { storyHeading, storyDescription }),
    onSuccess: () => {
      storyFlash.flash();
      qc.invalidateQueries(["about-main"]);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save Story section"),
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
      <div className="bg-dark-800 p-6 rounded-3xl mb-6 shadow-sm border border-surface-border">
        <h1 className="text-2xl font-bold text-white">About Us — Story Section</h1>
        <p className="text-gray-400 text-sm mt-1">Manage the story content for the About page.</p>
      </div>

      <FormCard
        title="Story Section"
        icon={ImageIcon}
        onSave={() => storyMutation.mutate()}
        isSaving={storyMutation.isLoading}
        saved={storyFlash.saved}
      >
        <InputField label="Heading" value={storyHeading} onChange={e => setStoryHeading(e.target.value)} placeholder="e.g. Our Story" />
        <RichTextEditor
          label="Description"
          value={storyDescription}
          onChange={setStoryDescription}
          placeholder="Write the story here — use the toolbar for bold, lists, headings and links..."
          minHeight={260}
        />
      </FormCard>
    </div>
  );
};

export default AboutStory;
