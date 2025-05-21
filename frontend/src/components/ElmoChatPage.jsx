import ElmoChat from './ElmoChat';

const ElmoChatPage = ({ email, isPremium }) => {
  return (
    <div className="mt-4">
      <h3 className="text-center mb-3">🤖 Chatbot Elmo</h3>
      <ElmoChat
        email={email}
        isPremium={isPremium}
      />
    </div>
  );
};

export default ElmoChatPage;