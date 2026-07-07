import React from 'react';
import logoImg from '../logo.png';

export function Home() {
  return (
    <div className="home-container">
      <div className="home-logo-section-large">
        <img className="home-logo-img" src={logoImg} alt="GIU Logo" />
      </div>
    </div>
  );
}
export default Home;
