import './footer.css';
import { FaLinkedinIn } from 'react-icons/fa';
import { FaGithub } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer>
      <a href='#home' className='footer__logo'>
        SIDDARDHA
      </a>

      <ul className='permalinks'>
        <li>
          <a href='#home'>Home</a>
        </li>
        <li>
          <a href='#about'>About</a>
        </li>
        <li>
          <a href='#experience'>Experience</a>
        </li>
        <li>
          <a href='#expertise'>Expertise</a>
        </li>
        <li>
          <a href='#qualification'>Qualification</a>
        </li>
        <li>
          <a href='#portfolio'>Portfolio</a>
        </li>
        <li>
          <a href='#contact'>Contact</a>
        </li>
      </ul>

      <div className='footer__socials'>
        <a
          href='https://linkedin.com/in/siddardha-chinthala-158a88350'
          aria-label='LinkedIn'
          target='_blank'
          rel='noreferrer'
        >
          <FaLinkedinIn />
        </a>
        <a
          href='https://github.com/krishh-9085'
          aria-label='GitHub'
          target='_blank'
          rel='noreferrer'
        >
          <FaGithub />
        </a>

      </div>

      <div className='footer__copyright'>
        <small>
          Created by yours truly,{' '}
          <a
            href='https://linkedin.com/in/siddardha-chinthala-158a88350'
            aria-label='Chinthala Siddardha'
            target='_blank'
            rel='noreferrer'
          >
            Chinthala Siddardha
          </a>{' '}
          &copy; {new Date().getFullYear()}.
        </small>
      </div>
    </footer>
  );
};

export default Footer;
