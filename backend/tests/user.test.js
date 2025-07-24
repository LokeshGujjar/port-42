// 🧪 User Model Tests

const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a valid user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        displayName: 'Test User'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.displayName).toBe(userData.displayName);
      expect(savedUser.reputation).toBe(0);
    });

    it('should hash password before saving', async () => {
      const userData = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'Password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(50);
    });

    it('should validate password correctly', async () => {
      const userData = {
        username: 'testuser3',
        email: 'test3@example.com',
        password: 'Password123'
      };

      const user = new User(userData);
      await user.save();

      const isValidPassword = await user.comparePassword('Password123');
      const isInvalidPassword = await user.comparePassword('wrongpassword');

      expect(isValidPassword).toBe(true);
      expect(isInvalidPassword).toBe(false);
    });
  });

  describe('User Validation', () => {
    it('should require username', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should require valid email', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Password123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique username', async () => {
      const userData1 = {
        username: 'testuser',
        email: 'test1@example.com',
        password: 'Password123'
      };

      const userData2 = {
        username: 'testuser', // Same username
        email: 'test2@example.com',
        password: 'Password123'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const userData1 = {
        username: 'testuser1',
        email: 'test@example.com',
        password: 'Password123'
      };

      const userData2 = {
        username: 'testuser2',
        email: 'test@example.com', // Same email
        password: 'Password123'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    it('should validate username format', async () => {
      const invalidUsernames = ['ab', 'user with spaces', 'user@invalid', 'a'.repeat(21)];

      for (const username of invalidUsernames) {
        const userData = {
          username,
          email: `${username}@example.com`,
          password: 'Password123'
        };

        const user = new User(userData);
        await expect(user.save()).rejects.toThrow();
      }
    });
  });

  describe('User Methods', () => {
    it('should calculate user level correctly', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
        reputation: 1500
      });

      await user.save();

      const level = user.getLevel();
      expect(level).toBe('Elite Hacker');
    });

    it('should update reputation correctly', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      });

      await user.save();

      await user.updateReputation(10);
      expect(user.reputation).toBe(10);

      await user.updateReputation(-5);
      expect(user.reputation).toBe(5);

      // Reputation should not go below 0
      await user.updateReputation(-10);
      expect(user.reputation).toBe(0);
    });
  });
});
