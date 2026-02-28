import "./globals.css";
import { SiteShell } from "@/src/components/site-shell";

export const metadata = {
  title: "DeepShield",
  description: "Sign authentic images and verify image integrity before they spread."
};

const RootLayout = ({
  children
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
};

export default RootLayout;
