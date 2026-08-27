import { useState, useRef, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { Lock } from "lucide-react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ServiceCatalog from "@/components/ServiceCatalog";
import BookingForm from "@/components/BookingForm";
import TrustBadges from "@/components/TrustBadges";
import StickyBar from "@/components/StickyBar";
import ConfirmationModal from "@/components/ConfirmationModal";
import TechnicianRegistration from "@/components/TechnicianRegistration";
import AdminDashboard from "@/components/AdminDashboard";
import AdminLoginModal from "@/components/AdminLoginModal";
import InstallPromptBanner from "@/components/InstallPromptBanner";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/constants/brand";

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  const [bookingPrefill, setBookingPrefill] = useState({
    category: "",
    subService: "",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [techModalOpen, setTechModalOpen] = useState(false);
  const [adminSession, setAdminSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const bookingRef = useRef<HTMLDivElement>(null);

  const verifyAdminSession = async (session: Session | null) => {
    if (!session) {
      setAdminSession(null);
      setAuthChecked(true);
      return;
    }
    const { data } = await supabase.from("admin_users").select("id").eq("id", session.user.id).maybeSingle();
    if (data) {
      setAdminSession(session);
    } else {
      await supabase.auth.signOut();
      setAdminSession(null);
    }
    setAuthChecked(true);
  };

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => verifyAdminSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAdminSession(null);
        setAuthChecked(true);
        return;
      }
      setTimeout(() => verifyAdminSession(session), 0);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const isAdmin = route === "#/admin" || route === "#admin";

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
    return <AdminDashboard email={adminSession.user.email ?? ""} onBack={() => { window.location.hash = ""; }} />;
  }

  return (
    <div className="min-h-screen bg-white pb-16 sm:pb-0">
      <Header onBookClick={scrollToBooking} onJoinClick={() => setTechModalOpen(true)} />

      <main>
        <Hero onBookClick={scrollToBooking} />
        <ServiceCatalog onBookService={handleBookService} />
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
          <p className="text-sm font-bold text-white">{BRAND.displayName}</p>
          <p className="mt-1 text-xs text-blue-300">{BRAND.taglines.primary}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-blue-300">
            <a href={`tel:${BRAND.callingNumber}`} className="hover:text-white">
              Call: {BRAND.supportPhone}
            </a>
            <span className="text-slate-600">|</span>
            <a
              href={`https://wa.me/${BRAND.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              WhatsApp
            </a>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => { window.location.hash = "#/admin"; }}
              className="flex items-center gap-1 hover:text-white"
            >
              <Lock className="h-3 w-3" />
              Admin
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            © 2026 {BRAND.displayName}. Proudly serving Muzaffarpur, Sitamarhi &amp; Sheohar, Bihar.
          </p>
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
      />
      <AdminLoginModal
        open={isAdmin && authChecked && !adminSession}
        onClose={() => { window.location.hash = ""; }}
        onAuthorized={() => undefined}
      />
    </div>
  );
}
