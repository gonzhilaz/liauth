import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passcode } = body;

    const expectedPasscode = process.env.MASTER_DEV_PASSCODE || "Xhi508471!!!";

    if (!passcode || passcode !== expectedPasscode) {
      return NextResponse.json(
        { success: false, message: "Invalid Developer Passcode" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Authenticated to Sentinel Authority",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Authentication error" },
      { status: 500 }
    );
  }
}

