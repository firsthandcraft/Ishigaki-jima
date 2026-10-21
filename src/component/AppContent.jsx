import { Routes, Route, Navigate } from 'react-router-dom';
import '../css/App.css';
import '../css/world.css';

import IslandCanvas from './IslandCanvas';
import HUD from './HUD';
import CharacterCustomize from './CharacterCustomize';
import PeopleList from './PeopleList';
import RegisterTripRecord from './RegisterTripRecord';


// AppContent 컴포넌트는 App 컴포넌트가 BrowserRouter로 감싼 후 렌더링되므로,
function AppContent() {
  return (
    <div className='baseLine'>
      <IslandCanvas />
      <HUD />
      <Routes>
        <Route path="/" element={null} />
        <Route path="/character" element={<CharacterCustomize />} />
        <Route path="/journal" element={<Navigate to="/character" replace />} /> {/* 예전 주소 */}
        <Route path="/people" element={<PeopleList />} />
        <Route path="/register" element={<RegisterTripRecord />} /> {/* 상단 메뉴에선 빠졌지만 주소로는 그대로 들어갈 수 있다 */}
      </Routes>
    </div>
  );
}
export default AppContent;
