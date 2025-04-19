import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleGenAI } from "@google/genai"

import './Topics.css'

function Topics() {
  const [topic, setTopic] = useState('')
  const [responseText, setResponseText] = useState("")
  const navigate = useNavigate()

  const handleNext = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_KEY })

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents:
          "You are a programming topic validating bot. Your only responses should be valid or invalid." +
          " Under no circumstances will you answer anything other than valid or invalid." +
          " You will answer valid if the input is a programming concept that can be defined in a single function." +
          " Eg. sorting, reversing, algorithms, if statements, for loops, while loops." +
          " If the input is not about programming, or not definable in the scope of one function you will answer invalid." +
          " E.g apples, news, cheese. these are not about programming so they are invalid." +
          " E.g Web interface, TCP server, computer networking, class hierarchies." +
          " these are not definable in a single function so you will answer invalid." +
          ` The topic to evaluate is: ${topic}`
      })

      const result = response.text.trim().toLowerCase()
      setResponseText(result)

      if (result === "valid") {
        navigate("/racer", { state: { topic } })
      } else {
        alert("Invalid topic. Ensure that your topic is: definable in one method and relates to programming.\n"+
          "E.g. For loops, if statements, quick sort, BFS, array operations "
        )
      }
    } catch (error) {
      console.error("Error with Gemini API:", error)
      alert("There was an error validating your topic. Please try again.")
    }
  }

  return (
    <div className="topics-container">
      <h1>Select a Topic</h1>
      <input
        type="text"
        placeholder="Enter a coding topic..."
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="topic-input"
      />
      <button className="next-button" onClick={handleNext}>
        Next
      </button>
      {responseText && <p className="response-text">Validation result: {responseText}</p>}
    </div>
  )
}

export default Topics
