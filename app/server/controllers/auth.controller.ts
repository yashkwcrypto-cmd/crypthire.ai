import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userQueries } from '../services/database/db';
import { JWT_SECRET, JWT_EXPIRES_IN, USER_ROLES } from '../constants';
import { logger } from '../logger';
import { RegisterPayload, AuthPayload } from '../types';

export async function register(payload: RegisterPayload) {
  try {
    const { email, password, name } = payload;

    // Check if user already exists
    const existingUser = await userQueries.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await userQueries.create({
      email,
      password: hashedPassword,
      name: name || undefined,
      role: USER_ROLES.ADMIN,
    });

    logger.info('User registered successfully', { userId: user.id, email });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  } catch (error) {
    logger.error('Registration failed', error);
    throw error;
  }
}

export async function login(payload: AuthPayload) {
  try {
    const { email, password } = payload;

    // Find user
    const user = await userQueries.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    logger.info('User logged in successfully', { userId: user.id, email });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  } catch (error) {
    logger.error('Login failed', error);
    throw error;
  }
}