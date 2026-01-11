import heic2any from "heic2any";

export interface MediaFile {
  name: string;
  handle: FileSystemFileHandle;
  type: "image" | "video";
  blobUrl?: string;
}

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "heic",
  "tiff",
  "tif",
  "bmp",
]);

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm", "m4v", "avi"]);

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function isImage(filename: string): boolean {
  return IMAGE_EXTENSIONS.has(getExtension(filename));
}

function isVideo(filename: string): boolean {
  return VIDEO_EXTENSIONS.has(getExtension(filename));
}

function isHeic(filename: string): boolean {
  return getExtension(filename) === "heic";
}

export async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle
): Promise<MediaFile[]> {
  const files: MediaFile[] = [];

  async function scan(handle: FileSystemDirectoryHandle) {
    for await (const entry of handle.values()) {
      if (entry.kind === "file") {
        const name = entry.name;
        if (isImage(name)) {
          files.push({ name, handle: entry, type: "image" });
        } else if (isVideo(name)) {
          files.push({ name, handle: entry, type: "video" });
        }
      } else if (entry.kind === "directory") {
        await scan(entry);
      }
    }
  }

  await scan(dirHandle);
  return files;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const blobUrlCache = new Map<string, string>();

export async function loadMediaUrl(file: MediaFile): Promise<string> {
  if (file.blobUrl) {
    return file.blobUrl;
  }

  const cached = blobUrlCache.get(file.name);
  if (cached) {
    file.blobUrl = cached;
    return cached;
  }

  const fileData = await file.handle.getFile();
  let blob: Blob = fileData;

  if (isHeic(file.name)) {
    try {
      const converted = await heic2any({
        blob: fileData,
        toType: "image/jpeg",
        quality: 0.9,
      });
      blob = Array.isArray(converted) ? converted[0] : converted;
    } catch (err) {
      console.error(`Failed to convert HEIC file ${file.name}:`, err);
      throw err;
    }
  }

  const url = URL.createObjectURL(blob);
  file.blobUrl = url;
  blobUrlCache.set(file.name, url);
  return url;
}

export async function preloadMedia(
  files: MediaFile[],
  currentIndex: number,
  count: number = 3
): Promise<void> {
  const toPreload: MediaFile[] = [];

  for (let i = 1; i <= count; i++) {
    const index = (currentIndex + i) % files.length;
    if (!files[index].blobUrl) {
      toPreload.push(files[index]);
    }
  }

  await Promise.all(
    toPreload.map((file) =>
      loadMediaUrl(file).catch((err) =>
        console.warn(`Preload failed for ${file.name}:`, err)
      )
    )
  );
}
