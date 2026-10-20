export const productCategories = [
  {
    id: "software-productivity",
    name: "Software & Productivity",
    nameBn: "সফটওয়্যার ও প্রোডাক্টিভিটি",
    icon: "Layers",
    color: "from-blue-500 to-cyan-500",
    description: "Essential genuine operating systems, office suites, and everyday tools."
  },
  {
    id: "design-engineering",
    name: "Design & Engineering",
    nameBn: "ডিজাইন ও ইঞ্জিনিয়ারিং",
    icon: "Compass",
    color: "from-cyan-500 to-emerald-500",
    description: "Industry-standard CAD, 3D animation, and architectural software."
  },
  {
    id: "business-cloud",
    name: "Business & Cloud",
    nameBn: "বিজনেস ও ক্লাউড",
    icon: "Briefcase",
    color: "from-indigo-500 to-blue-500",
    description: "Cloud collaboration, email services, and enterprise management."
  },
  {
    id: "ai-digital",
    name: "AI & Digital Tools",
    nameBn: "এআই ও ডিজিটাল টুলস",
    icon: "Sparkles",
    color: "from-purple-500 to-pink-500",
    description: "Cutting-edge artificial intelligence, design, and automation tools."
  },
  {
    id: "security-protection",
    name: "Security & Protection",
    nameBn: "সিকিউরিটি ও প্রটেকশন",
    icon: "ShieldCheck",
    color: "from-emerald-500 to-teal-500",
    description: "Enterprise antivirus, endpoint protection, and backup solutions."
  }
];

export const allProducts = [
  // --- Category 1: Software & Productivity ---
  {
    id: "win-11-pro",
    categoryId: "software-productivity",
    name: "Microsoft Windows 11 Pro",
    nameBn: "উইন্ডোজ ১১ প্রো লাইসেন্স",
    tagline: "Genuine Lifetime Retail / OEM License Key",
    taglineBn: "আজীবন অফিশিয়াল রিটেইল লাইসেন্স",
    description: "Unlock full security with BitLocker, Remote Desktop, and official Microsoft updates forever.",
    descriptionBn: "বিট-লকার, রিমোট ডেস্কটপ এবং আজীবন অফিশিয়াল আপডেট সহ নির্ভরযোগ্য সিকিউরিটি।",
    price: 1450,
    originalPrice: 4500,
    badge: "Bestseller",
    badgeBn: "জনপ্রিয়",
    icon: "Monitor",
    plans: [
      { id: "1pc", name: "1 PC Lifetime Retail Key", price: 1450 },
      { id: "3pc", name: "3 PC Commercial Pack", price: 3850 }
    ],
    features: [
      "100% Genuine Online Activation",
      "Lifetime Validity with Official Updates",
      "Direct Download from Microsoft Official Site",
      "Supports 64-bit Architecture",
      "Free Installation & Technical Support"
    ],
    featuresBn: [
      "১০০% জেনুইন অনলাইন অ্যাক্টিভেশন",
      "অফিশিয়াল আপডেট সহ আজীবন মেয়াদ",
      "সরাসরি মাইক্রোসফট ওয়েবসাইট থেকে ডাউনলোড",
      "৬৪-বিট আর্কিটেকচার সাপোর্ট",
      "ফ্রি ইনস্টলেশন ও টেকনিক্যাল সাপোর্ট"
    ]
  },
  {
    id: "ms-office-2024",
    categoryId: "software-productivity",
    name: "Microsoft Office 2024 Pro Plus",
    nameBn: "মাইক্রোসফট অফিস ২০২৪ প্রো প্লাস",
    tagline: "Word, Excel, PowerPoint, Outlook & Access",
    taglineBn: "ওয়ার্ড, এক্সেল, পাওয়ারপয়েন্ট, আউটলুক ও এক্সেস",
    description: "Latest standalone perpetual suite for professionals, freelancers, and growing enterprises.",
    descriptionBn: "কোন মাসিক ফি ছাড়া সম্পূর্ণ অফিশিয়াল লাইসেন্স। প্রোডাক্টিভিটির জন্য সেরা প্যাকেজ।",
    price: 1850,
    originalPrice: 6500,
    badge: "New Release",
    badgeBn: "নতুন রিলিজ",
    icon: "FileSpreadsheet",
    plans: [
      { id: "1pc", name: "1 PC Lifetime Key", price: 1850 },
      { id: "bind", name: "Account Bound (Transferable)", price: 2850 }
    ],
    features: [
      "Lifetime Perpetual Activation",
      "Full Classic Suite: Word, Excel, PPT, Outlook",
      "Bind with your Microsoft Account",
      "Clean Official ISO / Installer",
      "Guaranteed No License Error"
    ],
    featuresBn: [
      "লাইফটাইম পারপেচুয়াল লাইসেন্স",
      "ওয়ার্ড, এক্সেল, পাওয়ারপয়েন্ট, আউটলুক",
      "মাইক্রোসফট একাউন্টে সরাসরি লিংক",
      "অফিশিয়াল আইএসও ফাইল ডাউনলোড",
      "লাইসেন্স ইরর মুক্ত নিশ্চয়তা"
    ]
  },
  {
    id: "adobe-creative-cloud",
    categoryId: "software-productivity",
    name: "Adobe Creative Cloud All Apps",
    nameBn: "অ্যাডোবি ক্রিয়েটিভ ক্লাউড অল অ্যাপস",
    tagline: "Photoshop, Illustrator, Premiere Pro, After Effects + 20+ Apps",
    taglineBn: "ফটোশপ, ইলাস্ট্রেটর, প্রিমিয়ার প্রো ও ২০+ অ্যাপস",
    description: "Full official suite with 100GB Cloud Storage, Firefly AI credits, and multi-device access.",
    descriptionBn: "১০০জিবি ক্লাউড স্টোরেজ ও জেনারেটিভ এআই সহ অ্যাডোবির সকল প্রিমিয়াম অ্যাপসের অ্যাক্সেস।",
    price: 3490,
    originalPrice: 18500,
    badge: "Trending",
    badgeBn: "জনপ্রিয়",
    featured: true,
    icon: "Palette",
    plans: [
      { id: "6m", name: "6 Months Subscription", price: 1990 },
      { id: "1y", name: "1 Year Official Access", price: 3490 }
    ],
    features: [
      "Direct Invite on Your Own Email",
      "Adobe Firefly Generative AI Credits",
      "Windows & Mac Dual Support",
      "100GB Adobe Cloud Storage",
      "Full Replacement Warranty"
    ],
    featuresBn: [
      "নিজের ইমেইলে অফিশিয়াল অ্যাক্টিভেশন",
      "অ্যাডোবি ফায়ারফ্লাই এআই সাপোর্ট",
      "উইন্ডোজ ও ম্যাক উভয়েই ব্যবহারযোগ্য",
      "১০০ জিবি অ্যাডোবি ক্লাউড স্টোরেজ",
      "পূর্ণ মেয়াদের রিপ্লেসমেন্ট গ্যারান্টি"
    ]
  },
  {
    id: "idm-license",
    categoryId: "software-productivity",
    name: "Internet Download Manager (IDM)",
    nameBn: "ইন্টারনেট ডাউনলোড ম্যানেজার (আইডিএম)",
    tagline: "Official Lifetime Genuine Serial Key",
    taglineBn: "অফিশিয়াল লাইফটাইম জেনুইন সিরিয়াল কি",
    description: "Download speeds up to 5x faster with resume capability and browser extension integration.",
    descriptionBn: "সবচেয়ে দ্রুত ডাউনলোড স্পিড, ব্রাউজার ইন্টিগ্রেশন এবং ভাইরাস-মুক্ত ডাউনলোড ম্যানেজার।",
    price: 1550,
    originalPrice: 3200,
    badge: "Official",
    badgeBn: "অফিশিয়াল",
    icon: "Download",
    plans: [
      { id: "1y", name: "1 Year 1 PC License", price: 950 },
      { id: "life", name: "Lifetime 1 PC License", price: 1550 }
    ],
    features: [
      "Registered on Your Own Name & Email",
      "3 Years Free Updates (Lifetime validity)",
      "Official Tonec Inc. Registered Key",
      "No Patch or Crack Required",
      "Instant Delivery via Email"
    ],
    featuresBn: [
      "নিজের নামে ও ইমেইলে রেজিস্টার্ড",
      "৩ বছর ফ্রি অফিশিয়াল আপডেট",
      "টোনিক ইনকর্পোরেটেডের জেনুইন কি",
      "কোন ক্র্যাক বা ম্যালওয়্যার ছাড়া নিরাপদ",
      "ইমেইলে দ্রুত ডেলিভারি"
    ]
  },
  {
    id: "antivirus-security",
    categoryId: "software-productivity",
    name: "Bitdefender Total Security",
    nameBn: "বিটডিফেন্ডার টোটাল সিকিউরিটি",
    tagline: "Multi-layered Ransomware Protection",
    taglineBn: "র‍্যানসমওয়্যার ও রিয়েল-টাইম থ্রেট প্রোটেকশন",
    description: "Award-winning protection against malware, zero-day threats, phishing, and web surveillance.",
    descriptionBn: "র‍্যানসমওয়্যার, ফিশিং এবং অনলাইন আক্রমণ থেকে আপনার পিসি ও মোবাইলের সর্বোচ্চ সুরক্ষা।",
    price: 990,
    originalPrice: 2800,
    badge: "Top Security",
    badgeBn: "টপ সিকিউরিটি",
    icon: "ShieldAlert",
    plans: [
      { id: "1pc1y", name: "1 Device - 1 Year", price: 990 },
      { id: "5dev1y", name: "5 Devices - 1 Year", price: 1750 }
    ],
    features: [
      "Real-time Data Protection & Firewall",
      "Multi-Layer Ransomware Remediation",
      "Microphone & Webcam Shield",
      "Safe Online Banking & Shopping",
      "Lightweight on System Resources"
    ],
    featuresBn: [
      "রিয়েল-টাইম ডাটা প্রটেকশন ও ফায়ারওয়াল",
      "মাল্টি-লেয়ার র‍্যানসমওয়্যার সুরক্ষা",
      "ক্যামেরা ও মাইক্রোফোন নিরাপত্তা শিল্ড",
      "নিরাপদ অনলাইন ব্যাংকিং প্রটেকশন",
      "পিসির গতি না কমিয়ে দ্রুত স্ক্যান"
    ]
  },
  {
    id: "pdf-document-tools",
    categoryId: "software-productivity",
    name: "Adobe Acrobat Pro DC",
    nameBn: "অ্যাডোবি অ্যাক্রোব্যাট প্রো ডিসি",
    tagline: "The World's Best PDF Creation & Editing Solution",
    taglineBn: "পিডিএফ এডিটিং ও কনভার্ট করার সেরা টুল",
    description: "Edit text, convert PDFs to Office, sign legally binding forms, and organize document workflows.",
    descriptionBn: "পিডিএফ এডিট, ওয়ার্ড ও এক্সেলে কনভার্ট, ডিজিটাল সিগনেচার ও ফাইল কমপ্রেস করার সেরা টুল।",
    price: 1990,
    originalPrice: 6000,
    badge: "Essential",
    badgeBn: "প্রয়োজনীয়",
    icon: "FileText",
    plans: [
      { id: "1y", name: "1 Year Official Subscription", price: 1990 },
      { id: "life", name: "Lifetime Perpetual License", price: 2950 }
    ],
    features: [
      "Full PDF Text & Image Editing",
      "High Precision OCR Scanning",
      "E-Signatures & Form Creation",
      "Password Encryption & Redaction",
      "Seamless Cloud Storage Sync"
    ],
    featuresBn: [
      "সম্পূর্ণ টেক্সট ও ইমেজ এডিটিং",
      "উচ্চমানের ওসিআর স্ক্যানিং",
      "ডিজিটাল স্বাক্ষর ও ফর্ম তৈরি",
      "পাসওয়ার্ড প্রটেকশন ও রেড্যাকশন",
      "ক্লাউড ফাইল ব্যাকআপ"
    ]
  },

  // --- Category 2: Design & Engineering ---
  {
    id: "autocad",
    categoryId: "design-engineering",
    name: "Autodesk AutoCAD 2027/26/25/24",
    nameBn: "অটোডেস্ক অটোক্যাড ২০২৭/২৬/২৫/২৪",
    tagline: "Professional 2D Drafting & 3D Modeling Software",
    taglineBn: "প্রফেশনাল ২ডি ড্রাফটিং ও ৩ডি মডেলিং সফটওয়্যার",
    description: "Industry standard for civil engineers, architects, mechanical designers, and CAD technicians.",
    descriptionBn: "আর্কিটেক্ট ও সিভিল ইঞ্জিনিয়ারদের জন্য আসল অটোডেস্ক লাইসেন্স। নিজস্ব ইমেইলে অফিশিয়াল ইনভাইটেশন।",
    price: 1990,
    originalPrice: 26400,
    badge: "92% OFF",
    badgeBn: "৯২% ছাড়",
    featured: true,
    icon: "PenTool",
    plans: [
      { id: "1y", name: "1 Year Own Email Subscription", price: 1990 },
      { id: "3y", name: "3 Years Extended Plan", price: 4490 }
    ],
    features: [
      "Direct Official Invite on Your Autodesk Account",
      "Includes All Specialized Toolsets (Architecture, MEP, Electrical)",
      "Official Autodesk.com Software Download",
      "Windows & Mac Compatible",
      "1-Year Replacement Warranty & Technical Support"
    ],
    featuresBn: [
      "নিজের ইমেইলে সরাসরি অফিশিয়াল ইনভাইটেশন",
      "সকল স্পেশালাইজড টুলসেট অন্তর্ভুক্ত (MEP, Electrical, Plant 3D)",
      "সরাসরি Autodesk.com থেকে অরিজিনাল সফটওয়্যার ডাউনলোড",
      "উইন্ডোজ এবং ম্যাক উভয় ভার্সনে সাপোর্ট",
      "১ বছরের ফুল রিপ্লেসমেন্ট গ্যারান্টি ও টেকনিক্যাল হেল্প"
    ]
  },
  {
    id: "revit",
    categoryId: "design-engineering",
    name: "Autodesk Revit BIM",
    nameBn: "অটোডেস্ক রেভিট বিআইএম",
    tagline: "Building Information Modeling for Architecture & MEP",
    taglineBn: "বিল্ডিং ইনফরমেশন মডেলিং (বিআইএম) সফটওয়্যার",
    description: "Multidisciplinary BIM software for collaborative architectural, structural, and MEP engineering.",
    descriptionBn: "আধুনিক কনস্ট্রাকশন ও আর্কিটেকচারাল থ্রিডি ডিজাইন এবং স্ট্রাকচারাল এনালাইসিসের জন্য কমপ্লিট সলিউশন।",
    price: 2450,
    originalPrice: 28000,
    badge: "BIM Pro",
    badgeBn: "বিআইএম প্রো",
    icon: "Building2",
    plans: [
      { id: "1y", name: "1 Year Education/Commercial Access", price: 2450 },
      { id: "3y", name: "3 Years Long-term License", price: 5490 }
    ],
    features: [
      "Parametric 3D Modeling & Scheduling",
      "Seamless Collaboration with Structural Tools",
      "Official Cloud Rendering Support",
      "High Resolution Family Library Included",
      "Zero License Expire Shock"
    ],
    featuresBn: [
      "প্যারামেট্রিক ৩ডি মডেলিং ও শিডিউলিং",
      "স্ট্রাকচারাল টিমের সাথে টিমওয়ার্ক কোলাবোরেশন",
      "অফিশিয়াল ক্লাউড রেন্ডারিং সুবিধা",
      "বিশাল লাইব্রেরি অ্যাক্সেস",
      "নির্ভরযোগ্য দীর্ঘস্থায়ী অ্যাক্টিভেশন"
    ]
  },
  {
    id: "3ds-max",
    categoryId: "design-engineering",
    name: "Autodesk 3ds Max",
    nameBn: "অটোডেস্ক থ্রিডিএস ম্যাক্স",
    tagline: "3D Modeling, Animation & Photorealistic Rendering",
    taglineBn: "থ্রিডি মডেলিং ও ফটোরিয়ালিস্টিক রেন্ডারিং",
    description: "Create massive worlds in games, stunning architectural scenes, and cinematic visual effects.",
    descriptionBn: "ইন্টেরিয়র ডিজাইন ও আর্কিটেকচারাল রেন্ডারিংয়ের জন্য বিশ্বের এক নম্বর ৩ডি সফটওয়্যার।",
    price: 2250,
    originalPrice: 24000,
    badge: "Popular",
    badgeBn: "জনপ্রিয়",
    icon: "Box",
    plans: [
      { id: "1y", name: "1 Year Official License", price: 2250 }
    ],
    features: [
      "Arnold Renderer Built-in & Optimized",
      "Retopology & Spline Modeling Tools",
      "Advanced Material & Lighting Shaders",
      "Direct Autodesk Account Management",
      "Fast Customer Delivery"
    ],
    featuresBn: [
      "আর্নল্ড রেন্ডারার সহ ফুল ফিচার সাপোর্ট",
      "অ্যাডভান্সড স্প্লাইন ও মেটেরিয়াল লাইটিং",
      "অটোডেস্ক অফিশিয়াল অ্যাকাউন্ট ম্যানেজমেন্ট",
      "ইমেইলে সরাসরি ইনভাইট লিংক",
      "ফ্রি সেটআপ সহায়তা"
    ]
  },
  {
    id: "maya",
    categoryId: "design-engineering",
    name: "Autodesk Maya",
    nameBn: "অটোডেস্ক মায়া",
    tagline: "Industry Standard 3D Animation & VFX Suite",
    taglineBn: "থ্রিডি অ্যানিমেশন ও ভিএফএক্স স্যুট",
    description: "Leading animation tool for movie visual effects, dynamic character rigging, and simulations.",
    descriptionBn: "ফিল্ম ভিএফএক্স ও থ্রিডি ক্যারেক্টার অ্যানিমেশনের জন্য হলিউড স্ট্যান্ডার্ড প্রফেশনাল টুল।",
    price: 2450,
    originalPrice: 27000,
    badge: "Hollywood VFX",
    badgeBn: "ভিএফএক্স",
    icon: "Video",
    plans: [
      { id: "1y", name: "1 Year Official Subscription", price: 2450 }
    ],
    features: [
      "Bifrost Procedural Effects Graph",
      "Advanced Character Rigging & Muscle Systems",
      "Arnold High-Performance Rendering",
      "Official Autodesk Account Authentication",
      "Complete 1-Year Guarantee"
    ],
    featuresBn: [
      "বাইফ্রস্ট ডাইনামিক এফেক্টস গ্রাফ",
      "ক্যারেক্টার রিগিং ও ফিজিক্যাল সিমুলেশন",
      "আর্নল্ড ফটো-রেন্ডারার অন্তর্ভুক্ত",
      "অটোডেস্ক অফিশিয়াল অথেন্টিকেশন",
      "সম্পূর্ণ ১ বছরের রিপ্লেসমেন্ট ওয়ারেন্টি"
    ]
  },
  {
    id: "fusion-360",
    categoryId: "design-engineering",
    name: "Autodesk Fusion 360",
    nameBn: "অটোডেস্ক ফিউশন ৩৬০",
    tagline: "Cloud-Powered CAD, CAM, CAE & PCB Design",
    taglineBn: "ক্লাউড সিএডি, সিএএম এবং সিএই সফটওয়্যার",
    description: "Unify design, engineering, electronics, and manufacturing in a single cloud platform.",
    descriptionBn: "প্রোডাক্ট ডিজাইন, সিএনসি মেশিনিং ও ইলেকট্রনিক্স সার্কিট ডিজাইনের অল-ইন-ওয়ান ক্লাউড প্ল্যাটফর্ম।",
    price: 2150,
    originalPrice: 19000,
    badge: "Cloud CAD",
    badgeBn: "ক্লাউড সিএডি",
    icon: "Cpu",
    plans: [
      { id: "1y", name: "1 Year Cloud Subscription", price: 2150 }
    ],
    features: [
      "Integrated CAD & CAM (2.5 & 3 Axis CNC)",
      "Generative Design Technology",
      "Cloud Data Management & Team Sharing",
      "Cross-platform: Windows, Mac, Browser",
      "Full Online Support"
    ],
    featuresBn: [
      "সিএডি ও সিএএম ইন্টিগ্রেশন (CNC মেশিনিং)",
      "জেনারেটিভ ডিজাইন প্রযুক্তি",
      "ক্লাউড ডেটা ম্যানেজমেন্ট ও টিম শেয়ারিং",
      "উইন্ডোজ, ম্যাক ও ব্রাউজার সাপোর্ট",
      "২৪/৭ টেকনিক্যাল সাপোর্ট"
    ]
  },
  {
    id: "civil-3d",
    categoryId: "design-engineering",
    name: "Autodesk Civil 3D",
    nameBn: "অটোডেস্ক সিভিল থ্রিডি",
    tagline: "Civil Infrastructure Design and Documentation",
    taglineBn: "সিভিল ইনফ্রাস্ট্রাকচার ও রোড ডিজাইন টুল",
    description: "Design roads, highways, land developments, bridges, and stormwater drainage systems.",
    descriptionBn: "রোড নেটওয়ার্ক, হাইওয়ে ও ড্রেনেজ ইনফ্রাস্ট্রাকচার ডিজাইনের জন্য সেরা সিভিল ইঞ্জিনিয়ারিং সফটওয়্যার।",
    price: 2550,
    originalPrice: 29000,
    badge: "Civil Eng",
    badgeBn: "সিভিল ইঞ্জিনিয়ার",
    icon: "MapPin",
    plans: [
      { id: "1y", name: "1 Year Official Subscription", price: 2550 }
    ],
    features: [
      "Corridor Modeling & Earthwork Quantities",
      "Dynamic Surface Modeling & Survey Workflows",
      "Storm and Sanitary Analysis",
      "Direct Autodesk Account Invitation",
      "Official License Protection"
    ],
    featuresBn: [
      "করিডোর মডেলিং ও আর্থওয়ার্ক ক্যালকুলেশন",
      "ডায়নামিক সারফেস ও সার্ভে ড্রয়িং",
      "স্টর্ম ও ড্রেনেজ পাইপলাইন নেটওয়ার্ক",
      "অফিশিয়াল ইনভাইটেশন গ্যারান্টি",
      "১ বছরের জন্য নিরাপদ অ্যাক্সেস"
    ]
  },

  // --- Category 3: Business & Cloud ---
  {
    id: "microsoft-365",
    categoryId: "business-cloud",
    name: "Microsoft 365 Personal / Family",
    nameBn: "মাইক্রোসফট ৩৬৫ (অফিস ৩৬৫)",
    tagline: "Always Up-To-Date Premium Apps + 1TB Cloud Storage",
    taglineBn: "১টিবি ওয়ানড্রাইভ ক্লাউড স্টোরেজ ও প্রিমিয়াম অফিস অ্যাপস",
    description: "Word, Excel, PowerPoint, Outlook, OneNote, and 1TB secure OneDrive cloud storage for all your devices.",
    descriptionBn: "মোবাইল ও পিসিতে সবসময় আপডেট অফিস অ্যাপস এবং নিরাপদে ফাইল ব্যাকআপ রাখার জন্য ১ টেরাবাইট ওয়ানড্রাইভ।",
    price: 1890,
    originalPrice: 7500,
    badge: "Best Value",
    badgeBn: "সেরা অফার",
    featured: true,
    icon: "Cloud",
    plans: [
      { id: "1y-personal", name: "Personal - 1 User / 5 Devices (1TB)", price: 1890 },
      { id: "1y-family", name: "Family - 6 Users / 30 Devices (6TB)", price: 3490 }
    ],
    features: [
      "1TB Secure OneDrive Cloud Storage per user",
      "Install on 5 PCs/Macs + 5 Tablets + 5 Phones",
      "Word, Excel, PowerPoint, Outlook with AI Copilot support",
      "Ransomware Detection & File Recovery",
      "Official Microsoft Subscription via Your Email"
    ],
    featuresBn: [
      "প্রতি ইউজারের জন্য ১টিবি সিকিউর ওয়ানড্রাইভ স্টোরেজ",
      "একসাথে ৫টি পিসি/ম্যাক এবং ফোনে ব্যবহারযোগ্য",
      "ওয়ার্ড, এক্সেল, পাওয়ারপয়েন্ট প্রিমিয়াম অ্যাপস",
      "র‍্যানসমওয়্যার ডিটেকশন ও ডাটা রিকভারি",
      "নিজের ইমেইলে অফিশিয়াল সাবস্ক্রিপশন"
    ]
  },
  {
    id: "google-workspace",
    categoryId: "business-cloud",
    name: "Google Workspace Business",
    nameBn: "গুগল ওয়ার্কস্পেস বিজনেস",
    tagline: "Professional Custom Email (you@yourcompany.com) + Google Meet",
    taglineBn: "কাস্টম ডোমেইন বিজনেস ইমেইল ও ক্লাউড স্টোরেজ",
    description: "Professional business email, 30GB to 2TB cloud storage, Google Meet for up to 150 participants.",
    descriptionBn: "আপনার নিজস্ব ডোমেইনে প্রফেশনাল জিমেইল, বিশাল গুগল ড্রাইভ স্টোরেজ এবং সিকিউর বিজনেস ক্লাউড।",
    price: 750,
    originalPrice: 1600,
    badge: "Business",
    badgeBn: "বিজনেস",
    icon: "Mail",
    plans: [
      { id: "starter", name: "Business Starter (30GB Storage / User / Mo)", price: 750 },
      { id: "standard", name: "Business Standard (2TB Storage / User / Mo)", price: 1450 }
    ],
    features: [
      "Custom Email for Your Professional Brand",
      "Integrated Gmail, Drive, Calendar, Docs & Sheets",
      "Enterprise Level Spam & Phishing Protection",
      "24/7 Google Admin & Phone Support",
      "Easy Migration from Any Provider"
    ],
    featuresBn: [
      "আপনার নিজস্ব ডোমেইনে অফিশিয়াল ইমেইল",
      "জিমেইল, গুগল ড্রাইভ, ক্যালেন্ডার, মিট",
      "অত্যাধুনিক স্প্যাম ও ফিশিং প্রোটেকশন",
      "২৪/৭ অ্যাডমিন সাপোর্ট",
      "সহজেই অন্য ইমেইল থেকে ডাটা ট্রান্সফার"
    ]
  },
  {
    id: "cloud-storage-expansion",
    categoryId: "business-cloud",
    name: "Cloud Storage Expansion (OneDrive / GDrive)",
    nameBn: "ক্লাউড স্টোরেজ এক্সপ্যানশন",
    tagline: "High Speed, Secure Automated Cloud Backup",
    taglineBn: "নিরাপদ ক্লাউড ফাইল ব্যাকআপ ও অটো সিঙ্ক",
    description: "Expand your digital storage capacity for large project files, drawings, video renders, and family memories.",
    descriptionBn: "বড় প্রজেক্ট ফাইল, ৩ডি রেন্ডার ও অফিসের গুরুত্বপূর্ণ তথ্যের জন্য নিরাপদ ক্লাউড স্পেস।",
    price: 1200,
    originalPrice: 3200,
    badge: "Cloud",
    badgeBn: "ক্লাউড",
    icon: "HardDrive",
    plans: [
      { id: "1tb-1y", name: "1TB Cloud Expansion - 1 Year", price: 1200 },
      { id: "2tb-1y", name: "2TB Cloud Expansion - 1 Year", price: 2100 }
    ],
    features: [
      "Automated Folder Sync Across All Devices",
      "Version History to Restore Deleted or Overwritten Files",
      "Password Protected Link Sharing",
      "256-bit AES Encryption",
      "Guaranteed Account Privacy"
    ],
    featuresBn: [
      "সকল ডিভাইসে অটোমেটিক সিঙ্ক সুবিধা",
      "ডিলিট হওয়া ফাইল ফিরিয়ে আনার ভার্সন হিস্ট্রি",
      "পাসওয়ার্ড প্রটেক্টেড শেয়ারিং লিংক",
      "২৫৬-বিট এইএস এনক্রিপশন সুরক্ষা",
      "১০০% গোপনীয়তা ও নিরাপত্তা গ্যারান্টি"
    ]
  },
  {
    id: "business-collaboration-suite",
    categoryId: "business-cloud",
    name: "Enterprise Collaboration Suite",
    nameBn: "এন্টারপ্রাইজ কোলাবোরেশন টুলস",
    tagline: "Zoom Pro + Slack + Notion Workspace Integration",
    taglineBn: "টিম মিটিং, চ্যাট ও টাস্ক ম্যানেজমেন্ট সলিউশন",
    description: "Streamline team communication, eliminate meeting limits, and centralize project documentation.",
    descriptionBn: "টিম মেম্বারদের মাঝে দ্রুত যোগাযোগ ও প্রজেক্ট ম্যানেজমেন্টের কমপ্লিট ডিজিটাল ওয়ার্কস্পেস।",
    price: 1650,
    originalPrice: 4200,
    badge: "Team",
    badgeBn: "টিম প্যাক",
    icon: "Users",
    plans: [
      { id: "pro-bundle", name: "Zoom Pro + Team Workspace (Annual)", price: 1650 }
    ],
    features: [
      "Unlimited 30-Hour Zoom Meetings with Cloud Recording",
      "Organized Communication Channels",
      "Company Knowledgebase & Wiki Templates",
      "Calendar Integration & Reminders",
      "Priority Customer Onboarding"
    ],
    featuresBn: [
      "সীমাহীন জুম মিটিং ও ক্লাউড রেকর্ডিং",
      "চ্যানেল ভিত্তিক সংগঠিত টিম মেসেজিং",
      "কোম্পানি নলেজবেস ও ডকিউমেন্টেশন",
      "ক্যালেন্ডার সিঙ্ক ও মিটিং রিমাইন্ডার",
      "দ্রুত ওয়ান-অন-ওয়ান অনবোর্ডিং সাপোর্ট"
    ]
  },

  // --- Category 4: AI & Digital Tools ---
  {
    id: "chatgpt-claude-ai",
    categoryId: "ai-digital",
    name: "AI Productivity Pro Suite",
    nameBn: "এআই প্রোডাক্টিভিটি প্রো স্যুট",
    tagline: "ChatGPT Plus & Claude 3.5 Sonnet Access",
    taglineBn: "চ্যাটজিপিটি প্লাস ও ক্লড ৩.৫ সনেট অ্যাক্সেস",
    description: "Supercharge your research, coding, writing, and analytical reasoning with cutting-edge frontier AI models.",
    descriptionBn: "কোডিং, রিসার্চ ও লেখার গতি বহুগুণ বাড়িয়ে নিতে বিশ্বের সেরা জেনারেটিভ এআই মডেলের পূর্ণ অ্যাক্সেস।",
    price: 2490,
    originalPrice: 6500,
    badge: "AI Powered",
    badgeBn: "এআই পাওয়ার",
    featured: true,
    icon: "Sparkles",
    plans: [
      { id: "1m", name: "1 Month Private Access", price: 1100 },
      { id: "3m", name: "3 Months Bundle", price: 2490 }
    ],
    features: [
      "Access to GPT-4o, Canvas, and Advanced Voice",
      "Claude 3.5 Sonnet with Artifacts & Long Context",
      "DALL-E 3 Image Generation Engine",
      "Custom GPTs & Analytical Tools",
      "Fast & Guaranteed Replacements"
    ],
    featuresBn: [
      "জিপিটি-৪ও, ক্যানভাস ও অ্যাডভান্সড ভয়েস অ্যাক্সেস",
      "ক্লড ৩.৫ সনেট আর্টফ্যাক্টস ও কোডিং পাওয়ার",
      "ডাল-ই ৩ ইমেজ জেনারেশন",
      "কাস্টম জিপিটি ও ফাইল এনালাইসিস",
      "দ্রুত ডেলিভারি ও রিপ্লেসমেন্ট সাপোর্ট"
    ]
  },
  {
    id: "canva-pro-freepik",
    categoryId: "ai-digital",
    name: "Canva Pro + Freepik Premium",
    nameBn: "ক্যানভা প্রো ও ফ্রিপিক প্রিমিয়াম",
    tagline: "Unlimited Graphic Assets, Brand Kits & AI Magic Studio",
    taglineBn: "আনলিমিটেড গ্রাফিক টেমপ্লেট ও এআই ম্যাজিক স্টুডিও",
    description: "Design social media banners, marketing materials, presentations, and export vectors without watermarks.",
    descriptionBn: "সোশ্যাল মিডিয়া ব্যানার, পোস্টার ও ভিডিও তৈরি করার জন্য আনলিমিটেড প্রিমিয়াম টেমপ্লেট ও ফন্ট।",
    price: 650,
    originalPrice: 2400,
    badge: "Popular",
    badgeBn: "জনপ্রিয়",
    icon: "Image",
    plans: [
      { id: "1y-canva", name: "Canva Pro 1 Year (Own Email)", price: 650 },
      { id: "combo", name: "Canva Pro + Freepik Combo 1 Year", price: 1350 }
    ],
    features: [
      "Activated on Your Personal Email Account",
      "100M+ Premium Stock Photos, Videos & Audio",
      "One-Click Background Remover & Magic Resizer",
      "Commercial Usage Rights",
      "1-Year Guaranteed Replacement"
    ],
    featuresBn: [
      "নিজের ব্যক্তিগত ইমেইলে সরাসরি অ্যাক্টিভেশন",
      "১০ কোটিরও বেশি প্রিমিয়াম ফটো ও ভিডিও",
      "ওয়ান-ক্লিক ব্যাকগ্রাউন্ড রিমুভার ও এআই টুলস",
      "কমার্শিয়াল ব্যবহারের সম্পূর্ণ অধিকার",
      "১ বছরের ফুল রিপ্লেসমেন্ট ওয়ারেন্টি"
    ]
  },
  {
    id: "copilot-cursor-code",
    categoryId: "ai-digital",
    name: "AI Developer Suite (Copilot / Cursor)",
    nameBn: "এআই ডেভেলপার স্যুট",
    tagline: "Smart AI Pair Programmer for VS Code & JetBrains",
    taglineBn: "প্রোগ্রামারদের জন্য স্মার্ট এআই পেয়ার কোডার",
    description: "Turn natural language prompts into working code, auto-complete complex logic, and debug errors instantly.",
    descriptionBn: "কোডিং দ্রুত করার জন্য অটো-কমপ্লিশন, বাগ ফিক্সিং এবং ফুল স্ট্যাক সফটওয়্যার ডেভেলপমেন্ট অ্যাসিস্ট্যান্ট।",
    price: 1850,
    originalPrice: 4800,
    badge: "For Coders",
    badgeBn: "ডেভেলপারদের জন্য",
    icon: "Code",
    plans: [
      { id: "6m", name: "6 Months Developer Plan", price: 1100 },
      { id: "1y", name: "1 Year Developer Plan", price: 1850 }
    ],
    features: [
      "Works directly inside VS Code, IntelliJ, PyCharm",
      "Context-aware Code Suggestions & Refactoring",
      "Multi-file Editing & Command Generation",
      "Supports Python, JavaScript, TypeScript, PHP, Go, C++",
      "Verified Reliable Activation"
    ],
    featuresBn: [
      "ভিএস কোড এবং জেটব্রেইন্স আইডিইতে কাজ করে",
      "রিয়েল-টাইম কোড সাজেশন ও রিফ্যাক্টরিং",
      "মাল্টি-ফাইল অটোমেশন ও টার্মিনাল কমান্ড",
      "জাভাস্ক্রিপ্ট, পাইথন, পিএইচপি ও অন্যান্য ল্যাঙ্গুয়েজ",
      "নির্ভরযোগ্য ও নিরাপদ অ্যাক্টিভেশন"
    ]
  },

  // --- Category 5: Security & Protection ---
  {
    id: "endpoint-cyber-protect",
    categoryId: "security-protection",
    name: "Software Solutions Endpoint Shield Pro",
    nameBn: "সফটওয়্যার সলিউশন এন্ডপয়েন্ট শিল্ড প্রো",
    tagline: "Next-Gen Antivirus & Enterprise Threat Detection",
    taglineBn: "নেক্সট-জেন অ্যান্টিভাইরাস ও এন্টারপ্রাইজ থ্রেট প্রটেকশন",
    description: "Comprehensive corporate security against trojans, zero-day exploits, rootkits, and unauthorized data leakage.",
    descriptionBn: "অফিস নেটওয়ার্ক ও কম্পিউটারের সুরক্ষায় ম্যালওয়্যার, ট্রোজান এবং র‍্যানসমওয়্যার প্রতিরোধক শিল্ড।",
    price: 1250,
    originalPrice: 3500,
    badge: "Enterprise",
    badgeBn: "এন্টারপ্রাইজ",
    icon: "ShieldCheck",
    plans: [
      { id: "1dev", name: "1 Device - 1 Year", price: 1250 },
      { id: "5dev", name: "5 Devices - 1 Year Multi-Seat", price: 3450 }
    ],
    features: [
      "Behavioral AI Threat Analysis Engine",
      "Hardware-level Intrusion Detection",
      "USB Storage Access Whitelist Protection",
      "Automatic Daily Cloud Signature Updates",
      "Priority 24/7 Security Hotline"
    ],
    featuresBn: [
      "এআই নির্ভর থ্রেট অ্যানালাইসিস ইঞ্জিন",
      "হার্ডওয়্যার লেভেল ইন্ট্রুশন ডিটেকশন",
      "ইউএসবি স্টোরেজ রেস্ট্রিকশন ও সেফগার্ড",
      "অটোমেটিক ক্লাউড সিগনেচার আপডেট",
      "২৪/৭ প্রায়োরিটি সিকিউরিটি হটলাইন"
    ]
  },
  {
    id: "password-data-vault",
    categoryId: "security-protection",
    name: "Enterprise Password & Credential Vault",
    nameBn: "পাসওয়ার্ড ও ক্রেডেনশিয়াল ভল্ট",
    tagline: "Zero-Knowledge Military-Grade Vault",
    taglineBn: "জিরো-নলেজ মিলিটারি গ্রেড পাসওয়ার্ড ভল্ট",
    description: "Safely store, autofill, and share passwords, API keys, and sensitive documents across your team.",
    descriptionBn: "টিমের পাসওয়ার্ড ও পিন নিরাপদে সংরক্ষণ, অটোফিল এবং শেয়ার করার সামরিক মানের এনক্রিপ্টেড ভল্ট।",
    price: 850,
    originalPrice: 2200,
    badge: "Essential",
    badgeBn: "প্রয়োজনীয়",
    icon: "Lock",
    plans: [
      { id: "1y-individual", name: "1 Year Individual Vault", price: 850 },
      { id: "1y-team", name: "1 Year Team Vault (5 Users)", price: 2450 }
    ],
    features: [
      "End-to-End Zero Knowledge Architecture",
      "Biometric Login & 2FA Key Generator Built-in",
      "Compromised Password & Data Breach Watchdog",
      "Sync across Windows, macOS, Android, iOS",
      "Emergency Contact Recovery Access"
    ],
    featuresBn: [
      "এন্ড-টু-এন্ড জিরো নলেজ এনক্রিপশন",
      "বায়োমেট্রিক লগইন এবং টু-ফ্যাক্টর জেনারেটর",
      "ডাটা ব্রিচ ও পাসওয়ার্ড লিক অ্যালার্ট",
      "উইন্ডোজ, ম্যাক, অ্যান্ড্রয়েড ও আইওএস সিঙ্ক",
      "ইমার্জেন্সি রিকভারি সুবিধা"
    ]
  }
];

