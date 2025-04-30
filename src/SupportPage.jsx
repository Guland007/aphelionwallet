import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SupportPage.css';

function SupportPage() {
  const navigate = useNavigate();

  const faq = [
    {
      question: 'How do I restore access to my wallet?',
      answer: 'Use your 12-word seed phrase on the main login page.'
    },
    {
      question: 'Where can I find my wallet address?',
      answer: 'On the Wallet page, click “Receive” next to the desired token.'
    },
    {
      question: 'How can I contact support?',
      answer: 'You can email us at the address below.'
    },
  ];

  return (
    <div className="support-page">
      <div className="support-card">
        <h2 className="support-title">Help &amp; Support</h2>

        <section className="faq-section">
          <h3 className="section-heading">📖 Frequently Asked Questions (FAQ)</h3>
          <ul className="faq-list">
            {faq.map((item, index) => (
              <li key={index} className="faq-item">
                <strong className="faq-question">{item.question}</strong>
                <p className="faq-answer">{item.answer}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="contacts-section">
          <h3 className="section-heading">📬 Contact</h3>
          <p className="contact-item">
            Email:&nbsp;
            <a href="mailto:aphelionwallet@proton.me" className="contact-link">
              aphelionwallet@proton.me
            </a>
          </p>
          <p className="contact-item">
            Telegram:&nbsp;
            <a
              href="https://t.me/aphelionwallet"
              target="_blank"
              rel="noreferrer"
              className="contact-link"
            >
              @aphelionwallet
            </a>
          </p>
        </section>

        <div className="back-button-wrap">
          <button
            className="secondary-button"
            onClick={() => navigate('/wallet')}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupportPage;
