import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { BRAND, SERVICE_CATALOG } from "@/constants/brand";

export interface SubService {
    id: string;
    name: string;
    description: string;
    price: number;
    display_order: number;
    is_active: boolean;
}

export interface ServiceCategory {
    id: string;
    name: string;
    icon: string;
    display_order: number;
    is_active: boolean;
    sub_services: SubService[];
}

export interface TrustBadge {
    id: string;
    title: string;
    description: string;
    icon: string;
    display_order: number;
    is_active: boolean;
}

export interface TimeSlot {
    id: string;
    label: string;
    display_order: number;
    is_active: boolean;
}

export interface AppConfigState {
    config: Record<string, string>;
    categories: ServiceCategory[];
    badges: TrustBadge[];
    timeSlots: TimeSlot[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

// Static fallback values mirroring brand.ts — used when DB is unreachable
const FALLBACK_CONFIG: Record<string, string> = {
    whatsapp_number: BRAND.whatsappNumber,
    support_phone: BRAND.supportPhone,
    calling_number: BRAND.callingNumber,
    support_email: BRAND.supportEmail,
    brand_name: BRAND.name,
    brand_display_name: BRAND.displayName,
    brand_legal_name: BRAND.legalName,
    brand_domain: BRAND.domain,
    brand_url: BRAND.url,
    hero_title: BRAND.hero.title,
    hero_subtitle: BRAND.hero.subtitle,
    hero_region_label: BRAND.hero.regionLabel,
    hero_response_time: BRAND.hero.responseTime,
    tagline_primary: BRAND.taglines.primary,
    tagline_secondary: BRAND.taglines.secondary,
    tagline_short: BRAND.taglines.short,
    service_heading: BRAND.serviceCopy.heading,
    service_description: BRAND.serviceCopy.description,
    booking_button_text: BRAND.serviceCopy.bookingButton,
    partner_button_text: BRAND.serviceCopy.partnerButton,
    footer_serving_text: "Proudly serving Muzaffarpur, Sitamarhi, Sheohar & Motihari, Bihar.",
    inspection_fee: "99",
    guarantee_days: "30",
    twitter_handle: BRAND.socials.twitter,
    instagram_handle: BRAND.socials.instagram,
    facebook_handle: BRAND.socials.facebook,
};

const CATEGORY_ICON_MAP: Record<string, string> = {
    Electrician: "⚡", Plumber: "🔧", "AC Technician": "❄️", Painter: "🎨",
};

const FALLBACK_CATEGORIES: ServiceCategory[] = (
    Object.entries(SERVICE_CATALOG) as [string, { name: string; price: string; desc: string }[]][]
).map(([name, services], catIdx) => ({
    id: `fallback-cat-${catIdx}`,
    name,
    icon: CATEGORY_ICON_MAP[name] ?? "🔨",
    display_order: catIdx + 1,
    is_active: true,
    sub_services: services.map((s, i) => ({
        id: `fallback-sub-${catIdx}-${i}`,
        name: s.name,
        description: s.desc,
        price: parseInt(s.price.replace(/[^\d]/g, ""), 10),
        display_order: i + 1,
        is_active: true,
    })),
}));

const FALLBACK_BADGES: TrustBadge[] = [
    { id: "fb-1", title: BRAND.trust.inspection, description: "Low visit charge, adjusted in final bill", icon: "💰", display_order: 1, is_active: true },
    { id: "fb-2", title: BRAND.trust.experts, description: "Every expert is background-checked", icon: "✅", display_order: 2, is_active: true },
    { id: "fb-3", title: BRAND.trust.warranty, description: "Free rework if the issue comes back", icon: "🛡️", display_order: 3, is_active: true },
    { id: "fb-4", title: "60-Minute Response", description: "At your doorstep within an hour", icon: "⚡", display_order: 4, is_active: true },
    { id: "fb-5", title: "Skilled Professionals", description: "Experienced local electricians and plumbers", icon: "🔧", display_order: 5, is_active: true },
    { id: "fb-6", title: "Trusted Locally", description: "Built for North Bihar homes", icon: "🏠", display_order: 6, is_active: true },
];

const FALLBACK_TIME_SLOTS: TimeSlot[] = [
    { id: "ts-1", label: "09:00 AM - 12:00 PM (Morning)", display_order: 1, is_active: true },
    { id: "ts-2", label: "12:00 PM - 03:00 PM (Afternoon)", display_order: 2, is_active: true },
    { id: "ts-3", label: "03:00 PM - 06:00 PM (Evening)", display_order: 3, is_active: true },
    { id: "ts-4", label: "06:00 PM - 09:00 PM (Night)", display_order: 4, is_active: true },
];

export function useAppConfig(): AppConfigState {
    const [config, setConfig] = useState<Record<string, string>>(FALLBACK_CONFIG);
    const [categories, setCategories] = useState<ServiceCategory[]>(FALLBACK_CATEGORIES);
    const [badges, setBadges] = useState<TrustBadge[]>(FALLBACK_BADGES);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(FALLBACK_TIME_SLOTS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [configRes, catsRes, badgesRes, slotsRes] = await Promise.all([
                supabase.from("app_config").select("key, value"),
                supabase
                    .from("service_categories")
                    .select("*, sub_services(*)")
                    .eq("is_active", true)
                    .order("display_order"),
                supabase
                    .from("trust_badges")
                    .select("*")
                    .eq("is_active", true)
                    .order("display_order"),
                supabase
                    .from("booking_time_slots")
                    .select("*")
                    .eq("is_active", true)
                    .order("display_order"),
            ]);

            if (configRes.error) throw configRes.error;
            if (catsRes.error) throw catsRes.error;
            if (badgesRes.error) throw badgesRes.error;
            if (slotsRes.error) throw slotsRes.error;

            const configMap: Record<string, string> = { ...FALLBACK_CONFIG };
            for (const row of configRes.data ?? []) configMap[row.key] = row.value;

            // Sort nested sub_services by display_order
            const cats: ServiceCategory[] = (catsRes.data ?? []).map((c: ServiceCategory & { sub_services: SubService[] }) => ({
                ...c,
                sub_services: [...(c.sub_services ?? [])]
                    .filter((s) => s.is_active)
                    .sort((a, b) => a.display_order - b.display_order),
            }));

            setConfig(configMap);
            setCategories(cats.length > 0 ? cats : FALLBACK_CATEGORIES);
            setBadges((badgesRes.data ?? []).length > 0 ? (badgesRes.data as TrustBadge[]) : FALLBACK_BADGES);
            setTimeSlots((slotsRes.data ?? []).length > 0 ? (slotsRes.data as TimeSlot[]) : FALLBACK_TIME_SLOTS);
        } catch (err) {
            // Silently fall back to brand.ts constants so the UI stays functional
            setError(err instanceof Error ? err.message : "Failed to load site config");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    return { config, categories, badges, timeSlots, loading, error, refetch: fetchAll };
}
