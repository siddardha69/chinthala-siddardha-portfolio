import { useState, useEffect, useRef } from 'react';
import { subscribeToProjects } from '../../services/projectsService';
import { getOptimizedProjectImageUrl } from '../../services/cloudinaryService';
import './portfolio.css';

const ITEMS_PER_PAGE = 6;
const SKELETON_ITEMS = Array.from({ length: ITEMS_PER_PAGE }, (_, index) => `skeleton-${index}`);

const Portfolio = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleItems, setVisibleItems] = useState(new Set());
  const observerRef = useRef();
  const portfolioRef = useRef();

  const totalPages = Math.max(1, Math.ceil(projects.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProjects = projects.slice(startIndex, endIndex);

  useEffect(() => {
    const unsubscribe = subscribeToProjects(
      (items) => {
        setProjects(items);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      },
      { autoRefresh: false }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setCurrentPage((prevPage) => {
      const maxPage = Math.max(1, Math.ceil(projects.length / ITEMS_PER_PAGE));
      return Math.min(prevPage, maxPage);
    });
  }, [projects.length]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const itemId = entry.target.dataset.itemId;
            setVisibleItems(prev => new Set([...prev, itemId]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Observe portfolio items when they mount
  useEffect(() => {
    const items = portfolioRef.current?.querySelectorAll('.portfolio__item');
    items?.forEach(item => {
      observerRef.current?.observe(item);
    });

    return () => {
      items?.forEach(item => {
        observerRef.current?.unobserve(item);
      });
    };
  }, [currentPage, paginatedProjects.length]);

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      return;
    }

    setCurrentPage(nextPage);
    setVisibleItems(new Set());

    portfolioRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <section id='portfolio' ref={portfolioRef}>
      <h1 className='small-title animate-fade-in'>My Recent Work</h1>
      <h2 className='medium-title animate-fade-in'>Projects</h2>

      <div className='container portfolio__container'>
        {isLoading
          ? SKELETON_ITEMS.map((skeletonId) => (
            <article key={skeletonId} className='portfolio__item portfolio__item--skeleton' aria-hidden='true'>
              <div className='portfolio__item-image portfolio__skeleton-block'></div>
              <div className='portfolio__content'>
                <div className='portfolio__skeleton-title portfolio__skeleton-block'></div>
                <div className='portfolio__tag'>
                  <span className='portfolio__skeleton-pill portfolio__skeleton-block'></span>
                  <span className='portfolio__skeleton-pill portfolio__skeleton-block'></span>
                </div>
                <div className='portfolio__skeleton-desc portfolio__skeleton-block'></div>
                <div className='portfolio__item-cta'>
                  <span className='btn btn-variant btn-disabled portfolio__skeleton-btn'>Github</span>
                  <span className='btn btn-white btn-disabled portfolio__skeleton-btn'>Live Demo</span>
                </div>
              </div>
            </article>
          ))
          : paginatedProjects.map(({ id, image, title, github, demo, tags = [], desc, isNew, isFeatured, isPopular }, index) => {
            const isVisible = visibleItems.has(String(id));
            const animationDelay = `${index * 100}ms`;
            const imageSrc = getOptimizedProjectImageUrl(image, { width: 600 });
            const imageSrcSet = `${getOptimizedProjectImageUrl(image, { width: 400 })} 400w, ${getOptimizedProjectImageUrl(image, { width: 600 })} 600w, ${getOptimizedProjectImageUrl(image, { width: 900 })} 900w`;
            const badges = [];

            if (isNew) {
              badges.push({ key: 'new', className: 'portfolio__badge--new', label: 'NEW' });
            }
            if (isFeatured) {
              badges.push({ key: 'featured', className: 'portfolio__badge--featured', label: 'Featured' });
            }
            if (isPopular) {
              badges.push({ key: 'popular', className: 'portfolio__badge--popular', label: 'Popular' });
            }

            return (
              <article
                key={id}
                data-item-id={id}
                className={`portfolio__item ${isNew ? 'portfolio__item--new' : ''} ${isFeatured ? 'portfolio__item--featured' : ''} ${isPopular ? 'portfolio__item--popular' : ''} ${isVisible ? 'portfolio__item--visible' : ''}`}
                style={{ '--animation-delay': animationDelay }}
              >
                <div className='portfolio__item-image'>
                  <img
                    src={imageSrc}
                    srcSet={imageSrcSet}
                    sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
                    width='600'
                    height='420'
                    alt={title}
                    loading="lazy"
                    decoding='async'
                    fetchPriority={index === 0 && currentPage === 1 ? 'high' : 'low'}
                  />

                  {/* Hover overlay with quick actions */}
                  <div className='portfolio__overlay'>
                    <div className='portfolio__overlay-content'>
                      <a
                        href={github}
                        className='portfolio__quick-btn'
                        target='_blank'
                        rel='noreferrer'
                        aria-label={`View ${title} on GitHub`}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
                        </svg>
                      </a>
                      {demo && (
                        <a
                          href={demo}
                          className='portfolio__quick-btn'
                          target='_blank'
                          rel='noreferrer'
                          aria-label={`View ${title} live demo`}
                        >
                          <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="currentColor" d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className='portfolio__content'>
                  <h3>{title}</h3>
                  <div className='portfolio__tag'>
                    {tags.map((tag, tagIndex) => {
                      return (
                        <span
                          key={tagIndex}
                          className='portfolio__tag-pill'
                          style={{ '--tag-delay': `${tagIndex * 50}ms` }}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                  <p className='portfolio__desc'>{desc}</p>
                  <div className='portfolio__item-cta'>
                    <a
                      href={github}
                      className='btn btn-variant'
                      target='_blank'
                      rel='noreferrer'
                    >
                      Github
                    </a>
                    {demo ? (
                      <a
                        href={demo}
                        className='btn btn-white'
                        target='_blank'
                        rel='noreferrer'
                      >
                        Live Demo
                      </a>
                    ) : (
                      <span
                        className='btn btn-white btn-disabled'
                        aria-disabled='true'
                      >
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>

                {/* Special badges */}
                {badges.length > 0 && (
                  <div className='portfolio__badge-stack'>
                    {badges.map((badge) => (
                      <div key={badge.key} className={`portfolio__badge ${badge.className}`}>
                        {badge.label}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
      </div>

      <div className='portfolio__pagination-wrap'>
        {!isLoading && (
          <p className='portfolio__pagination-summary'>
            Showing {projects.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, projects.length)} of {projects.length} projects
          </p>
        )}

        {totalPages > 1 && (
          <div className='portfolio__pagination' role='navigation' aria-label='Projects pagination'>
            <button
              type='button'
              className='portfolio__pagination-btn'
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <div className='portfolio__pagination-numbers'>
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    type='button'
                    className={`portfolio__pagination-number ${page === currentPage ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                    aria-label={`Go to page ${page}`}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              type='button'
              className='portfolio__pagination-btn'
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Portfolio;

