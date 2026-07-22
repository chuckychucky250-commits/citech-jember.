const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./public/data/events.json', 'utf8'));

// Valid Unsplash IDs
const imgBencana = 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=800&grayscale=true'; 
const imgTragedi = 'https://images.unsplash.com/photo-1601662528567-526cd06f6582?auto=format&fit=crop&q=80&w=800&grayscale=true';
const imgPergerakan = 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800&grayscale=true';
const imgKasus = 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800&grayscale=true';

data.forEach((evt) => {
  if (evt.category === 'bencana') evt.heroImage = imgBencana;
  else if (evt.category === 'tragedi') evt.heroImage = imgTragedi;
  else if (evt.category === 'pergerakan') evt.heroImage = imgPergerakan;
  else if (evt.category === 'kasus') evt.heroImage = imgKasus;
  else evt.heroImage = imgKasus; // default
});

fs.writeFileSync('./public/data/events.json', JSON.stringify(data, null, 2));
console.log('Hero images updated successfully with valid Unsplash IDs');
