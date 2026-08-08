import api from "../api/axiosInstance";

/**
 * Uploads a file straight from the browser to Cloudinary, bypassing this
 * app's own backend entirely.
 *
 * Why: the backend runs as a Vercel serverless function, which has a hard
 * ~4.5MB request body limit enforced by the platform itself — any photo or
 * video over that gets rejected before our Express app (and its CORS
 * headers) ever run, which the browser then misreports as a CORS error.
 * Uploading directly to Cloudinary sidesteps that ceiling completely: the
 * backend only ever hands out a short-lived signature (see
 * POST /api/uploads/signature), never touches the file bytes.
 *
 * @param {File} file
 * @param {{ folder: string, resourceType?: 'image' | 'video' | 'auto' }} options
 *   `folder` must match the backend's `chameri/<segment>` allow-list.
 * @returns {Promise<{ url: string, publicId: string, bytes: number }>}
 */
export async function uploadToCloudinary(file, { folder, resourceType = "image" }) {
  const { data: sig } = await api.post("/uploads/signature", { folder, resourceType });
  const { timestamp, signature, apiKey, cloudName, transformation } = sig.data;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  if (transformation) form.append("transformation", transformation);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: form }
  );
  const result = await res.json();

  if (!res.ok) {
    throw new Error(result?.error?.message || "Upload to Cloudinary failed");
  }

  return { url: result.secure_url, publicId: result.public_id, bytes: result.bytes };
}
