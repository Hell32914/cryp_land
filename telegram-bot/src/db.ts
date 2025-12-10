import { PrismaClient } from '@prisma/client'

/**
 * Centralized PrismaClient instance
 * This ensures all parts of the application use the same database connection
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

// Handle cleanup on process termination
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
