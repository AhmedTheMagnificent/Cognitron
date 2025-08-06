const fs = require('fs');
const pdf = require('pdf-parse');

// Replace with your PDF file path
const filePath = 'A:/ProgrmmingStuff/Cognitron/shared_data/uploads/sample.pdf';

const readPdf = async (path) => {
    try {
        const dataBuffer = fs.readFileSync(path);
        const data = await pdf(dataBuffer);
        console.log(data.text);
    } catch (err) {
        console.error('Error reading PDF:', err.message);
    }
};

readPdf(filePath);
