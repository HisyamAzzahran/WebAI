import SasaaChat from './SasaaChat';

const SasaaChatPage = ({ email, isPremium, tokenSisa, setTokenSisa }) => {
  return (
    <div className="mt-4">
      <h3 className="text-center mb-3">🤖 Chatbot Sasaa</h3>
      <SasaaChat
        email={email}
        isPremium={isPremium}
        tokenSisa={tokenSisa}
        setTokenSisa={setTokenSisa}
      />
    </div>
  );
};

export default SasaaChatPage;
