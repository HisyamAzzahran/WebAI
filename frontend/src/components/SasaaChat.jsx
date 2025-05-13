import { useState } from 'react';
import axios from 'axios';
import './SasaaChat.css';
import { toast } from 'react-toastify';

const CHAT_WEBHOOK = "https://elevaai.app.n8n.cloud/webhook/13e55a07-d144-403b-b465-2a539501b207/chat";
const API_URL = "https://webai-production-b975.up.railway.app"; // endpoint Flask backend kamu

const SasaaChat = ({ email, tokenSisa, setTokenSisa, isPremium }) => {
  const [messages, setMessages] = useState([
    { sender: 'sasaa', text: 'Halooo, Kenalin Aku Sasaa 👋✨ kamu lagi cari info lomba apa nih?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Premium check
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
      // Kirim ke webhook n8n
      const res = await axios.post(CHAT_WEBHOOK, {
        message: input,
        email: email
      });

      const reply = res.data.reply || res.data.result || "Maaf, Sasaa belum bisa menjawab.";
      const updatedMessages = [...newMessages, { sender: 'sasaa', text: reply }];
      setMessages(updatedMessages);

      // ✅ Kurangi token di backend Flask
      const resToken = await axios.post(`${API_URL}/reduce-token`, { email });

      if (resToken.status === 200 && resToken.data.success) {
        setTokenSisa(resToken.data.new_token); // update frontend token
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
    <div className="sasaa-chat-container">
      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.sender}`}>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>

      <div className="chat-input">
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
  );
};

export default SasaaChat;
