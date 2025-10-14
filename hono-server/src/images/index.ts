import { v4 as uuidv4 } from "uuid";
import { uploadObjectToS3, type S3ObjectBody } from "./s3.js";

export async function saveImageToS3(image: S3ObjectBody) {
  const key = `${uuidv4()}`;
  await uploadObjectToS3(key, image);
  return key;
}

export async function sendImageToModel(file: File) {
  const formData = new FormData();
  const filename = (file as any)?.name ?? "upload.bin";

  formData.append("file", file as any, filename);
  const modelResponse = await fetch(
    `${process.env.FASTAPI_URL}/analyze_image`,
    {
      method: "POST",
      body: formData,
    }
  );

  return await modelResponse.json();
}
