// queues/bookProcessingQueue.js
const Queue = require('bull');
const { processBookContent } = require('../services/bookProcessor');

const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
};

// Include username/password only if provided
if (process.env.REDIS_USERNAME) redisConfig.username = process.env.REDIS_USERNAME;
if (process.env.REDIS_PASSWORD) redisConfig.password = process.env.REDIS_PASSWORD;

const bookProcessingQueue = new Queue('book-processing', {
    redis: redisConfig,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    },
});

// Process jobs
bookProcessingQueue.process(async (job) => {
    const { bookId, filePath, mimeType } = job.data;

    try {
        console.log(`Processing book ${bookId}...`);
        await job.progress(10);

        await processBookContent(bookId, filePath, mimeType);

        await job.progress(100);
        console.log(`Book ${bookId} processed successfully.`);
    } catch (err) {
        console.error(`Error processing book ${bookId}:`, err);
        throw err; // Let Bull handle retries
    }
});

// Event listeners
bookProcessingQueue.on('completed', (job) => {
    console.log(`Job ${job.id} completed for book ${job.data.bookId}`);
});

bookProcessingQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed for book ${job.data.bookId}:`, err.message);
});

bookProcessingQueue.on('error', (error) => {
    console.error('Queue error:', error);
});

module.exports = bookProcessingQueue;
