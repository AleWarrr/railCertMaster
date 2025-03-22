/**
 * PDF Generator utility for creating quality certifications
 * Uses PDFLib to create professional-quality PDF documents
 */
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';

/**
 * Generate a PDF certificate based on the certificate data
 * @param {Object} certificateData - The complete certificate data object
 * @returns {Promise<string>} - Promise resolving to a base64 encoded PDF string
 */
export const generateCertificatePdf = async (certificateData) => {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page to the document
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    
    // Load standard fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Set some standard dimensions
    const margin = 50;
    const textSize = 10;
    const headerTextSize = 16;
    const subHeaderTextSize = 12;
    
    // Current vertical position tracker (start from top)
    let yPos = height - margin;
    
    // Get company info
    const companyInfo = certificateData.companyInfo || {};
    
    // Draw header
    if (companyInfo) {
      // Company name
      page.drawText(`${companyInfo.companyName || 'Railway Company'}`, {
        x: margin,
        y: yPos,
        size: headerTextSize,
        font: helveticaBold,
        color: rgb(0, 0, 0.7),
      });
      
      yPos -= 20;
      
      // Company address
      if (companyInfo.address) {
        page.drawText(`${companyInfo.address}`, {
          x: margin,
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        yPos -= 15;
      }
      
      // City, State, Zip
      if (companyInfo.city || companyInfo.state || companyInfo.zipCode) {
        page.drawText(
          `${companyInfo.city || ''}, ${companyInfo.state || ''} ${companyInfo.zipCode || ''}`,
          {
            x: margin,
            y: yPos,
            size: textSize,
            font: helveticaFont,
          }
        );
        yPos -= 15;
      }
      
      // Contact info
      if (companyInfo.email || companyInfo.phone) {
        page.drawText(
          `${companyInfo.phone || ''} | ${companyInfo.email || ''}`,
          {
            x: margin,
            y: yPos,
            size: textSize,
            font: helveticaFont,
          }
        );
        yPos -= 15;
      }
      
      // Load company logo if available
      if (companyInfo.logoBase64) {
        try {
          const logoData = companyInfo.logoBase64;
          const logoImage = await pdfDoc.embedPng(logoData);
          
          // Calculate logo position (top right)
          const logoWidth = 120;
          const logoHeight = 80;
          const logoX = width - margin - logoWidth;
          const logoY = height - margin - logoHeight;
          
          page.drawImage(logoImage, {
            x: logoX,
            y: logoY,
            width: logoWidth,
            height: logoHeight,
          });
        } catch (error) {
          console.error('Error embedding logo:', error);
          // Continue without logo
        }
      }
    }
    
    // Draw horizontal line
    yPos -= 15;
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 1,
      color: rgb(0, 0, 0.7),
    });
    
    // Draw certificate title
    yPos -= 30;
    page.drawText('QUALITY CERTIFICATION', {
      x: width / 2 - 100,
      y: yPos,
      size: headerTextSize + 4,
      font: helveticaBold,
      color: rgb(0, 0, 0.7),
    });
    
    // Certificate information
    yPos -= 30;
    page.drawText(`Certificate Number: ${certificateData.certificateNumber || 'N/A'}`, {
      x: margin,
      y: yPos,
      size: subHeaderTextSize,
      font: helveticaBold,
    });
    
    yPos -= 20;
    page.drawText(`Date: ${formatDate(certificateData.date) || 'N/A'}`, {
      x: margin,
      y: yPos,
      size: textSize,
      font: helveticaFont,
    });
    
    yPos -= 15;
    page.drawText(`Material Type: ${getMaterialTypeLabel(certificateData.materialType) || 'N/A'}`, {
      x: margin,
      y: yPos,
      size: textSize,
      font: helveticaFont,
    });
    
    yPos -= 15;
    page.drawText(`Batch Number: ${certificateData.batchNumber || 'N/A'}`, {
      x: margin,
      y: yPos,
      size: textSize,
      font: helveticaFont,
    });
    
    if (certificateData.quantity) {
      yPos -= 15;
      page.drawText(`Quantity: ${certificateData.quantity}`, {
        x: margin,
        y: yPos,
        size: textSize,
        font: helveticaFont,
      });
    }
    
    // Customer information section
    yPos -= 30;
    page.drawText('Customer Information', {
      x: margin,
      y: yPos,
      size: subHeaderTextSize,
      font: helveticaBold,
    });
    
    yPos -= 20;
    page.drawText(`Customer Name: ${certificateData.customerName || 'N/A'}`, {
      x: margin,
      y: yPos,
      size: textSize,
      font: helveticaFont,
    });
    
    if (certificateData.customerReference) {
      yPos -= 15;
      page.drawText(`Customer Reference: ${certificateData.customerReference}`, {
        x: margin,
        y: yPos,
        size: textSize,
        font: helveticaFont,
      });
    }
    
    // Test Results Section
    if (certificateData.testResults && certificateData.testResults.length > 0) {
      yPos -= 30;
      page.drawText('Test Results', {
        x: margin,
        y: yPos,
        size: subHeaderTextSize,
        font: helveticaBold,
      });
      
      yPos -= 20;
      
      // Draw table header
      const testColWidths = [(width - 2 * margin) * 0.4, (width - 2 * margin) * 0.25, (width - 2 * margin) * 0.25, (width - 2 * margin) * 0.1];
      const testStartX = margin;
      
      page.drawText('Test Name', {
        x: testStartX,
        y: yPos,
        size: textSize,
        font: helveticaBold,
      });
      
      page.drawText('Standard Value', {
        x: testStartX + testColWidths[0],
        y: yPos,
        size: textSize,
        font: helveticaBold,
      });
      
      page.drawText('Actual Value', {
        x: testStartX + testColWidths[0] + testColWidths[1],
        y: yPos,
        size: textSize,
        font: helveticaBold,
      });
      
      page.drawText('Unit', {
        x: testStartX + testColWidths[0] + testColWidths[1] + testColWidths[2],
        y: yPos,
        size: textSize,
        font: helveticaBold,
      });
      
      yPos -= 15;
      
      // Draw horizontal line under header
      page.drawLine({
        start: { x: margin, y: yPos },
        end: { x: width - margin, y: yPos },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      yPos -= 15;
      
      // Draw test results
      for (const test of certificateData.testResults) {
        // If we're running out of space, add a new page
        if (yPos < 100) {
          page = pdfDoc.addPage(PageSizes.A4);
          yPos = height - margin;
          
          // Redraw the headers
          page.drawText('Test Results (continued)', {
            x: margin,
            y: yPos,
            size: subHeaderTextSize,
            font: helveticaBold,
          });
          
          yPos -= 20;
          
          page.drawText('Test Name', {
            x: testStartX,
            y: yPos,
            size: textSize,
            font: helveticaBold,
          });
          
          page.drawText('Standard Value', {
            x: testStartX + testColWidths[0],
            y: yPos,
            size: textSize,
            font: helveticaBold,
          });
          
          page.drawText('Actual Value', {
            x: testStartX + testColWidths[0] + testColWidths[1],
            y: yPos,
            size: textSize,
            font: helveticaBold,
          });
          
          page.drawText('Unit', {
            x: testStartX + testColWidths[0] + testColWidths[1] + testColWidths[2],
            y: yPos,
            size: textSize,
            font: helveticaBold,
          });
          
          yPos -= 15;
          
          // Draw horizontal line under header
          page.drawLine({
            start: { x: margin, y: yPos },
            end: { x: width - margin, y: yPos },
            thickness: 0.5,
            color: rgb(0.5, 0.5, 0.5),
          });
          
          yPos -= 15;
        }
        
        page.drawText(test.name || '', {
          x: testStartX,
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        
        page.drawText(test.standardValue || '', {
          x: testStartX + testColWidths[0],
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        
        page.drawText(test.actualValue || '', {
          x: testStartX + testColWidths[0] + testColWidths[1],
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        
        page.drawText(test.unit || '', {
          x: testStartX + testColWidths[0] + testColWidths[1] + testColWidths[2],
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        
        yPos -= 15;
      }
    }
    
    // Chemical Composition Section
    if (certificateData.chemicalComposition && certificateData.chemicalComposition.length > 0) {
      // If we're running out of space, add a new page
      if (yPos < 150) {
        page = pdfDoc.addPage(PageSizes.A4);
        yPos = height - margin;
      }
      
      yPos -= 30;
      page.drawText('Chemical Composition', {
        x: margin,
        y: yPos,
        size: subHeaderTextSize,
        font: helveticaBold,
      });
      
      yPos -= 20;
      
      // Draw table header
      const chemColWidths = [
        (width - 2 * margin) * 0.2,
        (width - 2 * margin) * 0.15,
        (width - 2 * margin) * 0.15,
        (width - 2 * margin) * 0.15,
        (width - 2 * margin) * 0.1
      ];
      const chemStartX = margin;
      
      page.drawText('Element', {
        x: chemStartX,
        y: yPos,
        size: textSize,
        font: helveticaBold,
      });
      
      page.drawText('Min Value', {
        x: chemStartX + chemColWidths[0],
        y: yPos,
        size: textSize,
        font: helveticaBold,
      });
      
      page.drawText('Max Value', {
        x: chemStartX + chemColWidths[0] + chemColWidths[1],
        y: yPos,
        size: textSize,
        font: helveticaBold,
      });
      
      page.drawText('Actual Value', {
        x: chemStartX + chemColWidths[0] + chemColWidths[1] + chemColWidths[2],
        y: yPos,
        size: textSize,
        font: helveticaBold,
      });
      
      page.drawText('Unit', {
        x: chemStartX + chemColWidths[0] + chemColWidths[1] + chemColWidths[2] + chemColWidths[3],
        y: yPos,
        size: textSize,
        font: helveticaBold,
      });
      
      yPos -= 15;
      
      // Draw horizontal line under header
      page.drawLine({
        start: { x: margin, y: yPos },
        end: { x: width - margin, y: yPos },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      yPos -= 15;
      
      // Draw chemical composition
      for (const element of certificateData.chemicalComposition) {
        // If we're running out of space, add a new page
        if (yPos < 100) {
          page = pdfDoc.addPage(PageSizes.A4);
          yPos = height - margin;
          
          // Redraw the headers
          page.drawText('Chemical Composition (continued)', {
            x: margin,
            y: yPos,
            size: subHeaderTextSize,
            font: helveticaBold,
          });
          
          yPos -= 20;
          
          page.drawText('Element', {
            x: chemStartX,
            y: yPos,
            size: textSize,
            font: helveticaBold,
          });
          
          page.drawText('Min Value', {
            x: chemStartX + chemColWidths[0],
            y: yPos,
            size: textSize,
            font: helveticaBold,
          });
          
          page.drawText('Max Value', {
            x: chemStartX + chemColWidths[0] + chemColWidths[1],
            y: yPos,
            size: textSize,
            font: helveticaBold,
          });
          
          page.drawText('Actual Value', {
            x: chemStartX + chemColWidths[0] + chemColWidths[1] + chemColWidths[2],
            y: yPos,
            size: textSize,
            font: helveticaBold,
          });
          
          page.drawText('Unit', {
            x: chemStartX + chemColWidths[0] + chemColWidths[1] + chemColWidths[2] + chemColWidths[3],
            y: yPos,
            size: textSize,
            font: helveticaBold,
          });
          
          yPos -= 15;
          
          // Draw horizontal line under header
          page.drawLine({
            start: { x: margin, y: yPos },
            end: { x: width - margin, y: yPos },
            thickness: 0.5,
            color: rgb(0.5, 0.5, 0.5),
          });
          
          yPos -= 15;
        }
        
        page.drawText(element.element || '', {
          x: chemStartX,
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        
        page.drawText(element.minValue || '', {
          x: chemStartX + chemColWidths[0],
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        
        page.drawText(element.maxValue || '', {
          x: chemStartX + chemColWidths[0] + chemColWidths[1],
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        
        page.drawText(element.actualValue || '', {
          x: chemStartX + chemColWidths[0] + chemColWidths[1] + chemColWidths[2],
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        
        page.drawText(element.unit || '', {
          x: chemStartX + chemColWidths[0] + chemColWidths[1] + chemColWidths[2] + chemColWidths[3],
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        
        yPos -= 15;
      }
    }
    
    // Mechanical Properties Section
    if (certificateData.mechanicalProperties && certificateData.mechanicalProperties.length > 0) {
      // If we're running out of space, add a new page
      if (yPos < 150) {
        page = pdfDoc.addPage(PageSizes.A4);
        yPos = height - margin;
      }
      
      yPos -= 30;
      page.drawText('Mechanical Properties', {
        x: margin,
        y: yPos,
        size: subHeaderTextSize,
        font: helveticaBold,
      });
      
      yPos -= 20;
      
      // Draw table header
      const mechColWidths = [
        (width - 2 * margin) * 0.25,
        (width - 2 * margin) * 0.25,
        (width - 2 * margin) * 0.25,
        (width - 2 * margin) * 0.1
      ];
      const mechStartX = margin;
      
      page.drawText('Property', {
        x: mechStartX,
        y: yPos,
        size: textSize,
        font: helveticaBold,
      });
      
      page.drawText('Required Value', {
        x: mechStartX + mechColWidths[0],
        y: yPos,
        size: textSize,
        font: helveticaBold,
      });
      
      page.drawText('Actual Value', {
        x: mechStartX + mechColWidths[0] + mechColWidths[1],
        y: yPos,
        size: textSize,
        font: helveticaBold,
      });
      
      page.drawText('Unit', {
        x: mechStartX + mechColWidths[0] + mechColWidths[1] + mechColWidths[2],
        y: yPos,
        size: textSize,
        font: helveticaBold,
      });
      
      yPos -= 15;
      
      // Draw horizontal line under header
      page.drawLine({
        start: { x: margin, y: yPos },
        end: { x: width - margin, y: yPos },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      yPos -= 15;
      
      // Draw mechanical properties
      for (const property of certificateData.mechanicalProperties) {
        // If we're running out of space, add a new page
        if (yPos < 100) {
          page = pdfDoc.addPage(PageSizes.A4);
          yPos = height - margin;
          
          // Redraw the headers
          page.drawText('Mechanical Properties (continued)', {
            x: margin,
            y: yPos,
            size: subHeaderTextSize,
            font: helveticaBold,
          });
          
          yPos -= 20;
          
          page.drawText('Property', {
            x: mechStartX,
            y: yPos,
            size: textSize,
            font: helveticaBold,
          });
          
          page.drawText('Required Value', {
            x: mechStartX + mechColWidths[0],
            y: yPos,
            size: textSize,
            font: helveticaBold,
          });
          
          page.drawText('Actual Value', {
            x: mechStartX + mechColWidths[0] + mechColWidths[1],
            y: yPos,
            size: textSize,
            font: helveticaBold,
          });
          
          page.drawText('Unit', {
            x: mechStartX + mechColWidths[0] + mechColWidths[1] + mechColWidths[2],
            y: yPos,
            size: textSize,
            font: helveticaBold,
          });
          
          yPos -= 15;
          
          // Draw horizontal line under header
          page.drawLine({
            start: { x: margin, y: yPos },
            end: { x: width - margin, y: yPos },
            thickness: 0.5,
            color: rgb(0.5, 0.5, 0.5),
          });
          
          yPos -= 15;
        }
        
        page.drawText(property.property || '', {
          x: mechStartX,
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        
        page.drawText(property.requiredValue || '', {
          x: mechStartX + mechColWidths[0],
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        
        page.drawText(property.actualValue || '', {
          x: mechStartX + mechColWidths[0] + mechColWidths[1],
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        
        page.drawText(property.unit || '', {
          x: mechStartX + mechColWidths[0] + mechColWidths[1] + mechColWidths[2],
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        
        yPos -= 15;
      }
    }
    
    // Comments Section
    if (certificateData.comments) {
      // If we're running out of space, add a new page
      if (yPos < 150) {
        page = pdfDoc.addPage(PageSizes.A4);
        yPos = height - margin;
      }
      
      yPos -= 30;
      page.drawText('Comments', {
        x: margin,
        y: yPos,
        size: subHeaderTextSize,
        font: helveticaBold,
      });
      
      yPos -= 20;
      
      // Split comments into lines
      const commentLines = splitTextIntoLines(certificateData.comments, width - 2 * margin, helveticaFont, textSize);
      
      for (const line of commentLines) {
        page.drawText(line, {
          x: margin,
          y: yPos,
          size: textSize,
          font: helveticaFont,
        });
        
        yPos -= 15;
        
        // If we're running out of space, add a new page
        if (yPos < 100) {
          page = pdfDoc.addPage(PageSizes.A4);
          yPos = height - margin;
        }
      }
    }
    
    // Certification Statement
    yPos -= 30;
    page.drawText('Certification Statement', {
      x: margin,
      y: yPos,
      size: subHeaderTextSize,
      font: helveticaBold,
    });
    
    yPos -= 20;
    
    const certificationStatement = 'We hereby certify that the material described above has been manufactured, tested, and inspected in accordance with the applicable specifications and standards, and conforms to the requirements specified.';
    
    const statementLines = splitTextIntoLines(certificationStatement, width - 2 * margin, helveticaFont, textSize);
    
    for (const line of statementLines) {
      page.drawText(line, {
        x: margin,
        y: yPos,
        size: textSize,
        font: helveticaFont,
      });
      
      yPos -= 15;
    }
    
    // Authorized Signatory
    yPos -= 40;
    
    // Signature line
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: margin + 150, y: yPos },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
    
    yPos -= 15;
    page.drawText('Authorized Signatory', {
      x: margin,
      y: yPos,
      size: textSize,
      font: helveticaFont,
    });
    
    yPos -= 30;
    page.drawText(`Date: ${formatDate(new Date().toISOString())}`, {
      x: margin,
      y: yPos,
      size: textSize,
      font: helveticaFont,
    });
    
    // Add footer with page numbers
    const totalPages = pdfDoc.getPageCount();
    
    for (let i = 0; i < totalPages; i++) {
      const footerPage = pdfDoc.getPage(i);
      const { width, height } = footerPage.getSize();
      
      footerPage.drawText(`Page ${i + 1} of ${totalPages}`, {
        x: width / 2 - 40,
        y: 30,
        size: 9,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      // Draw certificate number in the footer
      footerPage.drawText(`Certificate: ${certificateData.certificateNumber || 'N/A'}`, {
        x: margin,
        y: 30,
        size: 9,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
    
    // Merge any PDF attachments if they exist
    if (certificateData.attachments && certificateData.attachments.length > 0) {
      for (const attachment of certificateData.attachments) {
        try {
          if (attachment.fileData) {
            const attachmentPdfBytes = Buffer.from(attachment.fileData, 'base64');
            const attachmentPdf = await PDFDocument.load(attachmentPdfBytes);
            const attachmentPages = await pdfDoc.copyPages(attachmentPdf, attachmentPdf.getPageIndices());
            
            // Add attachment cover page
            const coverPage = pdfDoc.addPage(PageSizes.A4);
            const { width, height } = coverPage.getSize();
            
            coverPage.drawText('ATTACHMENT', {
              x: width / 2 - 60,
              y: height / 2 + 50,
              size: headerTextSize + 4,
              font: helveticaBold,
              color: rgb(0, 0, 0.7),
            });
            
            coverPage.drawText(attachment.name, {
              x: width / 2 - (attachment.name.length * 5),
              y: height / 2,
              size: subHeaderTextSize,
              font: helveticaBold,
            });
            
            // Add all the attachment pages
            for (const attachPage of attachmentPages) {
              pdfDoc.addPage(attachPage);
            }
          }
        } catch (error) {
          console.error(`Error adding attachment ${attachment.name}:`, error);
          // Continue without this attachment
        }
      }
    }
    
    // Serialize the PDFDocument to PDF bytes
    const pdfBytes = await pdfDoc.save();
    
    // Convert to base64
    const base64String = Buffer.from(pdfBytes).toString('base64');
    
    return base64String;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

/**
 * Helper function to format dates in a consistent way
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

/**
 * Helper function to get the display label for a material type
 * @param {string} materialType - Material type key
 * @returns {string} - Display label for the material type
 */
function getMaterialTypeLabel(materialType) {
  const materialTypeMap = {
    'rail': 'Rail Steel',
    'sleeper': 'Concrete Sleeper',
    'fastening': 'Fastening System',
    'ballast': 'Ballast Stone',
    'weld': 'Rail Weld',
    'insulation': 'Insulation Panels',
    'joint': 'Rail Joint',
    'tie': 'Wooden Tie',
  };
  
  return materialTypeMap[materialType] || materialType;
}

/**
 * Helper function to split text into lines that fit within a given width
 * @param {string} text - The text to split
 * @param {number} maxWidth - The maximum width of a line
 * @param {PDFFont} font - The font to use for measuring
 * @param {number} fontSize - The font size
 * @returns {string[]} - Array of lines that fit within the given width
 */
function splitTextIntoLines(text, maxWidth, font, fontSize) {
  if (!text) return [];
  
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(`${currentLine} ${word}`, fontSize);
    
    if (width < maxWidth) {
      currentLine += ` ${word}`;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}
