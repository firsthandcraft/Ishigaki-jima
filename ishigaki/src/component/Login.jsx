
import '../css/admin.css';
import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Box } from '@mui/material';

function Login({ handlChangeView }) {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');


      const handleLogin = async (e) => {
        e.preventDefault();

        try {
          const response = await axios.post('/member/login', {
            email,
            password
          });

          alert("로그인 성공!");
          console.log("로그인 결과:", response.data);
          // 토큰 저장, 페이지 이동 등 추가 로직 작성 가능
        } catch (error) {
          console.error("로그인 실패:", error);
          alert("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
      };
 
  return (
  <div className='formContainer'>
    <h2>Login</h2>
    <form onSubmit={handleLogin} className="loginForm">
        <TextField fullWidth
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
        />
        <TextField fullWidth
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
        />
        <Button variant="outlined" fullWidth variant="contained"
        sx={{ marginTop: '10px' }} type="submit">로그인</Button >
        <Button variant="outlined" fullWidth
        sx={{ marginTop: '10px' }} onClick={handlChangeView}>회원가입</Button >
    </form>
  </div>
  );
}

export default Login;
