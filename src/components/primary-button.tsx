import { Loader } from "@/src/components/loader";

interface PrimaryButtonProps {
  label: string;
  isLoading: boolean;
  isDisabled: boolean;
  type?: "button" | "submit";
}

export const PrimaryButton = ({
  label,
  isLoading,
  isDisabled,
  type = "button"
}: PrimaryButtonProps) => {
  return (
    <button
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300 disabled:text-white/80"
      disabled={isDisabled}
      type={type}
    >
      {isLoading ? (
        <>
          <Loader />
          <span>{label}</span>
        </>
      ) : (
        label
      )}
    </button>
  );
};
