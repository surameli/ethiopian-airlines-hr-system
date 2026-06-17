import fs from 'fs';
import pdfParse from 'pdf-parse';

/**
 * Extracts raw text from a PDF CV file.
 * @param {string} filePath - Absolute path to the PDF file
 * @returns {Promise<string>} - Extracted text content
 */
export const extractTextFromCV = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  } catch (err) {
    console.error('CV parsing error:', err.message);
    return '';
  }
};
