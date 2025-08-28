import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './css/reset.css';
import AppContent from './component/AppContent.jsx';


// App 컴포넌트는 오직 BrowserRouter만 렌더링하는 역할입니다.
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;