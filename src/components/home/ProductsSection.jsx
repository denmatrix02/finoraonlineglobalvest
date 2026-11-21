import { Wallet, CreditCard, Home } from 'lucide-react';

const products = [
  {
    icon: <Wallet size={22} />,
    title: 'Checking Accounts',
    description: 'Enjoy easy and convenient access to your funds with our range of checking account options. Benefit from features such as online and mobile banking, debit cards, and free ATM access.'
  },
  {
    icon: <CreditCard size={22} />,
    title: 'Savings Accounts',
    description: 'Build your savings with our competitive interest rates and flexible savings account options. Whether you\'re saving for a specific goal or want to grow your wealth over time, we have the right account for you.'
  },
  {
    icon: <Home size={22} />,
    title: 'Loans and Mortgages',
    description: 'Realize your dreams with our flexible loan and mortgage options. From personal loans to home mortgages, our experienced loan officers are here to guide you through the application process and help you secure the funds you need.'
  }
];

export default function ProductsSection() {
  return (
    <section className="section-padding">
      <div className="container">

        {/* Header */}
        <div className="flex items-start justify-between mb-12 gap-6 flex-wrap" data-animate="fade-up">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-text-main mb-2">
              Our <span className="text-primary">Products</span>
            </h2>
            <p className="text-sm text-text-muted max-w-md">
              Discover a range of comprehensive and customisable banking products at Finora, designed to suit your unique financial needs and aspirations.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary text-xs px-4 py-2">For Individuals</button>
            <button className="btn btn-outline text-xs px-4 py-2">For Businesses</button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {products.map((product, i) => (
            <div
              key={i}
              data-animate="fade-up"
              data-delay={`${i * 150}`}
              className="card-hover-lift bg-surface border border-border rounded-2xl p-8 text-center shimmer-hover"
            >
              <div className="w-14 h-14 rounded-xl bg-surface-2 border border-border text-primary flex items-center justify-center mx-auto mb-5">
                {product.icon}
              </div>
              <h3 className="font-semibold text-text-main mb-3 text-base">{product.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{product.description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

