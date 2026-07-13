import "./globals.css";

export const metadata = {
  title: "Payment Tracker",
  description: "Contractor payment and invoice tracking dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  );
}
