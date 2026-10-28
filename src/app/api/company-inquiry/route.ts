import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const companyName =
    typeof body?.companyName === "string" ? body.companyName.trim() : "";
  const contactName =
    typeof body?.contactName === "string" ? body.contactName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : null;
  const interest =
    typeof body?.interest === "string" ? body.interest.trim() : "";
  const message =
    typeof body?.message === "string" ? body.message.trim() : null;

  if (!companyName || !contactName || !email || !interest) {
    return NextResponse.json(
      { error: "required fields are missing" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("company_inquiries").insert({
    company_name: companyName,
    contact_name: contactName,
    email,
    phone,
    interest,
    message,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
