import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
}

// SHA-256 hash so plain OTP is never stored
async function hashOtp(otp: string): Promise<string> {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(otp));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

    try {
        const { phone } = await req.json();
        if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
            return new Response(JSON.stringify({ error: "Invalid mobile number" }), {
                status: 200, headers: { ...CORS, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        // Verify the phone belongs to a registered technician before sending OTP
        const { data: tech } = await supabase
            .from("technicians")
            .select("id")
            .eq("phone", phone)
            .maybeSingle();

        if (!tech) {
            return new Response(JSON.stringify({ error: "Mobile number not registered as a technician" }), {
                status: 200, headers: { ...CORS, "Content-Type": "application/json" },
            });
        }

        // Invalidate previous unused OTPs for this phone
        await supabase
            .from("otp_verifications")
            .update({ used: true })
            .eq("phone", phone)
            .eq("used", false);

        const otp = generateOtp();
        const otp_hash = await hashOtp(otp);
        const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        const { error: insertErr } = await supabase
            .from("otp_verifications")
            .insert({ phone, otp_hash, expires_at });

        if (insertErr) throw insertErr;

        // DEV MODE: return OTP in response — swap this block for real SMS in production
        const isDev = Deno.env.get("APP_ENV") !== "production";
        const responsePayload = isDev
            ? { success: true, dev_otp: otp, message: "DEV MODE: Use this OTP to login" }
            : { success: true, message: "OTP sent to your mobile number" };

        // PRODUCTION HOOK (uncomment and configure SMS provider when ready):
        // if (!isDev) {
        //   await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${Deno.env.get("FAST2SMS_API_KEY")}&variables_values=${otp}&route=otp&numbers=${phone}`);
        // }

        return new Response(JSON.stringify(responsePayload), {
            headers: { ...CORS, "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 200, headers: { ...CORS, "Content-Type": "application/json" },
        });
    }
});
