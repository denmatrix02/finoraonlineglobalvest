import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const LayoutGridIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const LayersIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
);

const ScanIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M4 7V4h3M17 4h3v3M4 17v3h3M17 20h3v-3M5 12h14"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <circle cx="12" cy="11" r="2"/>
  </svg>
);

const securityFeatures = [
  {
    icon: <LayoutGridIcon />,
    title: 'Secure Online Banking Platform',
    description: 'Our online banking platform is built with multiple layers of security to safeguard your information. We utilize industry-standard encryption protocols to ensure that your data remains confidential and protected during transmission.'
  },
  {
    icon: <LayersIcon />,
    title: 'Multi-Factor Authentication',
    description: 'To enhance the security of your online banking experience, we employ multi-factor authentication. This additional layer of security requires you to provide multiple pieces of identification, such as a password and a one-time verification code, to access your account.'
  },
  {
    icon: <ScanIcon />,
    title: 'Fraud Monitoring',
    description: 'We have sophisticated fraud detection systems in place to monitor your accounts for any suspicious activities. Our dedicated team works around the clock to detect and prevent unauthorized transactions, providing you with peace of mind.'
  },
  {
    icon: <ShieldIcon />,
    title: 'Secure Mobile Banking',
    description: 'Our mobile banking app is designed with the same level of security as our online banking platform. You can confidently access your accounts, make transactions, and manage your finances on the go, knowing that your information is protected.'
  }
];

const faqs = [
  {
    question: 'How do I open an account with Finora?',
    answer: 'Opening an account with Finora is easy. Simply visit our website and click on the "Open an Account" button. Follow the prompts, provide the required information, and complete the application process. If you have any questions or need assistance, our customer support team is available to help.'
  },
  {
    question: 'What documents do I need to provide to apply for a loan?',
    answer: 'The documents required for a loan application may vary depending on the type of loan you are applying for. Generally, you will need to provide identification documents (such as a passport or driver\'s license), proof of income (such as pay stubs or tax returns), and information about the collateral (if applicable). Our loan officers will guide you through the specific requirements during the application process.'
  },
  {
    question: 'How can I access my accounts online?',
    answer: 'Accessing your accounts online is simple and secure. Visit our website and click on the "Login" button. Enter your username and password to access your accounts. If you haven\'t registered for online banking, click on the "Enroll Now" button and follow the registration process. If you need assistance, our customer support team is available to guide you.'
  },
  {
    question: 'Are my transactions and personal information secure?',
    answer: 'At Finora, we prioritize the security of your transactions and personal information. We employ industry-leading encryption and multi-factor authentication to ensure that your data is protected. Additionally, we regularly update our security measures to stay ahead of emerging threats. You can bank with confidence knowing that we have robust security systems in place.'
  }
];

function FaqItem({ faq }) {
  return (
    <div className="border border-border bg-[#111111] rounded-2xl p-8 mb-6">
      <h3 className="text-lg font-bold text-text-main mb-4 pr-4">{faq.question}</h3>
      <div className="h-px w-full bg-border mb-4"></div>
      <p className="text-sm text-text-muted leading-relaxed">{faq.answer}</p>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <div className="pt-16 bg-bg">
      {/* Hero Section */}
      <section className="section-padding">
        <div className="container">
          <div className="bg-[#151515] rounded-3xl md:rounded-[40px] border border-border overflow-hidden relative">
            {/* Dotted accent top right */}
            <div className="absolute top-4 right-4 opacity-40 pointer-events-none z-10" aria-hidden>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                {Array.from({ length: 6 }).map((_, row) =>
                  Array.from({ length: 6 }).map((_, col) => (
                    <circle key={`${row}-${col}`} cx={col * 16 + 8} cy={row * 16 + 8} r="2" fill="#c5f82a" />
                  ))
                )}
              </svg>
            </div>
            <div className="grid md:grid-cols-2 items-stretch min-h-[420px]">
              {/* Left: Text */}
              <div className="flex flex-col justify-center p-8 md:p-16">
                <h1 className="text-4xl md:text-5xl font-bold text-text-main leading-tight mb-5">
                  Your Security is Our<br />
                  <span className="text-primary">Top Priority</span>
                </h1>
                <p className="text-text-muted text-sm leading-relaxed">
                  At Finora, we understand the importance of keeping your financial information secure. We employ robust security measures and advanced technologies to protect your personal and financial data. Rest assured that when you bank with us, your security is our utmost priority.
                </p>
              </div>
              {/* Right: Image — full bleed, no inner border */}
              <div className="relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop&q=80"
                  alt="Cyber security illustration"
                  className="w-full h-full min-h-[300px] object-cover grayscale opacity-80"
                />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* How We Protect You */}
      <section className="section-padding pt-0">
        <div className="container">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-text-main mb-3">
              How We <span className="text-primary">Protect You</span>
            </h2>
            <p className="text-text-muted text-sm max-w-xl">
              At Finora, we prioritize the security and confidentiality of your financial information. Our state-of-the-art encryption technology and stringent data protection measures ensure your assets and transactions are safeguarded at all times.
            </p>
          </div>

          {/* 2x2 Security Feature Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, idx) => (
              <div key={idx} className="bg-surface border border-border rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-semibold text-text-main">{feature.title}</h3>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding pt-0">
        <div className="container">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-text-main mb-3">
              <span className="text-primary">Frequently</span> Asked Questions
            </h2>
            <p className="text-sm text-text-muted">
              Still have any questions? Contact our team at finoraonlineglobalvest@gmail.com
            </p>
          </div>

          {/* FAQ Grid - 2 columns */}
          <div className="grid md:grid-cols-2 gap-x-12">
            <div className="space-y-0">
              {faqs.filter((_, i) => i % 2 === 0).map((faq, i) => (
                <FaqItem key={i} faq={faq} />
              ))}
            </div>
            <div className="space-y-0">
              {faqs.filter((_, i) => i % 2 === 1).map((faq, i) => (
                <FaqItem key={i} faq={faq} />
              ))}
            </div>
          </div>

          {/* Load All FAQs */}
          <div className="flex justify-center mt-10">
            <button
              id="load-all-faqs"
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text-main transition-colors"
            >
              Load All FAQ's <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

