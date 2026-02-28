"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import { PrimaryButton } from "@/src/components/primary-button";
import { StatusPill } from "@/src/components/status-pill";
import { useFilePreview } from "@/src/hooks/use-file-preview";

interface VerifyResponse {
  decision: string;
  summary: string;
  error?: string;
}

export const VerifyWorkbench = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [requestState, setRequestState] = useState("idle");
  const [responseData, setResponseData] = useState<VerifyResponse | null>(null);
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
      setErrorMessage("Choose a photo before verifying it.");
      return;
    }

    setRequestState("loading");
    setErrorMessage("");
    setResponseData(null);

    const formData = new FormData();
    formData.set("photo", selectedFile);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        body: formData
      });
      const responseJson: VerifyResponse = await response.json();

      if (!response.ok || responseJson.error) {
        setRequestState("error");
        setErrorMessage(
          responseJson.error || "The image could not be verified right now."
        );
        return;
      }

      setResponseData(responseJson);
      setRequestState("success");
    } catch {
      setRequestState("error");
      setErrorMessage("The image could not be verified right now.");
    }
  };

  const isLikelyAi =
    responseData?.decision === "altered" || responseData?.decision === "likely-ai";
  const decisionTone = responseData
    ? isLikelyAi
      ? "warning"
      : "success"
    : "neutral";
  const decisionLabel = responseData
    ? isLikelyAi
      ? "Likely AI"
      : "Unlikely AI"
    : "Awaiting Upload";

  return (
    <section className="mx-auto grid h-full w-full max-w-5xl gap-3 lg:grid-cols-2 items-center justify-center">
      <form
        className="h-full overflow-hidden rounded-3xl border border-border-subtle bg-surface px-5 py-4 sm:px-6"
        onSubmit={submitImage}
      >
        <div className="grid gap-3 lg:h-full lg:content-center">
          <div>
            <p className="text-lg font-semibold text-foreground">
              Add the image you want to check
            </p>
            <p className="mt-1 text-sm leading-7 text-muted">
              Drag and drop or choose a file, then run the check.
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
            label="Check Signature"
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
          <div className="grid h-full content-center justify-items-center gap-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <StatusPill label={decisionLabel} tone={decisionTone} />
            </div>
            {previewSource ? (
              <div className="mx-auto flex h-64 w-full max-w-4xl items-center justify-center rounded-3xl border border-border-subtle bg-surface-strong p-3 sm:h-72">
                <Image
                  alt="Uploaded preview"
                  className="mx-auto h-full w-auto max-w-full rounded-2xl object-contain"
                  height={640}
                  key={previewSource}
                  src={previewSource}
                  unoptimized
                  width={960}
                />
              </div>
            ) : null}
            <p className="text-lg font-semibold text-foreground">
              {responseData.summary}
            </p>
          </div>
        ) : selectedFile ? (
          <div className="grid h-full content-center justify-items-center gap-4 text-center">
            <p className="text-lg font-semibold text-foreground">Ready to check</p>
            {previewSource ? (
              <div className="mx-auto flex h-64 w-full max-w-4xl items-center justify-center rounded-3xl border border-border-subtle bg-surface-strong p-3 sm:h-72">
                <Image
                  alt="Selected image preview"
                  className="mx-auto h-full w-auto max-w-full rounded-2xl object-contain"
                  height={640}
                  key={previewSource}
                  src={previewSource}
                  unoptimized
                  width={960}
                />
              </div>
            ) : null}
            <p className="text-sm leading-7 text-muted">
              Your selected image is queued. Run the check when you are ready.
            </p>
          </div>
        ) : (
          <div className="grid h-full content-center justify-items-center gap-2 text-center">
            <p className="text-lg font-semibold text-foreground">What you will see</p>
            <p className="text-sm leading-7 text-muted">
              You will get a simple result with a short explanation.
            </p>
          </div>
        )}
      </motion.div>
    </section>
  );
};
