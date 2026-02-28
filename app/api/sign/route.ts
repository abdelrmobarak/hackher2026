import { signImageBuffer } from "@/src/lib/signature";

export const runtime = "nodejs";

const POST = async (request: Request) => {
  const formData = await request.formData();
  const uploadedFile = formData.get("photo");

  if (!(uploadedFile instanceof File)) {
    return Response.json(
      {
        error: "Upload a photo before requesting a signature."
      },
      {
        status: 400
      }
    );
  }

  try {
    const imageBuffer = Buffer.from(await uploadedFile.arrayBuffer());
    const signedImage = await signImageBuffer(imageBuffer);

    return Response.json({
      summary:
        "Signature created and embedded in a PNG master file. Keep this file unchanged for later verification.",
      signature: signedImage.signature,
      signaturePayload: signedImage.signaturePayload,
      signedImageBase64: signedImage.signedImageBuffer.toString("base64"),
      filename: `${uploadedFile.name.replace(/\.[^.]+$/, "") || "protected-photo"}-signed.png`
    });
  } catch {
    return Response.json(
      {
        error: "This file could not be processed as an image."
      },
      {
        status: 400
      }
    );
  }
};

export { POST };
