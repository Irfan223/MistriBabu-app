import { useEffect, useState } from "react";
import {
  Loader2,
  Zap,
  Droplets,
  Paintbrush,
  AirVent,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getServiceablePincode,
  type ServiceablePincode,
} from "@/services/serviceablePincodeService";
import { useConfig } from "@/context/AppConfigContext";

type Radius = 10 | 20 | 50;

interface WorkerSummary {
  trade: string;
  total_available: number;
  closest_distance_km: number;
}

interface NearbyMistriDiscoveryProps {
  onBook?: (trade: string) => void;
}

const TRADE_ICON_MAP: Record<string, React.ReactNode> = {
  Electrician: <Zap className="h-5 w-5" />,
  Plumber: <Droplets className="h-5 w-5" />,
  Painter: <Paintbrush className="h-5 w-5" />,
  "AC Technician": <AirVent className="h-5 w-5" />,
};

// India Post often returns "NA"/blank for block; skip those and never repeat the same text twice.
function formatPincodeLocation(data: ServiceablePincode): string {
  const isUsable = (value: string | null | undefined) =>
    Boolean(value && value.trim() && value.trim().toUpperCase() !== "NA");

  const candidates = [data.block, data.areaNames[0], data.district].filter(
    isUsable,
  ) as string[];

  const unique = candidates.filter(
    (value, index) =>
      candidates.findIndex(
        (other) => other.trim().toLowerCase() === value.trim().toLowerCase(),
      ) === index,
  );

  return unique.slice(0, 2).join(", ") || data.district;
}

export default function NearbyMistriDiscovery({
  onBook,
}: NearbyMistriDiscoveryProps) {
  const { categories } = useConfig();
  // Build icon map from DB categories, fall back to static map for unknown trades
  const TRADE_ICONS: Record<string, React.ReactNode> = Object.fromEntries(
    categories.map((c) => [
      c.name,
      TRADE_ICON_MAP[c.name] ?? <span className="text-lg">{c.icon}</span>,
    ]),
  );
  const [pincode, setPincode] = useState("");
  const [pincodeData, setPincodeData] = useState<ServiceablePincode | null>(
    null,
  );
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [radius, setRadius] = useState<Radius>(10);
  const [summaries, setSummaries] = useState<WorkerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lookup pincode coordinates when 6 digits entered
  useEffect(() => {
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeData(null);
      return;
    }
    let cancelled = false;
    setPincodeLoading(true);
    getServiceablePincode(pincode)
      .then((data) => {
        if (!cancelled) setPincodeData(data);
      })
      .catch(() => {
        if (!cancelled) setPincodeData(null);
      })
      .finally(() => {
        if (!cancelled) setPincodeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pincode]);

  // Fetch nearby worker summary when pincode coords or radius changes
  useEffect(() => {
    if (!pincodeData) {
      setSummaries([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.resolve(
      supabase.rpc("get_nearby_worker_summary", {
        customer_lat: pincodeData.latitude,
        customer_lng: pincodeData.longitude,
        radius_in_km: radius,
      }),
    )
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError) throw rpcError;
        setSummaries((data ?? []) as WorkerSummary[]);
      })
      .catch(() => {
        if (!cancelled)
          setError("Could not load nearby professionals. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pincodeData, radius]);

  return (
    <section className="bg-white py-12 sm:py-16" id="nearby-mistris">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
            Nearby professionals
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Find a Mistri near you
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your PIN code to see verified professionals available in your
            area.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <div className="w-full max-w-xs">
            <input
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter your 6-digit PIN code"
              className="form-input w-full text-center text-lg font-semibold tracking-widest"
            />
            {pincodeLoading && (
              <p className="mt-1 text-center text-xs text-slate-400">
                Looking up area...
              </p>
            )}
            {pincodeData && (
              <p className="mt-1 text-center text-xs font-semibold text-green-700">
                {formatPincodeLocation(pincodeData)}
              </p>
            )}
            {pincode.length === 6 && !pincodeLoading && !pincodeData && (
              <p className="mt-1 text-center text-xs text-red-600">
                PIN not in our service area yet.
              </p>
            )}
          </div>

          {pincodeData && (
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {([10, 20, 50] as Radius[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRadius(value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-bold transition ${radius === value ? "bg-orange-600 text-white" : "text-slate-500 hover:text-slate-900"}`}
                >
                  {value} km
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        {pincodeData && (
          <div className="mt-6">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
              </div>
            ) : summaries.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">
                No professionals found within {radius} km. Try increasing the
                range.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {summaries.map((summary) => (
                  <div
                    key={summary.trade}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                        {TRADE_ICONS[summary.trade] ?? (
                          <Search className="h-5 w-5" />
                        )}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">
                          {summary.trade}
                        </p>
                        <p className="text-xs text-slate-500">
                          {summary.total_available} available &mdash; closest{" "}
                          {summary.closest_distance_km.toFixed(1)} km
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onBook?.(summary.trade)}
                      className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white hover:bg-orange-500"
                    >
                      Book
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
