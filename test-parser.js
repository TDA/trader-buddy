const fs = require('fs');
const { parseCSV } = require('./lib/csvParser.ts');

// Read the sample CSV file
const csvText = fs.readFileSync('./sample-robinhood.csv', 'utf8');
console.log('CSV content:');
console.log(csvText);

// Parse it
const result = parseCSV(csvText);
console.log('Parse result:', result); 