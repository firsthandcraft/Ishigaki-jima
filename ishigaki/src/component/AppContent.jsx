import { Routes, Route } from 'react-router-dom';
import '../css/App.css';
import '../css/world.css';

import IslandCanvas from './IslandCanvas';
import HUD from './HUD';
import TripRecord from './TripRecord';
import RegisterTripRecord from './RegisterTripRecord';


// AppContent 컴포넌트는 App 컴포넌트가 BrowserRouter로 감싼 후 렌더링되므로,
function AppContent() {
  return (
    <div className='baseLine'>
      <IslandCanvas />
      <HUD />
      <Routes>
        <Route path="/" element={null} />
        <Route path="/journal" element={<TripRecord/>} />
        <Route path="/register" element={<RegisterTripRecord />} />
      </Routes>
    </div>
  );
}
export default AppContent;
