import PDFDocument from 'pdfkit';
import { Candidate } from './types';

export async function generateDailyReport(candidates: Candidate[], dateString: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(20).fillColor('#7c3aed').text('CryptHire AI - Daily Candidates Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#666666').text(`Date: ${dateString}`, { align: 'center' });
      doc.moveDown(2);

      if (candidates.length === 0) {
        doc.fontSize(14).fillColor('#000000').text('No candidates were submitted today.', { align: 'center' });
      } else {
        // Candidate Details
        candidates.forEach((candidate, index) => {
          doc.fontSize(16).fillColor('#000000').text(`${index + 1}. ${candidate.fullName}`);
          doc.fontSize(10).fillColor('#666666').text(`Email: ${candidate.email} | Phone: ${candidate.phone || 'N/A'}`);
          if (candidate.linkedinUrl) {
            doc.fillColor('#2563eb').text(`LinkedIn: ${candidate.linkedinUrl}`);
          }
          doc.moveDown(0.5);

          // Parse AI Analysis
          if (candidate.analysisResult) {
            try {
              const analysis = JSON.parse(candidate.analysisResult);
              
              doc.fontSize(12).fillColor('#000000').text('AI Analysis Summary:');
              doc.fontSize(10).fillColor('#333333').text(analysis.summary || 'No summary available.');
              doc.moveDown(0.5);
              
              if (analysis.score) {
                const scoreColor = analysis.score >= 80 ? '#16a34a' : analysis.score >= 60 ? '#ca8a04' : '#dc2626';
                doc.fontSize(12).fillColor('#000000').text('AI Score: ', { continued: true }).fillColor(scoreColor).text(`${analysis.score}/100`);
              }

              if (analysis.recommendation) {
                doc.moveDown(0.5);
                doc.fontSize(12).fillColor('#000000').text('Recommendation:');
                doc.fontSize(10).fillColor('#333333').text(analysis.recommendation);
              }
            } catch (e) {
              doc.fontSize(10).fillColor('#dc2626').text('Error parsing AI analysis results.');
            }
          } else {
            doc.fontSize(10).fillColor('#ca8a04').text('AI Analysis pending or failed.');
          }

          doc.moveDown(2);
          
          // Add a new page if we are near the bottom, except for the last item
          if (doc.y > 700 && index < candidates.length - 1) {
            doc.addPage();
          }
        });
      }

      // Finalize PDF file
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
