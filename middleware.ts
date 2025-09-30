// middleware.ts
import { clerkMiddleware, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publicRoutes: string[] = ["/", "/api/webhook/register", "/sign-in", "/sign-up"];

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // If the route is public, do nothing
  if (publicRoutes.includes(pathname)) return;

  // Get auth helper and userId
  const authHelper = await auth();
  const userId = authHelper?.userId;

  // Not authenticated -> redirect to sign-in
  if (!userId) {
    if (typeof authHelper?.redirectToSignIn === "function") {
      return authHelper.redirectToSignIn();
    }
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Authenticated -> fetch user via clerkClient instance
  try {
    // IMPORTANT: clerkClient must be awaited in Next.js so you get the actual client instance
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = user?.publicMetadata?.role as string | undefined;

    // Admin landing redirect when hitting /dashboard
    if (role === "admin" && pathname === "/dashboard") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // Prevent non-admins from accessing /admin/*
    if (role !== "admin" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If an authenticated user hits a public route, redirect to their landing
    if (publicRoutes.includes(pathname)) {
      return NextResponse.redirect(
        new URL(role === "admin" ? "/admin/dashboard" : "/dashboard", req.url)
      );
    }
  } catch (error) {
    console.error("Error fetching user data from Clerk:", error);
    return NextResponse.redirect(new URL("/error", req.url));
  }
});

export const config = {
  matcher: ["/((?!.*\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
