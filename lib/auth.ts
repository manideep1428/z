import { auth } from '@clerk/nextjs'
import { prisma } from './prisma'

export async function getCurrentUser() {
  const { userId } = auth()
  
  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      metadata: true,
    }
  })

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}