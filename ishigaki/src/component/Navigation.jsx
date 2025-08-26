import '../css/nav.css';
import { Link } from 'react-router-dom';
import home from '.././img/home.png'
import camera from '.././img/camera.png'
import letter from '.././img/letter.png'



function Navigation() {

    return (
        <div className='header'>
          <header>
            <nav>
              <ul>
                <li><Link to="/"><img src={home} alt="concepts" /></Link></li>
                <li><Link to="/journal"><img src={camera} alt="concepts" /></Link></li>
                <li><Link to="/aboutme"><img src={letter} alt="concepts" /></Link></li>
                <li><Link to="/register"><img src={letter} alt="concepts" /></Link></li>
              </ul>
            </nav>
          </header>
        </div>
    );
}
export default Navigation;