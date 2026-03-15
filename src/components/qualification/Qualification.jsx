import { useEffect, useState } from 'react';
import './qualification.css';
import { FaUserGraduate } from 'react-icons/fa';
import { FaBriefcase } from 'react-icons/fa';
import { AiOutlineCalendar } from 'react-icons/ai';
import { subscribeToQualification } from '../../services/qualificationService';

const Qualification = () => {
  const [toggleState, setToggleState] = useState(1);
  const [qualification, setQualification] = useState({ education: [], experience: [] });

  useEffect(() => {
    const unsubscribe = subscribeToQualification((nextQualification) => {
      setQualification(nextQualification);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const toggleTab = (index) => {
    setToggleState(index);
  };

  const renderTimeline = (items) => (
    items.map((item, index) => {
      const isLeft = index % 2 === 0;
      const isLast = index === items.length - 1;

      return (
        <div className='qualification__data' key={item.id}>
          {isLeft ? (
            <div className='text-right'>
              <h3 className='qualification__title'>{item.title}</h3>
              <span className='qualification__subtitle'>{item.subtitle}</span>
              <div className='qualification__calendar'>
                <AiOutlineCalendar className='qualification__calendar-icon' />
                {item.period}
              </div>
            </div>
          ) : (
            <div></div>
          )}

          <div>
            <span className='qualification__rounder'></span>
            {!isLast && <span className='qualification__line'></span>}
          </div>

          {isLeft ? (
            <div></div>
          ) : (
            <div>
              <h3 className='qualification__title'>{item.title}</h3>
              <span className='qualification__subtitle'>{item.subtitle}</span>
              <div className='qualification__calendar'>
                <AiOutlineCalendar className='qualification__calendar-icon' />
                {item.period}
              </div>
            </div>
          )}
        </div>
      );
    })
  );

  return (
    <section id='qualification' className='qualification section'>
      <h1 className='small-title'>My Personal Journey</h1>
      <h2 className='medium-title'>Qualification</h2>

      <div className='container qualification__container'>
        <div className='qualification__tabs' role='tablist' aria-label='Qualification categories'>
          <button
            type='button'
            id='qualification-tab-education'
            role='tab'
            aria-selected={toggleState === 1}
            aria-controls='qualification-panel-education'
            className={
              toggleState === 1
                ? 'qualification__button qualification__active button--flex'
                : 'qualification__button button--flex'
            }
            onClick={() => toggleTab(1)}
          >
            <FaUserGraduate className='qualification__icon' /> Education
          </button>

          <button
            type='button'
            id='qualification-tab-experience'
            role='tab'
            aria-selected={toggleState === 2}
            aria-controls='qualification-panel-experience'
            className={
              toggleState === 2
                ? 'qualification__button qualification__active button--flex'
                : 'qualification__button button--flex'
            }
            onClick={() => toggleTab(2)}
          >
            <FaBriefcase className='qualification__icon' />
            Experience
          </button>
        </div>

        <div className='qualification__sections'>
          <div
            id='qualification-panel-education'
            role='tabpanel'
            aria-labelledby='qualification-tab-education'
            className={
              toggleState === 1
                ? 'qualification__content qualification__content-active'
                : 'qualification__content'
            }
          >
            {renderTimeline(qualification.education)}
          </div>

          <div
            id='qualification-panel-experience'
            role='tabpanel'
            aria-labelledby='qualification-tab-experience'
            className={
              toggleState === 2
                ? 'qualification__content qualification__content-active'
                : 'qualification__content'
            }
          >
            {renderTimeline(qualification.experience)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Qualification;
