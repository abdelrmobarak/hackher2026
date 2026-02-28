interface LoaderProps {
  tone?: string;
}

export const Loader = ({ tone = "dark" }: LoaderProps) => {
  const spinnerClassName =
    tone === "light"
      ? "inline-block h-4 w-4 animate-spin rounded-full border-2 border-foreground/30 border-t-foreground"
      : "inline-block h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background";

  return <span aria-hidden className={spinnerClassName} />;
};

