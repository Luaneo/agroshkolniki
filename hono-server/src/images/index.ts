import { db } from "../db/index.js";
import { images } from "../db/schema.js";

import { readFile } from "fs/promises";

const toBase64 = async (file: File) => {
  // If file is a Node.js File-like object with a path, use fs to read it
  // Otherwise, if file is a Buffer or has an arrayBuffer method, use that
  if ((file as any).path) {
    const buffer = await readFile((file as any).path);
    return `data:${file.type};base64,${buffer.toString("base64")}`;
  } else if (typeof file.arrayBuffer === "function") {
    const buffer = Buffer.from(await file.arrayBuffer());
    return `data:${file.type};base64,${buffer.toString("base64")}`;
  } else {
    throw new Error("Unsupported file type for base64 conversion");
  }
};

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
  const modelResponse = await fetch(`${process.env.FASTAPI_URL}/analyze_image`, {
    method: "POST",
    body: formData,
  });
}
