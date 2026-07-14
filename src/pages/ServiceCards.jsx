import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Save, Loader2, LayoutGrid, CheckCircle2, UploadCloud, X } from "lucide-react";

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

// --- Textarea Field ---
const TextareaField = ({ label, value, onChange, placeholder, rows = 3 }) => (
  <div>
    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-500 transition-colors bg-gray-50/50 focus:bg-white resize-y"
    />
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const ServiceCards = () => {
  const qc = useQueryClient();
  const cardsFlash = useFlashSuccess();
  const cardImgRefs = useRef([]);

  const [cardsHeading, setCardsHeading] = useState("");
  const [cardsSubheading, setCardsSubheading] = useState("");
  const [cards, setCards] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ["service-main"],
    queryFn: async () => {
      const res = await api.get("/services/main");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setCardsHeading(data?.cardsSection?.heading || "");
    setCardsSubheading(data?.cardsSection?.subheading || "");
    const dbCards = data?.cardsSection?.cards || [];
    setCards(
      dbCards.map((c) => ({
        heading: c.heading || "",
        subheading: c.subheading || "",
        existingImage: c.image || "",
        newImage: null,
        preview: "",
      }))
    );
  }, [data]);

  const cardsMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("cardsHeading", cardsHeading);
      formData.append("cardsSubheading", cardsSubheading);

      const cardsData = cards.map((c, i) => ({
        heading: c.heading,
        subheading: c.subheading,
        existingImage: c.existingImage,
        newImageIndex: c.newImage ? i : null,
      }));
      formData.append("cardsData", JSON.stringify(cardsData));

      cards.forEach((c) => {
        if (c.newImage) formData.append("cardImages", c.newImage);
      });

      return api.put("/services/main/cards-section", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      cardsFlash.flash();
      setCards((prev) => prev.map((item) => ({ ...item, newImage: null, preview: "" })));
      qc.invalidateQueries(["service-main"]);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save Cards Section"),
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
        <h1 className="text-2xl font-bold text-white">Services — Cards Section</h1>
        <p className="text-gray-400 text-sm mt-1">Manage the services cards list.</p>
      </div>

      <FormCard
        title="Cards Section"
        icon={LayoutGrid}
        onSave={() => cardsMutation.mutate()}
        isSaving={cardsMutation.isPending}
        saved={cardsFlash.saved}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <InputField label="Heading" value={cardsHeading} onChange={e => setCardsHeading(e.target.value)} placeholder="e.g. Our Services" />
          <InputField label="Subheading" value={cardsSubheading} onChange={e => setCardsSubheading(e.target.value)} placeholder="e.g. What we offer" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-2">
          {cards.map((card, i) => (
            <div key={i} className="space-y-4 p-5 rounded-2xl bg-gray-50/70 border border-gray-100 relative">
              <button
                type="button"
                onClick={() => setCards(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove Card"
              >
                <X size={18} />
              </button>
              <p className="text-xs font-black uppercase tracking-widest text-brand-500">
                {String(i + 1).padStart(2, "0")}
              </p>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Image</label>
                <div
                  onClick={() => cardImgRefs.current[i]?.click()}
                  className="relative w-full h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group mx-auto"
                >
                  {(card.preview || card.existingImage) ? (
                    <>
                      <img
                        src={card.preview || card.existingImage}
                        alt={`Card ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                        <UploadCloud size={20} className="mb-1" />
                        <span className="text-xs font-semibold">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <UploadCloud size={20} className="mx-auto mb-2 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">Click to upload</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={el => cardImgRefs.current[i] = el}
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files[0];
                    if (!f) return;
                    setCards(prev => prev.map((item, idx) =>
                      idx === i ? { ...item, newImage: f, preview: URL.createObjectURL(f) } : item
                    ));
                  }}
                />
              </div>

              <InputField
                label="Heading"
                value={card.heading}
                onChange={e => setCards(prev => prev.map((item, idx) =>
                  idx === i ? { ...item, heading: e.target.value } : item
                ))}
                placeholder="e.g. Interior Design"
              />
              <TextareaField
                label="Subheading"
                value={card.subheading}
                onChange={e => setCards(prev => prev.map((item, idx) =>
                  idx === i ? { ...item, subheading: e.target.value } : item
                ))}
                placeholder="e.g. Crafting spaces that inspire..."
                rows={3}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setCards(prev => [...prev, {
              heading: "", subheading: "", existingImage: "", newImage: null, preview: ""
            }]);
          }}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-semibold hover:bg-gray-50 hover:border-brand-300 transition-colors"
        >
          + Add Card
        </button>
      </FormCard>
    </div>
  );
};

export default ServiceCards;
