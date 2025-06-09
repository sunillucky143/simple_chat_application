import React from 'react';
import Header from '../components/Header';
import MessageDisplay from '../components/MessageDisplay';
import MessageInput from '../components/MessageInput';
import ConnectionStatus from '../components/ConnectionStatus';
import BotToggle from '../components/BotToggle';
import { useChat } from '../context/ChatContext';

const ChatPage = () => {
  const { messages, connectionStatus, error } = useChat();
  const messageDisplayRef = React.useRef(null);

  // Auto-scroll to the latest message when messages change
  React.useEffect(() => {
    if (messageDisplayRef.current) {
      messageDisplayRef.current.scrollTop = messageDisplayRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-100" data-testid="app-container">
      <Header />
      <div className="flex justify-between items-center">
        <ConnectionStatus status={connectionStatus} error={error} />
        <BotToggle />
      </div>
      <MessageDisplay 
        messages={messages} 
        ref={messageDisplayRef}
      />
      <MessageInput />
    </div>
  );
};

export default ChatPage;