import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  return NextResponse.json({
    products: storage.getProducts(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { code, name, description } = await req.json();

    if (!code || !name) {
      return NextResponse.json({ error: "Product code and name are required" }, { status: 400 });
    }

    const newProd = {
      id: `prod-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description ? description.trim() : "",
      created_at: new Date().toISOString(),
    };

    storage.addProduct(newProd);

    return NextResponse.json({
      success: true,
      product: newProd,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
