"use client";

import { useEffect, useState } from "react";

export const useFilePreview = (selectedFile: File | null) => {
  const [previewSource, setPreviewSource] = useState("");

  useEffect(() => {
    if (!selectedFile) {
      setPreviewSource("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewSource(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  return previewSource;
};
