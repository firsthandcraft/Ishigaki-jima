import '../css/nav.css';
import { Link } from 'react-router-dom';
import home from '.././img/home.png'
import people from '.././img/people.svg'
import face from '.././img/face.svg'


function Navigation() {
  return (
    <div className='headerWrap'>
      <ul className='linkWrap'>
        <li><Link to="/"><img src={home} alt="concepts" /></Link></li>
        <li><Link to="/character"><img src={face} alt="캐릭터 꾸미기" /></Link></li>
        <li><Link to="/people"><img src={people} alt="섬 주민" /></Link></li>
      </ul>
    </div>
    );
}
export default Navigation;
