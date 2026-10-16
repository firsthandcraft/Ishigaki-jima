import '../css/nav.css';
import { Link } from 'react-router-dom';
import home from '.././img/home.png'
import camera from '.././img/camera.png'
import photo from '.././img/photo.png'


function Navigation() {
  return (
    <div className='headerWrap'>
      <ul className='linkWrap'>
        <li><Link to="/"><img src={home} alt="concepts" /></Link></li>
        <li><Link to="/journal"><img src={photo} alt="concepts" /></Link></li>
        <li><Link to="/register"><img src={camera} alt="concepts" /></Link></li>
      </ul>
    </div>
    );
}
export default Navigation;
