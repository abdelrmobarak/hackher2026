export interface DetectionAssessment {
  verdict: string;
  confidence: number;
  source: string;
  summary: string;
}

export interface DetectionProvider {
  detectImage: (
    imageBuffer: Buffer,
    contentType?: string
  ) => Promise<DetectionAssessment>;
}

