// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import CurryApp from './CurryApp.jsx' // we'll put your big app code in CurryApp.jsx

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CurryApp />
  </React.StrictMode>
)
