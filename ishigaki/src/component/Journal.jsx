import '../css/journal.css';
import { useEffect, useState } from 'react';
import axios from 'axios';

function Journal() {
  const [items, setItems] = useState([
    { id: 1, type: 'image', url: 'https://via.placeholder.com/300' },
    { id: 2, type: 'video', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm' },
    { id: 3, type: 'image', url: 'https://via.placeholder.com/301' },
    { id: 4, type: 'video', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm' },
    { id: 5, type: 'image', url: 'https://via.placeholder.com/302' },
    { id: 6, type: 'video', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm' },
  ]);

  // 실제로는 API 호출 후 setItems(data) 하시면 됩니다.
  /*
  useEffect(() => {
    axios.get('/api/journal')
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
  }, []);
  */

  return (
    <div className='journal'>
      <div className="journalContainer">
        <ul className="journalList">
          <li>04.29</li>
          <li>04.30</li>
          <li>05.01</li>
          <li>05.02</li>
          <li>05.03</li>
          <li>05.04</li>
          <li>05.05</li>
        </ul>
      </div>
      <div className="journalContent">
        {items.map(item => (
          <div key={item.id} className="mediaBox">
            {item.type === 'image' ? (
              <img src={item.url} alt={`image-${item.id}`} />
            ) : (
              <video 
                src={item.url} 
                autoPlay 
                muted 
                loop 
                playsInline
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Journal;
