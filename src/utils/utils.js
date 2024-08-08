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
    // '#E0F7FA', // Light Blue
    // '#B2EBF2', // Lighter Blue
    '#80DEEA', // Lighter Teal
    '#4DD0E1', // Teal
    '#26C6DA', // Darker Teal
    '#00BCD4', // Cyan
    // '#B2DFDB', // Light Teal
    // '#E0F2F1', // Light Green/Teal
    // '#FFFFFF', // White
  ];

  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

  return `linear-gradient(135deg, ${randomColor()}, ${randomColor()})`;
}