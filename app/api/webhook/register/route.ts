import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.json();
  // handle the webhook
  return NextResponse.json({ received: true });
}
