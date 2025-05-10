import { Platform } from 'react-native';
// Temporarily comment out problematic imports
// import * as FileSystem from 'expo-file-system';
// import * as ImageManipulator from 'expo-image-manipulator';
// import { OCR_API_KEY } from '@env';

// Hardcode API key temporarily (remember to remove this before committing code)
// const OCR_API_KEY = 'your-api-key-here'; 

// Uses OCR API to extract medicine information from an image
export const processImage = async (imageUri) => {
  try {
    // Temporarily return mock data while dependencies are being fixed
    console.log('OCR process requested for image:', imageUri);
    
    // Return mock data for now
    return {
      name: 'Sample Medicine',
      company: 'Pharma Company',
      expiryDate: '05/2026'
    };
    
    /* Original code commented out
    // Resize the image to improve OCR accuracy and reduce upload size
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    // Convert image to base64
    const base64Image = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Use Google Cloud Vision API for OCR
    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${OCR_API_KEY}`;
    
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 5,
            },
          ],
        },
      ],
    };
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json();
    
    if (data.responses && data.responses[0] && data.responses[0].textAnnotations) {
      const extractedText = data.responses[0].textAnnotations[0].description;
      return parseExtractedText(extractedText);
    } else {
      throw new Error('No text found in image');
    }
    */
  } catch (error) {
    console.error('OCR processing error:', error);
    throw error;
  }
};

// Parse the extracted text to identify medicine name, company, and expiry date
const parseExtractedText = (text) => {
  // Split text into lines for easier processing
  const lines = text.split('\n');
  
  // Initialize extracted data object
  const extractedData = {
    name: '',
    company: '',
    expiryDate: '',
  };
  
  // Regular expressions for identifying data
  const dateRegex = /(?:exp|expiry|expiration|expiry date|expiration date|exp date)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{2}[\/\-\.]\d{4})/i;
  
  // Process each line
  lines.forEach((line, index) => {
    // Check if line contains an expiry date
    const dateMatch = line.match(dateRegex);
    if (dateMatch) {
      extractedData.expiryDate = standardizeDate(dateMatch[1]);
    }
    
    // For medicine name and company, we'll use some heuristics
    // Often the brand name appears in larger text at the top
    if (index === 0 && !line.match(dateRegex)) {
      extractedData.name = line.trim();
    }
    // Sometimes the company name follows the medicine name
    else if (index === 1 && !line.match(dateRegex) && extractedData.name) {
      extractedData.company = line.trim();
    }
  });
  
  return extractedData;
};

// Convert various date formats to a standard format (MM/YYYY)
const standardizeDate = (dateString) => {
  // Remove any spaces
  dateString = dateString.trim();
  
  // Try to match common date formats
  let day, month, year;
  
  // Format: DD/MM/YYYY or MM/DD/YYYY
  const fullDateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/;
  // Format: MM/YYYY
  const monthYearRegex = /(\d{1,2})[\/\-\.](\d{4})/;
  
  if (fullDateRegex.test(dateString)) {
    const match = dateString.match(fullDateRegex);
    // Assuming the format is DD/MM/YYYY for medicines
    day = match[1];
    month = match[2];
    year = match[3];
    
    // If year is only 2 digits, assume it's in the 21st century
    if (year.length === 2) {
      year = '20' + year;
    }
    
    return `${month}/${year}`;
  } 
  else if (monthYearRegex.test(dateString)) {
    const match = dateString.match(monthYearRegex);
    month = match[1];
    year = match[2];
    return `${month}/${year}`;
  }
  
  // If no pattern matched, return the original string
  return dateString;
};