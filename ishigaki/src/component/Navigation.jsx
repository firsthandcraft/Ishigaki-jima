import '../css/nav.css';
import { Link } from 'react-router-dom';
import home from '.././img/home.png'
import camera from '.././img/camera.png'
import photo from '.././img/photo.png'
import key from '.././img/key.png'
import logout from '.././img/logout.png'
import React, { useState,useEffect  } from 'react';
import { TextField, Button, Box } from '@mui/material';
import Login from './Login.jsx';
import Register from './Register.jsx';


function Navigation() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); //F닫힘, T 열림
  const [isChangeView, setIsChangeView] = useState(true); //T 로그인, F회원가입
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 추가

  const openSidebar = () => {
    setIsChangeView(true);
    setIsSidebarOpen(true);
  };
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  //로그인 회원가입 전환
  const handlChangeView = () => {
     setIsChangeView(!isChangeView); 
  };
   // 컴포넌트 마운트 시 로컬 스토리지에서 로그인 상태를 확인
  useEffect(() => {
    const loggedInStatus = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedInStatus);
  }, []);
  return (
    <div className='headerWrap'>
      <ul className='linkWrap'>
        <li ><Link to="/"><img src={home} alt="concepts" /></Link></li>
        {isLoggedIn && (
          <>
            <li><Link to="/journal"><img src={photo} alt="concepts" /></Link></li>
            <li><Link to="/register"><img src={camera} alt="concepts" /></Link></li>
          </>
        )}
        {isLoggedIn ? (
          <li onClick={handleLogout}>
            <img src={logout} alt="Logout" />
          </li>
        ) : (
          <li onClick={openSidebar}>
            <img src={key} alt="Login" />
          </li>
        )}
      </ul>
      <aside className={`loginContainer ${isSidebarOpen ? 'active' : ''}`}>
        <button className="closeButton" onClick={toggleSidebar}>&times;</button>
        { isChangeView ?
          ( <Login handlChangeView={handlChangeView} /> ) : 
          ( <Register handlChangeView={handlChangeView}/>)
        }
      </aside>
    </div>
    );
}
export default Navigation;