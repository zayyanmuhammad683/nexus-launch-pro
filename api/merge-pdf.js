// This is the code for api/merge-pdf.js

import { PDFDocument } from 'pdf-lib';
import formidable from 'formidable';
import fs from 'fs/promises';

// This config tells Vercel how to handle the request
export const config = {
    api: {
        bodyParser: false,
    },
};

// This is the main serverless function
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Use formidable to handle the file uploads
        const [fields, files] = await formidable().parse(req);
        const pdfFiles = files.files;

        if (!pdfFiles || pdfFiles.length < 2) {
            return res.status(400).json({ error: 'Please upload at least two PDF files.' });
        }

        const mergedPdf = await PDFDocument.create();

        for (const file of pdfFiles) {
            const pdfBytes = await fs.readFile(file.filepath);
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => {
                mergedPdf.addPage(page);
            });
        }

        const mergedPdfBytes = await mergedPdf.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
        res.send(Buffer.from(mergedPdfBytes));

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while merging the PDFs.' });
    }
}
