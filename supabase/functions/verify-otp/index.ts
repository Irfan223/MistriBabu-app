import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashOtp(otp: string): Promise<string> {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(otp));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const techEmail = (phone: string, type = "technician") =>
    `${type === "customer" ? "cust" : "tech"}.${phone}@internal.quickmistri`;

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

    try {
        const { phone, otp, type = "technician" } = await req.json();
        if (!phone || !otp) {
            return new Response(JSON.stringify({ error: "phone and otp are required" }), {
                status: 200, headers: { ...CORS, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        const otp_hash = await hashOtp(String(otp));

        const { data: record } = await supabase
            .from("otp_verifications")
            .select("id, expires_at")
            .eq("phone", phone)
            .eq("otp_hash", otp_hash)
            .eq("used", false)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!record) {
            return new Response(JSON.stringify({ error: "Invalid OTP. Please try again." }), {
                status: 200, headers: { ...CORS, "Content-Type": "application/json" },
            });
        }

        if (new Date(record.expires_at) < new Date()) {
            return new Response(JSON.stringify({ error: "OTP expired. Request a new one." }), {
                status: 200, headers: { ...CORS, "Content-Type": "application/json" },
            });
        }

        // Consume the OTP immediately to prevent replay attacks
        await supabase.from("otp_verifications").update({ used: true }).eq("id", record.id);

        const email = techEmail(phone, type);

        // Get or create a Supabase auth user for this technician
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingUser = listData?.users?.find((u) => u.email === email);

        let userId: string;
        if (existingUser) {
            userId = existingUser.id;
        } else {
            const { data: created, error: createErr } = await supabase.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: { phone, role: type },
            });
            if (createErr || !created?.user) throw createErr ?? new Error("Failed to create auth user");
            userId = created.user.id;
        }

        // Only link technician rows — customers have no separate profile row
        if (type === "technician") {
            await supabase
                .from("technicians")
                .update({ user_id: userId })
                .eq("phone", phone)
                .is("user_id", null);
        }

        // Generate a magic link token the client uses to establish a real Supabase session
        const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email,
        });
        if (linkErr || !linkData) throw linkErr ?? new Error("Failed to generate session link");

        return new Response(
            JSON.stringify({ success: true, hashed_token: linkData.properties.hashed_token }),
            { headers: { ...CORS, "Content-Type": "application/json" } },
        );
    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 200, headers: { ...CORS, "Content-Type": "application/json" },
        });
    }
});
