import "./globals.css";

export const metadata = {
  title: "Sentinel — Universal License Authority & Kill-Switch Controller",
  description: "Enterprise software licensing and remote access management for developers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0B0E14] text-zinc-100 min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}

