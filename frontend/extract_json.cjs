const fs = require('fs');

const content = fs.readFileSync('src/main.js', 'utf8');
const start = content.indexOf('const markers = [');
const end = content.indexOf('const eventsData = markers;');

if (start !== -1 && end !== -1) {
    const arrayStr = content.substring(start + 16, end).trim();
    // arrayStr should end with ; which we should remove
    const cleanStr = arrayStr.endsWith(';') ? arrayStr.slice(0, -1) : arrayStr;
    const data = eval(cleanStr);
    
    // Ensure public/data directory exists
    if (!fs.existsSync('public/data')) {
        fs.mkdirSync('public/data', { recursive: true });
    }
    
    fs.writeFileSync('public/data/events.json', JSON.stringify(data, null, 2));
    console.log('Successfully wrote events.json');
} else {
    console.log('Could not find markers array boundaries');
}
