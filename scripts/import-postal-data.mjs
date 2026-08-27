#!/usr/bin/env node
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const versionIndex = args.indexOf("--version");
const sourceIndex = args.indexOf("--source");
const sourceVersion = versionIndex >= 0 ? args[versionIndex + 1] : new Date().toISOString().slice(0, 10);
const source = sourceIndex >= 0 ? args[sourceIndex + 1] : "India Post Pincode API (Department of Posts)";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the terminal.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const { data: configuredPins, error: pinsError } = await supabase
  .from("serviceable_pincodes")
  .select("pincode")
  .eq("enabled", true)
  .order("pincode");
if (pinsError) throw pinsError;

const pins = (configuredPins ?? []).map(({ pincode }) => pincode);
const results = [];
for (let index = 0; index < pins.length; index += 5) {
  const batch = pins.slice(index, index + 5);
  results.push(...await Promise.all(batch.map(importPincode)));
}

const rejected = results.filter((result) => result.error);
const imported = results.filter((result) => !result.error);
let officesImported = 0;

for (const result of imported) {
  const { error: pincodeError } = await supabase.from("postal_pincodes").upsert(result.pincode, { onConflict: "pincode" });
  if (pincodeError) throw pincodeError;
  const { error: deleteError } = await supabase.from("post_offices").delete().eq("pincode", result.pincode.pincode);
  if (deleteError) throw deleteError;
  const { error: officeError } = await supabase.from("post_offices").insert(result.offices);
  if (officeError) throw officeError;
  officesImported += result.offices.length;
}

const { error: auditError } = await supabase.from("postal_data_imports").insert({
  source,
  source_version: sourceVersion,
  records_processed: pins.length,
  pincodes_upserted: imported.length,
  post_offices_upserted: officesImported,
  records_rejected: rejected.length,
  rejection_report: rejected,
});
if (auditError) throw auditError;

console.log("Postal data import completed");
console.log(`Source: ${source}`);
console.log(`Source version: ${sourceVersion}`);
console.log(`Pincodes processed: ${pins.length}`);
console.log(`Pincodes imported: ${imported.length}`);
console.log(`Post offices imported: ${officesImported}`);
console.log(`Rejected records: ${rejected.length}`);
if (rejected.length) process.exitCode = 2;

async function importPincode(pincode) {
  if (!/^\d{6}$/.test(pincode)) return { pincode, error: "Invalid six-digit pincode" };
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    if (!response.ok) return { pincode, error: `India Post API HTTP ${response.status}` };
    const payload = await response.json();
    const offices = payload[0]?.PostOffice;
    if (payload[0]?.Status !== "Success" || !Array.isArray(offices) || offices.length === 0) {
      return { pincode, error: payload[0]?.Message ?? "No post offices returned" };
    }
    const districtSet = new Set(offices.map((office) => normalize(office.District)));
    if (districtSet.size !== 1) return { pincode, error: "Multiple districts returned by India Post" };
    return {
      pincode: { pincode, district: normalize(offices[0].District), state: normalize(offices[0].State) },
      offices: offices.map((office) => ({
        pincode,
        name: normalize(office.Name),
        office_type: nullable(office.BranchType),
        block: nullable(office.Block),
        district: normalize(office.District),
        state: normalize(office.State),
        latitude: numberOrNull(office.Latitude),
        longitude: numberOrNull(office.Longitude),
        source,
        source_version: sourceVersion,
      })),
    };
  } catch (error) {
    return { pincode, error: error instanceof Error ? error.message : "API request failed" };
  }
}

function normalize(value) { return String(value ?? "").replace(/\s+/g, " ").trim(); }
function nullable(value) { const result = normalize(value); return result || null; }
function numberOrNull(value) { const result = Number(value); return Number.isFinite(result) ? result : null; }
