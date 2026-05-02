import heroImage from "@/assets/hero.jpg";
import { ArrowUpRight, Sunrise, Clock, FileText, Search, Database, Calendar, Rss, BookOpen, ShieldCheck, Eye, MessageSquare, Languages } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";

const LangSwitch = ({ variant = "default" }: { variant?: "default" | "light" }) => {
  const { lang, setLang } = useLang();
  const base = variant === "light" ? "text-primary-foreground/70" : "text-muted-foreground";
  const active = variant === "light" ? "text-primary-foreground" : "text-primary";
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium tracking-wider ${base}`}>
      <Languages className="h-3.5 w-3.5 mr-1 opacity-70" />
      <button
        onClick={() => setLang("ja")}
        className={`px-1.5 py-0.5 transition-colors ${lang === "ja" ? `${active} font-bold` : "hover:opacity-100 opacity-60"}`}
        aria-pressed={lang === "ja"}
      >JA</button>
      <span className="opacity-30">/</span>
      <button
        onClick={() => setLang("en")}
        className={`px-1.5 py-0.5 transition-colors ${lang === "en" ? `${active} font-bold` : "hover:opacity-100 opacity-60"}`}
        aria-pressed={lang === "en"}
      >EN</button>
    </div>
  );
};

const Nav = () => {
  const { tr, lang } = useLang();
  const titleClass = lang === "ja" ? "font-serif-jp" : "font-serif-jp";
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b hairline">
      <div className="container-narrow flex h-16 items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2.5 font-display font-bold text-lg text-primary">
          <span className="grid place-items-center h-8 w-8 rounded-sm bg-primary text-primary-foreground text-xs tracking-widest">T</span>
          TOMO
        </a>
        <nav className={`hidden md:flex items-center gap-8 text-sm text-muted-foreground ${titleClass}`}>
          <a href="#about" className="hover:text-primary transition-colors">{tr("nav_about")}</a>
          <a href="#citizen" className="hover:text-primary transition-colors">{tr("nav_citizen")}</a>
          <a href="#politician" className="hover:text-primary transition-colors">{tr("nav_politician")}</a>
          <a href="#tech" className="hover:text-primary transition-colors">{tr("nav_tech")}</a>
          <a href="#vision" className="hover:text-primary transition-colors">{tr("nav_vision")}</a>
        </nav>
        <div className="flex items-center gap-4">
          <LangSwitch />
          <a href="#contact" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 bg-primary text-primary-foreground hover:bg-primary-glow transition-colors">
            {tr("nav_cta")} <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
};

const Hero = () => {
  const { tr, lang } = useLang();
  return (
    <section id="top" className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute inset-0 grid-bg opacity-40" />
      <img
        src={heroImage}
        alt="TOMO interface"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity"
      />
      <div className="absolute inset-0 bg-gradient-overlay" />

      <div className="container-narrow relative py-32 md:py-40">
        <div className="reveal flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-primary-foreground/70 mb-8">
          <span className="h-px w-10 bg-primary-foreground/40" />
          {tr("hero_kicker")}
        </div>

        <h1 className="reveal reveal-delay-1 font-serif-jp font-bold text-primary-foreground text-balance text-4xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight max-w-5xl">
          {lang === "ja" ? (
            <>{tr("hero_title_1")}<br /><span className="text-accent">{tr("hero_title_2")}</span>{tr("hero_title_3")}</>
          ) : (
            <>{tr("hero_title_1")}<br /><span className="text-accent">{tr("hero_title_2")}</span>{tr("hero_title_3")}</>
          )}
        </h1>

        <p className="reveal reveal-delay-2 mt-8 max-w-2xl text-base md:text-lg text-primary-foreground/80 leading-relaxed">
          {tr("hero_sub")}
        </p>

        <div className="reveal reveal-delay-3 mt-12 flex flex-wrap gap-4">
          <a href="#about" className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary-foreground text-primary font-medium hover:bg-accent hover:text-accent-foreground transition-all">
            {tr("hero_cta_1")} <ArrowUpRight className="h-4 w-4" />
          </a>
          <a href="#politician" className="inline-flex items-center gap-2 px-7 py-3.5 border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 transition-all">
            {tr("hero_cta_2")}
          </a>
        </div>

        <div className="reveal reveal-delay-3 mt-24 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 max-w-3xl">
          {[
            ["24/7", tr("stat_1")],
            ["3min", tr("stat_2")],
            ["RSS×AI", tr("stat_3")],
            ["100%", tr("stat_4")],
          ].map(([n, l]) => (
            <div key={l} className="border-l-2 border-accent pl-4">
              <div className="font-display text-2xl md:text-3xl font-bold text-primary-foreground">{n}</div>
              <div className="text-xs text-primary-foreground/60 mt-1 tracking-wider">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-primary-foreground/50 text-[10px] tracking-[0.3em]">{tr("scroll")}</div>
    </section>
  );
};

const SectionLabel = ({ num, label }: { num: string; label: string }) => (
  <div className="flex items-center gap-4 mb-8">
    <span className="font-display text-xs tabular-nums text-accent font-semibold tracking-widest">{num}</span>
    <span className="h-px w-12 bg-hairline" />
    <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground">{label}</span>
  </div>
);

const About = () => {
  const { tr } = useLang();
  const issues = [
    { t: tr("issue_1_t"), d: tr("issue_1_d") },
    { t: tr("issue_2_t"), d: tr("issue_2_d") },
    { t: tr("issue_3_t"), d: tr("issue_3_d") },
  ];
  return (
    <section id="about" className="py-28 md:py-36 bg-background">
      <div className="container-narrow">
        <SectionLabel num="01" label={tr("about_label")} />
        <h2 className="font-serif-jp text-3xl md:text-5xl font-bold text-primary text-balance leading-tight max-w-4xl">
          {tr("about_title_1")}<br />{tr("about_title_2")}
        </h2>
        <p className="mt-8 text-muted-foreground leading-loose max-w-3xl">{tr("about_lead")}</p>

        <div className="mt-16 grid md:grid-cols-3 gap-px bg-hairline border hairline">
          {issues.map((c, i) => (
            <div key={c.t} className="bg-background p-8 md:p-10">
              <div className="font-display text-xs text-accent font-bold mb-4">{tr("issue")} 0{i + 1}</div>
              <h3 className="font-serif-jp text-xl font-bold text-primary mb-4">{c.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>

        <blockquote className="mt-20 border-l-4 border-accent pl-8 max-w-3xl">
          <p className="font-serif-jp text-xl md:text-2xl text-primary leading-relaxed">
            {tr("about_quote")}
          </p>
        </blockquote>
      </div>
    </section>
  );
};

const Citizen = () => {
  const { tr } = useLang();
  const cards = [
    { icon: MessageSquare, t: tr("c1_t"), d: tr("c1_d") },
    { icon: Eye, t: tr("c2_t"), d: tr("c2_d") },
    { icon: ShieldCheck, t: tr("c3_t"), d: tr("c3_d") },
  ];
  return (
    <section id="citizen" className="py-28 md:py-36 bg-surface">
      <div className="container-narrow">
        <SectionLabel num="02" label={tr("citizen_label")} />
        <div className="grid lg:grid-cols-12 gap-12 items-end mb-16">
          <h2 className="lg:col-span-7 font-serif-jp text-3xl md:text-5xl font-bold text-primary text-balance leading-tight">
            {tr("citizen_title_1")}<br />{tr("citizen_title_2")}
          </h2>
          <p className="lg:col-span-5 text-muted-foreground leading-loose">{tr("citizen_lead")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map(({ icon: Icon, t, d }) => (
            <article key={t} className="group bg-background border hairline p-8 hover:shadow-elegant transition-all duration-500">
              <Icon className="h-8 w-8 text-accent mb-6" strokeWidth={1.5} />
              <h3 className="font-serif-jp text-xl font-bold text-primary mb-3">{t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
              <div className="mt-6 h-px bg-hairline group-hover:bg-accent transition-colors" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

const Politician = () => {
  const { tr } = useLang();
  const items = [
    { time: "08:00", icon: Sunrise, t: tr("p1_t"), sub: tr("p1_s"), d: tr("p1_d") },
    { time: "T-30min", icon: Clock, t: tr("p2_t"), sub: tr("p2_s"), d: tr("p2_d") },
    { time: "20:00", icon: FileText, t: tr("p3_t"), sub: tr("p3_s"), d: tr("p3_d") },
    { time: "/cmd", icon: Search, t: tr("p4_t"), sub: tr("p4_s"), d: tr("p4_d") },
    { time: "AUTO", icon: BookOpen, t: tr("p5_t"), sub: tr("p5_s"), d: tr("p5_d") },
  ];
  return (
    <section id="politician" className="py-28 md:py-36 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-mesh opacity-60" />
      <div className="container-narrow relative">
        <div className="flex items-center gap-4 mb-8">
          <span className="font-display text-xs tabular-nums text-accent font-semibold tracking-widest">03</span>
          <span className="h-px w-12 bg-primary-foreground/30" />
          <span className="text-xs tracking-[0.25em] uppercase text-primary-foreground/60">{tr("pol_label")}</span>
        </div>

        <h2 className="font-serif-jp text-3xl md:text-5xl font-bold text-balance leading-tight max-w-4xl">
          {tr("pol_title_1")}<br />{tr("pol_title_2")}
        </h2>
        <p className="mt-8 text-primary-foreground/70 leading-loose max-w-3xl">{tr("pol_lead")}</p>

        <div className="mt-20 space-y-px bg-primary-foreground/10">
          {items.map(({ time, icon: Icon, t, sub, d }) => (
            <div key={t} className="grid md:grid-cols-12 gap-6 bg-primary p-8 md:p-10 items-start hover:bg-primary-glow/20 transition-colors group">
              <div className="md:col-span-2 flex items-center gap-3">
                <span className="pulse-dot h-2 w-2 rounded-full bg-accent" />
                <span className="font-display text-sm font-bold tabular-nums text-accent tracking-wider">{time}</span>
              </div>
              <div className="md:col-span-1">
                <Icon className="h-6 w-6 text-primary-foreground/80" strokeWidth={1.5} />
              </div>
              <div className="md:col-span-4">
                <h3 className="font-serif-jp text-xl font-bold">{t}</h3>
                <div className="text-xs text-primary-foreground/50 tracking-widest mt-1 uppercase">{sub}</div>
              </div>
              <p className="md:col-span-5 text-sm text-primary-foreground/70 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const DataIntegration = () => {
  const { tr } = useLang();
  const items = [
    { icon: Rss, t: tr("di_1_t"), d: tr("di_1_d") },
    { icon: Calendar, t: tr("di_2_t"), d: tr("di_2_d") },
    { icon: Database, t: tr("di_3_t"), d: tr("di_3_d") },
  ];
  return (
    <section className="py-28 md:py-36 bg-background">
      <div className="container-narrow">
        <SectionLabel num="04" label={tr("di_label")} />
        <h2 className="font-serif-jp text-3xl md:text-5xl font-bold text-primary text-balance leading-tight max-w-4xl">
          {tr("di_title_1")}<br />{tr("di_title_2")}
        </h2>

        <div className="mt-16 grid md:grid-cols-3 gap-px bg-hairline border hairline">
          {items.map(({ icon: Icon, t, d }) => (
            <div key={t} className="bg-background p-10 group">
              <Icon className="h-7 w-7 text-primary mb-8 group-hover:text-accent transition-colors" strokeWidth={1.5} />
              <h3 className="font-serif-jp text-lg font-bold text-primary mb-4 leading-snug">{t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TechStack = () => {
  const { tr } = useLang();
  const stack = [
    [tr("tech_cat_1"), "Next.js (App Router), TypeScript", tr("tech_role_1")],
    [tr("tech_cat_2"), "Python, Claude API (OpenClaw)", tr("tech_role_2")],
    [tr("tech_cat_3"), "SadTalker, edge-tts", tr("tech_role_3")],
    [tr("tech_cat_4"), "Google API (Gmail, Calendar, Tasks)", tr("tech_role_4")],
    [tr("tech_cat_5"), "Telegram Bot API", tr("tech_role_5")],
    [tr("tech_cat_6"), "RSS feeds, Obsidian Markdown", tr("tech_role_6")],
  ];
  return (
    <section id="tech" className="py-28 md:py-36 bg-surface">
      <div className="container-narrow">
        <SectionLabel num="05" label={tr("tech_label")} />
        <h2 className="font-serif-jp text-3xl md:text-5xl font-bold text-primary text-balance leading-tight max-w-4xl mb-16">
          {tr("tech_title_1")}<br />{tr("tech_title_2")}
        </h2>

        <div className="border-t border-primary">
          {stack.map(([cat, tech, role]) => (
            <div key={cat} className="grid md:grid-cols-12 gap-4 py-7 border-b hairline group hover:bg-background transition-colors px-4 -mx-4">
              <div className="md:col-span-3 text-xs tracking-[0.2em] uppercase text-muted-foreground font-semibold">{cat}</div>
              <div className="md:col-span-5 font-display font-semibold text-primary group-hover:text-accent transition-colors">{tech}</div>
              <div className="md:col-span-4 text-sm text-muted-foreground">{role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Vision = () => {
  const { tr } = useLang();
  return (
    <section id="vision" className="py-28 md:py-36 bg-background">
      <div className="container-narrow">
        <SectionLabel num="06" label={tr("vision_label")} />

        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <div className="text-xs tracking-[0.2em] text-accent font-bold mb-4">{tr("v_for_pol")}</div>
            <h3 className="font-serif-jp text-2xl md:text-3xl font-bold text-primary mb-8 leading-snug">{tr("v_pol_t")}</h3>
            <ul className="space-y-5 text-muted-foreground">
              <li className="flex gap-4"><span className="font-display text-accent font-bold">→</span><span><strong className="text-primary">{tr("v_pol_1_h")}</strong>{tr("v_pol_1_d")}</span></li>
              <li className="flex gap-4"><span className="font-display text-accent font-bold">→</span><span><strong className="text-primary">{tr("v_pol_2_h")}</strong>{tr("v_pol_2_d")}</span></li>
            </ul>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] text-accent font-bold mb-4">{tr("v_for_cit")}</div>
            <h3 className="font-serif-jp text-2xl md:text-3xl font-bold text-primary mb-8 leading-snug">{tr("v_cit_t")}</h3>
            <ul className="space-y-5 text-muted-foreground">
              <li className="flex gap-4"><span className="font-display text-accent font-bold">→</span><span><strong className="text-primary">{tr("v_cit_1_h")}</strong>{tr("v_cit_1_d")}</span></li>
              <li className="flex gap-4"><span className="font-display text-accent font-bold">→</span><span><strong className="text-primary">{tr("v_cit_2_h")}</strong>{tr("v_cit_2_d")}</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-24 bg-gradient-hero text-primary-foreground p-10 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="relative max-w-3xl">
            <div className="text-xs tracking-[0.3em] text-accent mb-6">{tr("vision_kicker")}</div>
            <h3 className="font-serif-jp text-2xl md:text-4xl font-bold leading-tight mb-6 text-balance">
              {tr("vision_t_1")}<br />{tr("vision_t_2")}
            </h3>
            <p className="text-primary-foreground/80 leading-loose">{tr("vision_d")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const CTA = () => {
  const { tr } = useLang();
  return (
    <section id="contact" className="py-28 md:py-36 bg-surface border-t hairline">
      <div className="container-narrow text-center max-w-3xl">
        <h2 className="font-serif-jp text-3xl md:text-5xl font-bold text-primary text-balance leading-tight">
          {tr("cta_t")}
        </h2>
        <p className="mt-6 text-muted-foreground leading-loose">{tr("cta_d")}</p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <a href="mailto:contact@tomo.example" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground hover:bg-primary-glow transition-colors font-medium">
            {tr("cta_1")} <ArrowUpRight className="h-4 w-4" />
          </a>
          <a href="#top" className="inline-flex items-center gap-2 px-8 py-4 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors font-medium">
            {tr("cta_2")}
          </a>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  const { tr } = useLang();
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container-narrow">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 font-display font-bold text-lg">
              <span className="grid place-items-center h-8 w-8 rounded-sm bg-primary-foreground text-primary text-xs tracking-widest">T</span>
              TOMO
            </div>
            <p className="mt-4 text-sm text-primary-foreground/60 max-w-sm leading-relaxed">{tr("ft_lead")}</p>
            <div className="mt-6"><LangSwitch variant="light" /></div>
          </div>
          <div className="md:col-span-7 grid grid-cols-3 gap-6 text-sm">
            <div>
              <div className="text-xs tracking-widest text-primary-foreground/40 uppercase mb-4">{tr("ft_product")}</div>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="#citizen" className="hover:text-accent">{tr("nav_citizen")}</a></li>
                <li><a href="#politician" className="hover:text-accent">{tr("nav_politician")}</a></li>
                <li><a href="#tech" className="hover:text-accent">{tr("nav_tech")}</a></li>
              </ul>
            </div>
            <div>
              <div className="text-xs tracking-widest text-primary-foreground/40 uppercase mb-4">{tr("ft_company")}</div>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="#about" className="hover:text-accent">{tr("nav_about")}</a></li>
                <li><a href="#vision" className="hover:text-accent">{tr("nav_vision")}</a></li>
              </ul>
            </div>
            <div>
              <div className="text-xs tracking-widest text-primary-foreground/40 uppercase mb-4">{tr("ft_contact")}</div>
              <ul className="space-y-2 text-primary-foreground/80">
                <li>contact@tomo.example</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-primary-foreground/10 flex flex-wrap justify-between text-xs text-primary-foreground/40">
          <div>{tr("ft_copy")}</div>
          <div>{tr("ft_tag")}</div>
        </div>
      </div>
    </footer>
  );
};

const Index = () => (
  <main className="min-h-screen bg-background">
    <Nav />
    <Hero />
    <About />
    <Citizen />
    <Politician />
    <DataIntegration />
    <TechStack />
    <Vision />
    <CTA />
    <Footer />
  </main>
);

export default Index;
