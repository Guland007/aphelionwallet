import { useState, useRef, useEffect } from 'react';
import { BsTelephoneFill } from 'react-icons/bs';
import './SupportChat.css';

function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const buttonRef = useRef(null);
  const chatRef = useRef(null);

  const dragOffset = useRef({ x: 0, y: 0 });
  const position = useRef({ x: 40, y: window.innerHeight * 0.6 });

  useEffect(() => {
    const saved = localStorage.getItem('chatPosition');
    if (saved) {
      const parsed = JSON.parse(saved);
      position.current = parsed;
    }

    const el = buttonRef.current || chatRef.current;
    if (el) {
      el.style.left = `${position.current.x}px`;
      el.style.top = `${position.current.y}px`;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatPosition', JSON.stringify(position.current));
  }, [position.current]);

  const startDrag = (e) => {
    e.preventDefault();
    dragOffset.current = {
      x: e.clientX - position.current.x,
      y: e.clientY - position.current.y,
    };
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const onDrag = (e) => {
    const x = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragOffset.current.x));
    const y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y));
    position.current = { x, y };

    const el = isOpen ? chatRef.current : buttonRef.current;
    if (el) {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
  };

  const stopDrag = () => {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  const fetchBotReply = (userText) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const responses = {
          привет: 'Здравствуйте! Чем могу помочь?',
          'добрый день': 'Добрый день! Готов помочь.',
          здравствуйте: 'Приветствую вас!',
          помощь: 'Вы можете задать любой вопрос по кошельку.',
          кошелек: 'Ваш кошелек защищён и надёжен.',
          вход: 'На стартовой странице нажмите кнопку "Войти".',
          'как войти': 'Чтобы войти, нажмите "Войти" на главной странице.',
          восстановить: 'Используйте свою сид-фразу из 12 слов.',
          востановить: 'Используйте свою сид-фразу из 12 слов.',
          сид: 'Используйте свою сид-фразу, чтобы восстановить доступ.',
          спасибо: 'Всегда рады помочь!',
          поддержка: 'Мы здесь, чтобы помочь. Задайте вопрос.',
          ошибка: 'Пожалуйста, уточните, в чём ошибка.',
          default: 'Извините, я пока не понимаю. Задайте вопрос иначе.'
        };

        const lowerText = userText.toLowerCase();
        const matchedKey = Object.keys(responses).find((key) => lowerText.includes(key));
        const reply = matchedKey ? responses[matchedKey] : responses.default;
        resolve(reply);
      }, 700);
    });
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    fetchBotReply(input).then((reply) => {
      const botMsg = { sender: 'bot', text: reply };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    });
  };

  return (
    <>
      {!isOpen && (
        <button
          className={`chat-toggle ${messages.length > 0 ? 'notify' : ''}`}
          ref={buttonRef}
          onClick={() => setIsOpen(true)}
          onMouseDown={startDrag}
          style={{ position: 'fixed', zIndex: 9999 }}
        >
          <BsTelephoneFill />
        </button>
      )}

      {isOpen && (
        <div
          className="chat-box"
          ref={chatRef}
          style={{ position: 'fixed', zIndex: 9999 }}
        >
          <div className="chat-header" onMouseDown={startDrag}>
            Онлайн-чат
            <span className="close-btn" onClick={() => setIsOpen(false)}>×</span>
          </div>
          <div className="chat-body">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.sender}`}>{msg.text}</div>
            ))}
            {isTyping && (
              <div className="chat-message bot">
                <i>Печатает...</i>
              </div>
            )}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Напишите сообщение..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>Отправить</button>
          </div>
        </div>
      )}
    </>
  );
}

export default SupportChat;
