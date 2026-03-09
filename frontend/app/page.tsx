import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { Pricing } from "@/components/pricing";
import { HowItWorks } from "@/components/how-it-works";

export default function Home() {
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
