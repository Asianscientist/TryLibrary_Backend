const { sequelize, Subscription, Genre, Book, User } = require('./models');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Sync database (WARNING: This will drop all tables)
    await sequelize.sync({ force: true });
    console.log('✓ Database synced');

    // Seed subscriptions
    const subscriptions = await Subscription.bulkCreate([
      {
        name: 'basic',
        description: 'Free access to non-premium books',
        price: 0,
        duration_days: 365
      },
      {
        name: 'premium',
        description: 'Full access to all books including premium content',
        price: 9.99,
        duration_days: 30
      }
    ]);
    console.log('✓ Subscriptions seeded');

    // Seed genres
    const genres = await Genre.bulkCreate([
      { name: 'Fiction' },
      { name: 'Non-Fiction' },
      { name: 'Science Fiction' },
      { name: 'Fantasy' },
      { name: 'Mystery' },
      { name: 'Romance' },
      { name: 'Thriller' },
      { name: 'Biography' },
      { name: 'Self-Help' },
      { name: 'History' },
      { name: 'Horror' },
      { name: 'Adventure' },
      { name: 'Philosophy' },
      { name: 'Poetry' },
      { name: 'Science' }
    ]);
    console.log('✓ Genres seeded');

    // Seed sample books
    await Book.bulkCreate([
      {
        title: 'The Great Adventure',
        author_name: 'John Doe',
        description: 'An epic tale of adventure and discovery across unknown lands. Follow the hero as they embark on a journey that will change their life forever.',
        genre_id: genres[0].id, // Fiction
        publication_year: 2023,
        file_url: '/books/great-adventure.pdf',
        cover_url: '/covers/great-adventure.jpg',
        is_premium: false
      },
      {
        title: 'Space Odyssey 2024',
        author_name: 'Jane Smith',
        description: 'A thrilling journey through the cosmos. Experience the wonders and dangers of space exploration in this compelling science fiction masterpiece.',
        genre_id: genres[2].id, // Science Fiction
        publication_year: 2024,
        file_url: '/books/space-odyssey.pdf',
        cover_url: '/covers/space-odyssey.jpg',
        is_premium: true
      },
      {
        title: 'Mystery Manor',
        author_name: 'Mike Johnson',
        description: 'A thrilling mystery unfolds in an old Victorian mansion. Can you solve the mystery before it\'s too late?',
        genre_id: genres[4].id, // Mystery
        publication_year: 2023,
        file_url: '/books/mystery-manor.pdf',
        cover_url: '/covers/mystery-manor.jpg',
        is_premium: false
      },
      {
        title: 'Dragon\'s Realm',
        author_name: 'Sarah Williams',
        description: 'Enter a magical world where dragons rule the skies and ancient magic still exists. A fantasy epic for the ages.',
        genre_id: genres[3].id, // Fantasy
        publication_year: 2024,
        file_url: '/books/dragons-realm.pdf',
        cover_url: '/covers/dragons-realm.jpg',
        is_premium: true
      },
      {
        title: 'The Last Stand',
        author_name: 'Robert Brown',
        description: 'A pulse-pounding thriller that will keep you on the edge of your seat until the very last page.',
        genre_id: genres[6].id, // Thriller
        publication_year: 2023,
        file_url: '/books/last-stand.pdf',
        cover_url: '/covers/last-stand.jpg',
        is_premium: false
      },
      {
        title: 'Love in Paris',
        author_name: 'Emily Davis',
        description: 'A heartwarming romance set in the city of lights. Sometimes love finds you when you least expect it.',
        genre_id: genres[5].id, // Romance
        publication_year: 2024,
        file_url: '/books/love-paris.pdf',
        cover_url: '/covers/love-paris.jpg',
        is_premium: false
      },
      {
        title: 'The Art of Success',
        author_name: 'David Miller',
        description: 'Transform your life with proven strategies for personal and professional success.',
        genre_id: genres[8].id, // Self-Help
        publication_year: 2024,
        file_url: '/books/art-success.pdf',
        cover_url: '/covers/art-success.jpg',
        is_premium: true
      },
      {
        title: 'World War Chronicles',
        author_name: 'James Wilson',
        description: 'A comprehensive look at the events that shaped our modern world. History comes alive in this detailed account.',
        genre_id: genres[9].id, // History
        publication_year: 2023,
        file_url: '/books/ww-chronicles.pdf',
        cover_url: '/covers/ww-chronicles.jpg',
        is_premium: false
      },
      {
        title: 'Steve Jobs: A Biography',
        author_name: 'Walter Isaacson',
        description: 'The exclusive biography of the visionary who revolutionized technology and changed the world.',
        genre_id: genres[7].id, // Biography
        publication_year: 2023,
        file_url: '/books/steve-jobs.pdf',
        cover_url: '/covers/steve-jobs.jpg',
        is_premium: true
      },
      {
        title: 'The Quantum Universe',
        author_name: 'Brian Cox',
        description: 'Explore the mind-bending world of quantum physics and discover the fundamental nature of reality.',
        genre_id: genres[14].id, // Science
        publication_year: 2024,
        file_url: '/books/quantum-universe.pdf',
        cover_url: '/covers/quantum-universe.jpg',
        is_premium: true
      }
    ]);
    console.log('✓ Books seeded');

    // Create a test user
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password_hash: 'password123',
      subscription_id: subscriptions[0].id, // Basic subscription
      is_admin: false
    });
    console.log('✓ Test user created (email: test@example.com, password: password123)');

    // Create a premium test user
    const premiumUser = await User.create({
      name: 'Premium User',
      email: 'premium@example.com',
      password_hash: 'password123',
      subscription_id: subscriptions[1].id, // Premium subscription
      subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      is_admin: true
    });
    console.log('✓ Premium user created (email: premium@example.com, password: password123)');

    console.log('\n========================================');
    console.log('✓ Database seeded successfully!');
    console.log('========================================');
    console.log('\nTest Accounts:');
    console.log('1. Basic User:');
    console.log('   Email: test@example.com');
    console.log('   Password: password123');
    console.log('\n2. Premium User:');
    console.log('   Email: premium@example.com');
    console.log('   Password: password123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
