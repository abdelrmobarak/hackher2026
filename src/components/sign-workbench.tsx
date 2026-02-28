"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import { PrimaryButton } from "@/src/components/primary-button";
import { StatusPill } from "@/src/components/status-pill";
import { useFilePreview } from "@/src/hooks/use-file-preview";

interface SignaturePayloadResponse {
  version: string;
  algorithm: string;
  width: number;
  height: number;
  pixelHash: string;
  signedAt: string;
}

interface SignResponse {
  summary: string;
  signature: string;
  signaturePayload: SignaturePayloadResponse;
  signedImageBase64: string;
  filename: string;
  error?: string;
}

export const SignWorkbench = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [requestState, setRequestState] = useState("idle");
  const [responseData, setResponseData] = useState<SignResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const previewSource = useFilePreview(selectedFile);

  const updateSelectedFile = (nextFile: File | null) => {
    setSelectedFile(nextFile);
    setResponseData(null);
    setRequestState("idle");
    setErrorMessage("");
  };

  const submitImage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage("Choose a photo before generating a signature.");
      return;
    }

    setRequestState("loading");
    setErrorMessage("");
    setResponseData(null);

    const formData = new FormData();
    formData.set("photo", selectedFile);

    try {
      const response = await fetch("/api/sign", {
        method: "POST",
        body: formData
      });
      const responseJson: SignResponse = await response.json();

      if (!response.ok || responseJson.error) {
        setRequestState("error");
        setErrorMessage(
          responseJson.error || "The image could not be signed right now."
        );
        return;
      }

      setResponseData(responseJson);
      setRequestState("success");
    } catch {
      setRequestState("error");
      setErrorMessage("The image could not be signed right now.");
    }
  };

  const signedImageSource = responseData
    ? `data:image/png;base64,${responseData.signedImageBase64}`
    : "";

  return (
    <section className="mx-auto grid h-full w-full max-w-5xl gap-3 lg:grid-cols-2">
      <form
        className="h-full overflow-hidden rounded-3xl border border-border-subtle bg-surface px-5 py-4 sm:px-6"
        onSubmit={submitImage}
      >
        <div className="grid gap-3 lg:h-full lg:content-center">
          <div>
            <p className="text-lg font-semibold text-foreground">
              Add your photo
            </p>
            <p className="mt-1 text-sm leading-7 text-muted">
              Drag and drop or choose an image, then create a signed PNG.
            </p>
          </div>
          <label
            className={`grid gap-3 rounded-3xl border border-dashed px-5 py-5 text-sm font-medium transition ${
              isDragActive
                ? "border-primary-500 bg-primary-50 text-foreground"
                : "border-border-subtle bg-surface-strong text-foreground"
            }`}
          >
            <span>{isDragActive ? "Drop image here" : "Choose an image"}</span>
            <input
              accept="image/*"
              className="block w-full cursor-pointer text-sm text-muted file:mr-4 file:rounded-2xl file:border-0 file:bg-primary-500 file:px-4 file:py-2 file:font-semibold file:text-white"
              onChange={(event) => {
                const nextFile = event.target.files?.item(0);
                updateSelectedFile(nextFile || null);
              }}
              onDragEnter={() => {
                setIsDragActive(true);
              }}
              onDragLeave={() => {
                setIsDragActive(false);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragActive(true);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragActive(false);
                const nextFile = event.dataTransfer.files.item(0);
                updateSelectedFile(nextFile || null);
              }}
              type="file"
            />
            <span className="text-xs text-muted">
              {selectedFile ? selectedFile.name : "No file selected"}
            </span>
          </label>
          {errorMessage ? (
            <p className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
              {errorMessage}
            </p>
          ) : null}
          <PrimaryButton
            isDisabled={!selectedFile || requestState === "loading"}
            isLoading={requestState === "loading"}
            label="Generate Signature"
            type="submit"
          />
        </div>
      </form>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="h-full overflow-hidden rounded-3xl border border-border-subtle bg-surface px-5 py-4 sm:px-6"
        initial={{ opacity: 0, y: 18 }}
      >
        {responseData ? (
          <div className="grid gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <StatusPill label="Signed" tone="success" />
              <a
                className="rounded-2xl border border-border-subtle bg-surface-strong px-4 py-3 text-center text-sm font-semibold text-foreground transition hover:border-primary-300"
                download={responseData.filename}
                href={signedImageSource}
              >
                Download PNG
              </a>
            </div>
            <Image
              alt="Signed preview"
              className="h-72 w-full rounded-3xl border border-border-subtle bg-surface-strong object-contain p-3"
              height={responseData.signaturePayload.height}
              src={signedImageSource}
              unoptimized
              width={responseData.signaturePayload.width}
            />
            <p className="text-sm leading-7 text-muted">{responseData.summary}</p>
            <dl className="grid gap-3 text-sm text-foreground sm:grid-cols-2">
              <div className="rounded-2xl border border-border-subtle bg-surface-strong px-4 py-4">
                <dt className="text-xs uppercase tracking-wide text-muted">
                  Signed at
                </dt>
                <dd className="mt-2 font-medium">
                  {new Date(responseData.signaturePayload.signedAt).toLocaleString()}
                </dd>
              </div>
              <div className="rounded-2xl border border-border-subtle bg-surface-strong px-4 py-4">
                <dt className="text-xs uppercase tracking-wide text-muted">
                  Resolution
                </dt>
                <dd className="mt-2 font-medium">
                  {responseData.signaturePayload.width} x{" "}
                  {responseData.signaturePayload.height}
                </dd>
              </div>
            </dl>
          </div>
        ) : previewSource ? (
          <div className="grid gap-4">
            <p className="text-lg font-semibold text-foreground">Selected preview</p>
            <Image
              alt="Selected image preview"
              className="h-56 w-full rounded-3xl border border-border-subtle bg-surface-strong object-contain p-3 sm:h-64"
              height={640}
              key={previewSource}
              src={previewSource}
              unoptimized
              width={960}
            />
            <p className="text-sm leading-7 text-muted">
              Pick a different file and the preview updates right away.
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            <p className="text-lg font-semibold text-foreground">What happens next</p>
            <p className="text-sm leading-7 text-muted">
              Once you sign a photo, the signed PNG will appear here with a
              download button.
            </p>
          </div>
        )}
      </motion.div>
    </section>
  );
};
