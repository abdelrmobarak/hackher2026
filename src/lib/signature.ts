import crypto from "node:crypto";
import sharp from "sharp";
import { extractTextValue, insertTextValue } from "@/src/lib/png-metadata";

interface SignaturePayload {
  version: string;
  algorithm: string;
  width: number;
  height: number;
  pixelHash: string;
  signedAt: string;
}

interface SignedEnvelope {
  signature: string;
  signaturePayload: SignaturePayload;
}

interface ImageDigest {
  pixelHash: string;
  width: number;
  height: number;
}

interface SignImageResult {
  signature: string;
  signaturePayload: SignaturePayload;
  signedImageBuffer: Buffer;
}

interface SignatureCheckResult {
  status: string;
  summary: string;
  signaturePayload: SignaturePayload | null;
}

const metadataKey = "deep-shield-signature";

const getSigningSecret = () => {
  return process.env.IMAGE_SIGNING_SECRET || "local-development-secret";
};

const createImageDigest = async (imageBuffer: Buffer): Promise<ImageDigest> => {
  const rawImage = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({
      resolveWithObject: true
    });
  const hash = crypto.createHash("sha256");

  hash.update(
    Buffer.from(
      `${rawImage.info.width}:${rawImage.info.height}:${rawImage.info.channels}:`
    )
  );
  hash.update(rawImage.data);

  return {
    pixelHash: hash.digest("hex"),
    width: rawImage.info.width,
    height: rawImage.info.height
  };
};

const normalizeImageToPng = async (imageBuffer: Buffer) => {
  return sharp(imageBuffer).ensureAlpha().png().toBuffer();
};

const serializePayload = (signaturePayload: SignaturePayload) => {
  return JSON.stringify({
    version: signaturePayload.version,
    algorithm: signaturePayload.algorithm,
    width: signaturePayload.width,
    height: signaturePayload.height,
    pixelHash: signaturePayload.pixelHash,
    signedAt: signaturePayload.signedAt
  });
};

const createSignature = (signaturePayload: SignaturePayload) => {
  return crypto
    .createHmac("sha256", getSigningSecret())
    .update(serializePayload(signaturePayload))
    .digest("hex");
};

const createSignedEnvelope = (
  signaturePayload: SignaturePayload
): SignedEnvelope => {
  return {
    signature: createSignature(signaturePayload),
    signaturePayload
  };
};

const parseSignedEnvelope = (
  serializedEnvelope: string
): SignedEnvelope | null => {
  if (!serializedEnvelope) {
    return null;
  }

  let parsedValue: unknown = null;

  try {
    parsedValue = JSON.parse(serializedEnvelope);
  } catch {
    return null;
  }

  if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
    return null;
  }

  const signatureValue = Reflect.get(parsedValue, "signature");
  const signaturePayloadValue = Reflect.get(parsedValue, "signaturePayload");

  if (
    typeof signatureValue !== "string" ||
    !signaturePayloadValue ||
    typeof signaturePayloadValue !== "object" ||
    Array.isArray(signaturePayloadValue)
  ) {
    return null;
  }

  const versionValue = Reflect.get(signaturePayloadValue, "version");
  const algorithmValue = Reflect.get(signaturePayloadValue, "algorithm");
  const widthValue = Reflect.get(signaturePayloadValue, "width");
  const heightValue = Reflect.get(signaturePayloadValue, "height");
  const pixelHashValue = Reflect.get(signaturePayloadValue, "pixelHash");
  const signedAtValue = Reflect.get(signaturePayloadValue, "signedAt");

  if (
    typeof versionValue !== "string" ||
    typeof algorithmValue !== "string" ||
    typeof widthValue !== "number" ||
    typeof heightValue !== "number" ||
    typeof pixelHashValue !== "string" ||
    typeof signedAtValue !== "string"
  ) {
    return null;
  }

  return {
    signature: signatureValue,
    signaturePayload: {
      version: versionValue,
      algorithm: algorithmValue,
      width: widthValue,
      height: heightValue,
      pixelHash: pixelHashValue,
      signedAt: signedAtValue
    }
  };
};

const signaturesMatch = (expectedSignature: string, receivedSignature: string) => {
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(receivedSignature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

export const signImageBuffer = async (
  imageBuffer: Buffer
): Promise<SignImageResult> => {
  const normalizedImageBuffer = await normalizeImageToPng(imageBuffer);
  const imageDigest = await createImageDigest(normalizedImageBuffer);
  const signaturePayload: SignaturePayload = {
    version: "1",
    algorithm: "sha256+hmac-sha256",
    width: imageDigest.width,
    height: imageDigest.height,
    pixelHash: imageDigest.pixelHash,
    signedAt: new Date().toISOString()
  };
  const signedEnvelope = createSignedEnvelope(signaturePayload);
  const signedImageBuffer = insertTextValue(
    normalizedImageBuffer,
    metadataKey,
    JSON.stringify(signedEnvelope)
  );

  return {
    signature: signedEnvelope.signature,
    signaturePayload: signedEnvelope.signaturePayload,
    signedImageBuffer
  };
};

export const verifyImageSignature = async (
  imageBuffer: Buffer
): Promise<SignatureCheckResult> => {
  let serializedEnvelope = "";

  try {
    serializedEnvelope = extractTextValue(imageBuffer, metadataKey);
  } catch {
    return {
      status: "unsigned",
      summary:
        "No valid embedded signature was found, so this image cannot be verified as authentic.",
      signaturePayload: null
    };
  }

  if (!serializedEnvelope) {
    return {
      status: "unsigned",
      summary:
        "No valid embedded signature was found, so this image cannot be verified as authentic.",
      signaturePayload: null
    };
  }

  const signedEnvelope = parseSignedEnvelope(serializedEnvelope);

  if (!signedEnvelope) {
    return {
      status: "tampered",
      summary:
        "A signature block was detected, but the payload is malformed and cannot be trusted.",
      signaturePayload: null
    };
  }

  const expectedSignature = createSignature(signedEnvelope.signaturePayload);
  const imageDigest = await createImageDigest(imageBuffer);
  const digestMatches = imageDigest.pixelHash === signedEnvelope.signaturePayload.pixelHash;
  const signatureMatches = signaturesMatch(
    expectedSignature,
    signedEnvelope.signature
  );

  if (digestMatches && signatureMatches) {
    return {
      status: "verified",
      summary:
        "The embedded signature is valid and the current image pixels match the original signed version.",
      signaturePayload: signedEnvelope.signaturePayload
    };
  }

  return {
    status: "tampered",
    summary:
      "A signature was found, but the current pixels no longer match the signed record.",
    signaturePayload: signedEnvelope.signaturePayload
  };
};
