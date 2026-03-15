import '../experience/experience.css';
import { BsPatchCheckFill } from 'react-icons/bs';

const Certifications = () => {
  const certifications = [
    { id: 1, title: 'IBM — Python for Data Science', year: '2025' },
    { id: 2, title: 'Cisco Networking Academy — Data Science Essentials', year: '2025' },
    { id: 3, title: 'Cisco / Python Institute — Python Essentials 1', year: '2025' },
    { id: 4, title: 'Amazon Web Services — AWS Cloud Essentials', year: '2025' }
  ];

  return (
    <section id='certifications'>
      <h1 className='small-title'>My Credentials</h1>
      <h2 className='medium-title'>Certifications</h2>

      <div className='container experience__container' style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
        <div className='experience__frontend'>
          <h3>Professional Certificates</h3>
          <div className='experience__content'>
            {certifications.map(({ id, title, year }) => (
              <article key={id} className='experience__details'>
                <BsPatchCheckFill className='experience__details-icon' />
                <div className='experience__skill'>
                  <h4>{title}</h4>
                  <small className='text-light experience__level'>{year}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Certifications;
