import HeroSection from '../components/home/HeroSection';
import ProductsSection from '../components/home/ProductsSection';
import UseCasesSection from '../components/home/UseCasesSection';
import FeaturesSection from '../components/home/FeaturesSection';
import FaqSection from '../components/home/FaqSection';
import TestimonialsSection from '../components/home/TestimonialsSection';

export default function HomePage() {
  return (
    <div className="home-page">
      <HeroSection />
      <ProductsSection />
      <UseCasesSection />
      <FeaturesSection />
      <FaqSection />
      <TestimonialsSection />
    </div>
  );
}
