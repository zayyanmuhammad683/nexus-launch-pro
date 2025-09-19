// FINAL CORRECTED CODE for api/merge-pdf.js
// This version uses modern, native methods and NO formidable.

import { PDFDocument } from 'pdf-lib';

export const config = {
    api: {
        bodyParser: false, // Let Vercel handle the stream
    },
};

export default async function handler(req, res) {
    try {
        // Use the modern req.formData() to handle file uploads
        const formData = await req.formData();
        const files = formData.getAll('files'); // 'files' is the key from our index.html

        if (!files || files.length < 2) {
            return res.status(400).json({ error: 'Please upload at least two PDF files.' });
        }

        const mergedPdf = await PDFDocument.create();

        for (const file of files) {
            // Get the file content as an ArrayBuffer directly from the form data
            const fileBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(fileBuffer);
            
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        }

        const mergedPdfBytes = await mergedPdf.save();

        // Send the file back to the user
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
        res.send(Buffer.from(mergedPdfBytes));

    } catch (error) {
        // This will now catch any error and show it in the logs
        console.error("!!! A CRITICAL ERROR OCCURRED IN THE SERVER FUNCTION !!!", error);
        return res.status(500).json({ error: 'A server error occurred while merging the PDFs.' });
    }
}
