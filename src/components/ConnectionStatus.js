import React from 'react';

function ConnectionStatus({ status, error }) {
  // Don't show anything if connected and no error
  if (status === 'connected' && !error) {
    return null;
  }
  
  // Determine styling based on status
  let statusClass = 'px-4 py-2 text-sm text-center';
  let statusMessage = '';
  
  switch (status) {
    case 'connecting':
      statusClass += ' bg-yellow-100 text-yellow-800';
      statusMessage = 'Connecting to server...';
      break;
    case 'disconnected':
      statusClass += ' bg-red-100 text-red-800';
      statusMessage = 'Disconnected from server. Attempting to reconnect...';
      break;
    case 'error':
      statusClass += ' bg-red-100 text-red-800';
      statusMessage = error || 'Connection error';
      break;
    default:
      return null;
  }
  
  return (
    <div className={statusClass} data-testid="connection-status">
      {statusMessage}
    </div>
  );
}

export default ConnectionStatus;