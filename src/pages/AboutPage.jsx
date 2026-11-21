import MissionVisionSection from '../components/about/MissionVisionSection';
import PressReleasesSection from '../components/about/PressReleasesSection';

export default function AboutPage() {
  return (
    <div className="pt-16 bg-bg">
      {/* Hero Section */}
      <section className="section-padding">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
            {/* Left: Text */}
            <div className="flex flex-col justify-center">
              <p className="text-xs font-medium text-text-main mb-3">Welcome to Finora</p>
              <h1 className="text-4xl md:text-5xl font-bold text-text-main leading-tight mb-5">
                Where Banking Meets<br />
                <span className="text-primary">Excellence!</span>
              </h1>
              <p className="text-sm text-text-muted leading-relaxed max-w-lg">
                At Finora, we believe that banking should be more than just transactions. It should be an experience that empowers individuals and businesses to thrive and reach their financial goals. As a trusted financial institution, we are committed to delivering exceptional banking services that go beyond expectations. With a focus on innovation, personalized solutions, and unwavering integrity, we strive to provide the best banking experience for our valued customers. Join us on this exciting journey and discover a new level of banking excellence.
              </p>
            </div>
            {/* Right: Image */}
            <div className="bg-[#151515] rounded-3xl md:rounded-[40px] border border-border p-6 md:p-10 relative">
              {/* Dotted accent */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-30 pointer-events-none z-0 overflow-hidden rounded-tr-[40px]" aria-hidden>
                <svg width="100%" height="100%" fill="none">
                  <pattern id="dots-about-hero" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.5" fill="#c5f82a" />
                  </pattern>
                  <rect x="0" y="0" width="100%" height="100%" fill="url(#dots-about-hero)" />
                </svg>
              </div>
              <div className="relative z-10 h-full rounded-tr-[30px] rounded-bl-[30px] rounded-tl-lg rounded-br-lg overflow-hidden bg-surface-2 border border-border">
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&auto=format&fit=crop&q=80"
                  alt="Finora team"
                  className="w-full h-full min-h-[400px] object-cover grayscale opacity-80"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <MissionVisionSection />
      <PressReleasesSection />
    </div>
  );
}
