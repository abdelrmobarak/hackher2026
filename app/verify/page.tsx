import { VerifyWorkbench } from "@/src/components/verify-workbench";

const VerifyPage = () => {
  return (
    <main className="max-w-screen-4xl mx-auto flex h-full w-full flex-col justify-center gap-4 px-6 py-4 sm:px-10 sm:py-5">
      <section className="mx-auto grid w-full max-w-5xl gap-1">
        <p className="text-sm font-medium uppercase tracking-wide text-primary-700">
          Verify
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Check a photo in one step.
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
          Upload an image to check for a digital signature. If there is
          no signature, the app gives a simple likely AI or unlikely AI result.
        </p>
      </section>
      <VerifyWorkbench />
    </main>
  );
};

export default VerifyPage;
