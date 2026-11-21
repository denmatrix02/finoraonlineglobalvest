import { Wallet, PiggyBank, Heart, Lightbulb, Briefcase, Rocket, TrendingUp, CreditCard } from 'lucide-react';

export default function UseCasesSection() {
  return (
    <section className="section-padding bg-surface border-y border-border">
      <div className="container">

        {/* Section Header */}
        <div data-animate="fade-up" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-text-main mb-3">
            <span className="text-primary">Use Cases</span>
          </h2>
          <p className="text-sm text-text-muted max-w-lg">
          At Finora, we cater to the diverse needs of individuals and businesses alike, offering a wide range of financial solutions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">

          {/* ── Left Column ── */}
          <div className="flex flex-col gap-12">
            {/* Individuals Cards */}
            <div
              data-animate="fade-right"
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: <Wallet size={18} />, label: 'Managing Personal Finances' },
                { icon: <PiggyBank size={18} />, label: 'Saving for the Future' },
                { icon: <Heart size={18} />, label: 'Homeownership' },
                { icon: <Lightbulb size={18} />, label: 'Education Funding' },
              ].map((item, i) => (
                <div
                  key={i}
                  data-animate="scale-up"
                  data-delay={`${100 + i * 100}`}
                  className="card-hover-lift bg-[#151515] border border-border rounded-[20px] p-6 flex flex-col items-center gap-4 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-surface border border-border text-primary flex items-center justify-center mb-2">
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-text-main leading-snug">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Business Text */}
            <div data-animate="fade-up" data-delay="100">
              <h3 className="text-2xl font-bold text-text-main mb-4">For Business</h3>
              <p className="text-sm text-text-muted mb-8 leading-relaxed max-w-md">
                For businesses, we empower growth with working capital solutions that optimize cash flow, and our tailored financing options fuel business expansion. Whatever your financial aspirations, Finora is committed to providing the right tools and support to achieve them.
              </p>
              <div className="flex justify-between gap-4 mb-8">
                {[
                  { value: '65%', label: 'Cash Flow Management' },
                  { value: '70%', label: 'Drive Business Expansion' },
                  { value: '45%', label: 'Streamline payroll processing' },
                ].map((stat, i) => (
                  <div key={i} data-animate="fade-up" data-delay={`${i * 100}`}>
                    <p className="text-4xl font-bold text-primary mb-2">{stat.value}</p>
                    <p className="text-xs text-text-muted leading-snug max-w-[100px]">{stat.label}</p>
                  </div>
                ))}
              </div>
              <button className="btn btn-surface border border-border text-sm px-6 py-2.5 rounded-full text-text-main hover:text-primary transition-colors">Learn More</button>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="flex flex-col gap-12">
            {/* Individuals Text */}
            <div data-animate="fade-up" data-delay="300">
              <h3 className="text-2xl font-bold text-text-main mb-4">For Individuals</h3>
              <p className="text-sm text-text-muted mb-8 leading-relaxed max-w-md">
                For individuals, our mortgage services pave the way to homeownership, and our flexible personal loans provide vital support during various life milestones. We also prioritize retirement planning, ensuring a financially secure future for our customers.
              </p>
              <div className="flex justify-between gap-4 mb-8">
                {[
                  { value: '78%', label: 'Secure Retirement Planning' },
                  { value: '63%', label: 'Manageable Debt Consolidation' },
                  { value: '91%', label: 'Reducing financial burdens' },
                ].map((stat, i) => (
                  <div key={i} data-animate="fade-up" data-delay={`${i * 100}`}>
                    <p className="text-4xl font-bold text-primary mb-2">{stat.value}</p>
                    <p className="text-xs text-text-muted leading-snug max-w-[100px]">{stat.label}</p>
                  </div>
                ))}
              </div>
              <button className="btn btn-surface border border-border text-sm px-6 py-2.5 rounded-full text-text-main hover:text-primary transition-colors">Learn More</button>
            </div>

            {/* Business Cards */}
            <div
              data-animate="fade-left"
              data-delay="200"
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: <Rocket size={18} />, label: 'Startups and Entrepreneurs' },
                { icon: <TrendingUp size={18} />, label: 'Cash Flow Management' },
                { icon: <Briefcase size={18} />, label: 'Business Expansion' },
                { icon: <CreditCard size={18} />, label: 'Payment Solutions' },
              ].map((item, i) => (
                <div
                  key={i}
                  data-animate="scale-up"
                  data-delay={`${100 + i * 100}`}
                  className="card-hover-lift bg-[#151515] border border-border rounded-[20px] p-6 flex flex-col items-center gap-4 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-surface border border-border text-primary flex items-center justify-center mb-2">
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-text-main leading-snug">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

