import { useEffect, useState } from 'react';
import './experience.css';
import { BsPatchCheckFill } from 'react-icons/bs';
import { subscribeToExperience } from '../../services/experienceService';

const Experience = () => {
  const [skills, setSkills] = useState({ frontend: [], backend: [] });

  useEffect(() => {
    const unsubscribe = subscribeToExperience((nextSkills) => {
      setSkills(nextSkills);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <section id='experience'>
      <h1 className='small-title'>Skills Snapshot</h1>
      <h2 className='medium-title'>Technical Level</h2>

      <div className='container experience__container'>
        <div className='experience__frontend'>
          <h3>Frontend Development</h3>
          <div className='experience__content'>
            {skills.frontend.map(({ id, skill, level }) => {
              const levelClass = `experience__level--${String(level || '').toLowerCase()}`;
              return (
                <article key={id} className='experience__details'>
                  <BsPatchCheckFill className='experience__details-icon' />
                  <div className='experience__skill'>
                    <h4>{skill}</h4>
                    <small className={`text-light experience__level ${levelClass}`}>{level}</small>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className='experience__backend'>
          <h3>Backend Development</h3>
          <div className='experience__content'>
            {skills.backend.map(({ id, skill, level }) => {
              const levelClass = `experience__level--${String(level || '').toLowerCase()}`;
              return (
                <article key={id} className='experience__details'>
                  <BsPatchCheckFill className='experience__details-icon' />
                  <div className='experience__skill'>
                    <h4>{skill}</h4>
                    <small className={`text-light experience__level ${levelClass}`}>{level}</small>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
