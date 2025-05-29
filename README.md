# SimpleChat Application

A simple and visually appealing chat application frontend built with React and Tailwind CSS.

## Features

- Clean, modern UI with Tailwind CSS styling
- Responsive design for both desktop and mobile
- Message display with different styling for user and bot messages
- Message input with text field and send button
- Timestamps on messages
- Auto-scroll to the latest message

## Project Structure

```
simple_chat_application/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.js
│   │   ├── Message.js
│   │   ├── MessageDisplay.js
│   │   └── MessageInput.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```
4. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Running Tests

```
npm test
```

## Implementation Details

- **React**: Used for building the UI components and managing state
- **Tailwind CSS**: Used for styling with a utility-first approach
- **useState Hook**: Used for managing the messages state
- **useRef and useEffect Hooks**: Used for auto-scrolling to the latest message

Note: This is a frontend-only implementation. No backend logic is included.
