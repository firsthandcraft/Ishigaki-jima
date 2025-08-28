import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Box } from '@mui/material';
import '../css/admin.css';

function Register({ handlChangeView }) {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); 
  const [isEmailDuplicate, setIsEmailDuplicate] = useState(false);
  const [emailHelperText, setEmailHelperText] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');

const handleEmailCheck = async (e) => {
        const inputEmail = e.target.value;
        setEmail(inputEmail);

        if (inputEmail.length > 0) {
            try {
                const response = await axios.get(`/member/checkEmail?email=${inputEmail}`);
                
                if (response.data.isDuplicate) {
                    setIsEmailDuplicate(true);
                    setEmailHelperText("이미 사용 중인 이메일입니다.");
                } else {
                    setIsEmailDuplicate(false);
                    setEmailHelperText("사용 가능한 이메일입니다.");
                }
            } catch (error) {
                console.error("이메일 중복 확인 실패:", error);
                setIsEmailDuplicate(false);
                setEmailHelperText("이메일 확인에 실패했습니다.");
            }
        } else {
            setIsEmailDuplicate(false);
            setEmailHelperText('');
        }
    };
    
    const handleRegister = async (e) => {
        e.preventDefault();

        if (isEmailDuplicate) {
            setRegisterMessage("회원가입에 실패했습니다. 이메일 중복을 확인해주세요.");
            return;
        }

        try {
            await Promise.reject({ response: { status: 400, data: '테스트 에러 메시지' } });

            const response = await axios.post('/member/register', {
                email,
                password
            });

            setRegisterMessage("회원가입 성공!");
            console.log("회원가입 결과:", response.data);
            onChangeView();
        } catch (error) {
            console.error("회원가입 실패:", error);
            setRegisterMessage("회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        }
    };
 

  return (
    <div className="formContainer">
      <h2>Register</h2>
     <form onSubmit={handleRegister} className="loginForm">
        <TextField fullWidth
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={isEmailDuplicate} // 중복이면 오류 스타일 적용
            helperText={emailHelperText}
        />

        <TextField fullWidth
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
        />
        {registerMessage && 
          <Box sx={{ marginTop: '15px', textAlign: 'center' }}>
            <p style={{ 
              color: '#d32f2f',
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              fontWeight: 400,
              fontSize: '0.75rem',
            }}>
              {registerMessage}
            </p>
          </Box>
        }
        <Button variant="outlined" fullWidth variant="contained"
        sx={{ marginTop: '10px' }} type="submit">회원가입</Button >
        <Button variant="outlined" fullWidth
        sx={{ marginTop: '10px' }} onClick={handlChangeView}>로그인</Button >
    </form>
    </div>
  );
}

export default Register;
