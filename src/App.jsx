import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/header/Header';
import Nav from './components/nav/Nav';
import About from './components/about/About';
import Experience from './components/experience/Experience';
import Expertise from './components/expertise/Expertise';
import Qualification from './components/qualification/Qualification';
import Certifications from './components/certifications/Certifications';
import Portfolio from './components/portfolio/Portfolio';
import Contact from './components/contact/Contact';
import Footer from './components/footer/Footer';
import Switch from './components/switch/Switch';
import ErrorBoundary from './components/ErrorBoundary';
import { SwitchContext } from './contexts/SwitchContext';
import './App.css';

const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));

const HomePage = ({ darkMode, setDarkMode, myStorage }) => (
  <SwitchContext.Provider value={{ darkMode, setDarkMode, myStorage }}>
    <div className={`main-content ${darkMode ? 'bg-dark' : 'bg-light'}`}>
      <Header />
      <Nav />
      <About />
      <Experience />
      <Qualification />
      <Certifications />
      <Expertise />
      <Portfolio />
      <Contact />
      <Footer />
      <Switch />
    </div>
  </SwitchContext.Provider>
);

const App = () => {
  const myStorage = typeof window !== 'undefined' ? window.localStorage : null;
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = myStorage?.getItem('darkMode');
    if (savedTheme === 'true') setDarkMode(true);
    if (savedTheme === 'false') setDarkMode(false);
  }, [myStorage]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path='/'
          element={<HomePage darkMode={darkMode} setDarkMode={setDarkMode} myStorage={myStorage} />}
        />
        <Route
          path='/admin'
          element={(
            <Suspense fallback={<p className='container'>Loading admin dashboard...</p>}>
              <AdminDashboard />
            </Suspense>
          )}
        />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
