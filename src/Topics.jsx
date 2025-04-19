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
      console.log("The user prompt is: " + result);
      setResponseText(result)

      // makes sure that if the response is valid, then it isnt changed
      if (result === "valid") {
        navigate("/racer", { state: { topic } })
      } else {

      const response2 = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents:
          "You are a programming topic generation bot. Your only responses should be topics for functions." +
          " Under no circumstances will you answer anything other than a topic for a function." +
          " Under no circumstances will your answer be longer than 10 words" +
          " The imput topic is not about programming, or not definable in the scope of one function," +
          " E.g apples, news, cheese. these are not about programming so they are invalid." +
          " E.g Web interface, TCP server, computer networking, class hierarchies." +
          " these are not definable in a single function so they are invalid." +
          " You will create a topic that somehow involves the original topic given" +
          " E.g if the topic is apples, make the prompt: a mentod that prints out charcteristics of an apple." +
          " The topic you should generate should follow the ruels stated above. E.g definable in a single method, etc" +
          ` The topic to evaluate is: ${topic}`
      })
      const result2 = response2.text.trim().toLowerCase()
      console.log("The Gemini edited topic is :" + result2);
      setResponseText(result2);
      navigate("/racer", { state: { topic: result2 } })
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
