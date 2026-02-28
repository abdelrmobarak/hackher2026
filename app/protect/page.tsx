import { SignWorkbench } from "@/src/components/sign-workbench";

const ProtectPage = () => {
  return (
    <main className="max-w-screen-4xl mx-auto flex h-full w-full flex-col justify-center gap-4 px-6 py-4 sm:px-10 sm:py-5">
      <section className="mx-auto grid w-full max-w-5xl gap-1">
        <p className="text-sm font-medium uppercase tracking-wide text-primary-700">
          Protect
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Create a signed copy in one step.
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">
          Upload one image, then download the signed PNG. Keep that signed copy
          if you want to verify it later.
        </p>
      </section>
      <SignWorkbench />
    </main>
  );
};

export default ProtectPage;
