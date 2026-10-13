import React from "react";
import { UploadCloud, Video, MonitorPlay } from "lucide-react";
import { MEDIA_TYPES, getYoutubeId, youtubeThumb } from "../lib/cardMedia";

/**
 * The card-media control: a type switcher plus whichever input matches the
 * selected type (image upload, video upload, or a YouTube URL).
 *
 * Field names differ per page (Home/Services use cardImage/cardVideo/
 * cardYoutubeUrl, Client Review uses cardImage/video/youtubeUrl), so the
 * caller passes the resolved values and change handlers rather than the card.
 */
export default function CardMediaPicker({
  label = "Card Media",
  mediaType,
  onMediaTypeChange,

  imagePreview,
  existingImage,
  onImageChange,

  videoPreview,
  existingVideo,
  onVideoChange,

  youtubeUrl,
  onYoutubeUrlChange,

  // Optional cover shown on the public card for video/YouTube media, in
  // place of the video frame or YouTube's auto thumbnail. Omit
  // onCoverChange to hide the control.
  coverPreview,
  existingCover,
  onCoverChange,
  onCoverRemove,

  // Optional portrait cover used on phone-width screens; the site falls back
  // to the desktop cover when it is empty. Omit onMobileCoverChange to hide.
  mobileCoverPreview,
  existingMobileCover,
  onMobileCoverChange,
  onMobileCoverRemove,
}) {
  const activeType = mediaType || "image";
  const youtubeId = getYoutubeId(youtubeUrl);
  const cover = coverPreview || existingCover;

  return (
    <div className="pt-2">
      <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
        {label}
      </label>

      {/* Type switcher */}
      <div className="flex gap-1.5 mb-3 p-1 bg-gray-100 rounded-xl">
        {MEDIA_TYPES.map(({ id, label: typeLabel, icon: TypeIcon }) => {
          const active = activeType === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onMediaTypeChange(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <TypeIcon size={14} />
              {typeLabel}
            </button>
          );
        })}
      </div>

      {/* ── Image ── */}
      {activeType === "image" && (
        <div className="relative w-full h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group/cardimg">
          {imagePreview || existingImage ? (
            <>
              <img
                src={imagePreview || existingImage}
                alt="Card media"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cardimg:opacity-100 transition-opacity flex items-center justify-center text-white">
                <UploadCloud size={20} />
              </div>
            </>
          ) : (
            <div className="text-center">
              <UploadCloud size={20} className="mx-auto mb-2 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Upload Card Image</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onChange={(e) => onImageChange(e.target.files[0])}
          />
        </div>
      )}

      {/* ── Video ── */}
      {activeType === "video" && (
        <div className="relative w-full h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group/cardvid">
          {videoPreview || existingVideo ? (
            <>
              {/* muted + playsInline so the preview never blares audio in the panel */}
              <video
                src={videoPreview || existingVideo}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cardvid:opacity-100 transition-opacity flex items-center justify-center text-white">
                <UploadCloud size={20} />
              </div>
            </>
          ) : (
            <div className="text-center px-3">
              <Video size={20} className="mx-auto mb-2 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Upload Card Video</span>
              <span className="block text-[10px] text-gray-400 mt-0.5">MP4 or WebM, max 100MB</span>
            </div>
          )}
          <input
            type="file"
            accept="video/*"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            onChange={(e) => onVideoChange(e.target.files[0])}
          />
        </div>
      )}

      {/* ── YouTube ── */}
      {activeType === "youtube" && (
        <div className="space-y-2">
          <input
            type="url"
            value={youtubeUrl || ""}
            onChange={(e) => onYoutubeUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
          />
          {youtubeUrl && !youtubeId && (
            <p className="text-xs font-medium text-red-500">
              That doesn&apos;t look like a YouTube link.
            </p>
          )}
          {youtubeId && (
            <div className="relative w-full h-32 rounded-xl overflow-hidden bg-black">
              {/* Preview what the site will actually show: the custom cover
                  if one is set, otherwise YouTube's own thumbnail. */}
              <img
                src={cover || youtubeThumb(youtubeId)}
                alt="YouTube thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                  <MonitorPlay size={20} className="text-white" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Cover images (video / YouTube only) ──
          Desktop is landscape and always applies; Mobile is an optional
          portrait crop used on phone-width screens instead. */}
      {onCoverChange && (activeType === "video" || activeType === "youtube") && (
        <div className="mt-3">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">
            Cover Image <span className="normal-case tracking-normal font-medium">(optional)</span>
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
            <CoverSlot
              title="Desktop"
              hint={
                activeType === "youtube"
                  ? "Shown instead of YouTube's thumbnail"
                  : "Shown until the video is played"
              }
              src={cover}
              onChange={onCoverChange}
              onRemove={onCoverRemove}
              boxClass="w-full h-32"
            />
            {onMobileCoverChange && (
              <CoverSlot
                title="Mobile"
                hint="Portrait · falls back to desktop"
                src={mobileCoverPreview || existingMobileCover}
                onChange={onMobileCoverChange}
                onRemove={onMobileCoverRemove}
                // Phone cards are portrait, so preview at roughly their shape.
                boxClass="w-24 h-32"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CoverSlot({ title, hint, src, onChange, onRemove, boxClass }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1 gap-2">
        <span className="text-[11px] font-semibold text-gray-500">{title}</span>
        {src && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] font-semibold text-red-500 hover:text-red-600"
          >
            Remove
          </button>
        )}
      </div>
      <div
        className={`relative ${boxClass} rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-brand-300 transition-colors overflow-hidden group/cover`}
      >
        {src ? (
          <>
            <img src={src} alt={`${title} cover`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <UploadCloud size={20} />
            </div>
          </>
        ) : (
          <div className="text-center px-2">
            <UploadCloud size={20} className="mx-auto mb-2 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Upload</span>
            <span className="block text-[10px] text-gray-400 mt-0.5 leading-tight">{hint}</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          onChange={(e) => {
            onChange(e.target.files[0]);
            // Reset so re-picking the same file after Remove still fires.
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
