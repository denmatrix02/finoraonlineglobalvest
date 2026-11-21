import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import backquoteIcon from '../../assets/icons/backquote.png';

const INDIVIDUALS = [
  {
    text: 'Finora has been my trusted financial partner for years. Their personalized service and innovative digital banking solutions have made managing my finances a breeze.',
    author: 'Sara T.',
  },
  {
    text: 'I recently started my own business, and Finora has been instrumental in helping me set up my business accounts and secure the financing I needed. Their expert guidance and tailored solutions have been invaluable.',
    author: 'John D.',
  },
  {
    text: 'I love the convenience of Finora\'s mobile banking app. It allows me to stay on top of my finances and make transactions on the go. The app is user-friendly, secure, and always improving.',
    author: 'Emily R.',
  },
];

const BUSINESSES = [
  {
    text: 'As a business owner, managing cash flow is critical. Finora\'s business banking solutions have been indispensable. The streamlined payment processing has saved us countless hours.',
    author: 'Marcus L.',
  },
  {
    text: 'The working capital solutions from Finora gave us the financial runway to expand our operations. Their dedicated relationship managers understood our needs from day one.',
    author: 'Priya S.',
  },
  {
    text: 'Our company switched to Finora two years ago and it was the best decision we made. Their corporate tools are best-in-class and the onboarding experience was seamless.',
    author: 'James K.',
  },
];

export default function TestimonialsSection() {
  const [activeTab, setActiveTab] = useState('individuals');
  const [index, setIndex] = useState(0);

  const list = activeTab === 'individuals' ? INDIVIDUALS : BUSINESSES;
  const prev = () => setIndex((i) => (i === 0 ? list.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === list.length - 1 ? 0 : i + 1));

  return (
    <>
      {/* ── Testimonials section ── */}
      <section className="section-padding bg-[#191919] border-t border-[#262626]">
        <div className="container">

          {/* Header */}
          <div data-animate="fade-up" className="flex items-start justify-between mb-12 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Our <span className="text-primary">Testimonials</span>
              </h2>
              <p className="text-sm text-text-muted max-w-md">
                Discover how Finora has transformed lives with innovative digital solutions and
                personalised customer service. See why our clients trust us for a secure and prosperous
                financial journey.
              </p>
            </div>
            {/* Tab switcher */}
            <div className="flex gap-2 bg-[#111111] p-1.5 rounded-full border border-border">
              <button
                onClick={() => { setActiveTab('individuals'); setIndex(0); }}
                className={`text-sm px-6 py-2.5 rounded-full font-medium transition-colors ${
                  activeTab === 'individuals'
                    ? 'bg-primary text-[#111111]'
                    : 'text-text-main hover:text-primary'
                }`}
              >
                For Individuals
              </button>
              <button
                onClick={() => { setActiveTab('businesses'); setIndex(0); }}
                className={`text-sm px-6 py-2.5 rounded-full font-medium transition-colors ${
                  activeTab === 'businesses'
                    ? 'bg-primary text-[#111111]'
                    : 'text-text-main hover:text-primary'
                }`}
              >
                For Businesses
              </button>
            </div>
          </div>

          {/* Testimonial Cards */}
          <div data-animate="fade-up" data-delay="100" className="grid md:grid-cols-3 gap-5 mb-8">
            {list.map((t, i) => (
              <div
                key={`${activeTab}-${i}`}
                className={`card-hover-lift bg-[#111111] border rounded-2xl p-8 transition-all duration-300 flex flex-col justify-between ${
                  i === index ? 'border-primary/50 shadow-lg shadow-primary/5' : 'border-[#262626]'
                }`}
              >
                <div className="flex items-center justify-center mb-6 relative">
                  <div className="h-px bg-[#262626] flex-1"></div>
                  <img
                    src={backquoteIcon}
                    alt="Testimonial Quote"
                    className="w-10 h-10 object-contain mx-4"
                  />
                  <div className="h-px bg-[#262626] flex-1"></div>
                </div>
                <p className="text-sm text-text-muted leading-relaxed text-center mb-6 flex-1">{t.text}</p>
                <div className="text-center pt-2">
                  <span className="text-base font-bold text-primary block">{t.author}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-3">
            <button
              id="testimonial-prev"
              onClick={prev}
              className="w-10 h-10 rounded-full border border-border text-text-muted flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              id="testimonial-next"
              onClick={next}
              className="w-10 h-10 rounded-full border border-border text-text-muted flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="section-padding pt-0 bg-[#191919] border-t border-[#262626]">
        <div className="container">
          <div
            data-animate="scale-up"
            className="relative overflow-hidden bg-[#111111] border border-[#262626] rounded-3xl px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            {/* Background glow */}
            <div
              className="absolute -top-20 -left-20 w-64 h-64 opacity-10 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #CAFF33, transparent 70%)' }}
              aria-hidden
            />
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Start your financial journey with{' '}
                <span className="text-primary">Finora</span> today!
              </h2>
              <p className="text-sm text-text-muted max-w-xl">
                Ready to take control of your finances? Join Finora now, and let us help you achieve
                your financial goals with our tailored solutions and exceptional customer service.
              </p>
            </div>
            <button
              id="cta-open-account"
              className="btn btn-primary px-8 py-3 text-sm font-semibold shrink-0"
            >
              Open Account
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

