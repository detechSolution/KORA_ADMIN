import * as z from "zod";

const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const videoTypes = ["video/mp4", "video/mpeg", "video/quicktime", "video/webm", "video/x-msvideo"];

function mediaSchema(kind: "image" | "video") {
  return z.union([z.string(), z.instanceof(File)]).nullish().superRefine((value, ctx) => {
    if (!(value instanceof File))
      return;
    const allowedTypes = kind === "image" ? imageTypes : videoTypes;
    const limitMB = kind === "image" ? 2 : 100;
    if (!allowedTypes.includes(value.type)) {
      ctx.addIssue({
        code: "custom",
        message: kind === "image"
          ? "Banner image must be JPG, JPEG, PNG, WEBP, or GIF."
          : "Banner video must be MP4, MPEG, MOV, WEBM, or AVI.",
      });
    }
    if (value.size > limitMB * 1024 * 1024) {
      ctx.addIssue({ code: "custom", message: `Banner ${kind} exceeds the ${limitMB}MB size limit.` });
    }
  });
}

export const sessionBannerImageSchema = mediaSchema("image");
export const sessionBannerVideoSchema = mediaSchema("video");

export function appendSessionMedia(
  data: FormData,
  field: "file" | "video",
  value: File | string | null | undefined,
  updating = false,
) {
  if (value instanceof File) {
    data.append(field, value);
  }
  else if (typeof value === "string" && value.trim()) {
    data.append(`${field}Url`, value);
  }
  else if (updating && (value === null || value === "")) {
    data.append(`${field}Url`, "");
  }
}
