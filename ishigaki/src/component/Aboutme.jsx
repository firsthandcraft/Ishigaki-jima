import React, { useState } from 'react';
import axios from 'axios';
import '../css/admin.css';
import Login from './Login';
import Register from './register';
function AboutMe() {
  const [title, setTitle] = useState("About Me");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("image", imageFile);

    try {
      console.log("전송할 데이터:", formData);
      const response = await axios.post('/member/create', formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      alert("저장 완료!");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 중 오류 발생");
    }
  };

  return (
    <div className="aboutMeContainer">
      <Login></Login>
      <Register></Register>
      {/* <h2>{title}</h2>

      {preview ? (
        <img src={preview} alt="미리보기" className="aboutMeImage" />
      ) : (
        <p>No image selected</p>
      )}

      <form onSubmit={handleSubmit} className="aboutMeInputs">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        <button type="submit">저장</button>
      </form> */}
    </div>
  );
}

export default AboutMe;
