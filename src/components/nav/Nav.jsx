import './nav.css';
import { AiOutlineHome, AiOutlineUser } from 'react-icons/ai';
import { BiBook, BiTask } from 'react-icons/bi';
import { SlGraduation } from 'react-icons/sl';
import { RiServiceLine } from 'react-icons/ri';
import { BsChatDots } from 'react-icons/bs';
import { useState, useEffect, useRef, useCallback } from 'react';

const navItems = [
  { id: 'home', label: 'Home', icon: AiOutlineHome },
  { id: 'about', label: 'About', icon: AiOutlineUser },
  { id: 'experience', label: 'Experience', icon: BiBook },
  { id: 'qualification', label: 'Qualification', icon: SlGraduation },
  { id: 'expertise', label: 'Expertise', icon: BiTask },
  { id: 'portfolio', label: 'Projects', icon: RiServiceLine },
  { id: 'contact', label: 'Contact', icon: BsChatDots },
];

const Nav = () => {
  const [activeNav, setActiveNav] = useState('#home');
  const [hovered, setHovered] = useState(null);
  const navRef = useRef(null);
  const pillRef = useRef(null);

  const movePill = useCallback(() => {
    if (!navRef.current || !pillRef.current) return;
    const activeLink = navRef.current.querySelector('a.active');
    if (!activeLink) return;
    const navRect = navRef.current.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    pillRef.current.style.width = `${linkRect.width}px`;
    pillRef.current.style.height = `${linkRect.height}px`;
    pillRef.current.style.left = `${linkRect.left - navRect.left}px`;
    pillRef.current.style.top = `${linkRect.top - navRect.top}px`;
    pillRef.current.style.opacity = '1';
  }, []);

  useEffect(() => {
    movePill();
  }, [activeNav, movePill]);

  useEffect(() => {
    window.addEventListener('resize', movePill);
    return () => window.removeEventListener('resize', movePill);
  }, [movePill]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveNav(`#${entry.target.id}`);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sectionElements = [];

    navItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        sectionElements.push(el);
      }
    });

    return () => {
      sectionElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  return (
    <nav ref={navRef} role="navigation" aria-label="Main navigation">
      <span className="nav__pill" ref={pillRef} aria-hidden="true" />
      {navItems.map(({ id, label, icon: Icon }) => {
        const href = `#${id}`;
        const isActive = activeNav === href;
        return (
          <a
            key={id}
            href={href}
            aria-label={`Navigate to ${label}`}
            onClick={() => setActiveNav(href)}
            className={isActive ? 'active' : ''}
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
          >
            <Icon aria-hidden="true" />
            <span
              className={`nav__label ${isActive || hovered === id ? 'nav__label--visible' : ''}`}
            >
              {label}
            </span>
          </a>
        );
      })}
    </nav>
  );
};

export default Nav;
