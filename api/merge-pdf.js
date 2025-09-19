// This is the correct code for api/merge-pdf.js

import { PDFDocument } from 'pdf-lib';
import formidable from 'formidable';
import fs from 'fs/promises';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    const form = formidable({});
    
    try {
        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve([fields, files]);
            });
        });

        const pdfFileList = files.files;

        if (!pdfFileList || pdfFileList.length < 2) {
            return res.status(400).json({ error: 'Please upload at least two PDF files.' });
        }

        const mergedPdf = await PDFDocument.create();

        for (const file of pdfFileList) {
            const pdfBytes = await fs.readFile(file.filepath);
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
        res.send(Buffer.from(mergedPdfBytes));

    } catch (error) {
        console.error("!!! SERVER CRASHED, THIS IS THE REAL ERROR !!!", error);
        return res.status(500).json({ error: 'A critical error occurred on the server.' });
    }
}
