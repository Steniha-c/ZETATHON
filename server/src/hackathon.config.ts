export interface Challenge {
  id: string;
  code: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  shortDescription: string;
  description: string;
  background: string;
  deliverables: string[];
  techSuggestions: string[];
  evaluationCriteria: string[];
}

export interface TimelineItem {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  badge?: string;
  isSpecialOffer?: boolean;
  time?: string;
  phase?: 'pre' | 'hacking' | 'review' | 'post' | string;
  isMilestone?: boolean;
}


export interface PrizeItem {
  id: string;
  rank: '1st' | '2nd' | '3rd' | 'special';
  title: string;
  amount: string;
  tagline: string;
  perks: string[];
  icon: string;
  colorClass: string;
  image?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Teams' | 'Technical' | 'Evaluation' | 'Eligibility';
}

export interface RuleItem {
  id: string;
  title: string;
  summary: string;
  details: string[];
  category: 'General' | 'Eligibility' | 'Code of Conduct' | 'Submission';
}

export interface HackathonConfig {
  name: string;
  subtitle: string;
  organizer: string;
  tagline: string;
  description: string;
  heroBadge: string;
  dates: {
    startDate: string; // ISO String
    endDate: string;
    registrationDeadline: string;
    submissionDeadline: string;
    duration: string;
    venue: string;
  };
  stats: {
    hours: number;
    teams: string;
    challenges: string;
    prizePool: string;
    participants: string;
  };
  socialLinks: {
    instagram: string;
    linkedin: string;
    github: string;
    website: string;
  };
  contactDetails: {
    email: string;
    phone: string;
    address: string;
  };
  challenges: Challenge[];
  timeline: TimelineItem[];
  prizes: PrizeItem[];
  rules: RuleItem[];
  faqs: FaqItem[];
}

export const HACKATHON_CONFIG: HackathonConfig = {
  name: "ZETATHON",
  subtitle: "8-HOUR INTERNAL SPRINT",
  organizer: "ZETA Student Club",
  tagline: "8 HOURS. ONE CHALLENGE. INFINITE POSSIBILITIES.",
  description: "An 8-hour internal hackathon where ideas turn into prototypes, teams collaborate, and innovation takes center stage. Hosted exclusively for collegiate visionaries ready to push limits.",
  heroBadge: "INTERNAL HACKATHON • ORGANIZED BY ZETA",
  dates: {
    startDate: "2026-10-24T09:00:00+05:30",
    endDate: "2026-10-24T17:00:00+05:30",
    registrationDeadline: "2026-10-23T23:59:59+05:30",
    submissionDeadline: "2026-10-24T17:00:00+05:30",
    duration: "8 Hours",
    venue: "Zeta, 3rd floor, Admin block, DCE"
  },
  stats: {
    hours: 8,
    teams: "35+",
    challenges: "Open Track",
    prizePool: "₹10,000",
    participants: "140+"
  },
  socialLinks: {
    instagram: "https://www.instagram.com/zeta_dce?mdxt=MTg5YnJ4bzZvb2x5cQ==",
    linkedin: "https://www.linkedin.com/in/zeta-dce-532872442",
    github: "https://github.com/zeta-ecell-dce",
    website: "https://zetaclub.org"
  },
  contactDetails: {
    email: "zeta.ecell.dec@gmail.com",
    phone: "90254 41640",
    address: "Zeta, 3rd floor, Admin block, DCE"
  },
  challenges: [
    {
      id: "open-innovation",
      code: "OPEN-INNOVATION",
      title: "Open Innovation Track",
      category: "Open Innovation",
      difficulty: "Advanced",
      shortDescription: "Build any creative software or hardware solution solving real-world challenges across any domain with modern engineering.",
      description: "ZETATHON 2026 is an Open Innovation hackathon! Teams have complete creative freedom to conceptualize, design, and prototype solutions in AI/ML, Cloud, Web3, CyberSecurity, IoT, FinTech, HealthTech, EdTech, or GreenTech. Pick any problem that matters to you and build a working prototype in 8 hours.",
      background: "Breakthrough solutions happen when visionary minds explore unconstrained problem spaces without rigid bounds. Choose your problem, assemble your stack, and demonstrate your engineering agility.",
      deliverables: [
        "Functional working prototype or proof-of-concept",
        "Project presentation deck (PPT/PDF) detailing problem, architecture, tech stack, and impact",
        "GitHub repository with clear documentation and setup instructions"
      ],
      techSuggestions: [
        "Full Stack Web",
        "Mobile Applications",
        "AI / ML / GenAI",
        "Cloud & DevOps",
        "IoT & Robotics",
        "Cybersecurity",
        "Blockchain & Web3"
      ],
      evaluationCriteria: [
        "Innovation & Originality (30%)",
        "Technical Execution & Working Prototype (30%)",
        "Impact & Real-world Relevance (25%)",
        "Presentation & Live Demonstration (15%)"
      ]
    }
  ],
  timeline: [
    {
      id: "phase-01",
      phaseId: "PHASE 01",
      title: "Team Formation",
      description: "Teams must consist of 2 to 4 members. You can have members from different years, sections, or engineering disciplines.",
      phase: "pre"
    },
    {
      id: "phase-02",
      phaseId: "PHASE 02",
      title: "Registration",
      description: "Registration and review in progress.",
      phase: "pre"
    },
    {
      id: "phase-03",
      phaseId: "PHASE 03",
      title: "Selection Process",
      description: "Teams are shortlisted based on the submitted PPT and idea.",
      phase: "pre"
    },
    {
      id: "phase-04",
      phaseId: "PHASE 04",
      title: "Payment & Confirmation",
      description: "Shortlisted teams complete payment to confirm participation.",
      phase: "pre"
    },
    {
      id: "phase-05",
      phaseId: "PHASE 05",
      title: "8-Hour Hackathon",
      description: "Build, develop, and refine solutions with mentoring and reviews.",
      phase: "hacking",
      isMilestone: true
    },
    {
      id: "phase-06",
      phaseId: "PHASE 06",
      title: "Final Judging & Prizes",
      description: "Present your solution, followed by final judging and prize distribution.",
      phase: "post",
      isMilestone: true
    }
  ],
  prizes: [
    {
      id: "prz-01",
      rank: "1st",
      title: "1ST PRIZE",
      amount: "₹5,000",
      tagline: "First Prize Champion Trophy & Cash Reward",
      image: "/gold.webp",
      perks: [
        "First Prize Gold Trophy with Star Insignia",
        "₹5,000 Cash Prize Award",
        "Certificate of Distinction",
        "Direct fast-track to ZETA Incubation & Grants",
        "Exclusive ZETA Champion Swag Bag"
      ],
      icon: "Trophy",
      colorClass: "from-amber-400 via-yellow-300 to-amber-500"
    },
    {
      id: "prz-02",
      rank: "2nd",
      title: "2ND PRIZE",
      amount: "₹3,000",
      tagline: "Second Prize Runner-Up Trophy & Cash Reward",
      image: "/silver.webp",
      perks: [
        "Second Prize Silver Trophy with Laurel Insignia",
        "₹3,000 Cash Prize Award",
        "Certificate of Merit",
        "ZETA Mentorship & Project Sponsorship",
        "ZETATHON Exclusive Swag Kit"
      ],
      icon: "Award",
      colorClass: "from-slate-300 via-gray-100 to-slate-400"
    },
    {
      id: "prz-03",
      rank: "3rd",
      title: "3RD PRIZE",
      amount: "₹2,000",
      tagline: "Third Prize Bronze Trophy & Cash Reward",
      image: "/bronze.webp",
      perks: [
        "Third Prize Bronze Trophy with Star Insignia",
        "₹2,000 Cash Prize Award",
        "Certificate of Merit",
        "ZETA Community VIP Member status",
        "ZETATHON Swag Pack"
      ],
      icon: "Medal",
      colorClass: "from-amber-700 via-orange-400 to-amber-800"
    },
    {
      id: "prz-04",
      rank: "special",
      title: "SPECIAL REWARDS",
      amount: "EXCITING REWARDS & GIFT HAMPERS",
      tagline: "Special Category Recognitions Across Dimensions",
      perks: [
        "🌟 Best Freshers Squad (1st Year Champions)",
        "🎨 Best UI / UX & Design Craftsmanship",
        "⚡ Most Technically Ambitious Architecture",
        "🚀 Best Pitch & Storytelling Presentation"
      ],
      icon: "Sparkles",
      colorClass: "from-cyan-400 via-indigo-300 to-purple-500"
    }
  ],
  rules: [
    {
      id: "rule-01",
      title: "Eligibility & Team Composition",
      summary: "Open to all enrolled collegiate students. Teams must consist of 2 to 4 members.",
      details: [
        "All team members must be enrolled students of the participating institution.",
        "Team size is strictly capped at a minimum of 2 and a maximum of 4 participants.",
        "Cross-department and inter-year teams are encouraged.",
        "Individual participation is not allowed as ZETATHON emphasizes team collaboration."
      ],
      category: "Eligibility"
    },
    {
      id: "rule-02",
      title: "Development Window & Original Work",
      summary: "All project code must be authored during the 8-hour sprint (10:00 AM to 05:00 PM).",
      details: [
        "No pre-built project code is permitted. Initial commits must start after the hacking begins at 10:00 AM.",
        "Open-source libraries, frameworks, APIs, and public SDKs are welcome and encouraged.",
        "AI coding assistants (GitHub Copilot, Gemini, ChatGPT) are permitted, provided the core logic and architecture are understood and defendable during jury review.",
        "Plagiarism or passing off existing repository clones will lead to immediate disqualification."
      ],
      category: "Code of Conduct"
    },
    {
      id: "rule-03",
      title: "Submissions & Deliverables",
      summary: "Projects must be submitted via the ZETATHON dashboard before 05:00 PM sharp.",
      details: [
        "A public GitHub repository with commit history throughout the day.",
        "A concise README detailing the problem solved, tech stack, and setup instructions.",
        "A working live demo URL (Vercel, Netlify, Render, ngrok) or pre-recorded walkthrough video.",
        "A 3-minute pitch deck or presentation summary for the jury rounds."
      ],
      category: "Submission"
    },
    {
      id: "rule-04",
      title: "Evaluation & Finality",
      summary: "Projects will be judged on Innovation, Technical Depth, Usability, and Practical Impact.",
      details: [
        "Judging rubrics: Innovation (25%), Technical Execution (25%), UI/UX & Polish (25%), Impact & Presentation (25%).",
        "All decisions made by the judging panel and ZETA organizing committee are final and binding.",
        "Harassment, offensive content, or violation of campus ethics is strictly prohibited."
      ],
      category: "General"
    }
  ],
  faqs: [
    {
      id: "faq-01",
      question: "What is ZETATHON?",
      answer: "ZETATHON is an intensive 8-hour internal sprint hackathon created and hosted by the ZETA student club. It's engineered to help students rapidly translate ideas into working prototypes, learn modern engineering stacks, and compete in a high-energy collaborative environment.",
      category: "General"
    },
    {
      id: "faq-02",
      question: "Who can participate?",
      answer: "ZETATHON is open to all students across all engineering and technology departments. Whether you are a first-year student writing your first React component or a senior building distributed systems, there is a track for you.",
      category: "Eligibility"
    },
    {
      id: "faq-03",
      question: "What is the team size limit?",
      answer: "Teams must consist of 2 to 4 members. You can have members from different years, sections, or engineering disciplines. If you don't have a team yet, connect with fellow campus peers or reach out to the ZETA club desk before registration closes!",
      category: "Teams"
    },
    {
      id: "faq-04",
      question: "How long is the hackathon?",
      answer: "ZETATHON is exactly 8 hours of focused prototyping, starting at 10:00 AM and concluding at 05:00 PM, followed by live pitch evaluations and the grand award ceremony concluding at 06:30 PM.",
      category: "General"
    },
    {
      id: "faq-05",
      question: "Is prior hackathon experience required?",
      answer: "Not at all! ZETATHON is designed for all skill levels. We provide active mentors during the sprint to help unblock you on architecture, API integrations, and pitching.",
      category: "General"
    },
    {
      id: "faq-06",
      question: "What technologies and tools can we use?",
      answer: "You are free to use any modern programming languages, libraries, frameworks (React, Next.js, Node, Python, Flutter, Go, etc.), APIs, or database tools. The choice of stack is up to your team.",
      category: "Technical"
    },
    {
      id: "faq-07",
      question: "How are projects evaluated?",
      answer: "Our jury evaluates projects on four core pillars: Innovation & Originality (25%), Technical Complexity & Execution (25%), UI/UX & Polish (25%), and Practical Problem-Solving & Demo Pitch (25%).",
      category: "Evaluation"
    },
    {
      id: "faq-08",
      question: "Where will the hackathon take place?",
      answer: "ZETATHON is hosted at the ZETA Innovation Hub, Academic Block 4, with dedicated lab workstations, high-speed Wi-Fi, mentorship bays, and an online hybrid check-in channel for remote coordination.",
      category: "General"
    },
    {
      id: "faq-09",
      question: "How do we submit our project?",
      answer: "Submissions are submitted directly through the ZETATHON Participant Dashboard before 05:00 PM. You will supply your project title, brief description, GitHub repo link, and live demo or video walkthrough link.",
      category: "Technical"
    },
    {
      id: "faq-10",
      question: "Can we participate individually?",
      answer: "To promote peer collaboration and realistic team engineering workflows, individual participation is not supported. Every team must have at least 2 members.",
      category: "Teams"
    }
  ]
};
