import { mkdir, writeFile, readFile } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";

const ROOT = process.env.FILE_STORAGE_DIR ?? join(process.cwd(), "data", "files");
export const MAX_UPLOAD = Number(process.env.FILE_UPLOAD_MAX ?? 10 * 1024 * 1024); // 10MB

export async function saveUpload(file: File): Promise<{
  originalName: string;
  storedName: string;
  contentType: string;
  size: number;
}> {
  const buf = Buffer.from(await file.arrayBuffer());
  const storedName = `${randomUUID()}${extname(file.name)}`;
  await mkdir(ROOT, { recursive: true });
  await writeFile(join(ROOT, storedName), buf);
  return {
    originalName: file.name,
    storedName,
    contentType: file.type || "application/octet-stream",
    size: buf.length,
  };
}

export function readStored(storedName: string): Promise<Buffer> {
  // storedName은 UUID 기반이라 경로 탈출 위험이 없지만 방어적으로 basename만 사용.
  const safe = storedName.replace(/[/\\]/g, "");
  return readFile(join(ROOT, safe));
}
