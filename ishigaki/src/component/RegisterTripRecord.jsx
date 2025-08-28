import React, { useState,useRef,useEffect  } from 'react';
import axios from 'axios';
import '../css/register.css';
import Button from '@mui/material/Button';
import TextField from "@mui/material/TextField";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
// import axios from 'axios';


function RegisterTripRecord() {
  const [images, setImages] = useState([]); // 원본이미지배열
  const fileInputRef = useRef(null); // 최대 8개 까지 넣는 input
  const MAX_IMAGES = 8; //업로드 가능 이미지갯수 

  const [brushSize, setBrushSize] = useState(5); //브러쉬 사이즈
  const [brushColor, setBrushColor] = useState("red"); //브러쉬 컬러

  const canvasRef = useRef(null); //캔버스 
  const [editingIndex, setEditingIndex] = useState(null); // 캔버스에서 편집 중인 이미지 인덱스
  const [isDrawing, setIsDrawing] = useState(false); //그림을 그리고 있는 상태인지 여부

  const [selectedDate, setSelectedDate] = useState(""); //날짜 
  const today = new Date().toISOString().split("T")[0]; //오늘이후는 등록 못함


  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /*이미지 업로드 제한 기능 8개로 제한 */
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    
    if (images.length + files.length > MAX_IMAGES) {
      alert(`최대 ${MAX_IMAGES}개까지 선택 가능합니다!`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // 여러 개 선택 시 URL 배열 생성
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file), //blob url
    }));

    // 기존 이미지 + 새 이미지 합치기
    setImages((prev) => [...prev, ...newImages]);
  };



  // 이미지 클릭 → 편집 시작
  const handleImageClick = (idx) => {
    setEditingIndex(idx);
     // useEffect로 상태 변화 감지 후 캔버스 업데이트

  };

  useEffect(() => { //비동기식으로 변경 >> 이미지클릭시 캔버스에서 인지를 위해 
    if (editingIndex === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return; // null 체크

    const ctxEffect = canvas.getContext("2d");
    const img = new Image();
    img.src = images[editingIndex].preview;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctxEffect.drawImage(img, 0, 0);
    };
  }, [editingIndex, images]);


  // 그림판처럼 그림
  const handleMouseDown = () => setIsDrawing(true);
  const handleMouseUp = () => setIsDrawing(false);
  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const style = getComputedStyle(canvas);
  const paddingLeft = parseFloat(style.paddingLeft);
  const paddingTop = parseFloat(style.paddingTop);
  const borderLeft = parseFloat(style.borderLeftWidth);
  const borderTop = parseFloat(style.borderTopWidth);

  const x = e.clientX - rect.left - paddingLeft - borderLeft;
  const y = e.clientY - rect.top - paddingTop - borderTop;

    ctx.fillStyle = brushColor; // 브러시 색
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  };

  // 편집 완료 → 새로운 상태에 저장
  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const canvas = canvasRef.current;
    const editedDataUrl = canvas.toDataURL(); // 수정된 이미지

    // 기존 images 배열을 복사
    const newImages = [...images];

    // 클릭한 인덱스의 preview를 수정된 데이터 URL로 업데이트
    newImages[editingIndex] = {
      ...newImages[editingIndex],
      preview: editedDataUrl,
    };
    // 상태 업데이트
    setImages(newImages);

    //  편집 종료
    setEditingIndex(null);
  };

  const handleReset =() => {
    if (editingIndex === null) return; // 안전 체크
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // 원본 이미지 가져오기
    const img = new Image();
    img.src = images[editingIndex].preview; // 클릭한 이미지의 원본
    img.onload = () => {
      // 캔버스 크기 초기화
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height); // 기존 그림 초기화
      ctx.drawImage(img, 0, 0); // 원본 이미지 다시 그리기
    };
  }
  // 업로드 버튼 클릭 시 실행 (백엔드 연동용)
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!fileInputRef.current || !fileInputRef.current.files.length) {
      alert("이미지를 선택해주세요!");
      return;
    } else if (!selectedDate) {
        alert("날짜를 선택해주세요!");
        return;
    }
    const formData = new FormData();
    const files = fileInputRef.current.files;

    for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }
    formData.append("date", selectedDate);
    console.log("=== FormData 내용 ===");
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
      // for (let [key, value] of formData.entries()) {
      //   console.log(key, value);
      // }
    // 👉 fetch / axios 등을 사용해 서버 전송 가능
    // 예: axios.post("/upload", formData)
    axios.post('http://localhost:9010/island/journal/insert',formData) // Spring Boot 서버 주소
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
 
  };

  return (
    <div className="registerContainer">
      <form className='registerForm' >
           {/* 숨겨진 실제 파일 input */}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange} ref={fileInputRef}
              style={{ display: "none" }}
            />

            <Button
              variant="contained"
              color="primary"
              startIcon={<UploadFileIcon />}
              onClick={handleClick}
            >
              이미지 선택
            </Button>
        <br />
        <div id='imgWrap' className="grid grid-cols-4 gap-2 mb-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative" onClick={() => handleImageClick(idx)}>
              <img
                src={img.preview}
                alt={`preview-${idx}`}
                className="w-full h-24 object-cover rounded cursor-pointer"
              />
            </div>
          ))}
        </div>
   
        <br />
        <LocalizationProvider dateAdapter={AdapterDateFns} >
              <TextField
                label="날짜 선택"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{
                  shrink: true, // label이 겹치지 않도록
                  style: { color: "white" } 
                }}
                variant="outlined"
                inputProps={{
                  max: today, // 오늘 이후 선택 불가                  
                  style: { color: "white" } // Sets the input value to white
                }}
                sx={{
                  // 아웃라인(테두리) 색상을 흰색으로 변경
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "white",
                    },
                    // 호버 시 테두리 색상
                    "&:hover fieldset": {
                      borderColor: "white",
                    },
                    // 포커스 시 테두리 색상
                    "&.Mui-focused fieldset": {
                      borderColor: "white",
                    },
                  },
                  
                }}
              />
          </LocalizationProvider><br /><br />
       <Button variant="outlined" type="submit" style={{ color: "white", borderColor: "white" }}>등록</Button>
      </form>
           <br />
        {/* 편집 캔버스 */}
        {editingIndex !== null && (
          <div style={{ marginTop: "10px", textAlign:"center", position: "relative"}}>
            <p>{brushColor}</p>
            <div style={{ marginBottom: "5px" }}>
              <button onClick={() => setBrushColor("red")} style={{ backgroundColor: "red", width: 30, height: 30, marginRight: 5 }}></button>
              <button onClick={() => setBrushColor("blue")} style={{ backgroundColor: "blue", width: 30, height: 30, marginRight: 5 }}></button>
              <button onClick={() => setBrushColor("green")} style={{ backgroundColor: "green", width: 30, height: 30, marginRight: 5 }}></button>
              <button onClick={() => setBrushColor("yellow")} style={{ backgroundColor: "yellow", width: 30, height: 30, marginRight: 5 }}></button>
              <button onClick={() => setBrushColor("black")} style={{ backgroundColor: "black", width: 30, height: 30, marginRight: 5 }}></button>
            </div>
            <div style={{ marginBottom: "5px" }}>
              <label>브러시 굵기: </label>
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
              />
              <span> {brushSize}</span>
            </div>
            <canvas
             className="imgCavas" 
              style={{
                    display: editingIndex !== null ? 'block' : 'none'
                  }}   
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            ></canvas>
            <div style={{ marginTop: "5px" }}>
              <Button onClick={handleSaveEdit} style={{ marginRight: 5 }} variant="outlined">편집 저장</Button>
              <Button onClick={handleReset} variant="outlined">리셋</Button>
            </div>
        </div>
        )}
    </div>
  );
}

export default RegisterTripRecord;
