import './expertise.css';
import { BiCheck } from 'react-icons/bi';
import { HiCode, HiServer, HiBeaker } from 'react-icons/hi';
import { useState, useEffect, useRef } from 'react';

const expertiseData = [
  {
    title: 'Frontend Development',
    subtitle: 'Building interactive interfaces',
    icon: HiCode,
    skills: [
      { name: 'Responsive design with HTML, CSS & JavaScript', level: 'Advanced' },
      { name: 'React.js component & state management', level: 'Advanced' },
      { name: 'Bootstrap & Tailwind CSS styling frameworks', level: 'Experienced' },
      { name: 'Cross-browser compatibility & optimization', level: 'Experienced' },
      { name: 'Mobile-first responsive design approach', level: 'Advanced' },
      { name: 'Performance optimization & accessibility', level: 'Intermediate' },
    ],
  },
  {
    title: 'Backend Development',
    subtitle: 'Server-side architecture & APIs',
    icon: HiServer,
    skills: [
      { name: 'REST API development with Node.js & Express', level: 'Advanced' },
      { name: 'Database design with MongoDB & MySQL', level: 'Experienced' },
      { name: 'Server-side logic & business implementation', level: 'Experienced' },
      { name: 'Data structures & algorithms optimization', level: 'Intermediate' },
      { name: 'Python scripting and process automation', level: 'Experienced' },
      { name: 'Version control & collaborative development', level: 'Advanced' },
    ],
  },
  {
    title: 'Testing & AI/ML',
    subtitle: 'Quality assurance & intelligence',
    icon: HiBeaker,
    skills: [
      { name: 'iOS application testing & quality assurance', level: 'Experienced' },
      { name: 'Automated testing & bug identification', level: 'Experienced' },
      { name: 'Machine learning model development', level: 'Intermediate' },
      { name: 'Python data analysis & visualization', level: 'Experienced' },
      { name: 'Problem-solving & analytical thinking', level: 'Advanced' },
      { name: 'Technical documentation & reporting', level: 'Experienced' },
    ],
  },
];

const Expertise = () => {
  const [visibleCards, setVisibleCards] = useState(new Set());
  const observerRef = useRef();
  const sectionRef = useRef();

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardIndex = entry.target.dataset.cardIndex;
            setVisibleCards(prev => new Set([...prev, cardIndex]));
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    const cards = sectionRef.current?.querySelectorAll('.expertise');
    cards?.forEach((card, index) => {
      card.dataset.cardIndex = index;
      observerRef.current?.observe(card);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <section id='expertise' ref={sectionRef}>
      <h1 className='small-title animate-fade-in'>What I Offer</h1>
      <h2 className='medium-title animate-fade-in'>Expertise</h2>

      <div className='container expertises__container'>
        {expertiseData.map((category, catIdx) => {
          const Icon = category.icon;
          return (
            <article
              key={catIdx}
              className={`expertise ${visibleCards.has(String(catIdx)) ? 'expertise--visible' : ''}`}
              data-card-index={catIdx}
            >
              <div className='expertise__head'>
                <div className='expertise__head-top'>
                  <div className='expertise__icon'>
                    <Icon size={20} />
                  </div>
                  <h3>{category.title}</h3>
                  <span className='expertise__count'>{category.skills.length} skills</span>
                </div>
                <p className='expertise__subtitle'>{category.subtitle}</p>
              </div>

              <ul className='expertise__list'>
                {category.skills.map((skill, idx) => (
                  <li key={idx} style={{ '--item-delay': `${idx * 80}ms` }}>
                    <BiCheck className='expertise__list-icon' />
                    <div className='expertise__list-content'>
                      <p>{skill.name}</p>
                      <span className='expertise__skill-level'>{skill.level}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Expertise;
