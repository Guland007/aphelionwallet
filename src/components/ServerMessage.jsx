import { useEffect, useState } from 'react';
import axios from 'axios';

function ServerMessage() {
  const [message, setMessage] = useState('');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3001/api/message')
      .then(res => {
        setMessage(res.data.message);
      })
      .catch(err => {
        console.error('Ошибка получения:', err);
      });
  }, []);

  const updateMessage = () => {
    axios.post('http://localhost:3001/api/message', { message: newMessage })
      .then(res => {
        alert('Сообщение отправлено на сервер');
        setMessage(newMessage);
        setNewMessage('');
      })
      .catch(err => {
        console.error('Ошибка отправки:', err);
      });
  };

  return (
    <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid cyan', borderRadius: '10px' }}>
      <h3 style={{ color: 'white' }}>💬 Сообщение с сервера:</h3>
      <p style={{ color: 'cyan' }}>{message}</p>

      <input
        type="text"
        placeholder="Новое сообщение"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        style={{ padding: '8px', width: '100%', marginBottom: '10px', borderRadius: '6px' }}
      />
      <button onClick={updateMessage}>Отправить</button>
    </div>
  );
}

export default ServerMessage;
