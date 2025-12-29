import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Version 1.0.1 - Bug fixes: recipe validation & action menu visibility
console.log('MyPOS v1.0.1 initialized');
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
