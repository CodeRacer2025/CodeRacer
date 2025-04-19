import { Routes, Route, Link } from 'react-router-dom'
import Racer from './Racer.jsx'
import Topics from './Topics.jsx'
import Login from './Login.jsx';


function App() {
  return (
    <>
      {/* <nav>
        <Link to="/">Racer</Link> | <Link to="/topics">Topics</Link>
      </nav> */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/racer" element={<Racer />} />
      </Routes>
    </>
  )
}

export default App
