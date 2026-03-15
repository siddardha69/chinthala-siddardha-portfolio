import './header.css';
import Cta from './CTA';
import MEpng from '../../assets/siddardha_profile.jpg';
import HeaderSocial from './HeaderSocial';
import { useTypewriter, Cursor } from 'react-simple-typewriter';

const Header = () => {
  const [text] = useTypewriter({
    words: ['AI & Data Science Student', 'Machine Learning Engineer', 'Python Developer', 'Data Science Enthusiast'],
    loop: true
  });

  return (
    <header id='home' role="banner">
      <div className='container header__container'>
        <h1 className='small-title'>Hello, I am</h1>
        <a href='#home' aria-label="Go to home section">
          <h2 className='big-title'>Chinthala Siddardha</h2>
        </a>
        <div className='typewriter' aria-live="polite" aria-label="Current role">
          <span className='text-gradient'>{text}</span>
          <Cursor cursorColor='#444444' cursorStyle='|' />
        </div>
        <Cta />
        <HeaderSocial />

        <div className='me'>
          <img
            src={MEpng}
            alt='Chinthala Siddardha - Professional headshot'
            loading="eager"
          />
        </div>

        <div className='mouse' aria-hidden="true"></div>
        <a href='#contact' className='scroll__down' aria-label="Scroll down to contact section">
          Scroll Down
        </a>
      </div>
    </header>
  );
};

export default Header;
