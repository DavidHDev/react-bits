
import React from 'react';

interface CircleColors {
  primary?: string;
  secondary?: string;
  tertiary?: string;
}

interface RecipeCardProps {
  title?: string;
  category?: string;
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  enableHoverEffect?: boolean;
  backColor?: string;
  glowColor?: string;
  circleColors?: CircleColors;
  className?: string;
  onClick?: () => void;
}

const RecipeCardComponent: React.FC<RecipeCardProps> = ({
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
  const style: any = {
    '--back-color': backColor,
    '--glow-color': glowColor,
    '--circle-primary': circleColors.primary || '#ffbb66',
    '--circle-secondary': circleColors.secondary || '#ff8866',
    '--circle-tertiary': circleColors.tertiary || '#ff2233'
  };

  const rootClass = `card ${enableHoverEffect ? 'hover-enabled' : ''} ${className}`.trim();

  return (
    <div className={rootClass} style={style}>
      <div className="content">
        <div className="back">
          <div className="back-content">
            <svg height="50" width="50" aria-hidden="true" />
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
