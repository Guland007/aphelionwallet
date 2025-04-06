import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SupportPage.css';

function SupportPage() {
  const navigate = useNavigate();

  const faq = [
    {
      question: 'Как восстановить доступ к кошельку?',
      answer: 'Используйте вашу сид-фразу из 12 слов на главной странице входа.'
    },
    {
      question: 'Где взять адрес моего кошелька?',
      answer: 'На странице кошелька нажмите кнопку “Получить” напротив нужной монеты.'
    },
    {
      question: 'Как связаться с поддержкой?',
      answer: 'Вы можете написать на email, указанный ниже.'
    },
  ];

  return (
    <div className="support-page">
      <div className="support-card">
        <h2 className="support-title">Помощь и поддержка</h2>

        <section className="faq-section">
          <h3 className="section-heading">📖 Часто задаваемые вопросы (FAQ)</h3>
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
          <h3 className="section-heading">📬 Контакты</h3>
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
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupportPage;
