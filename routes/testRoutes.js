const express = require('express');
const router = express.Router();
const { redisClient } = require('../config/redis');
const bookProcessingQueue = require('../queues/bookProcessingQueue');

router.get('/redis/test', async (req, res) => {
    try {
        // Test set and get
        await redisClient.set('test_key', 'Hello from Redis!');
        const value = await redisClient.get('test_key');

        // Test with expiration
        await redisClient.setEx('temp_key', 60, 'This expires in 60 seconds');
        const tempValue = await redisClient.get('temp_key');

        // Get Redis info
        const info = await redisClient.info('server');

        res.json({
            success: true,
            message: 'Redis is working!',
            tests: {
                basicSetGet: value,
                withExpiration: tempValue,
                serverInfo: info.split('\n').slice(0, 5).join('\n')
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Redis test failed',
            error: error.message
        });
    }
});

router.get('/redis/keys', async (req, res) => {
    try {
        const keys = await redisClient.keys('*');
        const data = {};

        for (const key of keys.slice(0, 20)) { // Limit to 20 keys
            const value = await redisClient.get(key);
            const ttl = await redisClient.ttl(key);
            data[key] = { value, ttl };
        }

        res.json({
            success: true,
            totalKeys: keys.length,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/redis/queue-stats', async (req, res) => {
    try {
        const waiting = await bookProcessingQueue.getWaitingCount();
        const active = await bookProcessingQueue.getActiveCount();
        const completed = await bookProcessingQueue.getCompletedCount();
        const failed = await bookProcessingQueue.getFailedCount();
        const delayed = await bookProcessingQueue.getDelayedCount();

        const recentJobs = await bookProcessingQueue.getJobs(['completed', 'failed'], 0, 5);

        res.json({
            success: true,
            stats: {
                waiting,
                active,
                completed,
                failed,
                delayed,
                total: waiting + active + completed + failed + delayed
            },
            recentJobs: recentJobs.map(job => ({
                id: job.id,
                data: job.data,
                state: job.getState ? job.getState() : 'unknown',
                progress: job.progress(),
                timestamp: job.timestamp
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/redis/queue-clean', async (req, res) => {
    try {
        await bookProcessingQueue.clean(5000, 'completed'); // Clean jobs completed >5s ago
        await bookProcessingQueue.clean(10000, 'failed'); // Clean failed jobs >10s ago

        res.json({
            success: true,
            message: 'Queue cleaned successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;