// @ts-nocheck

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/generate(.*)",
  "/api/proposals(.*)",
  "/api/brand(.*)",
  "/api/analytics(.*)",
  "/api/workspace(.*)",
]);

// Development/public routes that should bypass Clerk auth
const isPublicRoute = createRouteMatcher([
  "/api/proposals/generate/dev",
  // Clerk's own servers call this — no Clerk session to check. Trust comes
  // from Svix signature verification inside the route itself, not from
  // this middleware. Explicit rather than relying on isProtectedRoute not
  // matching it, so a future broadening of that list can't silently break
  // Clerk's ability to deliver events here.
  "/api/webhooks/clerk(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) return;

  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}