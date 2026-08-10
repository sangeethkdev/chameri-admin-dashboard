import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Loader2, Users, CheckCircle, UploadCloud } from "lucide-react";
import { uploadToCloudinary } from "../lib/cloudinaryUpload";

// --- Custom Hook for flash success ---
const useFlashSuccess = (duration = 2000) => {
  const [saved, setSaved] = useState(false);
  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), duration);
  };
  return { saved, flash };
};

// --- Reusable Form Card Component ---
const FormCard = ({ title, icon: Icon, children, onSave, isSaving, saved }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50 mb-6 relative overflow-hidden transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-brand-600 shadow-sm border border-gray-100">
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">{title}</h2>
      </div>

      <div className="space-y-5">{children}</div>

      <div className="mt-6 flex justify-end items-center gap-3 border-t border-gray-50 pt-5">
        <div
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-green-50 text-green-600 border border-green-100 transition-all duration-300 ease-in-out ${
            saved ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none absolute right-40"
          }`}
        >
          <CheckCircle size={16} /> Saved!
        </div>

        <button
          onClick={onSave}
          disabled={isSaving}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center min-w-[120px] ${
            isSaving
              ? "bg-amber-100 text-amber-700 shadow-inner scale-95 cursor-not-allowed"
              : "bg-brand-600 text-white shadow-md hover:bg-brand-700 hover:shadow-lg active:scale-95"
          }`}
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Section"
          )}
        </button>
      </div>
    </div>
  );
};

// --- Input Field Component ---
const InputField = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 block p-3 transition-colors outline-none"
    />
  </div>
);

// --- Fully Controlled Team Card ---
// No local useState — all data lives in parent. Editing works correctly.
const TeamCardManager = ({ index, cardData, onUpdate }) => {
  const fileInputRef = useRef(null);

  // preview URL only for newly selected file (purely local, doesn't affect save)
  const [preview, setPreview] = useState("");

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    onUpdate({ ...cardData, newImage: f });
    e.target.value = "";
  };

  const displayImage = preview || cardData.image || "";

  return (
    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4 relative">
      <p className="text-xs font-black uppercase tracking-widest text-brand-500 absolute top-4 right-4">
        Card {index}
      </p>

      {/* Image Upload */}
      <div className="pt-6">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
          Profile Image
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative w-full h-40 rounded-xl border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-brand-300 transition-colors overflow-hidden group"
        >
          {displayImage ? (
            <>
              <img
                src={displayImage}
                alt={`Member ${index}`}
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
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Text Fields */}
      <div className="space-y-3 pt-2">
        <InputField
          label="Name"
          value={cardData.name || ""}
          onChange={(e) => onUpdate({ ...cardData, name: e.target.value })}
          placeholder="e.g. John Doe"
        />
        <InputField
          label="Designation"
          value={cardData.designation || ""}
          onChange={(e) => onUpdate({ ...cardData, designation: e.target.value })}
          placeholder="e.g. Senior Architect"
        />
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const CARD_KEYS = ["card1", "card2", "card3", "card4", "card5"];

const emptyCard = () => ({ name: "", designation: "", image: "", newImage: null });

const HomeOurTeam = () => {
  const qc = useQueryClient();
  const teamFlash = useFlashSuccess();

  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [separateCardHeading, setSeparateCardHeading] = useState("");

  const [cardsData, setCardsData] = useState({
    card1: emptyCard(),
    card2: emptyCard(),
    card3: emptyCard(),
    card4: emptyCard(),
    card5: emptyCard(),
  });

  // Fetch Data
  const { data, isLoading } = useQuery({
    queryKey: ["home-main"],
    queryFn: async () => {
      const res = await api.get("/home/main");
      return res.data.data;
    },
  });

  // Seed state from DB data
  useEffect(() => {
    if (!data?.ourTeam) return;
    setHeading(data.ourTeam.heading || "");
    setSubheading(data.ourTeam.subheading || "");
    setSeparateCardHeading(data.ourTeam.separateCard?.heading || "");

    setCardsData({
      card1: { ...emptyCard(), ...data.ourTeam.card1 },
      card2: { ...emptyCard(), ...data.ourTeam.card2 },
      card3: { ...emptyCard(), ...data.ourTeam.card3 },
      card4: { ...emptyCard(), ...data.ourTeam.card4 },
      card5: { ...emptyCard(), ...data.ourTeam.card5 },
    });
  }, [data]);

  const handleCardUpdate = (key, newData) => {
    setCardsData((prev) => ({ ...prev, [key]: newData }));
  };

  // Mutation
  const teamMutation = useMutation({
    mutationFn: async () => {
      // New images go straight to Cloudinary from the browser — this avoids
      // routing large photos through the backend's serverless function,
      // which rejects anything over ~4.5MB.
      const payload = {
        heading,
        subheading,
        separateCardHeading,
      };

      await Promise.all(
        CARD_KEYS.map(async (key) => {
          const card = cardsData[key];
          payload[`${key}Name`] = card.name || "";
          payload[`${key}Designation`] = card.designation || "";
          payload[`${key}Image`] = card.newImage
            ? (await uploadToCloudinary(card.newImage, { folder: "chameri/home" })).url
            : card.image || "";
        })
      );

      return api.put("/home/main/ourteam", payload);
    },
    onSuccess: () => {
      teamFlash.flash();
      qc.invalidateQueries(["home-main"]);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to save Our Team section"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl pb-10">
      {/* Header */}
      <div className="bg-dark-800 p-6 rounded-3xl mb-6 shadow-sm border border-surface-border">
        <h1 className="text-2xl font-bold text-white">Home — Our Team Section</h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage your team members and the "Join Us" highlight card.
        </p>
      </div>

      {/* ── Our Team Section ── */}
      <FormCard
        title="Our Team Details"
        icon={Users}
        onSave={() => teamMutation.mutate()}
        isSaving={teamMutation.isPending}
        saved={teamFlash.saved}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <InputField
            label="Heading"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="e.g. Meet Our Experts"
          />
          <InputField
            label="Subheading"
            value={subheading}
            onChange={(e) => setSubheading(e.target.value)}
            placeholder="e.g. The people behind our success."
          />
        </div>

        <div className="bg-brand-50 border border-brand-100 p-5 rounded-2xl mb-6">
          <h3 className="text-brand-600 font-bold mb-3">Separate Action Card</h3>
          <InputField
            label="Heading"
            value={separateCardHeading}
            onChange={(e) => setSeparateCardHeading(e.target.value)}
            placeholder="e.g. Want to join our team? Apply now!"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {CARD_KEYS.map((key, i) => (
            <TeamCardManager
              key={key}
              index={i + 1}
              cardData={cardsData[key]}
              onUpdate={(newData) => handleCardUpdate(key, newData)}
            />
          ))}
        </div>
      </FormCard>
    </div>
  );
};

export default HomeOurTeam;
