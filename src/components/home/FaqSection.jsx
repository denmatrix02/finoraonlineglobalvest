import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How do I open an account with Finora?',
    answer:
      'Opening an account with Finora is easy. Simply visit our website and click on the "Open an Account" button. Follow the prompts, provide the required information, and complete the application process. If you have any questions or need assistance, our customer support team is available to help.',
  },
  {
    question: 'What documents do I need to provide to apply for a loan?',
    answer:
      'The documents required for a loan application may vary depending on the type of loan you are applying for. Generally, you will need identification documents (such as a passport or driver\'s license), proof of income (such as pay stubs or tax returns), and information about the collateral, if applicable. Our loan officers will guide you through the specific requirements during the application process.',
  },
  {
    question: 'How can I access my accounts online?',
    answer:
      'Accessing your accounts online is simple and secure. Visit our website and click on the "Login" button. Enter your username and password to access your accounts. If you haven\'t registered for online banking, click on the "Enroll Now" button and follow the registration process. Our customer support team is available to guide you if needed.',
  },
  {
    question: 'Are my transactions and personal information secure?',
    answer:
      'At Finora, we prioritize the security of your transactions and personal information. We employ industry-leading encryption and multi-factor authentication to ensure that your data is protected. Additionally, we regularly update our security measures to stay ahead of emerging threats. You can bank with confidence knowing that we have robust security systems in place.',
  },
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

export default function FaqSection() {

  return (
    <section className="section-padding">
      <div className="container">

        {/* ── Header ── */}
        <div data-animate="fade-up" className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-text-main mb-3">
            <span className="text-primary">Frequently</span> Asked Questions
          </h2>
          <p className="text-sm text-text-muted">
            Still have any questions? Contact our Team via finoraonlineglobalvest@gmail.com
          </p>
        </div>

        {/* ── 2-column FAQ Grid ── */}
        <div className="grid md:grid-cols-2 gap-x-12">
          <div data-animate="fade-right" className="space-y-0">
            {faqs.filter((_, i) => i % 2 === 0).map((faq, i) => (
              <FaqItem key={i * 2} faq={faq} />
            ))}
          </div>
          <div data-animate="fade-left" data-delay="100" className="space-y-0">
            {faqs.filter((_, i) => i % 2 === 1).map((faq, i) => (
              <FaqItem key={i * 2 + 1} faq={faq} />
            ))}
          </div>
        </div>

        {/* ── Load All FAQs ── */}
        <div data-animate="fade-up" data-delay="200" className="flex justify-center mt-10">
          <button
            id="home-load-faqs"
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-main transition-colors"
          >
            Load All FAQ's <ChevronDown size={16} />
          </button>
        </div>

      </div>
    </section>
  );
}

