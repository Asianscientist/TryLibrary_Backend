console.log('Checking all controller exports...\n');

try {
  // Check authController
  const authController = require('./controllers/authController');
  console.log('✓ authController:', Object.keys(authController));
  
  // Check userController
  const userController = require('./controllers/userController');
  console.log('✓ userController:', Object.keys(userController));
  
  // Check bookController
  const bookController = require('./controllers/bookController');
  console.log('✓ bookController:', Object.keys(bookController));
  
  // Check borrowController
  const borrowController = require('./controllers/borrowController');
  console.log('✓ borrowController:', Object.keys(borrowController));
  
  // Check recommendationController
  const recommendationController = require('./controllers/recommendationController');
  console.log('✓ recommendationController:', Object.keys(recommendationController));
  
  console.log('\n✓ All controllers loaded successfully!');
  console.log('\nChecking middleware...\n');
  
  // Check auth middleware
  const authMiddleware = require('./middleware/auth');
  console.log('✓ auth middleware:', Object.keys(authMiddleware));
  
  // Check validation middleware
  const validationMiddleware = require('./middleware/validation');
  console.log('✓ validation middleware:', Object.keys(validationMiddleware));
  
  console.log('\n✓ All checks passed! You can run npm run dev now.');
  
} catch (error) {
  console.error('\n✗ Error found:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}