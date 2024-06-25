const airportList = [
    {
    "code": "TRZ",
    "name": "Tiruchirappalli (TRZ), India",
    "bandara": "Tiruchirappalli",
    "group": "Internasional"
    },
    {
    "code": "BKI",
    "name": "Kota Kinabalu (BKI), Malaysia",
    "bandara": "Kota Kinabalu",
    "group": "Internasional"
    },
    {
    "code": "TRV",
    "name": "Trivandrum (TRV), India",
    "bandara": "Trivandrum",
    "group": "Internasional"
    },
    {
    "code": "PVG",
    "name": "Shanghai Pudong (PVG), China",
    "bandara": "Shanghai Pudong",
    "group": "Internasional"
    },
    {
    "code": "KWE",
    "name": "Guiyang (KWE), China",
    "bandara": "Longdongbao",
    "group": "Internasional"
    },
    {
    "code": "PHS",
    "name": "Phitsanulok (PHS), Thailand",
    "bandara": "Phitsanulok",
    "group": "Internasional"
    },
    {
    "code": "KXB",
    "name": "Pomala Kolaka Airport (KXB)",
    "bandara": "Sangia Nibanderia",
    "group": "Domestik"
    },
    {
    "code": "LSW",
    "name": "Lhokseumawe (LSW)",
    "bandara": "Malikus Saleh",
    "group": "Domestik"
    },
    {
    "code": "KNY",
    "name": "Kenyam (KNY), Nduga",
    "bandara": "Kenyam",
    "group": "Domestik"
    },
    {
    "code": "BEJ",
    "name": "Berau (BEJ)",
    "bandara": "Kalimarau",
    "group": "Domestik"
    },
    {
    "code": "FKQ",
    "name": "Fakfak (FKQ)",
    "bandara": "Torea",
    "group": "Domestik"
    },
    {
    "code": "TRK",
    "name": "Tarakan (TRK)",
    "bandara": "Juwata",
    "group": "Domestik"
    },
    {
    "code": "TLI",
    "name": "Tolitoli (TLI)",
    "bandara": "Sultan Bantilan",
    "group": "Domestik"
    },
    {
    "code": "TTE",
    "name": "Ternate (TTE)",
    "bandara": "Sultan Babullah",
    "group": "Domestik"
    },
    {
    "code": "LKA",
    "name": "Larantuka (LKA), Flores Timur",
    "bandara": "Gewayantana",
    "group": "Domestik"
    },
    {
    "code": "BWX",
    "name": "Banyuwangi (BWX)",
    "bandara": "Blimbingsari",
    "group": "Domestik"
    },
    {
    "code": "TJS",
    "name": "Tanjung Selor (TJS), Bulungan",
    "bandara": "Tanjung Harapan",
    "group": "Domestik"
    },
    {
    "code": "TNJ",
    "name": "Tanjungpinang (TNJ)",
    "bandara": "Raja Haji Fisabilillah",
    "group": "Domestik"
    },
    {
    "code": "KNO",
    "name": "Medan (KNO)",
    "bandara": "Kualanamu",
    "group": "Domestik"
    },
    {
    "code": "SUP",
    "name": "SUMENEP (SUP)",
    "bandara": "Trunojoyo",
    "group": "Domestik"
    },
    {
    "code": "SWQ",
    "name": "Sumbawa (SWQ)",
    "bandara": "Sultan Muhammad Kaharuddin III",
    "group": "Domestik"
    },
    {
    "code": "SOC",
    "name": "Solo (SOC), Surakarta",
    "bandara": "Adisumarmo",
    "group": "Domestik"
    },
    {
    "code": "SNK",
    "name": "Sinak (SNK), Puncak",
    "bandara": "Sinak",
    "group": "Domestik"
    },
    {
    "code": "SMG",
    "name": "Simeuleu (SMG)",
    "bandara": "Lasikin",
    "group": "Domestik"
    },
    {
    "code": "SXK",
    "name": "Saumlaki (SXK), Maluku Tenggara Barat",
    "bandara": "Saumlaki",
    "group": "Domestik"
    },
    {
    "code": "KAZ",
    "name": "Kao Tobelo (KAZ), Kao Halmahera Utara",
    "bandara": "Kao Halmahera Utara",
    "group": "Domestik"
    },
    {
    "code": "SBG",
    "name": "Sabang (SBG)",
    "bandara": "Maimun Saleh",
    "group": "Domestik"
    },
    {
    "code": "LAH",
    "name": "Labuha (LAH), Halmahera Selatan",
    "bandara": "Oesman Sadik",
    "group": "Domestik"
    },
    {
    "code": "OTI",
    "name": "Morotai (OTI), Halmahera Utara",
    "bandara": "MOROTAI",
    "group": "Domestik"
    },
    {
    "code": "KEP",
    "name": "Kepi (KEP), Mappi",
    "bandara": "Kepi",
    "group": "Domestik"
    },
    {
    "code": "FLZ",
    "name": "Sibolga (FLZ)",
    "bandara": "Ferdinand Lumban",
    "group": "Domestik"
    },
    {
    "code": "BTJ",
    "name": "Banda Aceh (BTJ)",
    "bandara": "Sultan Iskandarmuda",
    "group": "Domestik"
    },
    {
    "code": "VPM",
    "name": "Ampana (VPM)",
    "bandara": "Tanjung Api",
    "group": "Domestik"
    },
    {
    "code": "RAQ",
    "name": "RAHA (RAQ)",
    "bandara": "Sugimanuru",
    "group": "Domestik"
    },
    {
    "code": "AMQ",
    "name": "Ambon (AMQ)",
    "bandara": "Pattimura",
    "group": "Domestik"
    },
    {
    "code": "RTG",
    "name": "Ruteng (RTG), Manggarai",
    "bandara": "Frans Sales Lega",
    "group": "Domestik"
    },
    {
    "code": "BDJ",
    "name": "Banjarmasin (BDJ)",
    "bandara": "Syamsudin Noor",
    "group": "Domestik"
    },
    {
    "code": "BJW",
    "name": "Bajawa (BJW), Ngada",
    "bandara": "Soa",
    "group": "Domestik"
    },
    {
    "code": "MNA",
    "name": "Melongguane (MNA), Kep Talaud",
    "bandara": "Melangguane",
    "group": "Domestik"
    },
    {
    "code": "NPO",
    "name": "Nanga Pinoh (NPO), Melawi",
    "bandara": "Nanga Pinoh",
    "group": "Domestik"
    },
    {
    "code": "LUW",
    "name": "Luwuk (LUW), Banggai",
    "bandara": "Syukuran Aminuddin Amir",
    "group": "Domestik"
    },
    {
    "code": "LOP",
    "name": "Lombok (LOP)",
    "bandara": "Lombok Praya",
    "group": "Domestik"
    },
    {
    "code": "BTH",
    "name": "Batam (BTH)",
    "bandara": "Hang Nadim",
    "group": "Domestik"
    },
    {
    "code": "BUW",
    "name": "Baubau (BUW)",
    "bandara": "Betoambari",
    "group": "Domestik"
    },
    {
    "code": "BIK",
    "name": "Biak (BIK)",
    "bandara": "Frans Kaisiepo",
    "group": "Domestik"
    },
    {
    "code": "BMU",
    "name": "Bima (BMU)",
    "bandara": "Muhammad Salahuddin",
    "group": "Domestik"
    },
    {
    "code": "DUM",
    "name": "Dumai (DUM)",
    "bandara": "Pinang Kampai",
    "group": "Domestik"
    },
    {
    "code": "ENE",
    "name": "Ende (ENE)",
    "bandara": "H Hasan Aroeboesman",
    "group": "Domestik"
    },
    {
    "code": "GLX",
    "name": "Galela (GLX), Halmahera Utara",
    "bandara": "Gamar Malamo",
    "group": "Domestik"
    },
    {
    "code": "GTO",
    "name": "Gorontalo (GTO)",
    "bandara": "Jalaluddin",
    "group": "Domestik"
    },
    {
    "code": "KTG",
    "name": "Ketapang (KTG)",
    "bandara": "Rahadi Osman",
    "group": "Domestik"
    },
    {
    "code": "KOX",
    "name": "Kokonau (KOX), Mimika",
    "bandara": "Kokonau",
    "group": "Domestik"
    },
    {
    "code": "KBU",
    "name": "Kotabaru (KBU)",
    "bandara": "Gusti Syamsir Alam",
    "group": "Domestik"
    },
    {
    "code": "BKS",
    "name": "Bengkulu (BKS)",
    "bandara": "Fatmawati Soekarno",
    "group": "Domestik"
    },
    {
    "code": "NAM",
    "name": "Namlea (NAM)",
    "bandara": "Namlea (NAM)",
    "group": "Domestik"
    },
    {
    "code": "WNI",
    "name": "Wakatobi (WNI)",
    "bandara": "Matahora",
    "group": "Domestik"
    },
    {
    "code": "BUU",
    "name": "Muara Bungo (BUU)",
    "bandara": "Muara Bungo",
    "group": "Domestik"
    },
    {
    "code": "DJB",
    "name": "Jambi (DJB)",
    "bandara": "Sultan Thaha",
    "group": "Domestik"
    },
    {
    "code": "MWS",
    "name": "Muara Bungo (MWS)",
    "bandara": "Muara Bungo",
    "group": "Domestik"
    },
    {
    "code": "DVO",
    "name": "Davao (DVO), Philippines",
    "bandara": "Davao",
    "group": "Internasional"
    },
    {
    "code": "ATQ",
    "name": "Amritsar (ATQ), India",
    "bandara": "Sri Guru Ram Dass Jee",
    "group": "Internasional"
    },
    {
    "code": "THD",
    "name": "Thanh Hoa (THD), Vietnam",
    "bandara": "Tho Xuan",
    "group": "Internasional"
    },
    {
    "code": "AMD",
    "name": "Ahmedabad (AMD), India",
    "bandara": "Ahmedabad",
    "group": "Internasional"
    },
    {
    "code": "KBR",
    "name": "Kota Bharu (KBR), Malaysia",
    "bandara": "Sultan Ismail Petra",
    "group": "Internasional"
    },
    {
    "code": "GAU",
    "name": "Guwahati (GAU), India",
    "bandara": "Lokpriya Gopinath Bordoloi",
    "group": "Internasional"
    },
    {
    "code": "KTM",
    "name": "Kathmandu (KTM), Nepal",
    "bandara": "Tribhuvan",
    "group": "Internasional"
    },
    {
    "code": "KMG",
    "name": "Kunming (KMG), China",
    "bandara": "Kunming Changshui",
    "group": "Internasional"
    },
    {
    "code": "TGG",
    "name": "Kuala Terengganu (TGG), Malaysia",
    "bandara": "Sultan Mahmud",
    "group": "Internasional"
    },
    {
    "code": "MAN",
    "name": "Manchester (MAN), UK",
    "bandara": "Manchester",
    "group": "Internasional"
    },
    {
    "code": "TBB",
    "name": "Tuy Hoa (TBB), Vietnam",
    "bandara": "Dong Tac",
    "group": "Internasional"
    },
    {
    "code": "SBW",
    "name": "Sibu (SBW), Malaysia",
    "bandara": "Sibu",
    "group": "Internasional"
    },
    {
    "code": "NYT",
    "name": "Nay Pyi Taw (NYT), Myanmar",
    "bandara": "Naypyidaw",
    "group": "Internasional"
    },
    {
    "code": "LBU",
    "name": "Labuan (LBU), Malaysia",
    "bandara": "Labuan",
    "group": "Internasional"
    },
    {
    "code": "ITM",
    "name": "Osaka Itami (ITM), Japan",
    "bandara": "Itami",
    "group": "Internasional"
    },
    {
    "code": "MDL",
    "name": "Mandalay (MDL), Myanmar",
    "bandara": "Mandalay",
    "group": "Internasional"
    },
    {
    "code": "HLP",
    "name": "Halim PK (HLP), Jakarta",
    "bandara": "Halim Perdanakusuma",
    "group": "Domestik"
    },
    {
    "code": "MRW",
    "name": "Morowali(MRW)",
    "bandara": "Morowali",
    "group": "Domestik"
    },
    {
    "code": "MOH",
    "name": "Morowali(MOH)",
    "bandara": "Morowali",
    "group": "Domestik"
    },
    {
    "code": "AAP",
    "name": "Samarinda (AAP)",
    "bandara": "Samarinda",
    "group": "Domestik"
    },
    {
    "code": "WMX",
    "name": "Wamena (WMX), Jayawijaya",
    "bandara": "Wamena",
    "group": "Domestik"
    },
    {
    "code": "BDO",
    "name": "Bandung (BDO)",
    "bandara": "Husein Sastranegara",
    "group": "Domestik"
    },
    {
    "code": "WGP",
    "name": "Waingapu (WGP), Sumba Timur",
    "bandara": "Umbu Mehang Kunda",
    "group": "Domestik"
    },
    {
    "code": "YKR",
    "name": "Selayar (YKR)",
    "bandara": "Aroepala",
    "group": "Domestik"
    },
    {
    "code": "PLW",
    "name": "Palu (PLW)",
    "bandara": "Mutiara SIS Al-Jufrie",
    "group": "Domestik"
    },
    {
    "code": "WUB",
    "name": "Buli (WUB), Halmahera Timur",
    "bandara": "Buli",
    "group": "Domestik"
    },
    {
    "code": "TIM",
    "name": "Timika (TIM), Mimika",
    "bandara": "Mozes Kilangin",
    "group": "Domestik"
    },
    {
    "code": "TAC",
    "name": "Tacloban (TAC), Philippines",
    "bandara": "Daniel Z. Romualdez",
    "group": "Internasional"
    },
    {
    "code": "SNO",
    "name": "Sakon Nakhon (SNO), Thailand",
    "bandara": "Sakon Nakhon",
    "group": "Internasional"
    },
    {
    "code": "NAW",
    "name": "Narathiwat (NAW), Thailand",
    "bandara": "Narathiwat",
    "group": "Internasional"
    },
    {
    "code": "BTW",
    "name": "BATU LICIN (BTW)",
    "bandara": "Bersujud",
    "group": "Domestik"
    },
    {
    "code": "DOB",
    "name": "Dobo (DOB)",
    "bandara": "Dobo",
    "group": "Domestik"
    },
    {
    "code": "PSU",
    "name": "Putussibau (PSU), Kapuas Hulu",
    "bandara": "Pangsuma",
    "group": "Domestik"
    },
    {
    "code": "PNK",
    "name": "Pontianak (PNK)",
    "bandara": "Supadio",
    "group": "Domestik"
    },
    {
    "code": "AEG",
    "name": "Tapanuli Selatan(AEG)",
    "bandara": "AEK GODANG",
    "group": "Domestik"
    },
    {
    "code": "SNB",
    "name": "Sinabang (SNB)",
    "bandara": "Sinabang",
    "group": "Domestik"
    },
    {
    "code": "TXE",
    "name": "Takengon (TXE)",
    "bandara": "Rembele/Takengon",
    "group": "Domestik"
    },
    {
    "code": "SUB",
    "name": "Surabaya (SUB)",
    "bandara": "Juanda",
    "group": "Domestik"
    },
    {
    "code": "TGK",
    "name": "Lampung (TGK)",
    "bandara": "Lampung",
    "group": "Domestik"
    },
    {
    "code": "CPF",
    "name": "Cepu (CPF)",
    "bandara": "Cepu",
    "group": "Domestik"
    },
    {
    "code": "PWL",
    "name": "Purbalingga (PWL)",
    "bandara": "Jenderal Besar Soedirman",
    "group": "Domestik"
    },
    {
    "code": "MLK",
    "name": "Melak (MLK), Kutai Barat",
    "bandara": "Melalan",
    "group": "Domestik"
    },
    {
    "code": "RTI",
    "name": "Rote (RTI)",
    "bandara": "Roti",
    "group": "Domestik"
    },
    {
    "code": "NAH",
    "name": "Tahuna (NAH), Kep Sangihe",
    "bandara": "Naha",
    "group": "Domestik"
    },
    {
    "code": "PKY",
    "name": "Palangkaraya (PKY)",
    "bandara": "Tjilik Riwut",
    "group": "Domestik"
    },
    {
    "code": "RJM",
    "name": "Raja Ampat (RJM)",
    "bandara": "Marinda",
    "group": "Domestik"
    },
    {
    "code": "KOE",
    "name": "Kupang (KOE)",
    "bandara": "El Tari",
    "group": "Domestik"
    },
    {
    "code": "JBB",
    "name": "Jember (JBB)",
    "bandara": "Notohadinegoro",
    "group": "Domestik"
    },
    {
    "code": "KDI",
    "name": "Kendari (KDI)",
    "bandara": "Haluoleo",
    "group": "Domestik"
    },
    {
    "code": "JOG",
    "name": "Yogyakarta (JOG)",
    "bandara": "Adisutjipto",
    "group": "Domestik"
    },
    {
    "code": "YIA",
    "name": "Yogyakarta (YIA)",
    "bandara": "Kulon Progo",
    "group": "Domestik"
    },
    {
    "code": "SRG",
    "name": "Semarang (SRG)",
    "bandara": "Ahmad Yani",
    "group": "Domestik"
    },
    {
    "code": "CKG",
    "name": "Chongqing (CKG), China",
    "bandara": "Jiangbei",
    "group": "Internasional"
    },
    {
    "code": "TWU",
    "name": "Tawau (TWU), Malaysia",
    "bandara": "Tawau",
    "group": "Internasional"
    },
    {
    "code": "TAK",
    "name": "Takamatsu (TAK), Japan",
    "bandara": "Takamatsu",
    "group": "Internasional"
    },
    {
    "code": "CTS",
    "name": "Sapporo (CTS), Japan",
    "bandara": "New Chitose",
    "group": "Internasional"
    },
    {
    "code": "NNT",
    "name": "Nan (NNT), Thailand",
    "bandara": "Nan Nakhon",
    "group": "Internasional"
    },
    {
    "code": "SDK",
    "name": "Sandakan (SDK), Malaysia",
    "bandara": "Sandakan",
    "group": "Internasional"
    },
    {
    "code": "TST",
    "name": "Trang (TST), Thailand",
    "bandara": "Trang",
    "group": "Internasional"
    },
    {
    "code": "AOR",
    "name": "Alor Setar (AOR), Malaysia",
    "bandara": "Sultan Abdul Halim",
    "group": "Internasional"
    },
    {
    "code": "ATH",
    "name": "Athens (ATH), Greece",
    "bandara": "Eleftherios Venizelos Intl",
    "group": "Internasional"
    },
    {
    "code": "BAH",
    "name": "Bahrain (BAH)",
    "bandara": "Bahrain Intl",
    "group": "Internasional"
    },
    {
    "code": "HKG",
    "name": "Hong Kong (HKG)",
    "bandara": "Hong Kong Intl",
    "group": "Internasional"
    },
    {
    "code": "SDJ",
    "name": "Sendai (SDJ), Japan",
    "bandara": "Sendai",
    "group": "Internasional"
    },
    {
    "code": "PEK",
    "name": "Beijing (PEK), China",
    "bandara": "Capital Intl",
    "group": "Internasional"
    },
    {
    "code": "LOE",
    "name": "Loei (LOE), Thailand",
    "bandara": "Loei",
    "group": "Internasional"
    },
    {
    "code": "KOP",
    "name": "Nakhon Phanom (KOP), Thailand",
    "bandara": "Nakhon Phanom",
    "group": "Internasional"
    },
    {
    "code": "NST",
    "name": "Nakhon Si Thammarat (NST), Thailand",
    "bandara": "Nakhon Si Thammarat",
    "group": "Internasional"
    },
    {
    "code": "ROI",
    "name": "Roi Et (ROI), Thailand",
    "bandara": "Roi Et",
    "group": "Internasional"
    },
    {
    "code": "TAG",
    "name": "Tagbilaran (TAG), Philippines",
    "bandara": "Tagbilaran",
    "group": "Internasional"
    },
    {
    "code": "BWN",
    "name": "Brunei (BWN), Brunei",
    "bandara": "Brunei Intl",
    "group": "Internasional"
    },
    {
    "code": "BRU",
    "name": "Brussels (BRU), Belgium",
    "bandara": "Brussels Natl",
    "group": "Internasional"
    },
    {
    "code": "PUS",
    "name": "Busan (PUS), South Korea",
    "bandara": "Gimhae Intl",
    "group": "Internasional"
    },
    {
    "code": "UBP",
    "name": "Ubon Ratchathani (UBP), Thailand",
    "bandara": "Ubon Ratchathani",
    "group": "Internasional"
    },
    {
    "code": "CGP",
    "name": "Chittagong (CGP), Bangladesh",
    "bandara": "Shah Amanat Intl",
    "group": "Internasional"
    },
    {
    "code": "FUK",
    "name": "Fukuoka (FUK), Japan",
    "bandara": "Fukuoka",
    "group": "Internasional"
    },
    {
    "code": "KMQ",
    "name": "Komatsu (KMQ), Japan",
    "bandara": "Komatsu",
    "group": "Internasional"
    },
    {
    "code": "MYY",
    "name": "Miri (MYY), Malaysia",
    "bandara": "Miri",
    "group": "Internasional"
    },
    {
    "code": "PNQ",
    "name": "Pune (PNQ), India",
    "bandara": "Pune",
    "group": "Internasional"
    },
    {
    "code": "PPS",
    "name": "Puerto Princesa (PPS), Philippines",
    "bandara": "Puerto Princesa",
    "group": "Internasional"
    },
    {
    "code": "BCN",
    "name": "Barcelona (BCN), Spain",
    "bandara": "Barcelona El Prat",
    "group": "Internasional"
    },
    {
    "code": "HHQ",
    "name": "Huahin (HHQ), Thailand",
    "bandara": "Hua Hin",
    "group": "Internasional"
    },
    {
    "code": "FCO",
    "name": "Rome (FCO), Italy",
    "bandara": "Leonardo da Vinci–Fiumicino",
    "group": "Internasional"
    },
    {
    "code": "CGK",
    "name": "Jakarta (CGK)",
    "bandara": "Soekarno - Hatta",
    "group": "Domestik"
    },
    {
    "code": "PCB",
    "name": "Pondok Cabe (PCB)",
    "bandara": "Pondok Cabe",
    "group": "Domestik"
    },
    {
    "code": "DPS",
    "name": "Denpasar (DPS)",
    "bandara": "Ngurah Rai",
    "group": "Domestik"
    },
    {
    "code": "KRC",
    "name": "Kerinci (KRC)",
    "bandara": "Depati Parbo",
    "group": "Domestik"
    },
    {
    "code": "ABU",
    "name": "Atambua (ABU), Belu",
    "bandara": "AA Bere Tallo",
    "group": "Domestik"
    },
    {
    "code": "OKL",
    "name": "OKSIBIL(OKL)",
    "bandara": "Oksibil",
    "group": "Domestik"
    },
    {
    "code": "DEX",
    "name": "DEKAI(DEX)",
    "bandara": "Dekai",
    "group": "Domestik"
    },
    {
    "code": "PDG",
    "name": "Padang (PDG)",
    "bandara": "Minangkabau",
    "group": "Domestik"
    },
    {
    "code": "EWE",
    "name": "Ewer (EWE), Asmat",
    "bandara": "Ewer",
    "group": "Domestik"
    },
    {
    "code": "MDC",
    "name": "Manado (MDC)",
    "bandara": "Sam Ratulangi",
    "group": "Domestik"
    },
    {
    "code": "SOQ",
    "name": "Sorong (SOQ)",
    "bandara": "Domine Eduard Osok",
    "group": "Domestik"
    },
    {
    "code": "LLO",
    "name": "PALOPO (LLO)",
    "bandara": "Lagaligo",
    "group": "Domestik"
    },
    {
    "code": "TKG",
    "name": "Bandar Lampung (TKG)",
    "bandara": "Radin Inten II",
    "group": "Domestik"
    },
    {
    "code": "JED",
    "name": "Jeddah (JED), Saudi Arabia",
    "bandara": "King Abdulaziz",
    "group": "Internasional"
    },
    {
    "code": "KUA",
    "name": "Kuantan (KUA), Malaysia",
    "bandara": "Sultan Haji Ahmad Shah",
    "group": "Internasional"
    },
    {
    "code": "KTE",
    "name": "Kerteh (KTE), Malaysia",
    "bandara": "Kerteh",
    "group": "Internasional"
    },
    {
    "code": "NKM",
    "name": "Nagoya (NKM), Japan",
    "bandara": "Nagoya Airfield",
    "group": "Internasional"
    },
    {
    "code": "CAN",
    "name": "Guangzhou (CAN), China",
    "bandara": "Guangzhou Baiyun Intl",
    "group": "Internasional"
    },
    {
    "code": "REP",
    "name": "Siem Reap (REP), Cambodia",
    "bandara": "Siem Reap",
    "group": "Internasional"
    },
    {
    "code": "WUX",
    "name": "Wuxi (WUX), China",
    "bandara": "Sunan Shuofang",
    "group": "Internasional"
    },
    {
    "code": "WUH",
    "name": "Wuhan (WUH), China",
    "bandara": "Wuhan Tianhe",
    "group": "Internasional"
    },
    {
    "code": "DMK",
    "name": "Bangkok Don Mueang (DMK), Thailand",
    "bandara": "Don Mueang Intl",
    "group": "Internasional"
    },
    {
    "code": "VTZ",
    "name": "Visakhapatnam (VTZ), India",
    "bandara": "Visakhapatnam",
    "group": "Internasional"
    },
    {
    "code": "FRA",
    "name": "Frankfurt (FRA), Germany",
    "bandara": "Frankfurt",
    "group": "Internasional"
    },
    {
    "code": "IST",
    "name": "Istanbul (IST), Turkey",
    "bandara": "Istanbul Atatürk",
    "group": "Internasional"
    },
    {
    "code": "CEB",
    "name": "Cebu (CEB), Philippines",
    "bandara": "Mactan Cebu Intl",
    "group": "Internasional"
    },
    {
    "code": "ORD",
    "name": "Chicago (ORD), USA",
    "bandara": "Chicago Ohare Intl",
    "group": "Internasional"
    },
    {
    "code": "VCE",
    "name": "Venice (VCE), Italy",
    "bandara": "Venice Marco Polo",
    "group": "Internasional"
    },
    {
    "code": "BLR",
    "name": "Bengaluru (BLR), India",
    "bandara": "Bangalore",
    "group": "Internasional"
    },
    {
    "code": "CRK",
    "name": "Clark (CRK), Philippines",
    "bandara": "Diosdado Macapagal Intl",
    "group": "Internasional"
    },
    {
    "code": "IMF",
    "name": "Imphal (IMF), India",
    "bandara": "Imphal Intl",
    "group": "Internasional"
    },
    {
    "code": "UTH",
    "name": "Udon Thani (UTH), Thailand",
    "bandara": "Udon Thani",
    "group": "Internasional"
    },
    {
    "code": "DAC",
    "name": "Dhaka (DAC), Bangladesh",
    "bandara": "Zia Intl",
    "group": "Internasional"
    },
    {
    "code": "USM",
    "name": "Koh Samui (USM), Thailand",
    "bandara": "Samui",
    "group": "Internasional"
    },
    {
    "code": "HAN",
    "name": "Hanoi (HAN), Vietnam",
    "bandara": "Noi Bai Intl",
    "group": "Internasional"
    },
    {
    "code": "UTP",
    "name": "Pattaya (UTP), Thailand",
    "bandara": "U-Tapao",
    "group": "Internasional"
    },
    {
    "code": "LPT",
    "name": "Lampang (LPT), Thailand",
    "bandara": "Lampang",
    "group": "Internasional"
    },
    {
    "code": "MFM",
    "name": "Macau (MFM)",
    "bandara": "Macau",
    "group": "Internasional"
    },
    {
    "code": "ORY",
    "name": "Paris Orly (ORY), France",
    "bandara": "Paris Orly",
    "group": "Internasional"
    },
    {
    "code": "OOL",
    "name": "Gold Coast (OOL), Australia",
    "bandara": "Gold Coast Intl",
    "group": "Internasional"
    },
    {
    "code": "TXL",
    "name": "Berlin (TXL), Germany",
    "bandara": "Tegel",
    "group": "Internasional"
    },
    {
    "code": "HAK",
    "name": "Haikou (HAK), China",
    "bandara": "Meilan",
    "group": "Internasional"
    },
    {
    "code": "HDY",
    "name": "Hat Yai (HDY), Thailand",
    "bandara": "Hat Yai Intl",
    "group": "Internasional"
    },
    {
    "code": "JHB",
    "name": "Johor Bahru (JHB), Malaysia",
    "bandara": "Senai",
    "group": "Internasional"
    },
    {
    "code": "KLO",
    "name": "Kalibo (KLO), Philippines",
    "bandara": "Kalibo",
    "group": "Internasional"
    },
    {
    "code": "XMN",
    "name": "Xiamen (XMN), China",
    "bandara": "Xiamen Gaoqi",
    "group": "Internasional"
    },
    {
    "code": "CDG",
    "name": "Paris Charles DG (CDG), France",
    "bandara": "Charles de Gaulle",
    "group": "Internasional"
    },
    {
    "code": "CEI",
    "name": "Chiang Rai (CEI), Thailand",
    "bandara": "Chiang Rai Intl",
    "group": "Internasional"
    },
    {
    "code": "VTE",
    "name": "Vientiane (VTE), Laos",
    "bandara": "Wattay",
    "group": "Internasional"
    },
    {
    "code": "ARN",
    "name": "Stockholm (ARN), Sweden",
    "bandara": "Stockholm Arlanda",
    "group": "Internasional"
    },
    {
    "code": "SVO",
    "name": "Moscow Sheremetyevo (SVO), Russia",
    "bandara": "Sheremetyevo",
    "group": "Internasional"
    },
    {
    "code": "SZX",
    "name": "Shenzhen (SZX), China",
    "bandara": "Shenzhen Baoan",
    "group": "Internasional"
    },
    {
    "code": "SQG",
    "name": "Sintang (SQG)",
    "bandara": "Sintang",
    "group": "Domestik"
    },
    {
    "code": "KNG",
    "name": "Kaimana (KNG)",
    "bandara": "Kaimana",
    "group": "Domestik"
    },
    {
    "code": "BPN",
    "name": "Balikpapan (BPN)",
    "bandara": "Sepinggan",
    "group": "Domestik"
    },
    {
    "code": "MOF",
    "name": "Maumere (MOF), Sikka",
    "bandara": "Frans Xavier Seda",
    "group": "Domestik"
    },
    {
    "code": "PKU",
    "name": "Pekanbaru (PKU)",
    "bandara": "Sultan Syarif Kasim II",
    "group": "Domestik"
    },
    {
    "code": "PLM",
    "name": "Palembang (PLM)",
    "bandara": "Sultan Mahmud Badaruddin II",
    "group": "Domestik"
    },
    {
    "code": "COK",
    "name": "Kochi (COK), India",
    "bandara": "Cochin",
    "group": "Internasional"
    },
    {
    "code": "DIL",
    "name": "Dili (DIL), Timor Leste",
    "bandara": "Presidente Nicolau Lobato Intl",
    "group": "Internasional"
    },
    {
    "code": "DRW",
    "name": "Darwin (DRW), Australia",
    "bandara": "Darwin Intl",
    "group": "Internasional"
    },
    {
    "code": "CGY",
    "name": "Cagayan de Oro (CGY), Philippines",
    "bandara": "Laguindingan Intl",
    "group": "Internasional"
    },
    {
    "code": "VII",
    "name": "Vinh (VII), Vietnam",
    "bandara": "Vinh",
    "group": "Internasional"
    },
    {
    "code": "MAD",
    "name": "Madrid (MAD), Spain",
    "bandara": "Adolfo Suárez Madrid–Barajas",
    "group": "Internasional"
    },
    {
    "code": "KCH",
    "name": "Kuching (KCH), Malaysia",
    "bandara": "Kuching",
    "group": "Internasional"
    },
    {
    "code": "MUC",
    "name": "Munich (MUC), Germany",
    "bandara": "Munich",
    "group": "Internasional"
    },
    {
    "code": "MCT",
    "name": "Muscat (MCT), Oman",
    "bandara": "Muscat",
    "group": "Internasional"
    },
    {
    "code": "SLL",
    "name": "Salalah (SLL), Oman",
    "bandara": "Salalah",
    "group": "Internasional"
    },
    {
    "code": "DUB",
    "name": "Dublin (DUB), Ireland",
    "bandara": "Dublin",
    "group": "Internasional"
    },
    {
    "code": "CMB",
    "name": "Colombo (CMB), Sri Lanka",
    "bandara": "Bandaranaike Intl Colombo",
    "group": "Internasional"
    },
    {
    "code": "CPH",
    "name": "Copenhagen (CPH), Denmark",
    "bandara": "Kastrup",
    "group": "Internasional"
    },
    {
    "code": "DAD",
    "name": "Da Nang (DAD), Vietnam",
    "bandara": "Da Nang",
    "group": "Internasional"
    },
    {
    "code": "CTU",
    "name": "Chengdu (CTU), China",
    "bandara": "Shuangliu",
    "group": "Internasional"
    },
    {
    "code": "OSL",
    "name": "Oslo (OSL), Norway",
    "bandara": "Oslo , Gardermoen",
    "group": "Internasional"
    },
    {
    "code": "CSX",
    "name": "Changsha (CSX), China",
    "bandara": "Huanghua",
    "group": "Internasional"
    },
    {
    "code": "BTU",
    "name": "Bintulu (BTU), Malaysia",
    "bandara": "Bintulu",
    "group": "Internasional"
    },
    {
    "code": "HGH",
    "name": "Hangzhou (HGH), China",
    "bandara": "Xiaoshan",
    "group": "Internasional"
    },
    {
    "code": "KWL",
    "name": "Guilin (KWL), China",
    "bandara": "Liangjiang",
    "group": "Internasional"
    },
    {
    "code": "DXB",
    "name": "Dubai (DXB), United Arab Emirates",
    "bandara": "Dubai Intl",
    "group": "Internasional"
    },
    {
    "code": "HND",
    "name": "Tokyo Haneda (HND), Japan",
    "bandara": "Haneda",
    "group": "Internasional"
    },
    {
    "code": "IPH",
    "name": "Ipoh (IPH), Malaysia",
    "bandara": "Sultan Azlan Shah",
    "group": "Internasional"
    },
    {
    "code": "KBV",
    "name": "Krabi (KBV), Thailand",
    "bandara": "Krabi",
    "group": "Internasional"
    },
    {
    "code": "LAX",
    "name": "Los Angeles (LAX), USA",
    "bandara": "Los Angeles",
    "group": "Internasional"
    },
    {
    "code": "DEL",
    "name": "New Delhi (DEL), India",
    "bandara": "Indira Gandhi",
    "group": "Internasional"
    },
    {
    "code": "JFK",
    "name": "New York (JFK), USA",
    "bandara": "John F. Kennedy",
    "group": "Internasional"
    },
    {
    "code": "PER",
    "name": "Perth (PER), Australia",
    "bandara": "Perth",
    "group": "Internasional"
    },
    {
    "code": "PEN",
    "name": "Penang (PEN), Malaysia",
    "bandara": "Penang",
    "group": "Internasional"
    },
    {
    "code": "KUL",
    "name": "Kuala Lumpur (KUL), Malaysia",
    "bandara": "Kuala Lumpur",
    "group": "Internasional"
    },
    {
    "code": "SEA",
    "name": "Seattle (SEA), USA",
    "bandara": "Seattle–Tacoma",
    "group": "Internasional"
    },
    {
    "code": "LKO",
    "name": "Lucknow (LKO), India",
    "bandara": "Chaudhary Charan Singh",
    "group": "Internasional"
    },
    {
    "code": "TPE",
    "name": "Taipei (TPE), Taiwan",
    "bandara": "Taiwan Taoyuan",
    "group": "Internasional"
    },
    {
    "code": "TSN",
    "name": "Tianjin (TNA), China",
    "bandara": "Tianjin Binhai",
    "group": "Internasional"
    },
    {
    "code": "LGK",
    "name": "Langkawi (LGK), Malaysia",
    "bandara": "Langkawi",
    "group": "Internasional"
    },
    {
    "code": "NKG",
    "name": "Nanjing (NKG), China",
    "bandara": "Nanjing Lukou",
    "group": "Internasional"
    },
    {
    "code": "LJG",
    "name": "Lijiang (LJG), China",
    "bandara": "Lijiang Sanyi",
    "group": "Internasional"
    },
    {
    "code": "MLE",
    "name": "Male (MLE), Maldives",
    "bandara": "Velana",
    "group": "Internasional"
    },
    {
    "code": "SIN",
    "name": "Singapore (SIN)",
    "bandara": "Singapore Changi",
    "group": "Internasional"
    },
    {
    "code": "LGW",
    "name": "London Gatwick (LGW), United Kingdom",
    "bandara": "Gatwick",
    "group": "Internasional"
    },
    {
    "code": "NNG",
    "name": "Nanning (NNG), China",
    "bandara": "Nanning Wuxu",
    "group": "Internasional"
    },
    {
    "code": "HYD",
    "name": "Hyderabad (HYD), India",
    "bandara": "Rajiv Gandhi Intl",
    "group": "Internasional"
    },
    {
    "code": "SYD",
    "name": "Sydney (SYD), Australia",
    "bandara": "Sydney",
    "group": "Internasional"
    },
    {
    "code": "MNL",
    "name": "Manila (MNL), Philippines",
    "bandara": "Ninoy Aquino",
    "group": "Internasional"
    },
    {
    "code": "TNA",
    "name": "Jinan (TNA), China",
    "bandara": "Jinan Yaoqiang",
    "group": "Internasional"
    },
    {
    "code": "JJN",
    "name": "Jinjiang (JJN), China",
    "bandara": "Quanzhou Jinjiang",
    "group": "Internasional"
    },
    {
    "code": "BOM",
    "name": "Mumbai (BOM), India",
    "bandara": "Chhatrapati Shivaji",
    "group": "Internasional"
    },
    {
    "code": "SFO",
    "name": "San Francisco (SFO), USA",
    "bandara": "San Francisco",
    "group": "Internasional"
    },
    {
    "code": "AUH",
    "name": "Abu Dhabi (AUH), United Arab Emirates",
    "bandara": "Abu Dhabi",
    "group": "Internasional"
    },
    {
    "code": "UOL",
    "name": "Buol (UOL)",
    "bandara": "Pogogul",
    "group": "Domestik"
    },
    {
    "code": "DJJ",
    "name": "Jayapura (DJJ)",
    "bandara": "Sentani",
    "group": "Domestik"
    },
    {
    "code": "TJQ",
    "name": "Tanjung Pandan (TJQ), Belitung",
    "bandara": "H.A.S. Hanandjoeddin",
    "group": "Domestik"
    },
    {
    "code": "PKN",
    "name": "Pangkalanbun (PKN), Kotawaringin Barat",
    "bandara": "Iskandar",
    "group": "Domestik"
    },
    {
    "code": "MKY",
    "name": "Mackay (MKY), Australia",
    "bandara": "Mackay",
    "group": "Internasional"
    },
    {
    "code": "MCY",
    "name": "Sunshine Coast (MCY), Australia",
    "bandara": "Sunshine Coast",
    "group": "Internasional"
    },
    {
    "code": "MYJ",
    "name": "Matsuyama (MYJ), Japan",
    "bandara": "Matsuyama",
    "group": "Internasional"
    },
    {
    "code": "KKC",
    "name": "Khon Kaen (KKC), Thailand",
    "bandara": "Khon Kaen",
    "group": "Internasional"
    },
    {
    "code": "PMR",
    "name": "Palmerston North (PMR), New Zealand",
    "bandara": "Palmerston North",
    "group": "Internasional"
    },
    {
    "code": "HIS",
    "name": "Hayman Island (HIS), Australia",
    "bandara": "",
    "group": "Internasional"
    },
    {
    "code": "AVV",
    "name": "Melbourne Avalon (AVV), Australia",
    "bandara": "Avalon",
    "group": "Internasional"
    },
    {
    "code": "NAN",
    "name": "Nadi (NAN), Fiji",
    "bandara": "Nadi",
    "group": "Internasional"
    },
    {
    "code": "SWA",
    "name": "Shantou (SWA), China",
    "bandara": "Shantou Waisha",
    "group": "Internasional"
    },
    {
    "code": "CCU",
    "name": "Kolkata (CCU), India",
    "bandara": "Netaji Subhas Chandra Bose",
    "group": "Internasional"
    },
    {
    "code": "MKZ",
    "name": "Malacca (MKZ), Malaysia",
    "bandara": "Malacca",
    "group": "Internasional"
    },
    {
    "code": "URT",
    "name": "Surat Thani (URT), Thailand",
    "bandara": "Surat Thani",
    "group": "Internasional"
    },
    {
    "code": "SZB",
    "name": "Subang (SZB), Malaysia",
    "bandara": "Sultan Abdul Aziz Shah",
    "group": "Internasional"
    },
    {
    "code": "MXP",
    "name": "Milan (MXP), Italy",
    "bandara": "Milan–Malpensa",
    "group": "Internasional"
    },
    {
    "code": "DME",
    "name": "Moscow Domodedovo (DME), Russia",
    "bandara": "Domodedovo",
    "group": "Internasional"
    },
    {
    "code": "UIH",
    "name": "Quy Nhon (UIH), Vietnam",
    "bandara": "Phu Cat",
    "group": "Internasional"
    },
    {
    "code": "KHN",
    "name": "Nanchang (KHN), China",
    "bandara": "Nanchang Changbei",
    "group": "Internasional"
    },
    {
    "code": "CXR",
    "name": "Nha Trang (CXR), Vietnam",
    "bandara": "Cam Ranh",
    "group": "Internasional"
    },
    {
    "code": "PXU",
    "name": "Pleiku (PXU), Vietnam",
    "bandara": "Pleiku",
    "group": "Internasional"
    },
    {
    "code": "PNH",
    "name": "Phnom Penh (PNH), Cambodia",
    "bandara": "Phnom Penh",
    "group": "Internasional"
    },
    {
    "code": "OIT",
    "name": "Oita (OIT), Japan",
    "bandara": "Oita",
    "group": "Internasional"
    },
    {
    "code": "ADL",
    "name": "Adelaide (ADL), Australia",
    "bandara": "Adelaide",
    "group": "Internasional"
    },
    {
    "code": "AMS",
    "name": "Amsterdam (AMS), Netherlands",
    "bandara": "Schiphol",
    "group": "Internasional"
    },
    {
    "code": "BNK",
    "name": "Ballina Byron (BNK), Australia",
    "bandara": "Ballina Byron Gateway",
    "group": "Internasional"
    },
    {
    "code": "BKK",
    "name": "Bangkok (BKK), Thailand",
    "bandara": "Suvarnabhumi Intl",
    "group": "Internasional"
    },
    {
    "code": "BNE",
    "name": "Brisbane (BNE), Australia",
    "bandara": "Brisbane Intl",
    "group": "Internasional"
    },
    {
    "code": "CNS",
    "name": "Cairns (CNS), Australia",
    "bandara": "Cairns Intl",
    "group": "Internasional"
    },
    {
    "code": "CAI",
    "name": "Cairo (CAI), Egypt",
    "bandara": "Cairo Intl",
    "group": "Internasional"
    },
    {
    "code": "CBR",
    "name": "Canberra (CBR), Australia",
    "bandara": "Canberra",
    "group": "Internasional"
    },
    {
    "code": "CNX",
    "name": "Chiang Mai (CNX), Thailand",
    "bandara": "Chiang Mai Intl",
    "group": "Internasional"
    },
    {
    "code": "DYG",
    "name": "Zhangjiajie (DYG), China",
    "bandara": "Zhangjiajie Hehua",
    "group": "Internasional"
    },
    {
    "code": "KHH",
    "name": "Kaohsiung (KHH), Taiwan",
    "bandara": "Kaohsiung",
    "group": "Internasional"
    },
    {
    "code": "XIY",
    "name": "Xian (XIY), China",
    "bandara": "Xian Xianyang",
    "group": "Internasional"
    },
    {
    "code": "LHR",
    "name": "London Heathrow (LHR), United Kingdom",
    "bandara": "Heathrow",
    "group": "Internasional"
    },
    {
    "code": "MEL",
    "name": "Melbourne (MEL), Australia",
    "bandara": "Melbourne",
    "group": "Internasional"
    },
    {
    "code": "SHE",
    "name": "Shenyang (SHE), China",
    "bandara": "Shenyang Taoxian",
    "group": "Internasional"
    },
    {
    "code": "GNS",
    "name": "Nias (GNS), Gunungsitoli",
    "bandara": "Binaka",
    "group": "Domestik"
    },
    {
    "code": "NGB",
    "name": "Ningbo (NGB), China",
    "bandara": "Ningbo Lishe",
    "group": "Internasional"
    },
    {
    "code": "HKT",
    "name": "Phuket (HKT), Thailand",
    "bandara": "Phuket",
    "group": "Internasional"
    },
    {
    "code": "MAA",
    "name": "Chennai (MAA), India",
    "bandara": "Chennai Intl",
    "group": "Internasional"
    },
    {
    "code": "GOI",
    "name": "Goa (GOI), India",
    "bandara": "Goa Intl",
    "group": "Internasional"
    },
    {
    "code": "JAI",
    "name": "Jaipur (JAI), India",
    "bandara": "Jaipur Intl",
    "group": "Internasional"
    },
    {
    "code": "AKL",
    "name": "Auckland (AKL), New Zealand",
    "bandara": "Auckland Intl",
    "group": "Internasional"
    },
    {
    "code": "VCL",
    "name": "Chu Lai (VCL), Vietnam",
    "bandara": "Chu Lai",
    "group": "Internasional"
    },
    {
    "code": "DLI",
    "name": "Da Lat (DLI), Vietnam",
    "bandara": "Dalat",
    "group": "Internasional"
    },
    {
    "code": "NGO",
    "name": "Nagoya (NGO), Japan",
    "bandara": "Chubu Centrair",
    "group": "Internasional"
    },
    {
    "code": "NPE",
    "name": "Napier (NPE), New Zealand",
    "bandara": "Hawkes Bay",
    "group": "Internasional"
    },
    {
    "code": "VDH",
    "name": "Dong Hoi (VDH), Vietnam",
    "bandara": "Dong Hoi",
    "group": "Internasional"
    },
    {
    "code": "ZQN",
    "name": "Queenstown (ZQN), New Zealand",
    "bandara": "Queenstown",
    "group": "Internasional"
    },
    {
    "code": "RAR",
    "name": "Rarotonga (RAR), Cook Islands",
    "bandara": "Rarotonga",
    "group": "Internasional"
    },
    {
    "code": "DUD",
    "name": "Dunedin (DUD), New Zealand",
    "bandara": "Dunedin",
    "group": "Internasional"
    },
    {
    "code": "HUI",
    "name": "Hue (HUI), Vietnam",
    "bandara": "Phu Bai",
    "group": "Internasional"
    },
    {
    "code": "HPH",
    "name": "Hai Phong (HPH), Vietnam",
    "bandara": "Cat Bi Intl",
    "group": "Internasional"
    },
    {
    "code": "BMV",
    "name": "Buon Ma Thuot (BMV), Vietnam",
    "bandara": "Buon Ma Thuot",
    "group": "Internasional"
    },
    {
    "code": "CHC",
    "name": "Christchurch (CHC), New Zealand",
    "bandara": "Christchurch Intl",
    "group": "Internasional"
    },
    {
    "code": "NSN",
    "name": "Nelson (NSN), New Zealand",
    "bandara": "Nelson",
    "group": "Internasional"
    },
    {
    "code": "NTL",
    "name": "Newcastle (NTL), Australia",
    "bandara": "Newcastle",
    "group": "Internasional"
    },
    {
    "code": "NPL",
    "name": "New Plymouth (NPL), New Zealand",
    "bandara": "New Plymouth",
    "group": "Internasional"
    },
    {
    "code": "PPP",
    "name": "Proserpine (PPP), Australia",
    "bandara": "Whitsunday Coast",
    "group": "Internasional"
    },
    {
    "code": "OKA",
    "name": "Okinawa (OKA), Japan",
    "bandara": "Naha",
    "group": "Internasional"
    },
    {
    "code": "HTI",
    "name": "Hamilton Island (HTI), Australia",
    "bandara": "Great Barrier R",
    "group": "Internasional"
    },
    {
    "code": "HBA",
    "name": "Hobart (HBA), Australia",
    "bandara": "Hobart",
    "group": "Internasional"
    },
    {
    "code": "SGN",
    "name": "Ho Chi Minh (SGN), Vietnam",
    "bandara": "Tansonnhat Intl",
    "group": "Internasional"
    },
    {
    "code": "HNL",
    "name": "Honolulu (HNL), USA",
    "bandara": "Honolulu Intl",
    "group": "Internasional"
    },
    {
    "code": "KOJ",
    "name": "Kagoshima (KOJ), Japan",
    "bandara": "Kagoshima",
    "group": "Internasional"
    },
    {
    "code": "RGN",
    "name": "Yangon (RGN), Myanmar",
    "bandara": "Yangon",
    "group": "Internasional"
    },
    {
    "code": "LBJ",
    "name": "Labuan Bajo (LBJ), Manggarai Barat",
    "bandara": "Komodo",
    "group": "Domestik"
    },
    {
    "code": "LWE",
    "name": "Lewoleba (LWE), Lembata",
    "bandara": "Wonopito",
    "group": "Domestik"
    },
    {
    "code": "LKI",
    "name": "Simeulue (LKI)",
    "bandara": "Sinabang",
    "group": "Domestik"
    },
    {
    "code": "LLJ",
    "name": "Lubuklinggau (LLJ)",
    "bandara": "Silampari",
    "group": "Domestik"
    },
    {
    "code": "TMC",
    "name": "Tambolaka (TMC), Sumba Barat Daya",
    "bandara": "Tambolaka",
    "group": "Domestik"
    },
    {
    "code": "UPG",
    "name": "Makassar (UPG)",
    "bandara": "Sultan Hasanuddin",
    "group": "Domestik"
    },
    {
    "code": "MLG",
    "name": "Malang (MLG)",
    "bandara": "Abdul Rachman Saleh",
    "group": "Domestik"
    },
    {
    "code": "LNU",
    "name": "Malinau (LNU)",
    "bandara": "Robert Atty Bessing",
    "group": "Domestik"
    },
    {
    "code": "MJU",
    "name": "Mamuju (MJU)",
    "bandara": "Tampa Padang",
    "group": "Domestik"
    },
    {
    "code": "MKW",
    "name": "Manokwari (MKW)",
    "bandara": "Rendani",
    "group": "Domestik"
    },
    {
    "code": "MWK",
    "name": "Matak (MWK), Kep Anambas",
    "bandara": "Matak",
    "group": "Domestik"
    },
    {
    "code": "MKQ",
    "name": "Merauke (MKQ)",
    "bandara": "Mopah",
    "group": "Domestik"
    },
    {
    "code": "MEQ",
    "name": "Meulaboh (MEQ)",
    "bandara": "Cut Nyak Dhien",
    "group": "Domestik"
    },
    {
    "code": "DTB",
    "name": "Silangit (DTB), Tapanuli Utara",
    "bandara": "Silangit",
    "group": "Domestik"
    },
    {
    "code": "NBX",
    "name": "Nabire (NBX)",
    "bandara": "Nabire",
    "group": "Domestik"
    },
    {
    "code": "NTX",
    "name": "Natuna (NTX)",
    "bandara": "Ranai",
    "group": "Domestik"
    },
    {
    "code": "SMQ",
    "name": "Sampit (SMQ)",
    "bandara": "H. Asan",
    "group": "Domestik"
    },
    {
    "code": "NNX",
    "name": "Nunukan (NNX)",
    "bandara": "Nunukan",
    "group": "Domestik"
    },
    {
    "code": "PSJ",
    "name": "Poso (PSJ)",
    "bandara": "Kasiguncu",
    "group": "Domestik"
    },
    {
    "code": "PXA",
    "name": "Pagar Alam (PXA)",
    "bandara": "Atung Bungsu",
    "group": "Domestik"
    },
    {
    "code": "PGK",
    "name": "Pangkalpinang (PGK)",
    "bandara": "Depati Amir",
    "group": "Domestik"
    },
    {
    "code": "PTW",
    "name": "Potowaiburu (PTW), Mimika",
    "bandara": "Patowai",
    "group": "Domestik"
    },
    {
    "code": "BIL",
    "name": "Bilogai (BIL), Intan Jaya",
    "bandara": "Billund",
    "group": "Domestik"
    },
    {
    "code": "ARD",
    "name": "Alor (ARD)",
    "bandara": "Alor Island",
    "group": "Domestik"
    },
    {
    "code": "ICN",
    "name": "Seoul (ICN), South Korea",
    "bandara": "Incheon",
    "group": "Internasional"
    },
    {
    "code": "NBO",
    "name": "Nairobi (NBO), Kenya",
    "bandara": "Jomo Kenyatta",
    "group": "Internasional"
    },
    {
    "code": "TAO",
    "name": "Qingdao (TAO), China",
    "bandara": "Qingdao Liuting",
    "group": "Internasional"
    },
    {
    "code": "WLG",
    "name": "Wellington (WLG), New Zealand",
    "bandara": "Wellington",
    "group": "Internasional"
    },
    {
    "code": "AYQ",
    "name": "Uluru (AYQ), Australia",
    "bandara": "Ayers Rock",
    "group": "Internasional"
    },
    {
    "code": "TSV",
    "name": "Townsville (TSV), Australia",
    "bandara": "Townsville",
    "group": "Internasional"
    },
    {
    "code": "NRT",
    "name": "Tokyo Narita (NRT), Japan",
    "bandara": "Narita",
    "group": "Internasional"
    },
    {
    "code": "KMJ",
    "name": "Kumamoto (KMJ), Japan",
    "bandara": "Kumamoto",
    "group": "Internasional"
    },
    {
    "code": "LST",
    "name": "Launceston (LST), Australia",
    "bandara": "Launceston",
    "group": "Internasional"
    },
    {
    "code": "PQC",
    "name": "Phu Quoc (PQC), Vietnam",
    "bandara": "Phu Quoc",
    "group": "Internasional"
    },
    {
    "code": "KIX",
    "name": "Osaka Kansai (KIX), Japan",
    "bandara": "Kansai",
    "group": "Internasional"
    },
    {
    "code": "LUV",
    "name": "Tual (LUV)",
    "bandara": "Dumatubun",
    "group": "Domestik"
    },
    {
    "code": "BUA",
    "name": "PALOPO",
    "bandara": "Bua",
    "group": "Domestik"
    },
    {
    "code": "IAD",
    "name": "Washington D.C",
    "bandara": "Washington Dulles",
    "group": "Internasional"
    },
    {
    "code": "KSR",
    "name": "Selayar (KSR)",
    "bandara": "Aroepala",
    "group": "Domestik"
    },
    {
    "code": "KJT",
    "name": "Kertajati Majalengka(KJT)",
    "bandara": "Majalengka",
    "group": "Domestik"
    },
    {
    "code": "MPC",
    "name": "Mukomuko (MPC)",
    "bandara": "Mukomuko",
    "group": "Domestik"
    },
    {
    "code": "TSY",
    "name": "Tasikmalaya (TSY)",
    "bandara": "Tasikmalaya",
    "group": "Domestik"
    },
    {
    "code": "KWB",
    "name": "Dewandaru Karimunjawa(KWB)",
    "bandara": "Karimunjawa",
    "group": "Domestik"
    },
    {
    "code": "LMU",
    "name": "Letung Anambas(LMU)",
    "bandara": "Anambas",
    "group": "Domestik"
    },
    {
    "code": "RGT",
    "name": "Japura Rengat(RGT)",
    "bandara": "Rengat Riau",
    "group": "Domestik"
    },
    {
    "code": "TFY",
    "name": "Lampung Pekon Serai(TFY)",
    "bandara": "M Taufik Kiemas",
    "group": "Domestik"
    },
    {
    "code": "TRT",
    "name": "Tana Toraja(TRT)",
    "bandara": "Tana Toraja",
    "group": "Domestik"
    }
    ]

module.exports = airportList;