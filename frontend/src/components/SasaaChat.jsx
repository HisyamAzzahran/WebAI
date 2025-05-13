import { useState } from 'react';
import axios from 'axios';
import './SasaaChat.css';
import { toast } from 'react-toastify';
import 'animate.css';

const CHAT_WEBHOOK = "https://elevaai.app.n8n.cloud/webhook/13e55a07-d144-403b-b465-2a539501b207/chat";
const API_URL = "https://webai-production-b975.up.railway.app";

const SasaaChat = ({ email, isPremium, tokenSisa, setTokenSisa }) => {
  const [messages, setMessages] = useState([
    { sender: 'sasaa', text: 'Halooo, Kenalin Aku Sasaa 👋✨ kamu lagi cari info lomba apa nih?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (!isPremium) {
      toast.warning("🚫 Fitur ini hanya untuk pengguna Premium!");
      return;
    }

    if (tokenSisa <= 0) {
      toast.error("😢 Token kamu habis. Silakan isi ulang token.");
      return;
    }

    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await axios.post(CHAT_WEBHOOK, { message: input, email });
      const reply = res.data.reply || res.data.result || "Maaf, Sasaa belum bisa menjawab.";
      setMessages([...newMessages, { sender: 'sasaa', text: reply }]);

      const resToken = await axios.post(`${API_URL}/reduce-token`, { email });
      if (resToken.status === 200 && resToken.data.success) {
        setTokenSisa(resToken.data.new_token);
      } else {
        toast.warning("⚠️ Token tidak berhasil dikurangi di server.");
      }
    } catch (error) {
      setMessages([...newMessages, { sender: 'sasaa', text: '❌ Gagal menghubungi Sasaa.' }]);
      toast.error("❌ Terjadi kesalahan.");
    }

    setInput('');
    setLoading(false);
  };

  return (
    <div className="sasaa-chat-wrapper animate__animated animate__fadeIn">
      <div className="sasaa-chat-card">
        <div className="sasaa-chat-header">🤖 Sasaa AI Assistant</div>
        <div className="sasaa-chat-box">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.sender}`}>
              <span>{msg.text}</span>
            </div>
          ))}
        </div>
        <div className="sasaa-chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya Sasaa tentang lomba..."
          />
          <button onClick={sendMessage} disabled={loading}>
            {loading ? "..." : "Kirim"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SasaaChat;
