import Link from "next/link";

const HomePage = () => {
  return (
    <main className="max-w-screen-4xl mx-auto flex h-full w-full flex-col justify-center px-6 py-5 sm:px-10 sm:py-6">
      <section className="mx-auto grid w-full max-w-5xl gap-4">
        <div className="rounded-3xl border border-border-subtle bg-surface px-6 py-6 sm:px-8 sm:py-7">
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Built for{" "}
            <span className="text-primary-500">real photos</span>
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted sm:text-lg sm:leading-9">
            Use a model to check if a photo is AI generated or real
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              className="rounded-2xl bg-primary-500 px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-primary-700"
              href="/protect"
            >
              Sign a Photo
            </Link>
            <Link
              className="rounded-2xl border border-border-subtle bg-surface-strong px-5 py-4 text-center text-sm font-semibold text-foreground transition hover:border-primary-300"
              href="/verify"
            >
              Check a Photo
            </Link>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl border border-border-subtle bg-surface px-5 py-5">
            <p className="text-sm font-semibold text-foreground">Upload</p>
            <p className="mt-2 text-sm leading-7 text-muted">
              Pick a photo or drag it in.
            </p>
          </div>
          <div className="rounded-3xl border border-border-subtle bg-surface px-5 py-5">
            <p className="text-sm font-semibold text-foreground">Sign</p>
            <p className="mt-2 text-sm leading-7 text-muted">
              Download the signed PNG copy.
            </p>
          </div>
          <div className="rounded-3xl border border-border-subtle bg-surface px-5 py-5">
            <p className="text-sm font-semibold text-foreground">Verify</p>
            <p className="mt-2 text-sm leading-7 text-muted">
              Re-upload it later to confirm it still matches.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
