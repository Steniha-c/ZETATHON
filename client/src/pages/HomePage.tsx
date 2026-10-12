import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' as const } },
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
          {mobileMenuOpen && <motion.nav className="mobile-links" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} aria-label="Mobile navigation">
            {nav.map(([label, id]) => <button key={id} onClick={() => scrollTo(id)}>{label}<ArrowUpRight size={14} /></button>)}
            <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Register your team <ArrowRight size={15} /></Link>
          </motion.nav>}
        </AnimatePresence>
      </header>

      <main>
        <section id="hero" className="hero-stage">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-orb hero-orb-violet" aria-hidden="true" />
          <div className="hero-orb hero-orb-cyan" aria-hidden="true" />
          <div className="hero-coordinate" aria-hidden="true">13°02′ N<br />80°11′ E</div>
          <div className="hero-content">
            {importantAnnouncement && <motion.aside className="announcement-ribbon" initial={reduceMotion ? false : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
              <span className="live-dot" /> <b>{importantAnnouncement.title}</b><span>{importantAnnouncement.content}</span>
            </motion.aside>}
            <motion.div className="hero-eyebrow" initial={reduceMotion ? false : 'hidden'} animate="visible" variants={reveal}>
              <span className="eyebrow-line" /> {config.heroBadge} <span className="eyebrow-line" />
            </motion.div>
            <motion.h1 initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.08 }}>
              <span className="hero-wordmark">ZETA<span>THON</span></span>
              <span className="hero-headline">BUILD THE FUTURE.<br /><em>BREAK THE LIMITS.</em></span>
            </motion.h1>
            <motion.p className="hero-description" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }}>
              Eight hours. One team. A real problem worth solving. Join student builders turning bold ideas into working prototypes.
            </motion.p>
            <motion.div className="hero-actions" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Link to="/register" className="button-primary">Register your team <ArrowRight size={17} /></Link>
              <button className="button-quiet" onClick={() => scrollTo('about')}>Explore the event <ArrowDown size={16} /></button>
            </motion.div>
            <div className="hero-facts" aria-label="Event information">
              <div><CalendarDays size={16} /><span><small>EVENT DATE</small><b>{dateLabel || 'To be announced'}</b></span></div>
              <div><Clock3 size={16} /><span><small>THE CHALLENGE</small><b>{duration}</b></span></div>
              <div><MapPin size={16} /><span><small>VENUE</small><b>{config.dates.venue || 'To be announced'}</b></span></div>
            </div>
          </div>
          <div className="hero-side-label" aria-hidden="true"><span>IDEATE</span><i /><span>BUILD</span><i /><span>IMPACT</span></div>
          <button className="scroll-cue" onClick={() => scrollTo('about')} aria-label="Scroll to learn about ZETATHON"><span>SCROLL TO EXPLORE</span><ArrowDown size={14} /></button>
          <span className="hero-index">01 / 06</span>
        </section>

        <section id="about" className="section about-section">
          <div className="section-kicker"><span>01</span><i /> THE IDEA</div>
          <div className="about-layout">
            <motion.h2 variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>Small window.<br /><span>Big possibility.</span></motion.h2>
            <div className="about-copy">
              <p className="about-lead">ZETATHON is an 8-hour internal hackathon by {config.organizer} at Dhanalakshmi College of Engineering.</p>
              <p>Bring different minds to one table. Choose a problem that matters, work shoulder-to-shoulder, and make an idea tangible. It’s not about having every answer before you begin—it’s about what a team can create when the clock starts.</p>
              <button className="text-link" onClick={() => scrollTo('format')}>See how the challenge works <ArrowRight size={15} /></button>
            </div>
          </div>
          <div className="about-stats">
            <div className="stat-feature"><strong>{config.stats.hours}<small>H</small></strong><span>one focused build sprint</span></div>
            <div><span className="stat-number">02</span><b>rounds</b><small>from the first idea to the build</small></div>
            <div><span className="stat-number">∞</span><b>open innovation</b><small>choose a domain that matters</small></div>
            <div className="stat-aside"><span className="status-marker" /> {config.subtitle || 'INTERNAL HACKATHON'}<br />Hosted by {config.organizer}</div>
          </div>
        </section>

        <section id="format" className="section format-section">
          <div className="section-kicker"><span>02</span><i /> THE CHALLENGE</div>
          <div className="section-heading-row">
            <h2>Two rounds.<br /><span>One meaningful build.</span></h2>
            <p>Start with the why. Then show what your team can make in a focused eight-hour sprint.</p>
          </div>
          <div className="rounds">
            <article className="round round-one">
              <div className="round-top"><span>ROUND 01</span><span className="round-symbol">01</span></div>
              <div className="round-rule" />
              <h3>IDEAS<br />THAT MATTER</h3>
              <p>Make the case for a problem worth solving. Teams register and submit a presentation or project idea for organizer review.</p>
              <ol className="round-steps">
                <li><span>01</span> Register your team</li><li><span>02</span> Submit your PPT or project idea</li><li><span>03</span> Organizers review submissions</li><li><span>04</span> Up to 30 teams shortlisted</li>
              </ol>
              <span className="round-foot">THE STARTING LINE</span>
            </article>
            <div className="round-connector" aria-hidden="true"><span><ArrowRight size={17} /></span><i /></div>
            <article className="round round-two">
              <div className="round-top"><span>ROUND 02</span><span className="round-symbol">02</span></div>
              <div className="round-rule" />
              <h3>BUILD<br />& INNOVATE</h3>
              <p>Shortlisted teams advance to the in-person hackathon: an 8-hour opportunity to turn a strong idea into a working prototype.</p>
              <div className="build-window"><Zap size={18} /><span><b>{duration} of building</b><small>{dateLabel ? `${dateLabel}${timeLabel ? ` · begins ${timeLabel}` : ''}` : 'Event date to be announced'}</small></span></div>
              <button className="text-link" onClick={() => setSelectedChallenge(config.challenges[0] || null)}>Explore the open track <ArrowUpRight size={15} /></button>
              <span className="round-foot">THE BUILD WINDOW</span>
            </article>
          </div>
          <div className="format-note"><ShieldCheck size={16} /><span>Only the event details shown in the organizer configuration are presented here. Further Round 02 deliverables and judging logistics can be confirmed by the organizers.</span></div>
        </section>

        <section id="timeline" className="section timeline-section">
          <div className="section-kicker"><span>03</span><i /> THE WHEN & WHERE</div>
          <div className="section-heading-row">
            <h2>Make the time.<br /><span>Build what’s next.</span></h2>
            <p>Configured event details at a glance. Check with the organizers if anything changes.</p>
          </div>
          <div className="event-detail-grid">
            <div className="event-detail-main"><span className="detail-label">EVENT DAY</span><CalendarDays size={22} /><strong>{dateLabel || 'Date to be announced'}</strong><span>{timeLabel ? `Starts at ${timeLabel} (IST)` : 'Schedule to be announced'}</span><div className="detail-bottom"><span>{duration.toUpperCase()} / IN-PERSON SPRINT</span><span className="detail-corner">↗</span></div></div>
            <div className="event-detail-secondary"><div className="detail-label">LOCATION</div><MapPin size={19} /><strong>{config.dates.venue || 'Venue to be announced'}</strong><span>{config.contactDetails.address}</span><a className="text-link" href={config.socialLinks.website} target="_blank" rel="noreferrer">Visit ZETA <ExternalLink size={13} /></a></div>
            <div className="event-detail-secondary"><div className="detail-label">REGISTRATION</div><UsersRound size={19} /><strong>Teams of 2–4</strong><span>Bring your collaborators and an idea you care about.</span><Link className="text-link" to="/register">Team registration <ArrowRight size={14} /></Link></div>
          </div>
          {config.timeline?.length > 0 && <div className="configured-timeline"><p className="detail-label">ORGANIZER-PUBLISHED PHASES</p><div className="timeline-track">{config.timeline.map((phase, index) => <div className="timeline-stop" key={phase.id}><span className="timeline-dot">{String(index + 1).padStart(2, '0')}</span><div><small>{phase.time || phase.phaseId || `PHASE ${String(index + 1).padStart(2, '0')}`}</small><b>{phase.title}</b><p>{phase.description}</p></div></div>)}</div></div>}
        </section>

        <section id="rules" className="section guidelines-section">
          <div className="section-kicker"><span>04</span><i /> THE GROUND RULES</div>
          <div className="section-heading-row"><h2>Room for ideas.<br /><span>Clarity for everyone.</span></h2><p>A good challenge starts with a fair playing field. Read the configured rules before you register.</p></div>
          {hasScheduleConflict && <div className="format-note rules-note"><ShieldCheck size={16} /><span>The configured event runs for {duration} beginning at {timeLabel || 'the configured start time'}, while one published development rule gives a different start time. Please confirm the final build window with the organizers.</span></div>}
          <div className="rules-list">{config.rules.map((rule, index) => {
            const isWindowRule = /development window/i.test(rule.title);
            const details = isWindowRule ? rule.details.filter((detail) => !/10:00\s*AM/i.test(detail)) : rule.details;
            const summary = isWindowRule ? rule.summary.replace(/10:00 AM to 05:00 PM/i, 'the organizer-confirmed build window') : rule.summary;
            return <article className="rule-row" key={rule.id}><span className="rule-index">0{index + 1}</span><div><small>{rule.category}</small><h3>{rule.title}</h3><p>{summary}</p></div><ul>{details.map((detail, i) => <li key={i}><Check size={14} />{detail}</li>)}</ul></article>;
          })}</div>
          <div className="eligibility-band"><UsersRound size={19} /><span><b>Team composition</b> — Teams of 2–4 students; cross-department and inter-year teams are encouraged, per the published rules.</span></div>
        </section>

        <section id="faq" className="section faq-section">
          <div className="section-kicker"><span>05</span><i /> QUESTIONS, ANSWERED</div>
          <div className="faq-layout"><div><h2>Good questions.<br /><span>Honest answers.</span></h2><p>Still unsure? Reach out to the ZETA team using the verified contact below.</p><a className="text-link" href={`mailto:${config.contactDetails.email}`}>Contact the organizers <ArrowUpRight size={15} /></a></div>
            <div className="faq-list">{displayedFaqs.map((faq) => <article className={`faq-item ${activeFaq === faq.id ? 'is-open' : ''}`} key={faq.id}><button aria-expanded={activeFaq === faq.id} onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}><span>{faq.question}</span><ChevronDown size={17} /></button><AnimatePresence initial={false}>{activeFaq === faq.id && <motion.div className="faq-answer" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p>{faq.answer}</p></motion.div>}</AnimatePresence></article>)}</div>
          </div>
        </section>

        <section className="register-cta">
          <div className="cta-grid" aria-hidden="true" />
          <div className="section-kicker"><span>06</span><i /> YOUR MOVE</div>
          <h2>Build something<br /><span>that matters.</span></h2>
          <p>Bring your people. Bring your curiosity. The first step is putting your team together.</p>
          <Link to="/register" className="button-primary">Register your team <ArrowRight size={17} /></Link>
          <small>TEAM SIZE: 2–4 / EVENT DURATION: {duration.toUpperCase()}</small>
        </section>
      </main>
      <footer className="home-footer"><Link className="site-brand" to="/"><img src="/zeta-logo.jpg" alt="" /><span><strong>ZETA<span className="brand-light">THON</span></strong><small>{config.organizer}</small></span></Link><p>Ideas in motion. Built by students at Dhanalakshmi College of Engineering.</p><div><a href={`mailto:${config.contactDetails.email}`}>{config.contactDetails.email}</a><a href={config.socialLinks.instagram} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={12} /></a><a href={config.socialLinks.linkedin} target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={12} /></a></div><span className="footer-copy">© {currentYear} ZETA STUDENT CLUB</span></footer>
      <AnimatePresence>{selectedChallenge && <ChallengeDetailModal challenge={selectedChallenge} isOpen onClose={() => setSelectedChallenge(null)} />}</AnimatePresence>
    </div>
  );
};

export default HomePage;
