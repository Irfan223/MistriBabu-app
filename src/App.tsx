import { useState, useRef, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ServiceCatalog from "@/components/ServiceCatalog";
import BookingForm from "@/components/BookingForm";
import TrustBadges from "@/components/TrustBadges";
import StickyBar from "@/components/StickyBar";
import ConfirmationModal from "@/components/ConfirmationModal";
import TechnicianRegistration from "@/components/TechnicianRegistration";
import TechnicianLoginModal from "@/components/TechnicianLoginModal";
import TechnicianDashboard from "@/components/TechnicianDashboard";
import CustomerLoginModal from "@/components/CustomerLoginModal";
import CustomerOrdersView from "@/components/CustomerOrdersView";
import AdminDashboard from "@/components/AdminDashboard";
import AdminLoginModal from "@/components/AdminLoginModal";
import InstallPromptBanner from "@/components/InstallPromptBanner";
import NearbyMistriDiscovery from "@/components/NearbyMistriDiscovery";
import { supabase } from "@/lib/supabase";
import { useConfig } from "@/context/AppConfigContext";

export default function App() {
  const { config } = useConfig();
  const [route, setRoute] = useState(window.location.hash);
  const [bookingPrefill, setBookingPrefill] = useState({
    category: "",
    subService: "",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [techModalOpen, setTechModalOpen] = useState(false);
  const [adminSession, setAdminSession] = useState<Session | null>(null);
  const [isTechnician, setIsTechnician] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [techLoginOpen, setTechLoginOpen] = useState(false);
  const [customerLoginOpen, setCustomerLoginOpen] = useState(false);
  const bookingRef = useRef<HTMLDivElement>(null);

  const verifySession = async (session: Session | null) => {
    if (!session) {
      setAdminSession(null);
      setIsTechnician(false);
      setIsCustomer(false);
      setCustomerPhone("");
      setAuthChecked(true);
      return;
    }
    // Check admin first
    const { data: admin } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();
    if (admin) {
      setAdminSession(session);
      setIsTechnician(false);
      setAuthChecked(true);
      return;
    }
    // Check technician (auth user created with role metadata)
    const role = session.user.user_metadata?.role;
    if (role === "technician") {
      setIsTechnician(true);
      setAdminSession(null);
      window.location.hash = "#/technician";
    } else if (role === "customer") {
      setIsCustomer(true);
      setCustomerPhone(session.user.user_metadata?.phone ?? "");
      setAdminSession(null);
      window.location.hash = "#/orders";
    } else {
      await supabase.auth.signOut();
      setAdminSession(null);
      setIsTechnician(false);
    }
    setAuthChecked(true);
  };

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => verifySession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setAdminSession(null);
          setIsTechnician(false);
          setIsCustomer(false);
          setCustomerPhone("");
          setAuthChecked(true);
          return;
        }
        setTimeout(() => verifySession(session), 0);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const isAdmin = route === "#/admin" || route === "#admin";
  const isTechnicianRoute = route === "#/technician" || route === "#technician";
  const isOrdersRoute = route === "#/orders" || route === "#orders";

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleBookService = (category: string, subService: string) => {
    setBookingPrefill({ category, subService });
    scrollToBooking();
  };

  const handleBookingSuccess = (id: string) => {
    setBookingId(id);
    setConfirmOpen(true);
  };

  if (isAdmin && authChecked && adminSession) {
    return (
      <AdminDashboard
        email={adminSession.user.email ?? ""}
        onBack={() => {
          window.location.hash = "";
        }}
      />
    );
  }

  if (isTechnicianRoute && authChecked && isTechnician) {
    return (
      <TechnicianDashboard
        onLogout={() => {
          setIsTechnician(false);
          window.location.hash = "";
        }}
      />
    );
  }

  if (isOrdersRoute && authChecked && isCustomer) {
    return (
      <CustomerOrdersView
        phone={customerPhone}
        onLogout={() => {
          setIsCustomer(false);
          setCustomerPhone("");
          window.location.hash = "";
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white pb-16 sm:pb-0">
      <Header
        onBookClick={scrollToBooking}
        onJoinClick={() => setTechModalOpen(true)}
        onTechLoginClick={() => setTechLoginOpen(true)}
        onOrdersClick={() => setCustomerLoginOpen(true)}
      />

      <main>
        <Hero onBookClick={scrollToBooking} />
        <ServiceCatalog onBookService={handleBookService} />
        <NearbyMistriDiscovery
          onBook={(category) => handleBookService(category, "")}
        />
        <BookingForm
          ref={bookingRef}
          prefillCategory={bookingPrefill.category}
          prefillSubService={bookingPrefill.subService}
          onSubmitSuccess={handleBookingSuccess}
        />
        <TrustBadges />
      </main>

      <footer className="bg-slate-900 py-8 text-center">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm font-bold text-white">
            {config.brand_display_name}
          </p>
          <p className="mt-1 text-xs text-brand-300">
            {config.tagline_primary}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-brand-300">
            <a
              href={`tel:${config.calling_number}`}
              className="hover:text-white"
            >
              Call: {config.support_phone}
            </a>
            <span className="text-slate-600">|</span>
            <a
              href={`https://wa.me/${config.whatsapp_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              WhatsApp
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            © 2026 {config.brand_display_name}. {config.footer_serving_text}
          </p>
          {/* Hidden in plain sight — internal staff only */}
          <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-slate-700">
            <button
              onClick={() => setCustomerLoginOpen(true)}
              className="hover:text-slate-500"
            >
              My Orders
            </button>
            <span>·</span>
            <button
              onClick={() => setTechLoginOpen(true)}
              className="hover:text-slate-500"
            >
              Technician Login
            </button>
            <span>·</span>
            <button
              onClick={() => {
                window.location.hash = "#/admin";
              }}
              className="hover:text-slate-500"
            >
              Admin
            </button>
          </div>
        </div>
      </footer>

      <StickyBar />
      <InstallPromptBanner />
      <ConfirmationModal
        open={confirmOpen}
        bookingId={bookingId}
        onClose={() => setConfirmOpen(false)}
      />
      <TechnicianRegistration
        open={techModalOpen}
        onClose={() => setTechModalOpen(false)}
        onLoginClick={() => {
          setTechModalOpen(false);
          setTechLoginOpen(true);
        }}
      />
      <CustomerLoginModal
        open={
          customerLoginOpen || (isOrdersRoute && authChecked && !isCustomer)
        }
        onClose={() => {
          setCustomerLoginOpen(false);
          if (isOrdersRoute) window.location.hash = "";
        }}
      />
      <TechnicianLoginModal
        open={
          techLoginOpen || (isTechnicianRoute && authChecked && !isTechnician)
        }
        onClose={() => {
          setTechLoginOpen(false);
          if (isTechnicianRoute) window.location.hash = "";
        }}
        onJoinClick={() => {
          setTechLoginOpen(false);
          setTechModalOpen(true);
        }}
      />
      <AdminLoginModal
        open={isAdmin && authChecked && !adminSession}
        onClose={() => {
          window.location.hash = "";
        }}
        onAuthorized={() => undefined}
      />
    </div>
  );
}
