import React from 'react';
import logoImg from '../assets/logo-metallic-plaque.png';

export function Home() {
  return (
    <div className="home-container">
      <div className="home-logo-section-large">
        <img className="home-logo-img" src={logoImg} alt="GIU - Gestión Integral Urbana" />
      </div>
    </div>
  );
}
export default Home;
