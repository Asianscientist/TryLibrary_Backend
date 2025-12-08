const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const EPub = require('epub');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const { Book, BookPage } = require('../models');

async function processBookContent(bookId, filePath, mimeType) {
    try {
        console.log(`Starting to process book ${bookId}...`);

        await Book.update(
            { processing_status: 'processing' },
            { where: { id: bookId } }
        );

        // Read file
        const fileBuffer = await fs.readFile(filePath);

        // Extract text based on format
        let fullText = '';

        switch (mimeType) {
            case 'application/pdf':
                fullText = await extractPdfText(fileBuffer);
                break;

            case 'application/epub+zip':
                fullText = await extractEpubText(fileBuffer);
                break;

            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
                fullText = docxResult.value;
                break;

            case 'text/plain':
                fullText = fileBuffer.toString('utf-8');
                break;

            default:
                throw new Error('Unsupported file format');
        }

        // Clean text
        fullText = cleanText(fullText);

        if (!fullText || fullText.length < 100) {
            throw new Error('Extracted text is too short or empty');
        }

        console.log(`Extracted ${fullText.length} characters from book ${bookId}`);

        // Split into pages
        const pages = smartChunkText(fullText, {
            wordsPerPage: 500,
            respectParagraphs: true
        });

        console.log(`Created ${pages.length} pages for book ${bookId}`);

        // Delete existing pages (if any)
        await BookPage.destroy({ where: { book_id: bookId } });

        // Batch insert pages
        const pageRecords = pages.map((content, index) => ({
            book_id: bookId,
            page_number: index + 1,
            content: content
        }));

        await BookPage.bulkCreate(pageRecords);

        // Update book status
        await Book.update({
            processing_status: 'completed',
            total_pages: pages.length
        }, {
            where: { id: bookId }
        });

        console.log(`✓ Book ${bookId} processed successfully: ${pages.length} pages created`);

    } catch (error) {
        console.error(`✗ Failed to process book ${bookId}:`, error);

        await Book.update({
            processing_status: 'failed'
        }, {
            where: { id: bookId }
        });

        throw error;
    }
}

function cleanText(text) {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[^\S\n]{2,}/g, ' ')
        .trim();
}

function smartChunkText(text, options) {
    const { wordsPerPage, respectParagraphs } = options;
    const paragraphs = text.split(/\n\n+/);
    const chunks = [];
    let currentChunk = '';
    let currentWordCount = 0;

    for (const paragraph of paragraphs) {
        const words = paragraph.split(/\s+/).filter(w => w.length > 0);
        const paragraphWordCount = words.length;

        if (currentWordCount + paragraphWordCount > wordsPerPage && currentWordCount > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = paragraph;
            currentWordCount = paragraphWordCount;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            currentWordCount += paragraphWordCount;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

async function extractEpubText(buffer) {
    return new Promise((resolve, reject) => {
        const epub = new EPub(buffer);

        epub.on('end', async () => {
            try {
                const chapters = epub.flow.map(chapter => chapter.id);
                let fullText = '';

                for (const chapterId of chapters) {
                    const chapterText = await new Promise((res, rej) => {
                        epub.getChapter(chapterId, (err, text) => {
                            if (err) rej(err);
                            else res(text);
                        });
                    });

                    // Strip HTML tags
                    const cleanChapter = chapterText.replace(/<[^>]*>/g, ' ');
                    fullText += cleanChapter + '\n\n';
                }

                resolve(fullText);
            } catch (err) {
                reject(err);
            }
        });

        epub.on('error', reject);
        epub.parse();
    });
}

async function extractPdfText(fileBuffer) {
    try {
        // Convert Buffer to Uint8Array (required by pdfjs)
        const uint8Array = new Uint8Array(fileBuffer);
        const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
        let fullText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText;
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

module.exports = { processBookContent };