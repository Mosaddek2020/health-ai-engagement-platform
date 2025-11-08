import React from 'react'

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Health AI Engagement Platform</h1>
      <p>Welcome to the AI-powered platform to predict and reduce patient no-shows.</p>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h2>Services Status</h2>
        <ul>
          <li>React Frontend: Running ✓</li>
          <li>Laravel Backend: Check http://localhost:80</li>
          <li>AI Agent Service: Check http://localhost:8000</li>
          <li>API Documentation: http://localhost:8000/docs</li>
        </ul>
      </div>
    </div>
  )
}

export default App
