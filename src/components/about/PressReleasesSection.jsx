import press1 from '../../assets/press_release1.png';
import press2 from '../../assets/pressrelease2.png';
import press3 from '../../assets/pressrelease3.png';
import press4 from '../../assets/pressrelease4.png';

const pressItems = [
  {
    image: press1,
    location: 'India',
    date: '06/5/2024',
    title: 'Now you Bank With us from India',
    description: 'Finora is pleased to announce the introduction of our new Rewards Program, aimed at rewarding our loyal customers and enhancing their banking experience. The program offers exclusive benefits, discounts, and personalized offers tailored to individual customer preferences. With this initiative, Finora reaffirms its commitment to delivering exceptional value and building lasting relationships with our valued customers.'
  },
  {
    image: press2,
    location: 'China',
    date: '4/7/2025',
    title: 'Finora Expands Branch Network with Opening of New Support HQ in China',
    description: 'Finora is excited to announce the grand opening of our newest support branch in Shenzhen. This expansion is a testament to our continued commitment to serving our customers and providing them with convenient access to our comprehensive range of Mobile banking services. The new branch will feature state-of-the-art facilities, a team of dedicated professionals, and a personalized approach to banking, further strengthening our presence in the local community.'
  },
  {
    image: press3,
    location: 'USA',
    date: '24/6/2024',
    title: 'Finora Partners with Local Nonprofit to Support Financial Education Initiatives',
    description: 'Finora has partnered with a local nonprofit to expand financial education initiatives in the community. The collaboration focuses on providing practical financial skills through youth literacy programs, and digital learning tools to help individuals and families strengthen their financial knowledge. By combining Finora\'s banking expertise with the nonprofit\'s community needs, the initiative aims to promote economic resilience and empower underserved groups with practical money management skills.'
  },
  {
    image: press4,
    location: 'USA',
    date: '28/2/2024',
    title: 'Finora Launches Sustainable Banking Initiative to Promote Environmental Responsibility',
    description: 'Finora has officially launched its Sustainable Banking Initiative, designed to embed environmental responsibility into financial services. With a strong presence in California, the program focuses on Green financing, Digital ESG reporting, and AI-powered dashboards to help California firms monitor carbon footprints and supply chain sustainability.'
  }
];

export default function PressReleasesSection() {
  return (
    <section className="section-padding pt-0">
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-3">Press Releases</h2>
          <p className="text-sm text-text-muted">
            Stay updated with the latest happenings and exciting developments at Finora through our press releases.
          </p>
        </div>

        {/* 2x2 Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {pressItems.map((item, idx) => (
            <div key={idx} className="group cursor-pointer bg-[#151515] rounded-[32px] border border-border p-6 md:p-10">
              {/* Image */}
              <div className="rounded-tr-[24px] rounded-bl-[24px] rounded-tl-md rounded-br-md overflow-hidden border border-border bg-surface-2 mb-8">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-64 object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
              </div>
              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-text-muted mb-6">
                <span className="bg-bg border border-border px-4 py-1.5 rounded-full">Location: {item.location}</span>
                <span className="bg-bg border border-border px-4 py-1.5 rounded-full">Date: {item.date}</span>
              </div>
              {/* Title */}
              <h3 className="text-xl font-bold text-text-main mb-4 group-hover:text-primary transition-colors leading-snug">
                {item.title}
              </h3>
              {/* Description */}
              <p className="text-sm text-text-muted leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
