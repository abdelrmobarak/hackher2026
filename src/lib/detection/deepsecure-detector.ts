import {
  DetectionAssessment,
  DetectionProvider
} from "@/src/lib/detection/detector-interface";

interface UnknownRecord {
  [key: string]: unknown;
}

const toRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const normalizedRecord: UnknownRecord = {};

  for (const [recordKey, recordValue] of Object.entries(value)) {
    normalizedRecord[recordKey] = recordValue;
  }

  return normalizedRecord;
};

const getStringValue = (
  value: UnknownRecord | null,
  key: string
): string | null => {
  if (!value) {
    return null;
  }

  const fieldValue = Reflect.get(value, key);

  return typeof fieldValue === "string" ? fieldValue : null;
};

const getNumberValue = (
  value: UnknownRecord | null,
  key: string
): number | null => {
  if (!value) {
    return null;
  }

  const fieldValue = Reflect.get(value, key);

  return typeof fieldValue === "number" ? fieldValue : null;
};

const clampConfidence = (value: number) => {
  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
};

const normalizeResponse = (responseData: unknown): DetectionAssessment => {
  const rootRecord = toRecord(responseData);
  const labelValue =
    getStringValue(rootRecord, "label") ||
    getStringValue(rootRecord, "top_label") ||
    "real";
  const normalizedLabel = labelValue.toLowerCase();
  const primaryScore = getNumberValue(rootRecord, "score");
  const confidenceScore = getNumberValue(rootRecord, "confidence");
  const aiConfidenceScore = getNumberValue(rootRecord, "ai_confidence");
  const authenticConfidenceScore = getNumberValue(
    rootRecord,
    "authentic_confidence"
  );
  const scoreValue =
    primaryScore === null
      ? confidenceScore === null
        ? 0.5
        : confidenceScore
      : primaryScore;
  const normalizedAiConfidence = clampConfidence(
    aiConfidenceScore === null
      ? normalizedLabel.includes("fake") || normalizedLabel.includes("deepfake")
        ? scoreValue
        : 1 - scoreValue
      : aiConfidenceScore
  );
  const normalizedAuthenticConfidence = clampConfidence(
    authenticConfidenceScore === null ? 1 - normalizedAiConfidence : authenticConfidenceScore
  );
  const isLikelyAiGenerated =
    normalizedAiConfidence >= normalizedAuthenticConfidence;

  return {
    verdict: isLikelyAiGenerated ? "likely-ai" : "likely-authentic",
    confidence: normalizedAiConfidence,
    aiConfidence: normalizedAiConfidence,
    authenticConfidence: normalizedAuthenticConfidence,
    source: "detector",
    summary: isLikelyAiGenerated
      ? "This unsigned image is likely AI-generated and should be treated as suspicious."
      : "This unsigned image is likely authentic."
  };
};

export const createDeepsecureDetector = (endpoint: string): DetectionProvider => {
  return {
    detectImage: async (
      imageBuffer: Buffer,
      contentType?: string
    ): Promise<DetectionAssessment> => {
      const formData = new FormData();
      const imageBytes = Uint8Array.from(imageBuffer);
      const fileType = contentType || "image/png";

      formData.set(
        "file",
        new Blob([imageBytes], { type: fileType }),
        "unsigned-image.png"
      );

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("The detector did not return a valid response.");
      }

      const responseJson: unknown = await response.json();

      return normalizeResponse(responseJson);
    }
  };
};
