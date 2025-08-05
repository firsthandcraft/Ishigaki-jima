import { useState } from 'react';
import './css/reset.css';
import './css/App.css';
import P5Sketch from './component/P5Sketch';
import Navigation from './component/Navigation';
import Title from './component/Title';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className='baseLine'>
        <Navigation/>
        <P5Sketch/>
        <Title></Title>
      </div>
    </>
  );
}

export default App;
