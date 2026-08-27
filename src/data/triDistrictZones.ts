export interface PincodeMeta {
  pincode: string;
  hubName: string;
  type: "URBAN" | "SEMI-URBAN" | "RURAL";
}

export interface DistrictCluster {
  district: "Muzaffarpur" | "Sitamarhi" | "Sheohar";
  pincodes: PincodeMeta[];
}

export const TRI_DISTRICT_DATA: Record<string, DistrictCluster> = {
  Muzaffarpur: {
    district: "Muzaffarpur",
    pincodes: [
      { pincode: "842001", hubName: "Head Office / Mithanpura", type: "URBAN" },
      { pincode: "842002", hubName: "Brahmpura / Juran Chapra / MDDM", type: "URBAN" },
      { pincode: "842003", hubName: "Ramna / Kalambagh Road / Bela", type: "URBAN" },
      { pincode: "842004", hubName: "Kanti Industrial Area", type: "SEMI-URBAN" },
      { pincode: "842005", hubName: "Ahiyapur / SKMCH Medical", type: "SEMI-URBAN" },
      { pincode: "843101", hubName: "Saraiya / Amgola", type: "RURAL" },
      { pincode: "843102", hubName: "Bariarpur", type: "RURAL" },
      { pincode: "843103", hubName: "Baghi / Sakra Rural", type: "RURAL" },
      { pincode: "843104", hubName: "Bochahan / Barauni", type: "RURAL" },
      { pincode: "843105", hubName: "Dholi / Sakra", type: "RURAL" },
      { pincode: "843106", hubName: "Gaighat", type: "RURAL" },
      { pincode: "843107", hubName: "Jhapahan", type: "RURAL" },
      { pincode: "843108", hubName: "Kolhua / Kanti Rural", type: "RURAL" },
      { pincode: "843109", hubName: "Karja / Marwan", type: "RURAL" },
      { pincode: "843110", hubName: "Katra", type: "RURAL" },
      { pincode: "843112", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843111", hubName: "Minapur / Mahua Rural", type: "RURAL" },
      { pincode: "843116", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843117", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843113", hubName: "Motipur", type: "SEMI-URBAN" },
      { pincode: "843115", hubName: "Muraul / Bandra", type: "RURAL" },
      { pincode: "843118", hubName: "Paroo", type: "RURAL" },
      { pincode: "843119", hubName: "Sahebganj", type: "RURAL" },
      { pincode: "843120", hubName: "Saraiya Hat", type: "RURAL" },
      { pincode: "843121", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843122", hubName: "Kurhani / Tariya", type: "RURAL" },
      { pincode: "843123", hubName: "Baruraj", type: "RURAL" },
      { pincode: "843125", hubName: "Sakra Wajid", type: "RURAL" },
      { pincode: "843126", hubName: "Turki", type: "RURAL" },
      { pincode: "843127", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843128", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843129", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843132", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843133", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843139", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843141", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843143", hubName: "Aurai", type: "RURAL" },
      { pincode: "843144", hubName: "Majhaulia / Kudhani", type: "RURAL" },
      { pincode: "843146", hubName: "Minapur Block", type: "RURAL" },
      { pincode: "843147", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843152", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843153", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843161", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843162", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "843165", hubName: "Bandra", type: "RURAL" },
      { pincode: "843312", hubName: "Muzaffarpur District", type: "RURAL" },
      { pincode: "844111", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "844112", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "844118", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "844120", hubName: "Muzaffarpur Rural", type: "RURAL" },
      { pincode: "844127", hubName: "Dholi Station", type: "RURAL" },
      { pincode: "847107", hubName: "Muzaffarpur Rural", type: "RURAL" },
    ],
  },
  Sitamarhi: {
    district: "Sitamarhi",
    pincodes: [
      { pincode: "843301", hubName: "Sitamarhi HO / Dumra", type: "URBAN" },
      { pincode: "843302", hubName: "Bairgania", type: "SEMI-URBAN" },
      { pincode: "843311", hubName: "Bathanaha", type: "RURAL" },
      { pincode: "843313", hubName: "Sitamarhi Rural", type: "RURAL" },
      { pincode: "843314", hubName: "Belsand", type: "SEMI-URBAN" },
      { pincode: "843315", hubName: "Parsauni / Bhikhpatti", type: "RURAL" },
      { pincode: "843316", hubName: "Choraut", type: "RURAL" },
      { pincode: "843317", hubName: "Pupri / Janakpur Road", type: "SEMI-URBAN" },
      { pincode: "843318", hubName: "Sitamarhi Rural", type: "RURAL" },
      { pincode: "843319", hubName: "Dumra Court / Rajopatti", type: "URBAN" },
      { pincode: "843320", hubName: "Majorgang", type: "RURAL" },
      { pincode: "843322", hubName: "Sitamarhi Rural", type: "RURAL" },
      { pincode: "843323", hubName: "Nanpur", type: "RURAL" },
      { pincode: "843324", hubName: "Parihar", type: "RURAL" },
      { pincode: "843325", hubName: "Riga", type: "SEMI-URBAN" },
      { pincode: "843326", hubName: "Suppi / Rikhauli", type: "RURAL" },
      { pincode: "843327", hubName: "Riga Sugar Mill", type: "SEMI-URBAN" },
      { pincode: "843329", hubName: "Sursand", type: "SEMI-URBAN" },
      { pincode: "843330", hubName: "Sonbarsa", type: "RURAL" },
      { pincode: "843331", hubName: "Runnisaidpur", type: "SEMI-URBAN" },
      { pincode: "843332", hubName: "Bajpatti / Bokraha", type: "RURAL" },
      { pincode: "843333", hubName: "Barganiya Border", type: "RURAL" },
      { pincode: "843360", hubName: "Sitamarhi Rural", type: "RURAL" },
      { pincode: "847302", hubName: "Sitamarhi Rural", type: "RURAL" },
      { pincode: "847307", hubName: "Sitamarhi Rural", type: "RURAL" },
    ],
  },
  Sheohar: {
    district: "Sheohar",
    pincodes: [
      { pincode: "843328", hubName: "Sheohar HO / Piprahi", type: "URBAN" },
      { pincode: "843334", hubName: "Tariani Chowk / Narwara", type: "RURAL" },
      { pincode: "843321", hubName: "Dumri Katsari", type: "RURAL" },
      { pincode: "843351", hubName: "Purnahiya", type: "RURAL" },
    ],
  },
};

export const ALL_TRI_DISTRICT_PINCODES = Object.values(TRI_DISTRICT_DATA).flatMap((cluster) => cluster.pincodes);

export function getPincodeMeta(pincode: string): { district: DistrictCluster["district"]; meta: PincodeMeta } | null {
  for (const cluster of Object.values(TRI_DISTRICT_DATA)) {
    const meta = cluster.pincodes.find((entry) => entry.pincode === pincode);
    if (meta) return { district: cluster.district, meta };
  }
  return null;
}
