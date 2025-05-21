import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './SasaaChat.css';
import { toast } from 'react-toastify';
import 'animate.css';

const CHAT_WEBHOOK = "https://n8n-production-d505.up.railway.app/webhook/13e55a07-d144-403b-b465-2a539501b207/chat";
const API_URL = "https://webai-production-b975.up.railway.app";

const ElmoChat = ({ email, isPremium }) => {
  const [messages, setMessages] = useState([
    { sender: 'elmo', text: 'Halooo, Aku Elmo 👋✨ kamu lagi cari info lomba apa nih?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatReply = (text) => {
    if (!text) return '';
    return text
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (!isPremium) {
      toast.warning("🚫 Fitur ini hanya untuk pengguna Premium!");
      return;
    }

    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Logging penggunaan Elmo
      await axios.post(`${API_URL}/log-feature`, {
        email,
        feature: 'elmo-chat'
      });

      const res = await axios.post(CHAT_WEBHOOK, { message: input, email });
      const reply = res.data.reply || res.data.result || "Maaf, Elmo belum bisa menjawab.";
      const updatedMessages = [...newMessages, { sender: 'elmo', text: reply }];
      setMessages(updatedMessages);
    } catch (error) {
      setMessages([...newMessages, { sender: 'elmo', text: '❌ Gagal menghubungi Elmo.' }]);
      toast.error("❌ Terjadi kesalahan.");
    }

    setInput('');
    setLoading(false);
  };

  return (
    <div className="sasaa-chat-wrapper animate__animated animate__fadeIn">
      <div className="sasaa-chat-card">
        <div className="sasaa-chat-header">🤖 Elmo AI Assistant</div>
        <div className="sasaa-chat-box">
          {messages.map((msg, i) => (
            <div className={`elmo-reply-box ${msg.sender}`}>
  <span dangerouslySetInnerHTML={{ __html: formatReply(msg.text) }} />
</div>
          ))}
          {loading && (
            <div className="chat-msg elmo loading">
              <span className="dot-wave"><span></span><span></span><span></span></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="sasaa-chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya Elmo tentang lomba..."
          />
          <button onClick={sendMessage} disabled={loading}>
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElmoChat;
