const fs = require('fs');

let content = fs.readFileSync('src/main.js', 'utf8');

// 1. Remove backend fetch block
const fetchBackendStart = content.indexOf('  // --- FETCH DATA FROM BACKEND ---');
const fetchBackendEnd = content.indexOf('  // --- REALTIME DMS COORDINATES (Bottom Right) ---');
if (fetchBackendStart !== -1 && fetchBackendEnd !== -1) {
  content = content.substring(0, fetchBackendStart) + content.substring(fetchBackendEnd);
}

// 2. Replace hardcoded markers array with fetch
const datasetStart = content.indexOf('  // --- 3. DATASET ---');
const datasetEnd = content.indexOf('  const markerLayers = {};');
if (datasetStart !== -1 && datasetEnd !== -1) {
  const fetchCode = `  // --- 3. DATASET ---
  fetch('/data/events.json')
    .then(response => response.json())
    .then(eventsData => {
`;
  content = content.substring(0, datasetStart) + fetchCode + content.substring(datasetEnd);
}

// 3. Add closing bracket for the fetch at the end of the DOMContentLoaded block
const closingBlock = `    };
  }

});`;
const newClosingBlock = `    };
  }

    }).catch(err => console.error('Failed to load events data:', err));
});`;

content = content.replace(closingBlock, newClosingBlock);

fs.writeFileSync('src/main.js', content);
console.log('Successfully updated main.js');
