const redis = require('redis');

const redisClient = redis.createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        tls: {}
    }
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('✓ Redis connected successfully');
});

redisClient.on('ready', () => {
    console.log('✓ Redis ready to accept commands');
});

redisClient.on('end', () => {
    console.log('Redis connection closed');
});

const connectRedis = async () => {
    try {
        await redisClient.connect();
        return redisClient;
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        throw error;
    }
};

module.exports = { redisClient, connectRedis };