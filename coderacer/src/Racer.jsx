import { useState, useEffect, useRef } from 'react'
import { GoogleGenAI } from "@google/genai";
import { useLocation } from 'react-router-dom';
import './Racer.css'
import { db } from './firebase';
import { doc, collection, addDoc, deleteDoc, getDocs, query, orderBy} from 'firebase/firestore';

function Racer() {
  const location = useLocation();
  const topic = location.state?.topic || 'default topic';
  const [typedText, setTypedText] = useState("")
  const [responseText, setResponseText] = useState("");
  const [language, setLanguage] = useState("Python");
  const languages = ["Python", "JavaScript", "C++", "Java", "C#", "Rust"];
  const [races, setRaces] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  const userEmail = localStorage.getItem('userEmail');
  const [mistakeCount, setMistakeCount] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0); 
  const [currentLine, setCurrentLine] = useState(0);
  const displayBoxRef = useRef(null);


  // Add CPM tracking states
  const [cpm, setCpm] = useState(0);
  const typingStartTimeRef = useRef(null);
  const timeoutIdRef = useRef(null);
  const isTypingRef = useRef(false);

  const [autoSaveSeconds, setAutoSaveSeconds] = useState(15);
  const autoSaveTimeoutRef = useRef(null);
  const hasStartedTypingRef = useRef(false);
  const cpmRef = useRef(0);





  useEffect(() => {
    if (userEmail) {
      loadUserRaces(userEmail);
    }
    
    // Cleanup on unmount
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [userEmail]);

  // Generate an initial promp
  useEffect(() => {
    // Delay code generation slightly so the render applies button class first
    const timeout = setTimeout(() => {
      handleAiClick();
    }, 0); // can also use 50 if needed
  
    return () => clearTimeout(timeout);
  }, []);
  
  

  const typedTextLengthRef = useRef(0);

  // Update the ref whenever typedText changes
  useEffect(() => {
    typedTextLengthRef.current = typedText.length;
  }, [typedText]);

  // Handle typing and response text changes
  useEffect(() => {
    // Start tracking when typing begins
    if (typedText.length > 0 && !isTypingRef.current) {
      isTypingRef.current = true;
      startCpmTracking();
    
      if (autoSaveSeconds && !autoSaveTimeoutRef.current) {
        autoSaveTimeoutRef.current = setTimeout(() => {
          saveRace();
          setAutoSaveSeconds(null);
        }, autoSaveSeconds * 1000);
      }
    }
    
    // Reset tracking when text is cleared
    if (typedText.length === 0 && isTypingRef.current) {
      resetCpmTracking();
    }
  }, [typedText]);
  
  // Handle response text changes separately
  useEffect(() => {
    if (responseText) {
      resetCpmTracking();
    }
  }, [responseText]);

  useEffect(() => {
    if (!displayBoxRef.current) return;
  
    // Get the line element inside .display-box
    const lineElements = displayBoxRef.current.children;
    const targetLine = lineElements[currentLine];
    
    if (targetLine) {
      targetLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLine]);

  useEffect(() => {
    if (!displayBoxRef.current) return;
  
    const el = displayBoxRef.current;
  
    const inputLines = typedText.split('\n');
    const lastLine = inputLines[inputLines.length - 1];
  
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.whiteSpace = 'pre';
    span.style.fontFamily = 'monospace';
    span.style.fontSize = '1.5rem';
    span.textContent = lastLine;
  
    document.body.appendChild(span);
    const pixelWidth = span.offsetWidth;
    document.body.removeChild(span);
  
    const charWidth = 9.6 * 1.5; // Estimate of monospace char at 1.5rem
    const buffer = charWidth * 5;
  
    const visibleRightEdge = el.scrollLeft + el.clientWidth;
    const isNearRightEdge = pixelWidth > (visibleRightEdge - buffer);
  
    if (isNearRightEdge) {
      el.scrollLeft = pixelWidth - el.clientWidth + buffer;
    }
  }, [typedText]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);
  

  const startAutoSaveTimer = (seconds) => {
    setAutoSaveSeconds(seconds);
  
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveRace();
      setAutoSaveSeconds(null); // reset after save
    }, seconds * 1000);
  };
  
  const calculateAndUpdateCpm = () => {
    if (!typingStartTimeRef.current || !isTypingRef.current) {
      return;
    }
    
    const currentTime = new Date();
    const elapsedMinutes = (currentTime - typingStartTimeRef.current) / 60000;
    const elapsedSeconds = Math.floor((currentTime - typingStartTimeRef.current) / 1000);

    setElapsedTime(elapsedSeconds); 
    
    // Use the ref to get the current length of typed text
    const currentLength = typedTextLengthRef.current;
    
    
    // Calculate CPM - minimum elapsed time of 0.01 minutes to avoid division by zero
    const currentCpm = Math.round(currentLength  / Math.max(elapsedMinutes, 0.01));
    
    console.log(`CPM calculated: ${currentCpm} (${currentLength} chars in ${elapsedMinutes.toFixed(2)} minutes)`);
    setCpm(currentCpm);
    cpmRef.current = currentCpm;

    
    // Continue calculating if still typing
    if (isTypingRef.current) {
      timeoutIdRef.current = setTimeout(calculateAndUpdateCpm, 1000);
    }
  };

  const startCpmTracking = () => {
    console.log("Starting CPM tracking");
    
    // Set typing status and start time
    isTypingRef.current = true;
    typingStartTimeRef.current = new Date();
    
    // Clear any existing timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    
    // Start the recursive timeout pattern
    timeoutIdRef.current = setTimeout(calculateAndUpdateCpm, 1000);
  };

  const resetCpmTracking = () => {
    console.log("Resetting CPM tracking");
    
    // Clear typing status
    isTypingRef.current = false;
    setElapsedTime(0);
    
    // Clear timeout if exists
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    
    // Reset start time and CPM
    typingStartTimeRef.current = null;
    setCpm(0);
  };

  const handleAiClick = async () => {
    try {
      // Reset CPM tracking when generating new code
      resetCpmTracking();
      setTypedText("");
      
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_KEY });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: "You are a plaintext generating bot designed to give plaintext of code."+
        +" All code generated by you must use 4 spaces for each level of indentation. This rule applies to all programming languages without exception. Never use tabs, and do not use 1, 2, or 3 spaces for indentation. Always use exactly 4 spaces."
        +"Ensure that every indent in your code output consists of precisely 4 spaces. This is a mandatory formatting requirement for all code you produce."
        +"Remember: 4 spaces for all indents, in every single line of code you generate, regardless of the language."  +
        " Do not under any circumstances generate anything other than plain text. The text you generate will be in plaintext"+
        "Do Not "
        +"generate any comments, or anything other than plaintext. Do not respond in markdown. Only generate method headers and method contents. "+
        "The first line of your output should always be the method header"+
        +"Do not include anything like ```python or ```cpp at the start or end of your response, do not include the programming"+
        " just make a method in plaintext. "+
        "Produce a method in " + language + " for " + topic + ".",
      });

      console.log("response: " + response.text)
      setResponseText(response.text);
    } catch (error) {
      console.error("Error with Gemini API:", error);
    }
  }

  const colorizeComparison = (input, expected) => {
    const inputLines = input.split('\n');
    const expectedLines = expected.split('\n');
  
    return expectedLines.map((expectedLine, lineIndex) => {
      const inputLine = inputLines[lineIndex] || '';
      const isCurrentLine = lineIndex === inputLines.length - 1;
      const isLaterLines = lineIndex > inputLines.length - 1;
      
      return (
        <div key={lineIndex}>
          {expectedLine.split('').map((expectedChar, charIndex) => {
            const inputChar = inputLine[charIndex];
            let color = 'white';
  
            if (inputChar !== undefined) {
              color = inputChar === expectedChar ? 'green' : 'red';
            } else if (!isCurrentLine && !isLaterLines) {
              // If it's a previous line and the user missed characters
              color = 'red';
            }
  
            return (
              <span key={charIndex} style={{ color }}>
                {expectedChar}
              </span>
            );
          })}
        </div>
      );
    });
  };

  const saveRace = async () => {
    if (!userEmail) {
      console.warn('User email not found.');
      return;
    }

    const racesRef = collection(doc(db, 'users', userEmail), 'races');

    const totalChars = responseText.length;
    const correctChars = totalChars - mistakeCount;
    const accuracy = Math.max(0, (correctChars / totalChars) * 100);
    try {
      const docRef = await addDoc(racesRef, {
        cpm: cpmRef.current,
        prompt: responseText,
        language,
        topic,
        accuracy,
        timestamp: new Date(),
      });
      console.log('Race saved successfully.');
      setTypedText("");
      
      loadUserRaces(userEmail);
    } catch (error) {
      console.error('Error saving race:', error);
    }
  };

  const deleteRace = async (raceId) => {
    if (!userEmail || !raceId) return;
  
    const raceDocRef = doc(db, 'users', userEmail, 'races', raceId);
    try {
      await deleteDoc(raceDocRef);
      console.log('Race deleted');
      setSelectedRace(null);           
      loadUserRaces(userEmail);        
    } catch (error) {
      console.error('Error deleting race:', error);
    }
  };
  
  const getUserRaces = async (email) => {
    if (!email) return [];
  
    const racesRef = collection(doc(db, 'users', email), 'races');
    const q = query(racesRef, orderBy('timestamp', 'desc')); 
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };
  
  const loadUserRaces = async (email) => {
    const racesData = await getUserRaces(email);
    setRaces(racesData);
  };

  return (
    <div className="container">
      <div className="history-panel">
        <h2 className="history-title">History</h2>
        <div className="history-content">
          {races.length === 0 ? (
            <p>No previous races</p>
          ) : (
            races.map((race) => (
              <div
                key={race.id}
                className="race-entry"
                onClick={() => {
                  setSelectedRace(race);
                  setTypedText("");
                  }}
                style={{ cursor: 'pointer' }}
              >
                <strong style={{ fontSize: '16px' }}>{race.topic || "Unknown Topic"}</strong>
                <div style={{ marginTop: '4px' }}>
                  CPM: <span style={{ color: '#00ff90' }}>{race.cpm}</span>
                </div>
                <div style={{ marginTop: '2px' }}>
                  Accuracy: <span style={{ color: '#00ff90' }}>{race.accuracy?.toFixed(1)}%</span>
                </div>
                <div style={{ marginTop: '2px' }}>
                  Language: <span style={{ color: '#00ff90' }}>{race.language}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="typing-panel">
        {selectedRace ? (
          <>
            <div className="race-detail-container">
            <h2 className="race-title">{selectedRace.topic || "Untitled Prompt"}</h2>

            <div className="race-meta">
              <p><strong>CPM:</strong> {selectedRace.cpm}</p>
              <p><strong>Accuracy:</strong> {selectedRace.accuracy?.toFixed(1)}%</p>
              <p><strong>Language:</strong> {selectedRace.language}</p>
            </div>

            <div className="race-detail-box">
              {selectedRace.prompt}
            </div>
          </div>
          <div className="race-detail-buttons">
            <button className="back-button" onClick={() => setSelectedRace(null)}>
              ← Back to Race
            </button>
            <button className="delete-button" onClick={() => deleteRace(selectedRace.id)}>
              🗑 Delete Race
            </button>
          </div>
          </>
        ) : (
          <>
            <h1>CodeRacer</h1>
            <div className="stats">
              <div className="stat">
                <span className="label">CPM:</span> {cpm}
              </div>
              <div className="stat">
                <span className="label">Time:</span> {elapsedTime}s
              </div>
            </div>
            <div className="filters" style={{ marginTop: '1rem' }}>
              {[15, 30, 60].map((sec) => (
                <button
                  key={sec}
                  onClick={() => startAutoSaveTimer(sec)}
                  className={autoSaveSeconds === sec ? 'selected' : ''}
                >
                  {sec}s
                </button>
              ))}
            </div>
            <div className="filters">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    if (lang !== language) {
                      setLanguage(lang);
                      setTypedText("");        
                      setResponseText("");      
                      setTimeout(() => handleAiClick(), 0); 
                    }

                    }}
                  className={language === lang ? "selected" : ""}
                >
                  {lang}
                </button>
              ))}
            </div>
            <div className="typing-pair">
            <div className="textarea-wrapper">
              <textarea
                value={typedText}
                onChange={(e) => {
                  const textarea = e.target;
                  const textUntilCaret = typedText.substring(0, textarea.selectionStart);
                  const line = textUntilCaret.split('\n').length - 1;
                  setCurrentLine(line);

                  const newTypedText = e.target.value;
                  setTypedText(newTypedText);

                  let mistakes = 0;
                  const maxLength = Math.max(newTypedText.length, responseText.length);

                  for (let i = 0; i < maxLength; i++) {
                    if (newTypedText[i] !== responseText[i]) {
                      mistakes++;
                    }
                  }

                  setMistakeCount(mistakes);

                }}
                onKeyDown={(e) => {
                  const TAB_SPACES = '    ';
                
                  if (e.key === 'Enter') {
                    // Reset scroll to left if user was scrolled right
                    if (displayBoxRef.current && displayBoxRef.current.scrollLeft > 0) {
                      setTimeout(() => {
                        displayBoxRef.current.scrollLeft = 0;
                      }, 0); // delay to let the new line render first
                    }
                  }

                  if (e.key === 'Tab') {
                    e.preventDefault();
                
                    const start = e.target.selectionStart;
                    const end = e.target.selectionEnd;
                
                    const newValue =
                      typedText.substring(0, start) + TAB_SPACES + typedText.substring(end);
                
                    setTypedText(newValue);
                
                    setTimeout(() => {
                      e.target.selectionStart = e.target.selectionEnd = start + TAB_SPACES.length;
                    }, 0);
                  }
                
                  if (e.key === 'Backspace') {
                    const start = e.target.selectionStart;
                    const end = e.target.selectionEnd;
                
                    if (start === end) {
                      const before = typedText.substring(start - 4, start);
                      if (before === TAB_SPACES) {
                        e.preventDefault();
                
                        const newValue =
                          typedText.substring(0, start - 4) + typedText.substring(end);
                
                        setTypedText(newValue);
                
                        setTimeout(() => {
                          e.target.selectionStart = e.target.selectionEnd = start - 4;
                        }, 0);
                      }
                    }
                  }
                }}
              />
            </div>
            <div className ="display-box" ref={displayBoxRef}>
              {colorizeComparison(typedText, responseText)}
            </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Racer