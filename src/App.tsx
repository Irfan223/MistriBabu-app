import { useState, useRef, useEffect } from "react";
import { ShieldCheck, Lock } from "lucide-react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ServiceCatalog from "@/components/ServiceCatalog";
import BookingForm from "@/components/BookingForm";
import TrustBadges from "@/components/TrustBadges";
import StickyBar from "@/components/StickyBar";
import ConfirmationModal from "@/components/ConfirmationModal";
import TechnicianRegistration from "@/components/TechnicianRegistration";
import AdminDashboard from "@/components/AdminDashboard";
import { siteConfig } from "@/config/siteConfig";

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  const [bookingPrefill, setBookingPrefill] = useState({
    category: "",
    subService: "",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [techModalOpen, setTechModalOpen] = useState(false);
  const bookingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
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

  if (isAdmin) {
    return <AdminDashboard onBack={() => { window.location.hash = ""; }} />;
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
          <p className="text-sm font-bold text-white">{siteConfig.brandName}</p>
          <p className="mt-1 text-xs text-blue-300">{siteConfig.tagline}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-blue-300">
            <a href={`tel:${siteConfig.callingNumber}`} className="hover:text-white">
              Call: {siteConfig.callingNumber}
            </a>
            <span className="text-slate-600">|</span>
            <a
              href={`https://wa.me/${siteConfig.whatsappNumber}`}
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
            © {new Date().getFullYear()} {siteConfig.brandName}. Made for {siteConfig.city}, Bihar.
          </p>
        </div>
      </footer>

      <StickyBar />
      <ConfirmationModal
        open={confirmOpen}
        bookingId={bookingId}
        onClose={() => setConfirmOpen(false)}
      />
      <TechnicianRegistration
        open={techModalOpen}
        onClose={() => setTechModalOpen(false)}
      />
    </div>
  );
}
