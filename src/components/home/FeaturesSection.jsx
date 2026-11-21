import {
  Monitor,
  Smartphone,
  Shield,
  Repeat2,
  Wrench,
  Users,
  ArrowUpRight,
} from 'lucide-react';

const features = [
  {
    icon: <Monitor size={20} />,
    category: 'Online Banking',
    title: '24/7 Account Access',
    description:
      'Enjoy the convenience of accessing your accounts anytime, anywhere through our secure online banking platform. Check balances, transfer funds, and pay bills with ease.',
  },
  {
    icon: <Smartphone size={20} />,
    category: '',
    title: 'Mobile Banking App',
    description:
      'Stay connected to your finances on the go with our user-friendly mobile banking app. Easily manage your accounts, deposit checks, and make payments from your smartphone or tablet.',
  },
  {
    icon: <Shield size={20} />,
    category: '',
    title: 'Secure Transactions',
    description:
      'Rest assured knowing that your transactions are protected by industry-leading security measures. We employ encryption and multi-factor authentication to safeguard your financial information.',
  },
  {
    icon: <Repeat2 size={20} />,
    category: '',
    title: 'Bill Pay & Transfers',
    description:
      'Save time and avoid late fees with our convenient bill pay service. Set up recurring payments or make one-time transfers between your accounts with just a few clicks.',
  },
  {
    icon: <Wrench size={20} />,
    category: 'Financial Tools',
    title: 'Financial Planning Tools',
    description:
      'Take control of your finances with our suite of built-in planning tools. Set budgets, track spending patterns, and get AI-driven insights to reach your goals faster.',
  },
  {
    icon: <Users size={20} />,
    category: 'Customer Support',
    title: 'Dedicated Customer Support',
    description:
      'Our team of banking experts is available around the clock to assist you. Whether by chat, phone, or in person, we ensure every question is answered promptly.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="section-padding">
      <div className="container">

        {/* ── Header ── */}
        <div data-animate="fade-up" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-text-main mb-3">
            Our <span className="text-primary">Features</span>
          </h2>
          <p className="text-sm text-text-muted max-w-lg leading-relaxed">
            Experience a host of powerful features at Finora, including seamless online banking,
            secure transactions, and personalised financial insights, all designed to enhance your
            banking experience.
          </p>
        </div>

        {/* ── Feature Cards (design: left sidebar + 2-col right) ── */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* Left sidebar categories */}
          <div
            data-animate="fade-right"
            className="bg-[#111111] border border-border rounded-3xl p-6 flex flex-col gap-4 justify-start"
          >
            <button className="text-left text-sm px-4 py-3 rounded-xl transition-colors font-medium text-text-main bg-surface border border-border">
              Online Banking
            </button>
            <button className="text-left text-sm px-4 py-3 rounded-xl transition-colors font-medium text-text-muted hover:text-text-main">
              Financial Tools
            </button>
            <button className="text-left text-sm px-4 py-3 rounded-xl transition-colors font-medium text-text-muted hover:text-text-main">
              Customer Support
            </button>
          </div>

          {/* Feature detail cards — 2 columns spanning 2 of 3 cols */}
          <div className="md:col-span-2 grid sm:grid-cols-2 gap-5">
            {features.slice(0, 4).map((feature, i) => (
              <div
                key={i}
                data-animate="fade-up"
                data-delay={`${(i % 4) * 100}`}
                className="card-hover-lift bg-[#111111] border border-border rounded-2xl p-6 group shimmer-hover"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="text-primary flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <ArrowUpRight
                    size={18}
                    className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                  />
                </div>
                <h3 className="text-base font-semibold text-text-main mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

