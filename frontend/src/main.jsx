import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'  // ⬅️ Tambahkan ini
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* ⬅️ Bungkus App di dalam BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
