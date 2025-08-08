import React, { useState } from 'react';
import axios from 'axios';

function Register() {
  const [form, setForm] = useState({
    username: '',
    id: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/member/create', form);
      alert('회원가입 성공!');
    } catch (err) {
      console.error(err);
      alert('회원가입 실패!');
    }
  };

  return (
    <div className="registerContainer">
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit}>
        <input
        className={getInputClass()}
          type="text"
          name="username"
          placeholder="사용자 이름"
          value={form.username}
          onChange={handleChange}
        />
        <input
        className={getInputClass()}
          type="text"
          name="id"
          placeholder="아이디"
          value={form.id}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          value={form.password}
          onChange={handleChange}
        />
        <button type="submit">가입하기</button>
      </form>
    </div>
  );
}

export default Register;
