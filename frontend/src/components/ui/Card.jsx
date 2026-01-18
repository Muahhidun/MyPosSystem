import React from 'react';

const Card = ({ children, className = '', hover = false, ...props }) => {
  const baseStyles = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
    transition: 'box-shadow 0.2s ease'
  };

  const hoverStyles = hover ? {
    cursor: 'pointer',
  } : {};

  const handleMouseEnter = (e) => {
    if (hover) {
      e.currentTarget.style.boxShadow = '0 0 15px rgba(31, 107, 122, 0.15)';
    }
  };

  const handleMouseLeave = (e) => {
    if (hover) {
      e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.05)';
    }
  };

  return (
    <div
      className={`${className}`}
      style={{ ...baseStyles, ...hoverStyles }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
