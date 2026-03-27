import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import RolesSection from "@/components/RolesSection";
import MarketplaceSection from "@/components/MarketplaceSection";
import DatasetsSection from "@/components/DatasetsSection";
import EscrowSection from "@/components/EscrowSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <RolesSection />
      <MarketplaceSection />
      <DatasetsSection />
      <EscrowSection />
      <FooterSection />
    </div>
  );
};

export default Index;
