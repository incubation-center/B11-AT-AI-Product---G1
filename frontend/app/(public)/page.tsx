import { headers } from "next/headers";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Navbar } from "@/components/navbar";
import { Pricing } from "@/components/pricing";
import { PublicStorefront } from "@/components/storefront/public-storefront";
import { extractStoreSubdomain, getStorefrontBySubdomain } from "@/lib/storefront";

export default async function Home() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  const subdomain = extractStoreSubdomain(host);

  if (subdomain) {
    const storefront = await getStorefrontBySubdomain(subdomain);

    if (storefront?.store) {
      return <PublicStorefront store={storefront.store} products={storefront.products} />;
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#002e6b]">
      <Navbar />
      <main className="pt-20">
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
