const fs = require('fs');
let data = fs.readFileSync('public/data/events.json', 'utf8');
data = data.replace(/"\/images\//g, '"./images/');
fs.writeFileSync('public/data/events.json', data);
console.log('Fixed image paths in events.json');
