import { useEffect, useState } from "react";
import { Loader2, MapPin, Navigation, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DISTRICT_FALLBACK_COORDINATES, useUserLocation } from "@/hooks/useUserLocation";

type Radius = 3 | 5 | 10 | 20 | 50;
interface WorkerSummary { trade: string; total_available: number; closest_distance_km: number; }
interface Technician { id: string; name: string; phone: string; trade: string; service_pincode: string | null; service_location_name: string | null; distance_km: number; latitude: number; longitude: number; }

interface NearbyMistriDiscoveryProps { onBook?: (trade: string) => void; }

export default function NearbyMistriDiscovery({ onBook }: NearbyMistriDiscoveryProps) {
  const { coords, loading: locationLoading, error: locationError, requestGPS, setManualDistrict } = useUserLocation();
  const [radius, setRadius] = useState<Radius>(10);
  const [summaries, setSummaries] = useState<WorkerSummary[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { requestGPS(); }, [requestGPS]);

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.resolve(supabase.rpc("get_nearby_worker_summary", { customer_lat: coords.lat, customer_lng: coords.lng, radius_in_km: radius }))
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError) throw rpcError;
        setSummaries((data ?? []) as WorkerSummary[]);
      })
      .catch((rpcError) => { if (!cancelled) setError(rpcError instanceof Error ? rpcError.message : "Could not load nearby professionals."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [coords, radius]);

  useEffect(() => {
    if (!coords || !selectedTrade) { setTechnicians([]); return; }
    let cancelled = false;
    setListLoading(true);
    Promise.resolve(supabase.rpc("get_nearby_technicians_list", { customer_lat: coords.lat, customer_lng: coords.lng, radius_in_km: radius, filter_trade: selectedTrade }))
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError) throw rpcError;
        setTechnicians((data ?? []) as Technician[]);
      })
      .catch((rpcError) => { if (!cancelled) setError(rpcError instanceof Error ? rpcError.message : "Could not load nearby professionals."); })
      .finally(() => { if (!cancelled) setListLoading(false); });
    return () => { cancelled = true; };
  }, [coords, radius, selectedTrade]);

  const total = summaries.reduce((sum, item) => sum + item.total_available, 0);

  return (
    <section className="bg-white py-12 sm:py-16" id="nearby-mistris">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-bold uppercase tracking-wide text-orange-600">Nearby professionals</p><h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">Find a mistri near you</h2><p className="mt-2 text-sm text-slate-500">See verified professionals available around your location.</p></div>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Choose district fallback" defaultValue="" onChange={(event) => { if (event.target.value) setManualDistrict(event.target.value); }} className="form-input w-auto text-sm"><option value="">Choose district</option>{Object.keys(DISTRICT_FALLBACK_COORDINATES).map((district) => <option key={district}>{district}</option>)}</select>
            <button type="button" onClick={requestGPS} disabled={locationLoading} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"><Navigation className="h-4 w-4" />{locationLoading ? "Locating" : "Use GPS"}</button>
          </div>
        </div>
        {locationError && !coords && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">{locationError} Select a district to continue.</p>}
        {coords && <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950 p-4 text-white"><div className="flex items-center gap-2"><span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-orange-500" /></span><span className="text-sm font-semibold">{loading ? "Finding professionals..." : `${total} professionals available nearby`}</span></div><div className="flex flex-wrap gap-1 rounded-lg bg-white/10 p-1">{([3, 5, 10, 20, 50] as Radius[]).map((value) => <button type="button" key={value} onClick={() => setRadius(value)} className={`rounded-md px-2.5 py-1 text-xs font-bold ${radius === value ? "bg-orange-600 text-white" : "text-slate-300 hover:text-white"}`}>{value} km</button>)}</div></div>}
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {coords && <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{summaries.map((summary) => <button type="button" key={summary.trade} onClick={() => setSelectedTrade(summary.trade)} className={`rounded-xl p-4 text-left ring-1 transition ${selectedTrade === summary.trade ? "bg-orange-50 text-orange-800 ring-orange-300" : "bg-slate-50 text-slate-800 ring-slate-200 hover:ring-orange-300"}`}><div className="flex items-center justify-between"><span className="font-bold">{summary.trade}</span><Search className="h-4 w-4" /></div><p className="mt-3 text-2xl font-extrabold">{summary.total_available}</p><p className="text-xs text-slate-500">Closest {summary.closest_distance_km.toFixed(1)} km</p></button>)}</div>}
        {selectedTrade && <div className="mt-8"><h3 className="text-lg font-bold text-slate-900">Available {selectedTrade} professionals</h3>{listLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-orange-600" /></div> : technicians.length === 0 ? <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No professionals found in this radius.</p> : <div className="mt-3 space-y-3">{technicians.map((technician) => <div key={technician.id} className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-slate-900">{technician.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{technician.service_location_name ?? technician.service_pincode ?? "Service area pending"} • {technician.distance_km.toFixed(1)} km away</p></div><button type="button" onClick={() => onBook?.(technician.trade)} className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-500">Book Now</button></div>)}</div>}</div>}
      </div>
    </section>
  );
}
