export const BRAND = {
  name: "QuickMistri",
  displayName: "Quick Mistri",
  legalName: "Quick Mistri Technologies",
  domain: "quickmistri.in",
  url: "https://www.quickmistri.in",
  supportEmail: "support@quickmistri.in",
  supportPhone: "+91 89105 41678",
  whatsappNumber: "918910541678",
  callingNumber: "+918910541678",
  region: "Muzaffarpur • Sitamarhi • Sheohar • Motihari",

  taglines: {
    primary: "Ghar Ke Har Kaam Ka Bharosemand Hal",
    secondary: "Expert Home Services, Right at Your Doorstep",
    short: "Trusted Home Services, On Demand",
  },

  seo: {
    defaultTitle: "Quick Mistri | Book Verified Home Repair & Maintenance Services",
    titleTemplate: "%s | Quick Mistri",
    description:
      "Book verified electricians, plumbers, appliance repair experts, and home maintenance professionals with upfront pricing and guaranteed quality on Quick Mistri.",
    keywords: [
      "Quick Mistri",
      "home repair services",
      "verified electrician",
      "plumbing service",
      "appliance repair",
      "carpenter at home",
      "book home service",
    ],
  },

  features: [
    {
      title: "Verified Experts",
      description: "Background-checked and skill-verified technicians.",
    },
    {
      title: "Transparent Pricing",
      description: "No hidden charges; clear service estimates before work starts.",
    },
    {
      title: "Fast At-Home Service",
      description: "On-time arrival with prompt issue diagnostics and repair.",
    },
    {
      title: "Guaranteed Workmanship",
      description: "Reliable repairs backed by a 30-day rework warranty.",
    },
  ],

  serviceCopy: {
    heading: "Home Maintenance, Made Simple",
    description: "Transparent pricing. No hidden charges. Pay after service.",
    bookingButton: "Book a Service Now",
    partnerButton: "Join Quick Mistri",
  },

  hero: {
    regionLabel: "Serving Muzaffarpur • Sitamarhi • Sheohar • Motihari",
    title: "Expert Home Services at Your Doorstep",
    subtitle: "Verified local experts at fixed pricing. Rapid doorstep repair across North Bihar.",
    responseTime: "Average response time: under 60 minutes",
  },

  trust: {
    inspection: "₹99 Inspection",
    experts: "Verified Experts",
    warranty: "30-Day Warranty",
  },

  inspectionFee: "₹99",
  guarantee: "30-Day Warranty",
  guaranteeDays: "30-Day Rework Warranty",

  socials: {
    twitter: "@QuickMistriIn",
    instagram: "quickmistri.in",
    facebook: "quickmistriofficial",
  },
} as const;

export const SERVICE_CATALOG = {
  Electrician: [
    {
      name: "Fan / Light / Switch Repair",
      price: "From ₹149",
      desc: "Ceiling fan, tube light, switch & socket fixing",
    },
    {
      name: "Short Circuit / MCB Fix",
      price: "From ₹199",
      desc: "Tripping, short circuit, MCB & fuse box repair",
    },
    {
      name: "Inverter / Wiring Inspection",
      price: "From ₹399",
      desc: "Full wiring check & inverter setup inspection",
    },
    {
      name: "Geyser / Appliance Point",
      price: "From ₹249",
      desc: "Geyser, AC & appliance point installation",
    },
  ],
  Plumber: [
    {
      name: "Tap / Pipe Leakage",
      price: "From ₹149",
      desc: "Leaking taps, pipes & joints repair",
    },
    {
      name: "Toilet / Flush Tank / Washbasin",
      price: "From ₹249",
      desc: "Flush tank, commode & washbasin fixing",
    },
    {
      name: "Water Motor / Submersible Inspection",
      price: "From ₹299",
      desc: "Motor & submersible pump check & repair",
    },
    {
      name: "Tank Cleaning & Blockage Clearing",
      price: "From ₹499",
      desc: "Overhead tank cleaning & drain blockage",
    },
  ],
  AC: [
    {
      name: "AC Service & Cleaning",
      price: "From ₹499",
      desc: "Deep cleaning for split and window AC units",
    },
    {
      name: "AC Repair & Gas Check",
      price: "From ₹299",
      desc: "Cooling issues, gas leakage checks and repairs",
    },
    {
      name: "AC Installation",
      price: "From ₹999",
      desc: "Professional split and window AC installation",
    },
    {
      name: "AC Uninstallation",
      price: "From ₹499",
      desc: "Careful removal for shifting or replacement",
    },
  ],
  Painter: [
    {
      name: "Room Painting",
      price: "From ₹1,499",
      desc: "Neat interior wall painting for rooms and homes",
    },
    {
      name: "Wall Texture & Design",
      price: "From ₹1,999",
      desc: "Decorative textures and feature wall finishes",
    },
    {
      name: "Exterior Painting",
      price: "From ₹1,999",
      desc: "Weather-resistant exterior painting and touch-ups",
    },
    {
      name: "Putty & Surface Preparation",
      price: "From ₹699",
      desc: "Crack filling, putty work and smooth surface prep",
    },
  ],
} as const;
