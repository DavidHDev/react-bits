import React from 'react';
import './RecipeCard.css';

const RecipeCardComponent = ({
  title = 'Spaghetti Bolognese',
  category = 'Pasta',
  cookTime = 30,
  servings = 1,
  difficulty = 'Medium',
  enableHoverEffect = true,
  backColor = '#151515',
  glowColor = '#ff9966',
  circleColors = { primary: '#ffbb66', secondary: '#ff8866', tertiary: '#ff2233' },
  className = '',
  onClick
}) => {
  const style = {
    ['--back-color']: backColor,
    ['--glow-color']: glowColor,
    ['--circle-primary']: circleColors.primary || '#ffbb66',
    ['--circle-secondary']: circleColors.secondary || '#ff8866',
    ['--circle-tertiary']: circleColors.tertiary || '#ff2233'
  };

  return (
    <div className={`card ${enableHoverEffect ? 'hover-enabled' : ''} ${className}`.trim()} style={style}>
      <div className="content">
        <div className="back">
          <div className="back-content">
            <svg stroke="#ffffff" xmlnsXlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" height="50px" width="50px" fill="#ffffff">
              <g strokeWidth="0" id="SVGRepo_bgCarrier"></g>
              <g strokeLinejoin="round" strokeLinecap="round" id="SVGRepo_tracerCarrier"></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M20.84375 0.03125C20.191406 0.0703125 19.652344 0.425781 19.21875 1.53125C18.988281 2.117188 18.5 3.558594 18.03125 4.9375C17.792969 5.636719 17.570313 6.273438 17.40625 6.75C17.390625 6.796875 17.414063 6.855469 17.40625 6.90625C17.398438 6.925781 17.351563 6.949219 17.34375 6.96875L17.25 7.25C18.566406 7.65625 19.539063 8.058594 19.625 8.09375C22.597656 9.21875 28.351563 11.847656 33.28125 16.78125C38.5 22 41.183594 28.265625 42.09375 30.71875C42.113281 30.761719 42.375 31.535156 42.75 32.84375C42.757813 32.839844 42.777344 32.847656 42.78125 32.84375C43.34375 32.664063 44.953125 32.09375 46.3125 31.625C47.109375 31.351563 47.808594 31.117188 48.15625 31C49.003906 30.714844 49.542969 30.292969 49.8125 29.6875C50.074219 29.109375 50.066406 28.429688 49.75 27.6875C49.605469 27.347656 49.441406 26.917969 49.25 26.4375C47.878906 23.007813 45.007813 15.882813 39.59375 10.46875C33.613281 4.484375 25.792969 1.210938 22.125 0.21875C21.648438 0.0898438 21.234375 0.0078125 20.84375 0.03125 Z M 16.46875 9.09375L0.0625 48.625C-0.09375 48.996094 -0.00390625 49.433594 0.28125 49.71875C0.472656 49.910156 0.738281 50 1 50C1.128906 50 1.253906 49.988281 1.375 49.9375L40.90625 33.59375C40.523438 32.242188 40.222656 31.449219 40.21875 31.4375C39.351563 29.089844 36.816406 23.128906 31.875 18.1875C27.035156 13.34375 21.167969 10.804688 18.875 9.9375C18.84375 9.925781 17.8125 9.5 16.46875 9.09375 Z M 17 16C19.761719 16 22 18.238281 22 21C22 23.761719 19.761719 26 17 26C15.140625 26 13.550781 24.972656 12.6875 23.46875L15.6875 16.1875C16.101563 16.074219 16.550781 16 17 16 Z M 31 22C32.65625 22 34 23.34375 34 25C34 25.917969 33.585938 26.730469 32.9375 27.28125L32.90625 27.28125C33.570313 27.996094 34 28.949219 34 30C34 32.210938 32.210938 34 30 34C27.789063 34 26 32.210938 26 30C26 28.359375 26.996094 26.960938 28.40625 26.34375L28.3125 26.3125C28.117188 25.917969 28 25.472656 28 25C28 23.34375 29.34375 22 31 22 Z M 21 32C23.210938 32 25 33.789063 25 36C25 36.855469 24.710938 37.660156 24.25 38.3125L20.3125 39.9375C18.429688 39.609375 17 37.976563 17 36C17 33.789063 18.789063 32 21 32 Z M 9 34C10.65625 34 12 35.34375 12 37C12 38.65625 10.65625 40 9 40C7.902344 40 6.960938 39.414063 6.4375 38.53125L8.25 34.09375C8.488281 34.03125 8.742188 34 9 34Z"></path>
              </g>
            </svg>
            <strong>Hover Me</strong>
          </div>
        </div>

        <div className="front">
          <div className="img">
            <div className="circle" style={{ backgroundColor: 'var(--circle-primary)' }} />
            <div className="circle" id="right" style={{ backgroundColor: 'var(--circle-tertiary)' }} />
            <div className="circle" id="bottom" style={{ backgroundColor: 'var(--circle-secondary)' }} />
          </div>

          <div className="front-content">
            <small className="badge">{category}</small>
            <div className="description">
              <div className="title">
                <p className="title">
                  <strong>{title}</strong>
                </p>
                <svg height="15" width="15" viewBox="0 0 24 24" fill="#20c997" aria-hidden="true"><path d="M12 2l7 11H5z" /></svg>
              </div>
              <p className="card-footer">
                {cookTime} Mins &nbsp; | &nbsp; {servings} Serving
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecipeCard = React.memo(RecipeCardComponent);
export default RecipeCard;
