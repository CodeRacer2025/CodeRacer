import { useState } from 'react'
import { GoogleGenAI } from "@google/genai";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'


function App() {
  const [count, setCount] = useState(0)

  const handleAiClick = async () => {
    console.log("Gemini key:", import.meta.env.VITE_GEMINI_KEY);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_KEY });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: "Explain how AI works and limit it to 50 words",
      });

      console.log(response.text)
    } catch (error) {
      console.error("Error with Gemini API:", error);
    }
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button onClick={handleAiClick} style={{ marginTop: "1rem" }}>
          Ask Gemini: "How does AI work?"
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
