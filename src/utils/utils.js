export const getLanguage = (key) => {
  if (key === 'code') return 'jsx';
  if (key === 'usage') return 'jsx';
  if (key === 'installation') return 'bash';
  if (key === 'css') return 'css';
}

export const getStarsCount = async () => {
  try {
    const response = await fetch('https://api.github.com/repos/DavidHDev/react-bits');
    const data = await response.json();
    return data.stargazers_count;
  } catch (error) {
    console.error('Error fetching stargazers count:', error);
    return null;
  }
};

// Function to generate random linear gradients
export const getRandomGradient = () => {
  const colors = [
    '#80DEEA', // Lighter Teal
    '#4DD0E1', // Teal
    '#26C6DA', // Darker Teal
    '#00BCD4'  // Cyan
  ];

  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];
  return `linear-gradient(135deg, ${randomColor()}, ${randomColor()})`;
}

export const decodeLabel = (label) => label
  .split('-')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');