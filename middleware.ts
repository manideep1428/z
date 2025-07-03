import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: ['/'],
  ignoredRoutes: [
    '/api/webhooks/(.*)',
    '/api/ai-message-webhook',
    '/api/ai-post-webhook',
    '/api/post-webhook'
  ],
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}