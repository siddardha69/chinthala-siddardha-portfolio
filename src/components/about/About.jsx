import './about.css';
import SiddardhaProfile from '../../assets/siddardha_profile.jpg';
import { FaAward } from 'react-icons/fa';
import { TfiHeadphoneAlt } from 'react-icons/tfi';
import { VscFolderLibrary } from 'react-icons/vsc';

const About = () => {
  return (
    <section id='about'>
      <h1 className='small-title'>Get To Know</h1>
      <h2 className='medium-title'>About Me</h2>

      <div className='container about__container'>
        <div className='about__content'>
          <p className='about__intro'>
            AI & Data Science student at CBIT Hyderabad, passionate about building intelligent systems and data-driven solutions using Python, Machine Learning, and modern AI frameworks.
          </p>

          <div className='about__cards'>
            <article className='about__card'>
              <FaAward className='about__icon' />
              <h3>Hackathons</h3>
              <small>1+ Completed</small>
            </article>

            <article className='about__card'>
              <VscFolderLibrary className='about__icon' />
              <h3>Projects</h3>
              <small>3+ Completed</small>
            </article>

            <article className='about__card'>
              <TfiHeadphoneAlt className='about__icon' />
              <h3>Learning</h3>
              <small>Always Growing</small>
            </article>
          </div>

          <div className='about__actions'>
            <a href='#contact' className='btn btn-primary'>
              Let&apos;s Talk
            </a>
            <a href='#portfolio' className='btn'>
              View Projects
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
