import { useEffect, useState } from 'react';
import { BsFillChatFill } from 'react-icons/bs';
import { subscribeToResume } from '../../services/resumeService';

const Cta = () => {
  const [resume, setResume] = useState({ url: '', fileName: 'Resume.pdf' });

  useEffect(() => {
    const unsubscribe = subscribeToResume((nextResume) => {
      setResume(nextResume);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className='cta'>
      <a
        href={resume.url}
        download={resume.fileName}
        className='btn cta-icon dl'
      >
        Download CV
      </a>
      <a href='#contact' className='btn btn-primary cta-icon'>
        <BsFillChatFill /> Let&apos;s Talk
      </a>
    </div>
  );
};

export default Cta;
