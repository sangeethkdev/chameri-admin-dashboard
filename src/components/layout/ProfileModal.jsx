import { useState, useRef } from "react";
import { X, ShieldCheck, Camera, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import toast from "react-hot-toast";
import { uploadToCloudinary } from "../../lib/cloudinaryUpload";

const ProfileModal = ({ onClose }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [name, setName] = useState(admin?.name || "");
  const [displayName, setDisplayName] = useState(admin?.name || "");
  const [avatarPreview, setAvatarPreview] = useState(admin?.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Avatar goes straight to Cloudinary from the browser — this avoids
      // routing it through the backend's serverless function, which rejects
      // anything over ~4.5MB.
      let avatarUrl;
      if (avatarFile) {
        const uploaded = await uploadToCloudinary(avatarFile, { folder: "chameri/general" });
        avatarUrl = uploaded.url;
      }

      const { data } = await api.put("/auth/update-profile", {
        name: displayName,
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
      });

      // Update local storage with fresh data from server
      localStorage.setItem("chameri_admin", JSON.stringify(data.admin));
      toast.success("Profile updated!");
      onClose();
      window.location.reload(); // refresh header name/avatar
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Card */}
        <div
          className="bg-white rounded-3xl w-full max-w-sm p-6 relative shadow-2xl animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-5">My Profile</h2>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold">
                    {admin?.name?.[0]?.toUpperCase() || "A"}
                  </div>
                )}
              </div>
              {/* Camera overlay */}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Camera size={13} className="text-white" />
              </button>
            </div>
            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm text-gray-400 underline mt-2 hover:text-gray-600 transition-colors"
            >
              Change Photo
            </button>
          </div>

          {/* Role Badge */}
          <div className="flex justify-center mb-5">
            <span className="flex items-center gap-1.5 border border-red-300 text-red-500 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
              <ShieldCheck size={13} />
              {"Admin"} Account
            </span>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            {/* Login Username (email — read only) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
                Login Username
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 text-sm">
                {admin?.email}
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm outline-none focus:border-gray-400 transition-colors"
                placeholder="Your display name"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                This name is shown in the dashboard header.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-2xl hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : "Save Changes"}
            </button>

            <button
              onClick={handleSignOut}
              className="w-full bg-red-50 text-red-500 font-bold py-3.5 rounded-2xl hover:bg-red-100 transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileModal;
