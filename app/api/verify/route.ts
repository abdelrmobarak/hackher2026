import { getDetectionProvider } from "@/src/lib/detection/get-detector";
import { verifyImageSignature } from "@/src/lib/signature";

export const runtime = "nodejs";

const POST = async (request: Request) => {
  const formData = await request.formData();
  const uploadedFile = formData.get("photo");

  if (!(uploadedFile instanceof File)) {
    return Response.json(
      {
        error: "Upload a photo before requesting verification."
      },
      {
        status: 400
      }
    );
  }

  try {
    const imageBuffer = Buffer.from(await uploadedFile.arrayBuffer());
    const signatureCheck = await verifyImageSignature(imageBuffer);

    if (signatureCheck.status !== "unsigned") {
      return Response.json({
        decision:
          signatureCheck.status === "verified" ? "authentic" : "altered",
        source: "signature",
        summary: signatureCheck.summary,
        confidence: 1
      });
    }

    const detectionProvider = getDetectionProvider();
    const detectionAssessment = await detectionProvider.detectImage(
      imageBuffer,
      uploadedFile.type
    );

    return Response.json({
      decision: detectionAssessment.verdict,
      source: detectionAssessment.source,
      summary: detectionAssessment.summary,
      confidence: detectionAssessment.confidence
    });
  } catch {
    return Response.json(
      {
        error: "This file could not be processed for verification."
      },
      {
        status: 400
      }
    );
  }
};

export { POST };
