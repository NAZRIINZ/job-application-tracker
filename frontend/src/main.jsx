// main.jsx - The entry point for the React application
// React renders the App component into the #root div in index.html
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'   // Global styles

// React 18 way of rendering the app
// StrictMode helps catch bugs during development by rendering twice
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
