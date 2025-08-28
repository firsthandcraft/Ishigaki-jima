import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import '../css/App.css';

import P5Sketch from './P5Sketch';
import Navigation from './Navigation';
import Title from './Title';
import TripRecord from './TripRecord';
import Login from './Login';
import RegisterTripRecord from './RegisterTripRecord';


// AppContent 컴포넌트는 App 컴포넌트가 BrowserRouter로 감싼 후 렌더링되므로,
function AppContent() {
  const location = useLocation();
  const [cameraPosition, setCameraPosition] = useState(0);

useEffect(() => {
    console.log("현재 AppContent 주소:", location.pathname);
      if (location.pathname === '/register') {
        setCameraPosition(1);
        } else if (location.pathname === '/') {
        setCameraPosition(0);
        } else if (location.pathname === '/journal') {
        setCameraPosition(2);
        }
  }, [location,cameraPosition]);


  return (
    <div className='baseLine'>
      <Navigation />
      <P5Sketch cameraPosition={cameraPosition} />
      <Routes>
        <Route path="/" element={<Title/>} />
        <Route path="/journal" element={<TripRecord/>} />
        <Route path="/register" element={<RegisterTripRecord />} />
      </Routes>
    </div>
  );
}
export default AppContent;
