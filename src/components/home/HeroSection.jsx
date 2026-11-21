import { ArrowRightLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import MoneyExchange from './MoneyExchange';
import TransferWidget from './TransferWidget';
import heroDottedPattern from '../../assets/hero_dotted pattern.png';
import abstractDesignDotted from '../../assets/Abstract Design-dotted.png';

const TRANSACTIONS = [
  {
    icon: <ArrowRightLeft size={18} className="text-primary" />,
    label: 'Transaction',
    name: 'Joel Kenley',
    amount: '-$68.00',
    positive: false,
  },
  {
    icon: <ArrowRightLeft size={18} className="text-primary" />,
    label: 'Transaction',
    name: 'Mark Smith',
    amount: '-$68.00',
    positive: false,
  },
  {
    icon: <ArrowRightLeft size={18} className="text-primary" />,
    label: 'Transaction',
    name: 'Lenen Roy',
    amount: '-$68.00',
    positive: false,
  },
];

export default function HeroSection() {
  return (
    <section className="relative section-padding pt- bg-[#111111]">
      {/* Top Left / Top Right Hero Dotted Pattern Image */}
      <img
        src={heroDottedPattern}
        alt="Hero Dotted Pattern"
        className="absolute -top-16 -left-10 w-80 md:w-[480px] pointer-events-none z-0 opacity-80"
      />

      {/* Abstract Design Dotted Overlay */}
      {/* <div
        className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none z-0 opacity-70"
        style={{
          backgroundImage: `url('${abstractDesignDotted}')`,
          backgroundSize: 'contain',
          backgroundPosition: 'top right',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden
      /> */}

      <div className="container relative z-10">
        <div className="grid md:grid-cols-2 gap-14 items-start">
          {/* ══ LEFT — Hero copy ══ */}
          <div>
            {/* Floating badge */}
            <div
              data-animate="fade-up"
              className="float-badge inline-flex items-center gap-2 bg-[#1A1A1A] border border-[#262626] rounded-full px-4 py-1.5 mb-7"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-text-muted font-medium">No LLC Required, No Credit Check.</span>
            </div>

            <h1
              data-animate="fade-up"
              data-delay="100"
              className="text-4xl md:text-[2.875rem] font-bold text-[#F4F4F5] leading-[1.15] tracking-tight mb-5"
            >
              Welcome to Finora,<br />
              Empowering Your{' '}
              <span className="text-primary">Financial</span>{' '}
              Journey
            </h1>

            <p
              data-animate="fade-up"
              data-delay="200"
              className="text-sm md:text-base text-text-muted leading-relaxed mb-8 max-w-md"
            >
              At Finora, our mission is to provide comprehensive banking solutions that empower
              individuals and businesses to achieve their financial goals. We are committed to
              delivering personalized and innovative services that prioritize our customers' needs.
            </p>

            <div data-animate="fade-up" data-delay="300">
              <Link
                id="hero-open-account"
                to="/signup"
                className="btn btn-primary px-8 py-3.5 text-sm font-semibold rounded-full"
              >
                Open Account
              </Link>
            </div>
          </div>

          {/* ══ RIGHT — Dashboard cards stack ══ */}
          <div data-animate="fade-left" data-delay="150" className="flex flex-col gap-4">
            <div className="relative">
              {/* Floating + $5000,00 Income pill */}
              <div className="absolute -top-6 -left-6 md:-left-10 z-20 flex items-center gap-3 bg-[#1A1A1A] border border-[#262626] rounded-xl p-3 shadow-2xl">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg leading-none">+</div>
                <div>
                  <p className="text-xs font-bold text-white leading-none mb-1">+ $5000,00</p>
                  <p className="text-[10px] text-text-muted leading-none">Monthly Income</p>
                </div>
              </div>

              <div className="bg-[#1A1A1A] relative border border-[#262626] rounded-2xl p-6 relative z-10 shadow-2xl">
                {/* Your Transactions */}
                <img src={abstractDesignDotted} className='absolute rotate-90 right-2 -top-1 -z-10' width='300px' alt="" />
                <p className="text-sm text-white font-semibold mb-4">
                  Your Transactions
                </p>
                <div className="space-y-4 mb-6">
                  {TRANSACTIONS.map((tx, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#222222] border border-[#262626] flex items-center justify-center text-primary">
                          {tx.icon}
                        </div>
                        <div>
                          <p className="text-xs text-text-muted mb-0.5">Transaction</p>
                          <p className="text-sm font-medium text-white leading-none">{tx.name}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-white font-mono">
                        {tx.amount}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Money Exchange */}
                <p className="text-sm text-white font-semibold mb-4 mt-6">
                  Money Exchange
                </p>
                <div className="mb-6">
                  <MoneyExchange />
                </div>
              </div>

              {/* Supported Currency */}
              <div className="mt-6 flex flex-wrap justify-end gap-2 items-center">
                <span className="text-xs text-text-muted mr-2 font-mono">Supported Currency</span>
                {['$', '€', '£', '฿'].map((curr, idx) => (
                  <div key={idx} className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-primary text-xs font-semibold">
                    {curr}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

