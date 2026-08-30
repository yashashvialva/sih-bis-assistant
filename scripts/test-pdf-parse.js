const pdfParse = require('pdf-parse');
console.log('typeof pdfParse:', typeof pdfParse);
console.log('keys:', Object.keys(pdfParse));
console.log('typeof pdfParse.default:', typeof pdfParse.default);
if (typeof pdfParse === 'function') {
  console.log('pdfParse is a function');
} else if (typeof pdfParse.default === 'function') {
  console.log('pdfParse.default is a function');
} else if (pdfParse && typeof pdfParse.pdfParse === 'function') {
  console.log('pdfParse.pdfParse is a function');
} else {
  console.log('NO FUNCTION FOUND');
}
