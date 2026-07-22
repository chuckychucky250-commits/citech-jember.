const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./public/data/events.json', 'utf8'));

data.forEach((evt, idx) => {
  let keyword = 'city';
  if (evt.category === 'bencana') keyword = 'flood,disaster';
  else if (evt.category === 'tragedi') {
      if (evt.title.toLowerCase().includes('kebakaran')) keyword = 'fire,building';
      else keyword = 'accident,disaster';
  }
  else if (evt.category === 'pergerakan') keyword = 'protest,crowd';
  else if (evt.category === 'kasus') keyword = 'police,law';

  // Hero image
  evt.heroImage = `https://loremflickr.com/800/400/${keyword}?lock=${idx}`;

  // Dokumentasi array (4 images)
  evt.dokumentasi = [
    `https://loremflickr.com/400/400/${keyword}?lock=${idx}1`,
    `https://loremflickr.com/400/400/${keyword}?lock=${idx}2`,
    `https://loremflickr.com/400/400/${keyword}?lock=${idx}3`,
    `https://loremflickr.com/400/400/${keyword}?lock=${idx}4`
  ];
});

fs.writeFileSync('./public/data/events.json', JSON.stringify(data, null, 2));
console.log('Images updated successfully');
