import type { Prospect, PipelineStatus, WebsiteStatus, WebsiteDraft, DashboardStats } from '../types/index.ts';

/**
 * Calculates the opportunity score (0 - 100) for a local business prospect.
 * Higher score = higher urgency & value for selling a website redesign.
 */
export function calculateOpportunityScore(params: {
  rating: number;
  reviewsCount: number;
  websiteStatus: WebsiteStatus;
}): number {
  let score = 20;

  // Website status is primary driver
  switch (params.websiteStatus) {
    case 'no_website':
      score += 50; // Critical need
      break;
    case 'broken':
    case 'broken_mobile':
      score += 42;
      break;
    case 'outdated':
      score += 35;
      break;
    case 'modern':
      score += 5; // Low need
      break;
  }

  // Good reviews but poor web presence = great opportunity (business is viable)
  if (params.reviewsCount >= 50) {
    score += 15;
  } else if (params.reviewsCount >= 15) {
    score += 10;
  } else if (params.reviewsCount >= 5) {
    score += 5;
  }

  // Rating impact: High ratings mean they care about reputation
  if (params.rating >= 4.5) {
    score += 10;
  } else if (params.rating >= 4.0) {
    score += 6;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Validates allowed state transitions in the sales pipeline
 */
export function isValidStatusTransition(
  current: PipelineStatus,
  target: PipelineStatus
): boolean {
  if (current === target) return true;

  const validTransitions: Record<PipelineStatus, PipelineStatus[]> = {
    discovered: ['demo_created', 'pitched', 'passed'],
    demo_created: ['pitched', 'meeting_booked', 'passed'],
    pitched: ['meeting_booked', 'closed_won', 'passed'],
    meeting_booked: ['closed_won', 'passed'],
    closed_won: [], // terminal
    passed: ['discovered', 'demo_created', 'pitched'], // can resurrect
  };

  return validTransitions[current]?.includes(target) ?? false;
}

/**
 * Interpolates variables into email templates
 */
export function interpolateEmailTemplate(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const valStr = value !== undefined && value !== null ? String(value) : '';
    // Replace {key} and {{key}}
    result = result.replace(new RegExp(`\\{\\{?\\s*${key}\\s*\\}?}`, 'g'), valStr);
  }
  return result;
}

/**
 * Calculates aggregate dashboard stats from current prospects and outreach list
 */
export function calculateDashboardStats(
  prospects: Prospect[],
  outreachSentCount: number
): DashboardStats {
  const total = prospects.length;
  const sitesGenerated = prospects.filter((p) => !!p.demoDraft || p.pipelineStatus !== 'discovered').length;
  const meetingsBooked = prospects.filter((p) => p.pipelineStatus === 'meeting_booked').length;
  const closedWon = prospects.filter((p) => p.pipelineStatus === 'closed_won').length;

  const totalScore = prospects.reduce((acc, p) => acc + (p.opportunityScore || 0), 0);
  const avgOpportunityScore = total > 0 ? Math.round(totalScore / total) : 0;

  const pipelineValue = prospects.reduce((acc, p) => {
    if (p.pipelineStatus === 'passed') return acc;
    return acc + (Number.isFinite(p.estimatedDealValue) && p.estimatedDealValue > 0 ? p.estimatedDealValue : 0);
  }, 0);

  return {
    totalProspects: total,
    generatedSitesCount: sitesGenerated,
    activePitchesSent: outreachSentCount,
    meetingsBooked,
    closedWonCount: closedWon,
    avgOpportunityScore,
    pipelineValue,
  };
}

/**
 * Generates initial tailored website draft for a prospect based on category
 */
export function generateDefaultDraftForProspect(prospect: {
  id: string;
  name: string;
  category: string;
  city: string;
  phone?: string;
  email?: string;
  address?: string;
}): WebsiteDraft {
  const cat = (prospect.category || 'Local Services').toLowerCase();

  let industry = 'Specialist Services';
  let tagline = `Premier ${prospect.category || 'Local'} Services in ${prospect.city}`;
  let headline = `Exceptional Care & Quality You Can Trust in ${prospect.city}`;
  let subheadline = `Serving local families and businesses with 5-star precision, upfront transparent pricing, and instant online scheduling.`;
  let heroCta = 'Book Your Appointment Online';
  let primaryColor = '#0284c7'; // sky-600
  let accentColor = '#38bdf8'; // sky-400
  let customPitch = `Your current Google presence has great reviews, but missing an instant booking funnel leaves up to 40% of potential customers moving to competitors. This interactive demo demonstrates instant mobile reservation.`;

  let services = [
    {
      id: 'srv-1',
      title: 'Full Inspection & Consultation',
      description: 'Comprehensive diagnostic and personalized action plan delivered same-day.',
      badge: 'Most Popular',
    },
    {
      id: 'srv-2',
      title: 'Priority Same-Day Service',
      description: 'Rapid response dispatch with fully-equipped specialists right to your door.',
    },
    {
      id: 'srv-3',
      title: 'Annual Preventative Care',
      description: 'Scheduled maintenance and ongoing protection with VIP customer pricing.',
    },
  ];

  if (cat.includes('dent') || cat.includes('health') || cat.includes('clinic')) {
    industry = 'Modern Dental & Wellness';
    tagline = `Gentle, Modern Dental Care in ${prospect.city}`;
    headline = `Healthy, Radiant Smiles for Your Whole Family`;
    subheadline = `Experience stress-free dentistry with modern tech, comforting amenities, and same-week new patient appointments.`;
    heroCta = 'Schedule New Patient Exam';
    primaryColor = '#0d9488'; // teal-600
    accentColor = '#2dd4bf'; // teal-400
    customPitch = `Patients searching on mobile phones want to click 'Book Online' in 2 taps. This redesign includes seamless digital check-in and modern treatment showcases.`;
    services = [
      { id: 'srv-1', title: 'Comprehensive Exams & Cleanings', description: 'Gentle preventative care with digital low-radiation imaging.', badge: 'New Patients' },
      { id: 'srv-2', title: 'Cosmetic & Invisalign', description: 'Transform your smile with clear aligners and professional whitening.' },
      { id: 'srv-3', title: 'Emergency Dental Care', description: 'Same-day relief for toothaches, chipped teeth, and urgent care needs.' },
    ];
  } else if (cat.includes('plumb') || cat.includes('hvac') || cat.includes('roof') || cat.includes('contract')) {
    industry = 'Residential & Commercial Trades';
    tagline = `Fast, Dependable 24/7 Contractors in ${prospect.city}`;
    headline = `Licensed Experts. On-Time Guarantee. Zero Surprises.`;
    subheadline = `From urgent emergencies to planned remodels, our master-certified team delivers guaranteed craftsmanship and clean work.`;
    heroCta = 'Get Instant Upfront Estimate';
    primaryColor = '#ea580c'; // orange-600
    accentColor = '#f97316'; // orange-500
    customPitch = `Homeowners in an emergency look for immediate click-to-call and upfront rate transparency. This mobile-first demo converts emergency clicks into booked jobs.`;
    services = [
      { id: 'srv-1', title: 'Emergency Repair & Diagnostics', description: 'Fast truck roll-out within 45 minutes across the metro area.', badge: '24/7 Available' },
      { id: 'srv-2', title: 'System Installation & Upgrades', description: 'High-efficiency certified units with manufacturer warranty coverage.' },
      { id: 'srv-3', title: 'Preventative Maintenance Plan', description: 'Seasonal safety checkups to eliminate unexpected breakdowns.' },
    ];
  } else if (cat.includes('bistro') || cat.includes('cafe') || cat.includes('restaurant') || cat.includes('bakery')) {
    industry = 'Artisan Hospitality & Dining';
    tagline = `Craft Dining & Seasonal Table in ${prospect.city}`;
    headline = `Handcrafted Flavors Made with Locally Sourced Ingredients`;
    subheadline = `Join us for warm hospitality, wood-fired specialties, curated organic wines, and an unforgettable neighborhood dining experience.`;
    heroCta = 'Reserve a Table Online';
    primaryColor = '#b45309'; // amber-700
    accentColor = '#f59e0b'; // amber-500
    customPitch = `Diners browse menus on their phones before arriving. This responsive demo features dynamic digital menus, OpenTable/Resy integration, and event reservations.`;
    services = [
      { id: 'srv-1', title: 'Seasonal Chef Tasting Menu', description: 'Five-course culinary journey celebrating regional harvest.', badge: 'Chef Special' },
      { id: 'srv-2', title: 'Private Dining & Celebrations', description: 'Exclusive mezzanine space for intimate birthdays and gatherings.' },
      { id: 'srv-3', title: 'Online Curbside Pickup', description: 'Packaged hot and fresh with contactless curbside handoff.' },
    ];
  } else if (cat.includes('law') || cat.includes('attorney') || cat.includes('account') || cat.includes('cpa')) {
    industry = 'Professional Legal & Financial Advisory';
    tagline = `Strategic Counsel & Wealth Protection in ${prospect.city}`;
    headline = `Protecting What Matters Most with Decades of Proven Results`;
    subheadline = `Strategic advocacy and proactive planning for individuals, founders, and growing enterprises facing complex challenges.`;
    heroCta = 'Request Confidential Consultation';
    primaryColor = '#1e3a8a'; // blue-900
    accentColor = '#3b82f6'; // blue-500
    customPitch = `High-value clients expect trust, case studies, and clear confidentiality assurances. This layout positions your firm as the tier-one authority.`;
  }

  return {
    id: `draft-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    prospectId: prospect.id,
    businessName: prospect.name,
    tagline,
    industry,
    headline,
    subheadline,
    heroCtaText: heroCta,
    primaryColor,
    accentColor,
    services,
    features: [
      'Mobile-first responsive design tested on iOS and Android',
      'Instant 1-click customer scheduling and SMS confirmation',
      'Integrated Google Reviews showcase and live star badges',
      'Fast loading speed score (98+ Google Lighthouse standard)',
      'Clean SSL security and local SEO meta tags pre-configured',
    ],
    testimonials: [
      {
        id: 't-1',
        name: 'Sarah Jenkins',
        role: `Local ${prospect.city} Resident`,
        content: `Outstanding experience from start to finish. Fast, friendly, and honest communication. Highly recommended to everyone in the area!`,
        rating: 5,
      },
      {
        id: 't-2',
        name: 'David Martinez',
        role: 'Verified Customer',
        content: `Their team went above and beyond when we needed quick help. Truly professional and reliable.`,
        rating: 5,
      },
    ],
    contactInfo: {
      phone: prospect.phone || '(555) 234-8901',
      email: prospect.email || `contact@${prospect.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'business'}.com`,
      address: prospect.address || `Downtown District, ${prospect.city}`,
      hours: 'Mon - Fri: 8:00 AM - 6:00 PM | Sat: By Appt',
    },
    customPitchAngle: customPitch,
    createdAt: new Date().toISOString(),
  };
}
