import { useState } from 'react';
import './css/reset.css';
import './css/App.css';
import P5Sketch from './component/P5Sketch';
import Navigation from './component/Navigation';
import Title from './component/Title';
import TripRecord from './component/TripRecord';
import AboutMe from './component/Aboutme';
import RegisterTripRecord from './component/RegisterTripRecord';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
function App() {
  const [count, setCount] = useState(0);
  return (
    <>
    <BrowserRouter>

      <div className='baseLine'>
        <Navigation/>
        <Title></Title>
          <Routes>
            <Route path="/" element={<P5Sketch />} />
            <Route path="/journal" element={<TripRecord />} />
            <Route path="/aboutme" element={<AboutMe />} />
            <Route path="/register" element={<RegisterTripRecord />} />
          </Routes>

      </div>
    </BrowserRouter>

    </>
  );
}

export default App;
