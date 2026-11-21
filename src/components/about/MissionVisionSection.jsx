import missionImg from '../../assets/mission.png';
import visionImg from '../../assets/vision.png';

export default function MissionVisionSection() {
  return (
    <section className="section-padding pt-0">
      <div className="container">
        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">Mission &amp; Vision</h2>
          <p className="text-text-muted text-sm max-w-xl">
            We envision being a leading force in the industry, driven by innovation, integrity, and inclusivity, creating a brighter financial future for individuals and businesses while maintaining a strong commitment to customer satisfaction and community development.
          </p>
        </div>

        {/* Mission Row: Image Left, Text Right */}
        <div className="grid md:grid-cols-2 gap-10 items-center mb-16">
          <div className="bg-[#151515] rounded-3xl md:rounded-[40px] border border-border p-6 md:p-10 relative">
            {/* Dotted accent */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-30 pointer-events-none z-0 overflow-hidden rounded-tr-[40px]" aria-hidden>
              <svg width="100%" height="100%" fill="none">
                <pattern id="dots-mission" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="#c5f82a" />
                </pattern>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#dots-mission)" />
              </svg>
            </div>
            <div className="relative z-10 rounded-tr-[30px] rounded-bl-[30px] rounded-tl-lg rounded-br-lg overflow-hidden border border-border">
              <img
                src={missionImg}
                alt="Mission - growth"
                className="w-full h-80 object-cover opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
          <div className="pl-0 md:pl-8 border-l border-border md:border-none relative">
             {/* Left green accent line */}
            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-border"></div>
            <div className="hidden md:block absolute left-0 top-1/4 bottom-1/4 w-px bg-primary"></div>
            <h3 className="text-3xl font-bold text-text-main mb-4">Mission</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              At Finora, our mission is to empower our customers to achieve financial success. We are dedicated to delivering innovative banking solutions that cater to their unique needs. Through personalized services, expert guidance, and cutting-edge technology, we aim to build strong, lasting relationships with our customers. Our mission is to be their trusted partner, helping them navigate their financial journey and realize their dreams.
            </p>
          </div>
        </div>

        {/* Vision Row: Text Left, Image Right */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="pr-0 md:pr-8 border-r border-border md:border-none relative">
            {/* Right green accent line */}
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-px bg-border"></div>
            <div className="hidden md:block absolute right-0 top-1/4 bottom-1/4 w-px bg-primary"></div>
            <h3 className="text-3xl font-bold text-text-main mb-4">Vision</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Our vision at Finora is to redefine banking by creating a seamless and personalized experience for our customers. We envision a future where banking is accessible, transparent, and tailored to individual preferences. Through continuous innovation and collaboration, we strive to be at the forefront of the industry, setting new standards for customer-centric banking. Our vision is to be the preferred financial institution, known for our unwavering commitment to excellence, trust, and customer satisfaction.
            </p>
          </div>
          <div className="bg-[#151515] rounded-3xl md:rounded-[40px] border border-border p-6 md:p-10 relative">
            {/* Dotted accent */}
            <div className="absolute bottom-0 left-0 w-32 h-32 opacity-30 pointer-events-none z-0 overflow-hidden rounded-bl-[40px]" aria-hidden>
              <svg width="100%" height="100%" fill="none">
                <pattern id="dots-vision" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="#c5f82a" />
                </pattern>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#dots-vision)" />
              </svg>
            </div>
            <div className="relative z-10 rounded-tr-[30px] rounded-bl-[30px] rounded-tl-lg rounded-br-lg overflow-hidden border border-border">
              <img
                src={visionImg}
                alt="Vision - technology"
                className="w-full h-80 object-cover opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
