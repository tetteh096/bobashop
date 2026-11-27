import Footer from "@/components/footer";
import Header from "@/components/header";

/** The shop: every customer page, with the site header and footer. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
