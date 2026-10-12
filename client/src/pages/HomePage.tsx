import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown,
  Clock3, ExternalLink, MapPin, Menu, ShieldCheck,
  UsersRound, X, Zap,
} from 'lucide-react';
import { HACKATHON_CONFIG, type Challenge, type HackathonConfig } from '../hackathon.config.js';
import { ChallengeDetailModal } from '../components/modals/ChallengeDetailModal.js';
import { api } from '../services/api.js';
import '../home.css';

const currentYear = new Date().getFullYear();
const reveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' as const } },
};
const sectionCascade: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.04 } },
};
const heroTitleCascade: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.08 } },
};
const heroTitleReveal: Variants = {
  hidden: { opacity: 0, y: 26, filter: 'blur(8px)', scale: 0.985 },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, transition: { duration: 0.55, ease: 'easeOut' } },
};

const heroParticles = [
  { x: '8%', y: '24%', delay: '0s', duration: '7.2s' },
  { x: '17%', y: '63%', delay: '1.1s', duration: '8.4s' },
  { x: '28%', y: '15%', delay: '2.4s', duration: '7.8s' },
  { x: '38%', y: '78%', delay: '0.8s', duration: '9s' },
  { x: '51%', y: '21%', delay: '1.8s', duration: '8.1s' },
  { x: '62%', y: '68%', delay: '3s', duration: '7.5s' },
  { x: '73%', y: '18%', delay: '0.5s', duration: '9.2s' },
  { x: '84%', y: '48%', delay: '2.1s', duration: '7.7s' },
  { x: '92%', y: '74%', delay: '1.5s', duration: '8.8s' },
  { x: '45%', y: '42%', delay: '3.4s', duration: '9.5s' },
  { x: '13%', y: '84%', delay: '2.8s', duration: '7.9s' },
  { x: '78%', y: '87%', delay: '0.3s', duration: '8.6s' },
];

interface RevealSectionProps extends React.PropsWithChildren {
  id?: string;
  className: string;
}

const RevealSection: React.FC<RevealSectionProps> = ({ id, className, children }) => {
  const reduceMotion = useReducedMotion();
  const supportsIntersectionObserver = typeof window !== 'undefined' && 'IntersectionObserver' in window;
  const revealOnScroll = !reduceMotion && supportsIntersectionObserver;

  return (
    <motion.section
      id={id}
      className={className}
      variants={sectionCascade}
      initial={revealOnScroll ? 'hidden' : false}
      animate={revealOnScroll ? undefined : 'visible'}
      whileInView={revealOnScroll ? 'visible' : undefined}
      viewport={revealOnScroll ? { once: true, amount: 0.12, margin: '0px 0px -8% 0px' } : undefined}
    >
      {children}
    </motion.section>
  );
};

function formatEventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export const HomePage: React.FC = () => {
  const [config, setConfig] = useState<HackathonConfig>(HACKATHON_CONFIG);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const gridParallax = useTransform(scrollYProgress, [0, 1], [0, 54]);
  const orbParallax = useTransform(scrollYProgress, [0, 1], [0, 25]);

  useEffect(() => {
    let active = true;
    Promise.all([api.getConfig(), api.getAnnouncements()]).then(([liveConfig, liveAnnouncements]) => {
      if (!active) return;
      if (liveConfig) setConfig(liveConfig);
      if (liveAnnouncements) setAnnouncements(liveAnnouncements);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const importantAnnouncement = announcements.find((item) =>
    item.isImportant && !/\bverify\b.{0,40}\bemail\b/i.test(`${item.title} ${item.content}`),
  );
  const dateLabel = formatEventDate(config.dates.startDate);
  const duration = config.dates.duration || `${config.stats.hours} hours`;
  const timeLabel = config.dates.startDate
    ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(config.dates.startDate))
    : null;
  const endTimeLabel = config.dates.endDate
    ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(config.dates.endDate))
    : null;
  const hasScheduleConflict = config.rules.some((rule) => rule.details.some((detail) => /10:00\s*AM|10:00 AM to 05:00 PM/i.test(detail)));
  const displayedFaqs = config.faqs.map((faq) => {
    const question = faq.question.toLowerCase();
    if (question.includes('who can participate')) {
      return { ...faq, answer: 'ZETATHON is described as an internal event. The published eligibility rule says team members must be enrolled students of the participating institution. If you are unsure whether your situation qualifies, please confirm with the organizers.' };
    }
    if (question.includes('how long')) {
      return { ...faq, answer: `${duration} is the configured event duration${timeLabel && endTimeLabel ? `, currently scheduled from ${timeLabel} to ${endTimeLabel} (IST)` : ''}. The published rule sheet contains a different build-window start time, so confirm the final run-of-show with the organizers.` };
    }
    if (question.includes('how are projects evaluated')) {
      return { ...faq, answer: 'The event configuration lists evaluation criteria, but the challenge brief and rules currently specify different scoring weights. The organizers should confirm the final judging rubric before the event.' };
    }
    if (question.includes('where will')) {
      return { ...faq, answer: `The current event configuration lists ${config.dates.venue || 'the venue as yet to be announced'}. Please check with the organizers for any venue update.` };
    }
    if (question.includes('submit our project')) {
      return { ...faq, answer: 'Round 01 submissions are a PPT or project idea, uploaded with team registration. The project submission API is part of the participant dashboard; shortlisted teams should follow organizer instructions for Round 02 deliverables.' };
    }
    return faq;
  });
  const nav = [
    ['About', 'about'], ['The challenge', 'format'], ['Timeline', 'timeline'], ['Guidelines', 'rules'], ['FAQ', 'faq'],
  ];
  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className="site-home">
      <header className="site-nav">
        <Link className="site-brand" to="/" aria-label="ZETATHON home">
          <img src="/zeta-logo.jpg" alt="" />
          <span><strong>ZETA<span className="brand-light">THON</span></strong><small>STUDENT INNOVATION / 2026</small></span>
        </Link>
        <nav className="desktop-links" aria-label="Main navigation">
          {nav.map(([label, id]) => <button key={id} onClick={() => scrollTo(id)}>{label}</button>)}
        </nav>
        <Link className="nav-register" to="/register">Register your team <ArrowUpRight size={15} /></Link>
        <button className="nav-toggle" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <AnimatePresence>
          {mobileMenuOpen && <motion.nav className="mobile-links" initial={reduceMotion ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} aria-label="Mobile navigation">
            {nav.map(([label, id]) => <button key={id} onClick={() => scrollTo(id)}>{label}<ArrowUpRight size={14} /></button>)}
            <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Register your team <ArrowRight size={15} /></Link>
          </motion.nav>}
        </AnimatePresence>
      </header>

      <main>
        <motion.section id="hero" ref={heroRef} className="hero-stage">
          <motion.div className="hero-grid-drift" style={{ y: reduceMotion ? 0 : gridParallax }} aria-hidden="true"><div className="hero-grid" /></motion.div>
          <motion.div className="hero-orb-drift" style={{ y: reduceMotion ? 0 : orbParallax }} aria-hidden="true"><div className="hero-orb hero-orb-violet" /><div className="hero-orb hero-orb-cyan" /></motion.div>
          <div className="hero-particles" aria-hidden="true">{heroParticles.map((particle, index) => <span key={index} className="hero-particle" style={{ left: particle.x, top: particle.y, animationDelay: particle.delay, animationDuration: particle.duration }} />)}</div>
          <div className="hero-coordinate" aria-hidden="true">13°02′ N<br />80°11′ E</div>
          <div className="hero-content">
            {importantAnnouncement && <motion.aside className="announcement-ribbon" initial={reduceMotion ? false : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.55 }}>
              <span className="live-dot" /> <b>{importantAnnouncement.title}</b><span>{importantAnnouncement.content}</span>
            </motion.aside>}
            <motion.div className="hero-eyebrow" initial={reduceMotion ? false : 'hidden'} animate="visible" variants={reveal} transition={{ duration: reduceMotion ? 0 : 0.55 }}>
              <span className="eyebrow-line" /> {config.heroBadge} <span className="eyebrow-line" />
            </motion.div>
            <motion.h1 initial={reduceMotion ? false : 'hidden'} animate="visible" variants={heroTitleCascade}>
              <motion.span className="hero-wordmark" variants={heroTitleReveal}>ZETA<span>THON</span></motion.span>
              <motion.span className="hero-headline" variants={heroTitleCascade}>
                <span className="hero-title-line"><motion.span className="hero-title-word" variants={heroTitleReveal}>BUILD</motion.span>{' '}<motion.span className="hero-title-word" variants={heroTitleReveal}>THE</motion.span>{' '}<motion.span className="hero-title-word" variants={heroTitleReveal}>FUTURE.</motion.span></span>
                <span className="hero-title-line"><motion.span className="hero-title-word" variants={heroTitleReveal}><em>BREAK</em></motion.span>{' '}<motion.span className="hero-title-word" variants={heroTitleReveal}><em>THE</em></motion.span>{' '}<motion.span className="hero-title-word" variants={heroTitleReveal}><em>LIMITS.</em></motion.span></span>
              </motion.span>
            </motion.h1>
            <motion.p className="hero-description" initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 1.45 }}>
              Eight hours. One team. A real problem worth solving. Join student builders turning bold ideas into working prototypes.
            </motion.p>
            <motion.div className="hero-actions" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.58, delay: reduceMotion ? 0 : 1.67 }}>
              <Link to="/register" className="button-primary">Register your team <ArrowRight size={17} /></Link>
              <button className="button-quiet" onClick={() => scrollTo('about')}>Explore the event <ArrowDown size={16} /></button>
            </motion.div>
            <motion.div className="hero-facts" aria-label="Event information" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 1.88 }}>
              <div><CalendarDays size={16} /><span><small>EVENT DATE</small><b>{dateLabel || 'To be announced'}</b></span></div>
              <div><Clock3 size={16} /><span><small>THE CHALLENGE</small><b>{duration}</b></span></div>
              <div><MapPin size={16} /><span><small>VENUE</small><b>{config.dates.venue || 'To be announced'}</b></span></div>
            </motion.div>
          </div>
          <div className="hero-side-label" aria-hidden="true"><span>IDEATE</span><i /><span>BUILD</span><i /><span>IMPACT</span></div>
          <button className="scroll-cue" onClick={() => scrollTo('about')} aria-label="Scroll to learn about ZETATHON"><span>SCROLL TO EXPLORE</span><ArrowDown size={14} /></button>
          <span className="hero-index">01 / 06</span>
        </motion.section>

        <RevealSection id="about" className="section about-section">
          <motion.div className="section-kicker" variants={reveal}><span>01</span><i /> THE IDEA</motion.div>
          <motion.div className="about-layout" variants={sectionCascade}>
            <motion.h2 variants={reveal}>Small window.<br /><span>Big possibility.</span></motion.h2>
            <motion.div className="about-copy" variants={sectionCascade}>
              <motion.p className="about-lead" variants={reveal}>ZETATHON is an 8-hour internal hackathon by {config.organizer} at Dhanalakshmi College of Engineering.</motion.p>
              <motion.p variants={reveal}>Bring different minds to one table. Choose a problem that matters, work shoulder-to-shoulder, and make an idea tangible. It’s not about having every answer before you begin—it’s about what a team can create when the clock starts.</motion.p>
              <motion.button className="text-link" variants={reveal} onClick={() => scrollTo('format')}>See how the challenge works <ArrowRight size={15} /></motion.button>
            </motion.div>
          </motion.div>
          <motion.div className="about-stats" variants={sectionCascade}>
            <motion.div className="stat-feature" variants={reveal}><strong>{config.stats.hours}<small>H</small></strong><span>one focused build sprint</span></motion.div>
            <motion.div variants={reveal}><span className="stat-number">02</span><b>rounds</b><small>from the first idea to the build</small></motion.div>
            <motion.div variants={reveal}><span className="stat-number">∞</span><b>open innovation</b><small>choose a domain that matters</small></motion.div>
            <motion.div className="stat-aside" variants={reveal}><span className="status-marker" /> {config.subtitle || 'INTERNAL HACKATHON'}<br />Hosted by {config.organizer}</motion.div>
          </motion.div>
        </RevealSection>

        <RevealSection id="format" className="section format-section">
          <motion.div className="section-kicker" variants={reveal}><span>02</span><i /> THE CHALLENGE</motion.div>
          <motion.div className="section-heading-row" variants={reveal}>
            <h2>Two rounds.<br /><span>One meaningful build.</span></h2>
            <p>Start with the why. Then show what your team can make in a focused eight-hour sprint.</p>
          </motion.div>
          <motion.div className="rounds" variants={sectionCascade}>
            <motion.article className="round round-one" variants={reveal}>
              <div className="round-top"><span>ROUND 01</span><span className="round-symbol">01</span></div>
              <div className="round-rule" />
              <h3>IDEAS<br />THAT MATTER</h3>
              <p>Make the case for a problem worth solving. Teams register and submit a presentation or project idea for organizer review.</p>
              <ol className="round-steps">
                <li><span>01</span> Register your team</li><li><span>02</span> Submit your PPT or project idea</li><li><span>03</span> Organizers review submissions</li><li><span>04</span> Up to 30 teams shortlisted</li>
              </ol>
              <span className="round-foot">THE STARTING LINE</span>
            </motion.article>
            <motion.div className="round-connector" variants={reveal} aria-hidden="true"><span><ArrowRight size={17} /></span><i /></motion.div>
            <motion.article className="round round-two" variants={reveal}>
              <div className="round-top"><span>ROUND 02</span><span className="round-symbol">02</span></div>
              <div className="round-rule" />
              <h3>BUILD<br />& INNOVATE</h3>
              <p>Shortlisted teams advance to the in-person hackathon: an 8-hour opportunity to turn a strong idea into a working prototype.</p>
              <div className="build-window"><Zap size={18} /><span><b>{duration} of building</b><small>{dateLabel ? `${dateLabel}${timeLabel ? ` · begins ${timeLabel}` : ''}` : 'Event date to be announced'}</small></span></div>
              <button className="text-link" onClick={() => setSelectedChallenge(config.challenges[0] || null)}>Explore the open track <ArrowUpRight size={15} /></button>
              <span className="round-foot">THE BUILD WINDOW</span>
            </motion.article>
          </motion.div>
          <motion.div className="format-note" variants={reveal}><ShieldCheck size={16} /><span>Only the event details shown in the organizer configuration are presented here. Further Round 02 deliverables and judging logistics can be confirmed by the organizers.</span></motion.div>
        </RevealSection>

        <RevealSection id="timeline" className="section timeline-section">
          <motion.div className="section-kicker" variants={reveal}><span>03</span><i /> THE WHEN & WHERE</motion.div>
          <motion.div className="section-heading-row" variants={reveal}>
            <h2>Make the time.<br /><span>Build what’s next.</span></h2>
            <p>Configured event details at a glance. Check with the organizers if anything changes.</p>
          </motion.div>
          <motion.div className="event-detail-grid" variants={sectionCascade}>
            <motion.div className="event-detail-main" variants={reveal}><span className="detail-label">EVENT DAY</span><CalendarDays size={22} /><strong>{dateLabel || 'Date to be announced'}</strong><span>{timeLabel ? `Starts at ${timeLabel} (IST)` : 'Schedule to be announced'}</span><div className="detail-bottom"><span>{duration.toUpperCase()} / IN-PERSON SPRINT</span><span className="detail-corner">↗</span></div></motion.div>
            <motion.div className="event-detail-secondary" variants={reveal}><div className="detail-label">LOCATION</div><MapPin size={19} /><strong>{config.dates.venue || 'Venue to be announced'}</strong><span>{config.contactDetails.address}</span><a className="text-link" href={config.socialLinks.website} target="_blank" rel="noreferrer">Visit ZETA <ExternalLink size={13} /></a></motion.div>
            <motion.div className="event-detail-secondary" variants={reveal}><div className="detail-label">REGISTRATION</div><UsersRound size={19} /><strong>Teams of 2–4</strong><span>Bring your collaborators and an idea you care about.</span><Link className="text-link" to="/register">Team registration <ArrowRight size={14} /></Link></motion.div>
          </motion.div>
          {config.timeline?.length > 0 && <motion.div className="configured-timeline" variants={reveal}><p className="detail-label">ORGANIZER-PUBLISHED PHASES</p><motion.div className="timeline-track" variants={sectionCascade}>{config.timeline.map((phase, index) => <motion.article className="timeline-stop" variants={reveal} key={phase.id}><span className="timeline-dot">{String(index + 1).padStart(2, '0')}</span><div><small>{phase.time || phase.phaseId || `PHASE ${String(index + 1).padStart(2, '0')}`}</small><b>{phase.title}</b><p>{phase.description}</p></div></motion.article>)}</motion.div></motion.div>}
        </RevealSection>

        <RevealSection id="rules" className="section guidelines-section">
          <motion.div className="section-kicker" variants={reveal}><span>04</span><i /> THE GROUND RULES</motion.div>
          <motion.div className="section-heading-row" variants={reveal}><h2>Room for ideas.<br /><span>Clarity for everyone.</span></h2><p>A good challenge starts with a fair playing field. Read the configured rules before you register.</p></motion.div>
          {hasScheduleConflict && <motion.div className="format-note rules-note" variants={reveal}><ShieldCheck size={16} /><span>The configured event runs for {duration} beginning at {timeLabel || 'the configured start time'}, while one published development rule gives a different start time. Please confirm the final build window with the organizers.</span></motion.div>}
          <motion.div className="rules-list" variants={sectionCascade}>{config.rules.map((rule, index) => {
            const isWindowRule = /development window/i.test(rule.title);
            const details = isWindowRule ? rule.details.filter((detail) => !/10:00\s*AM/i.test(detail)) : rule.details;
            const summary = isWindowRule ? rule.summary.replace(/10:00 AM to 05:00 PM/i, 'the organizer-confirmed build window') : rule.summary;
            return <motion.article className="rule-row" variants={reveal} key={rule.id}><span className="rule-index">0{index + 1}</span><div><small>{rule.category}</small><h3>{rule.title}</h3><p>{summary}</p></div><ul>{details.map((detail, i) => <li key={i}><Check size={14} />{detail}</li>)}</ul></motion.article>;
          })}</motion.div>
          <motion.div className="eligibility-band" variants={reveal}><UsersRound size={19} /><span><b>Team composition</b> — Teams of 2–4 students; cross-department and inter-year teams are encouraged, per the published rules.</span></motion.div>
        </RevealSection>

        <RevealSection id="faq" className="section faq-section">
          <motion.div className="section-kicker" variants={reveal}><span>05</span><i /> QUESTIONS, ANSWERED</motion.div>
          <motion.div className="faq-layout" variants={sectionCascade}><motion.div variants={reveal}><h2>Good questions.<br /><span>Honest answers.</span></h2><p>Still unsure? Reach out to the ZETA team using the verified contact below.</p><a className="text-link" href={`mailto:${config.contactDetails.email}`}>Contact the organizers <ArrowUpRight size={15} /></a></motion.div>
            <motion.div className="faq-list" variants={sectionCascade}>{displayedFaqs.map((faq) => <motion.article className={`faq-item ${activeFaq === faq.id ? 'is-open' : ''}`} variants={reveal} key={faq.id}><button aria-expanded={activeFaq === faq.id} onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}><span>{faq.question}</span><ChevronDown size={17} /></button><AnimatePresence initial={false}>{activeFaq === faq.id && <motion.div className="faq-answer" initial={reduceMotion ? false : { height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.24 }}><p>{faq.answer}</p></motion.div>}</AnimatePresence></motion.article>)}</motion.div>
          </motion.div>
        </RevealSection>

        <RevealSection className="register-cta">
          <div className="cta-grid" aria-hidden="true" />
          <motion.div className="section-kicker" variants={reveal}><span>06</span><i /> YOUR MOVE</motion.div>
          <motion.h2 variants={reveal}>Build something<br /><span>that matters.</span></motion.h2>
          <motion.p variants={reveal}>Bring your people. Bring your curiosity. The first step is putting your team together.</motion.p>
          <motion.div variants={reveal}><Link to="/register" className="button-primary">Register your team <ArrowRight size={17} /></Link></motion.div>
          <motion.small variants={reveal}>TEAM SIZE: 2–4 / EVENT DURATION: {duration.toUpperCase()}</motion.small>
        </RevealSection>
      </main>
      <footer className="home-footer"><Link className="site-brand" to="/"><img src="/zeta-logo.jpg" alt="" /><span><strong>ZETA<span className="brand-light">THON</span></strong><small>{config.organizer}</small></span></Link><p>Ideas in motion. Built by students at Dhanalakshmi College of Engineering.</p><div><a href={`mailto:${config.contactDetails.email}`}>{config.contactDetails.email}</a><a href={config.socialLinks.instagram} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={12} /></a><a href={config.socialLinks.linkedin} target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={12} /></a></div><span className="footer-copy">© {currentYear} ZETA STUDENT CLUB</span></footer>
      <AnimatePresence>{selectedChallenge && <ChallengeDetailModal challenge={selectedChallenge} isOpen onClose={() => setSelectedChallenge(null)} />}</AnimatePresence>
    </div>
  );
};

export default HomePage;
