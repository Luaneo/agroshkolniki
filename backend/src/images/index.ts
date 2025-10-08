import { db } from "../db/index.js";
import { images } from "../db/schema.js";

const toBase64 = (file: File) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

export async function saveImageToDb(file: File, authorId: number) {
  db.insert(images).values({
    base64Image: (await toBase64(file)) as string,
    filename: file.name,
    authorId,
  });
}

export async function sendImageToModel(file: File) {
  const formData = new FormData();
  const filename = (file as any)?.name ?? "upload.bin";

  formData.append("file", file as any, filename);
  const modelResponse = await fetch("http://foo.bar/upload", {
    method: "POST",
    body: formData,
    // Do not set Content-Type manually; fetch will set correct multipart boundary
  });

  return await modelResponse.json();
}
