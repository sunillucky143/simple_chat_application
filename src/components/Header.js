import React from 'react';

function Header() {
  return (
    <header className="bg-blue-600 text-white p-4 shadow-md" data-testid="header">
      <h1 className="text-xl font-bold text-center" data-testid="header-title">SimpleChat</h1>
    </header>
  );
}

export default Header;