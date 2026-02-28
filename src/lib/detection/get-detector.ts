import { createDeepsecureDetector } from "@/src/lib/detection/deepsecure-detector";

export const getDetectionProvider = () => {
  const endpoint =
    process.env.DEEPSECURE_DETECTOR_ENDPOINT || "http://localhost:8200/detect";

  return createDeepsecureDetector(endpoint);
};

