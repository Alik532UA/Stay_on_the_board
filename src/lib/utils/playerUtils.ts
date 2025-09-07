// file: src/lib/utils/playerUtils.ts

export const generateId = () => Date.now() + Math.random();

const availableColors = [
  '#00bbf9', '#f4a261',  '#9b5de5', '#e76f51', '#457b9d', '#f15bb5', '#2a9d8f', '#e63946'
];

const getRandomColor = () => availableColors[Math.floor(Math.random() * availableColors.length)];

export const getRandomUnusedColor = (usedColors: string[]) => {
  const unused = availableColors.filter(c => !usedColors.includes(c));
  if (unused.length === 0) return getRandomColor();
  return unused[Math.floor(Math.random() * unused.length)];
};

const availableNames = ['Alik', 'Noah', 'Jack', 'Mateo', 'Lucas', 'Sofia', 'Olivia', 'Nora', 'Lucia', 'Emilia'];

export const getRandomUnusedName = (usedNames: string[]) => {
  const unused = availableNames.filter(name => !usedNames.includes(name));
  if (unused.length === 0) return `Player ${usedNames.length + 1}`;
  return unused[Math.floor(Math.random() * unused.length)];
};