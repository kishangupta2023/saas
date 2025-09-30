import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Extract id from URL path instead of relying on context params
export async function PUT(req: NextRequest) {
  const userId = (await auth())?.userId;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract id from the URL: /api/todos/:id
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const id = segments[segments.length - 1]; // last segment is the id

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  try {
    const { completed } = await req.json();

    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo) return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    if (todo.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updatedTodo = await prisma.todo.update({ where: { id }, data: { completed } });

    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = (await auth())?.userId;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract id from URL path
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const id = segments[segments.length - 1];

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  try {
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo) return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    if (todo.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.todo.delete({ where: { id } });

    return NextResponse.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
