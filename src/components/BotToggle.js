import React from 'react';
import { useChat } from '../context/ChatContext';

function BotToggle() {
  const { botEnabled, toggleBot } = useChat();

  return (
    <div className="flex items-center space-x-2 px-4 py-2" data-testid="bot-toggle-container">
      <span className="text-sm text-gray-700">AI Bot:</span>
      <button
        onClick={toggleBot}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          botEnabled ? 'bg-blue-600' : 'bg-gray-200'
        }`}
        data-testid="bot-toggle-button"
        aria-pressed={botEnabled}
        aria-label="Toggle AI Bot"
      >
        <span className="sr-only">Toggle AI Bot</span>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            botEnabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="text-xs text-gray-500" data-testid="bot-status">
        {botEnabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  );
}

export default BotToggle;