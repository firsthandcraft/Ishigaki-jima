import React, { useState } from 'react';
import axios from 'axios';
import '../css/admin.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
    <div className="loginContainer">
      <h2>로그인</h2>
      <form onSubmit={handleLogin} className="loginForm">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">로그인</button>
      </form>
    </div>
  );
}

export default Login;
