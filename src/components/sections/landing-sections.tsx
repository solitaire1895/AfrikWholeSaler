"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Play, Pause } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Accordion } from "@/components/ui/accordion";
import {
  testimonials,
  faqs,
  stats,
  sourcingSteps,
  howItWorksSteps,
  valueProps,
} from "@/lib/data";
import { cn, formatNumber } from "@/lib/utils";
import type { Product, Category } from "@/types";
import { useI18n } from "@/i18n/client";
import { categoryName } from "@/i18n/names";

/** Looks up a text by id, keeping the original if there is no translation. */
function pick<T>(map: unknown, id: string, fallback: T): T {
  return ((map as Record<string, T>)[id] ?? fallback) as T;
}

// ========================================================
// Editorial primitives
// ========================================================

// --- Motion hooks ---

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Flips to true (once) when the element scrolls into view. */
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

/**
 * Calls `apply(progress, el)` on every scroll frame, where progress runs
 * 0 → 1 as the element travels from the bottom of the viewport to the top.
 * Writes straight to the DOM, so scrolling never re-renders React.
 */
function useScrollProgress<T extends HTMLElement>(
  apply: (progress: number, el: T) => void
) {
  const ref = useRef<T>(null);
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh - rect.top) / (vh + rect.height);
      applyRef.current(Math.min(1, Math.max(0, p)), el);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return ref;
}

/**
 * Mixed-type display headline: plain words render as uppercase sans,
 * words wrapped in *asterisks* render as lowercase italic serif,
 * words wrapped in _underscores_ render as italic serif in the accent colour.
 * A "/" starts a new line.
 *
 * Like the template, letters rise into place one after another when the
 * headline scrolls into view.
 */
function Display({
  text,
  as: Tag = "h2",
  className,
  serifClass,
  accentClass = "text-brand",
}: {
  text: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  serifClass?: string;
  accentClass?: string;
}) {
  const [ref, inView] = useInView<HTMLHeadingElement>(0.2);
  let letterIndex = 0;

  // Latin words stay whole; each CJK character is its own unit so Chinese can wrap.
  const renderWords = (chunk: string) =>
    (chunk.match(/\s+|[\u3000-\u9fff\uff00-\uffef]|[^\s\u3000-\u9fff\uff00-\uffef]+/g) ?? [])
      .map((word, wi) => {
        if (/^\s+$/.test(word)) return " ";
        return (
          // Each word clips its own letters so they rise out of a mask.
          <span
            key={wi}
            className="inline-block overflow-hidden whitespace-nowrap pb-[0.12em] -mb-[0.12em] pr-[0.04em] align-bottom"
          >
            {Array.from(word).map((ch, ci) => {
              const delay = Math.min(letterIndex++ * 22, 900);
              return (
                <span
                  key={ci}
                  style={{ transitionDelay: `${delay}ms` }}
                  className={cn(
                    "inline-block transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0 motion-reduce:transition-none",
                    inView ? "translate-y-0" : "translate-y-[110%]"
                  )}
                >
                  {ch}
                </span>
              );
            })}
          </span>
        );
      });

  return (
    <Tag
      ref={ref}
      aria-label={text.replace(/[*_/]/g, "").replace(/\s+/g, " ").trim()}
      className={cn(
        "font-semibold uppercase tracking-[-0.03em] leading-[0.95] text-navy",
        className
      )}
    >
      {text.split("/").map((line, li) => (
        <span key={li} aria-hidden className="block">
          {line
            .trim()
            .split(/(\*[^*]+\*|_[^_]+_)/)
            .filter(Boolean)
            .map((part, i) => {
              if (part.startsWith("*") || part.startsWith("_")) {
                return (
                  <em
                    key={i}
                    className={cn(
                      "font-serif font-normal normal-case italic tracking-[-0.01em]",
                      part.startsWith("_") ? accentClass : serifClass
                    )}
                  >
                    {renderWords(part.slice(1, -1))}
                  </em>
                );
              }
              return <span key={i}>{renderWords(part)}</span>;
            })}
        </span>
      ))}
    </Tag>
  );
}

/**
 * Image that drifts slower than the page (parallax) and settles from a
 * slight zoom as it enters — the template's image motion.
 */
function ParallaxImage({
  src,
  alt,
  sizes,
  className,
  strength = 60,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  strength?: number;
  priority?: boolean;
}) {
  const ref = useScrollProgress<HTMLDivElement>((p, el) => {
    const inner = el.firstElementChild as HTMLElement | null;
    if (inner) inner.style.transform = `translate3d(0, ${(0.5 - p) * strength * 2}px, 0)`;
  });
  const [viewRef, inView] = useInView<HTMLDivElement>(0.1);

  return (
    <div ref={viewRef} className={cn("relative overflow-hidden", className)}>
      <div ref={ref} className="absolute inset-0">
        <div
          className="absolute inset-x-0 will-change-transform"
          style={{ top: -strength, bottom: -strength }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className={cn(
              "object-cover transition-[transform,filter] duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
              inView ? "scale-100 blur-0" : "scale-[1.15] blur-[6px]"
            )}
          />
        </div>
      </div>
    </div>
  );
}

/** Small label above a section: "— 01 · The process" */
function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.25em]",
        light ? "text-white/60" : "text-text-secondary"
      )}
    >
      <span className={cn("h-px w-8", light ? "bg-white/40" : "bg-navy/30")} />
      {children}
    </p>
  );
}

/** Understated text link with an arrow and animated underline. */
function TextLink({
  href,
  children,
  light,
}: {
  href: string;
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.15em]",
        light ? "text-white" : "text-navy"
      )}
    >
      <span className="relative">
        {children}
        <span
          className={cn(
            "absolute -bottom-1 left-0 h-px w-full origin-left scale-x-100 transition-transform duration-500 group-hover:scale-x-0",
            light ? "bg-white/60" : "bg-navy/40"
          )}
        />
      </span>
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

/** Solid pill CTA in brand red. */
function PillLink({
  href,
  children,
  variant = "brand",
}: {
  href: string;
  children: ReactNode;
  variant?: "brand" | "light";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex h-12 items-center gap-3 rounded-full pl-6 pr-2 text-sm font-semibold uppercase tracking-[0.12em] transition-colors",
        variant === "brand"
          ? "bg-brand text-white hover:bg-brand-hover"
          : "bg-white text-navy hover:bg-cream"
      )}
    >
      {children}
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-[-45deg]",
          variant === "brand" ? "bg-white text-brand" : "bg-brand text-white"
        )}
      >
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

/**
 * Reveals children once they scroll into view.
 * "rise": fade + lift + un-blur (default). "scale": grows from 80% like the
 * template's product cards.
 */
function Reveal({
  children,
  className,
  delay = 0,
  variant = "rise",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "rise" | "scale";
}) {
  const [ref, visible] = useInView<HTMLDivElement>(0.15);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-[opacity,transform,filter] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        visible
          ? "translate-y-0 scale-100 opacity-100 blur-0"
          : variant === "scale"
            ? "scale-[0.8] opacity-0"
            : "translate-y-10 opacity-0 blur-[6px]",
        className
      )}
    >
      {children}
    </div>
  );
}

// --- Animated Counter ---
function AnimatedCounter({
  value,
  suffix,
  duration = 2000,
}: {
  value: number;
  suffix: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = Date.now();
          const animate = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
            else setCount(value);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {formatNumber(count)}
      {suffix}
    </span>
  );
}

const container = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

// ========================================================
// Section: Hero
// ========================================================
export function HeroSection() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  // Scroll-driven media: the frame grows to full width and its corners
  // square off as it rises to the top, while the footage zooms out.
  const mediaRef = useScrollProgress<HTMLDivElement>((_, el) => {
    const frame = el.firstElementChild as HTMLElement | null;
    const video = frame?.querySelector("video");
    if (!frame) return;
    const vh = window.innerHeight;
    const top = el.getBoundingClientRect().top;
    const q = Math.min(1, Math.max(0, 1 - top / (vh * 0.85)));
    frame.style.transform = `scale(${0.9 + 0.1 * q})`;
    frame.style.borderRadius = `${40 - 28 * q}px`;
    if (video) video.style.transform = `scale(${1.1 - 0.1 * q})`;
  });

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section className="relative bg-cream pt-28 pb-20 sm:pt-36 sm:pb-32">
      <div className={container}>
        <Reveal>
          <Eyebrow>{t.landing.hero.eyebrow}</Eyebrow>
        </Reveal>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <Display
              as="h1"
              text={t.landing.hero.title}
              className="text-[13vw] sm:text-7xl lg:text-[6.5rem]"
            />
          </div>

          <Reveal className="lg:col-span-4 lg:pb-3" delay={250}>
            <p className="font-serif text-xl italic leading-snug text-navy/80 sm:text-2xl">
              {t.landing.hero.lead}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <PillLink href="/quote">{t.landing.hero.requestQuote}</PillLink>
              <TextLink href="/products">{t.landing.hero.browse}</TextLink>
            </div>
            <MobileMoneyStrip />
          </Reveal>
        </div>
      </div>

      {/* Full-width media */}
      <Reveal className="mt-14 sm:mt-20" delay={350}>
        <div ref={mediaRef} className="px-4 sm:px-6 lg:px-8">
          <div
            className="relative mx-auto aspect-[4/5] max-w-[1600px] overflow-hidden rounded-[28px] bg-navy will-change-transform sm:aspect-[16/8]"
            style={{ transform: "scale(0.9)" }}
          >
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full scale-110 object-cover will-change-transform"
              src="/landing/hero.mp4"
              poster="/landing/courier.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-10">
              <p className="max-w-md font-serif text-2xl italic leading-tight text-white sm:text-3xl">
                {t.landing.hero.quote}
              </p>
              <div className="flex items-center gap-4">
                <span className="hidden text-[11px] uppercase tracking-[0.25em] text-white/70 sm:block">
                  {t.landing.hero.trusted}
                </span>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={playing ? t.landing.hero.pauseVideo : t.landing.hero.playVideo}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ========================================================
// Mobile money — the payment methods African businesses actually use
// ========================================================
const mobileMoney = [
  // `logo` is the full wordmark for large tiles; `icon` is a square mark for small spots.
  { id: "orange", name: "Orange Money", logo: "/landing/pay/orange-money.png", icon: "/landing/pay/orange-icon.png", bg: "#ffffff", pad: "p-3" },
  { id: "mtn", name: "MTN MoMo", logo: "/landing/pay/mtn-momo.png", icon: "/landing/pay/mtn-icon.png", bg: "#ffcb01", pad: "p-0" },
  { id: "moov", name: "Moov Money", logo: "/landing/pay/moov-money.png", icon: "/landing/pay/moov-money.png", bg: "#ffffff", pad: "p-1" },
  { id: "wave", name: "Wave", logo: "/landing/pay/wave.png", icon: "/landing/pay/wave.png", bg: "#1dc8ff", pad: "p-1" },
];

function PayLogo({
  method,
  className,
  small,
}: {
  method: (typeof mobileMoney)[number];
  className?: string;
  small?: boolean;
}) {
  return (
    <span
      className={cn("relative block overflow-hidden", !small && method.pad, className)}
      style={{ backgroundColor: method.bg }}
    >
      <span className="relative block h-full w-full">
        <Image
          src={small ? method.icon : method.logo}
          alt={method.name}
          fill
          sizes={small ? "48px" : "240px"}
          className="object-contain"
        />
      </span>
    </span>
  );
}

/** Compact logo row, used under the hero CTAs. */
function MobileMoneyStrip() {
  const { t } = useI18n();
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <span className="text-[11px] uppercase tracking-[0.2em] text-text-secondary">
        {t.landing.hero.payWith}
      </span>
      <div className="flex items-center -space-x-2">
        {mobileMoney.map((m) => (
          <PayLogo
            key={m.id}
            method={m}
            small
            className="h-9 w-9 rounded-full border-2 border-cream shadow-sm"
          />
        ))}
      </div>
      <a
        href="#mobile-money"
        className="text-xs font-medium text-navy underline decoration-navy/30 underline-offset-4 hover:decoration-brand"
      >
        Mobile Money
      </a>
    </div>
  );
}

/** Phone mock-up that cycles through operators, showing the checkout flow. */
function PhoneCheckout() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((a) => (a + 1) % mobileMoney.length), 2200);
    return () => clearInterval(id);
  }, []);

  const selected = mobileMoney[active];
  const { t, format } = useI18n();
  const p = t.landing.payments;

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* Glow */}
      <div className="absolute -inset-10 rounded-full bg-brand/30 blur-3xl" aria-hidden />
      <div className="relative rounded-[44px] border-[10px] border-[#05070d] bg-white shadow-2xl">
        <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-[#05070d]" />
        <div className="px-5 pb-6 pt-10 text-navy">
          <div className="flex items-center justify-between text-[11px] text-text-secondary">
            <span>{p.phoneOrder}</span>
            <span className="rounded-full bg-success/10 px-2 py-0.5 font-medium text-success">
              {p.phoneSecure}
            </span>
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-text-secondary">
            {p.phoneAmountDue}
          </p>
          <p className="font-serif text-4xl [font-variant-numeric:lining-nums]">
            1 250 000 <span className="text-lg text-text-secondary">FCFA</span>
          </p>

          <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-text-secondary">
            {p.phoneChoose}
          </p>
          <ul className="mt-3 space-y-2">
            {mobileMoney.map((m, i) => (
              <li
                key={m.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-2 transition-all duration-500",
                  i === active ? "border-brand bg-brand-light" : "border-border"
                )}
              >
                <PayLogo method={m} small className="h-9 w-9 shrink-0 rounded-xl" />
                <span className="flex-1 text-sm font-medium">{m.name}</span>
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors",
                    i === active ? "border-brand" : "border-border"
                  )}
                >
                  {i === active && <span className="h-2 w-2 rounded-full bg-brand" />}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex h-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
            {format(p.phonePayWith, { name: selected.name })}
          </div>
          <p className="mt-3 text-center text-[11px] text-text-secondary">
            {p.phoneConfirm}
          </p>
        </div>
      </div>
    </div>
  );
}

export function MobilePaymentsSection() {
  const { t } = useI18n();
  const p = t.landing.payments;
  const points = [
    { title: p.point1Title, text: p.point1Text },
    { title: p.point2Title, text: p.point2Text },
    { title: p.point3Title, text: p.point3Text },
  ];

  return (
    <section
      id="mobile-money"
      className="relative scroll-mt-20 overflow-hidden bg-navy py-24 text-white sm:py-36"
    >
      {/* Brand glow */}
      <div
        className="absolute inset-0 opacity-40"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% 30%, rgba(214,40,40,0.35) 0%, transparent 45%), radial-gradient(circle at 10% 90%, rgba(244,180,0,0.18) 0%, transparent 40%)",
        }}
      />

      <div className={cn(container, "relative")}>
        <div className="grid items-center gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <Eyebrow light>{p.eyebrow}</Eyebrow>
              <Display
                text={p.title}
                serifClass="text-gold"
                className="mt-6 text-[14vw] leading-[0.9] tracking-[-0.04em] text-white sm:text-8xl lg:text-[6.75rem]"
              />
              <p className="mt-6 font-serif text-3xl italic leading-tight text-white/80 sm:text-4xl">
                {p.wayBefore} <span className="text-gold">{p.africa}</span>{p.wayAfter.startsWith(".") ? "" : " "}
                {p.wayAfter}
              </p>
            </Reveal>

            <Reveal delay={150}>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                {p.lead}
              </p>
            </Reveal>

            {/* Operator tiles */}
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {mobileMoney.map((m, i) => (
                <Reveal key={m.id} delay={200 + i * 100}>
                  <div className="group">
                    <PayLogo
                      method={m}
                      className="aspect-[4/3] rounded-2xl ring-1 ring-white/10 transition-transform duration-500 group-hover:-translate-y-1"
                    />
                    <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/60">
                      {m.name}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal className="lg:col-span-5" delay={200}>
            <PhoneCheckout />
          </Reveal>
        </div>

        <div className="mt-20 grid border-t border-white/15 sm:grid-cols-3">
          {points.map((p, i) => (
            <Reveal
              key={p.title}
              delay={i * 100}
              className={cn("border-b border-white/15 py-8 sm:border-b-0 sm:px-8 sm:first:pl-0", i > 0 && "sm:border-l")}
            >
              <span className="font-serif text-lg italic text-gold">
                ({String(i + 1).padStart(2, "0")})
              </span>
              <h3 className="mt-3 text-xl font-semibold uppercase tracking-tight">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{p.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14 flex flex-wrap items-center gap-6">
          <PillLink href="/products" variant="light">
            {p.startOrder}
          </PillLink>
          <TextLink href="/quote" light>
            {p.requestQuote}
          </TextLink>
        </Reveal>
      </div>
    </section>
  );
}

// ========================================================
// Section: Statement + Stats
// ========================================================
export function StatsSection() {
  const { t } = useI18n();
  return (
    <section className="bg-cream py-24 sm:py-36">
      <div className={container}>
        <Reveal className="mx-auto max-w-5xl text-center">
          <Display
            text={t.landing.stats.title}
            className="text-5xl sm:text-7xl lg:text-8xl"
          />
          <p className="mx-auto mt-10 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
            {t.landing.stats.lead}
          </p>
        </Reveal>

        <div className="mt-20 grid grid-cols-2 border-t border-navy/15 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal
              key={stat.id}
              delay={i * 100}
              className={cn(
                "border-b border-navy/15 py-8 lg:border-b-0",
                i % 2 === 0 ? "pr-4" : "pl-4 border-l",
                "lg:px-8 lg:first:pl-0",
                i > 0 && "lg:border-l"
              )}
            >
              <div className="font-serif text-5xl text-navy [font-variant-numeric:lining-nums] sm:text-6xl">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-text-secondary">
                {pick(t.content.stats, stat.id, stat.label)}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========================================================
// Section: Sourcing Process — "From FACTORY, to CHECK, to DOOR"
// ========================================================
const processImages = [
  "/landing/order-online.jpg",
  "/landing/loading.jpg",
  "/landing/handover.jpg",
  "/landing/courier.jpg",
];

export function SourcingProcessSection() {
  const { t } = useI18n();
  return (
    <section className="bg-surface py-24 sm:py-36">
      <div className={container}>
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-8">
            <Eyebrow>{t.landing.process.eyebrow}</Eyebrow>
            <Display
              text={t.landing.process.title}
              className="mt-6 text-5xl sm:text-7xl"
            />
          </Reveal>
          <Reveal className="lg:col-span-4" delay={150}>
            <p className="text-base leading-relaxed text-text-secondary">
              {t.landing.process.lead}
            </p>
            <div className="mt-6">
              <TextLink href="/quote">{t.landing.process.discover}</TextLink>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {sourcingSteps.map((raw, idx) => {
            const step = pick(t.content.sourcingSteps, raw.id, raw);
            return (
            <Reveal key={raw.id} delay={idx * 120} variant="scale">
              <div className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-cream">
                  <div className="absolute inset-0 transition-transform duration-[1200ms] ease-out group-hover:scale-105">
                    <ParallaxImage
                      src={processImages[idx % processImages.length]}
                      alt={step.title}
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      strength={40}
                      className="h-full w-full"
                    />
                  </div>
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-navy">
                    0{idx + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-2xl font-semibold uppercase tracking-tight text-navy">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </div>
            </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ========================================================
// Section: Story — "One partner. Never a stranger."
// ========================================================
export function HowItWorksSection() {
  const { t } = useI18n();
  return (
    <section className="bg-cream py-24 sm:py-36">
      <div className={cn(container, "grid gap-14 lg:grid-cols-2 lg:items-start")}>
        {/* Sticky image column, as in the template */}
        <Reveal className="lg:sticky lg:top-24">
          <div className="relative">
            <ParallaxImage
              src="/landing/customer-smile.jpg"
              alt={t.landing.story.imageAlt}
              sizes="(min-width: 1024px) 50vw, 100vw"
              strength={50}
              className="aspect-[4/5] rounded-[28px]"
            />
            <div className="absolute bottom-5 left-5 right-5 rounded-[18px] bg-white/90 p-5 backdrop-blur-sm sm:right-auto sm:max-w-xs">
              <p className="text-[11px] uppercase tracking-[0.2em] text-text-secondary">
                {t.landing.story.soldBy}
              </p>
              <p className="mt-1 font-serif text-2xl italic text-navy">
                AfrikWholesaler
              </p>
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <Eyebrow>{t.landing.story.eyebrow}</Eyebrow>
            <Display
              text={t.landing.story.title}
              serifClass="text-navy"
              className="mt-6 text-5xl leading-[1.05] sm:text-6xl [&_.block+.block_em]:text-text-secondary"
            />
            <p className="mt-6 max-w-lg text-base leading-relaxed text-text-secondary">
              {t.landing.story.lead}
            </p>
          </Reveal>

          <ol className="mt-10 border-t border-navy/15">
            {howItWorksSteps.map((raw, idx) => {
              const step = pick(t.content.howItWorksSteps, raw.id, raw);
              return (
              <Reveal key={raw.id} delay={idx * 120}>
                <li className="grid grid-cols-[3rem_1fr] gap-4 border-b border-navy/15 py-6">
                  <span className="font-serif text-3xl italic text-brand">
                    0{idx + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold uppercase tracking-tight text-navy">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                      {step.description}
                    </p>
                  </div>
                </li>
              </Reveal>
              );
            })}
          </ol>

          <Reveal className="mt-10">
            <PillLink href="/quote">{t.landing.story.getStarted}</PillLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ========================================================
// Section: Why Choose Us — numbered editorial list
// ========================================================
export function WhyChooseUsSection() {
  const { t } = useI18n();
  return (
    <section className="bg-navy py-24 text-white sm:py-36">
      <div className={container}>
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <Eyebrow light>{t.landing.why.eyebrow}</Eyebrow>
            <Display
              text={t.landing.why.title}
              serifClass="text-gold"
              className="mt-6 text-5xl text-white sm:text-7xl"
            />
          </Reveal>
          <Reveal className="lg:col-span-5" delay={150}>
            <ParallaxImage
              src="/landing/cart.jpg"
              alt={t.landing.why.imageAlt}
              sizes="(min-width: 1024px) 40vw, 100vw"
              strength={30}
              className="aspect-[16/10] rounded-[20px]"
            />
          </Reveal>
        </div>

        <div className="mt-16 grid border-t border-white/15 sm:grid-cols-2 lg:grid-cols-3">
          {valueProps.map((raw, idx) => {
            const vp = pick(t.content.valueProps, raw.id, raw);
            return (
            <Reveal
              key={raw.id}
              delay={(idx % 3) * 100}
              className="border-b border-white/15 py-10 sm:pr-10"
            >
              <span className="font-serif text-lg italic text-gold">
                ({String(idx + 1).padStart(2, "0")})
              </span>
              <h3 className="mt-4 text-xl font-semibold uppercase tracking-tight">
                {vp.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                {vp.description}
              </p>
            </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ========================================================
// Section: Featured Products — "Our COLLECTION"
// ========================================================
export function FeaturedProductsSection({ products }: { products: Product[] }) {
  const { t } = useI18n();
  return (
    <section className="bg-cream py-24 sm:py-36">
      <div className={container}>
        <Reveal className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>{t.landing.featured.eyebrow}</Eyebrow>
            <Display text={t.landing.featured.title} className="mt-6 text-5xl sm:text-7xl" />
          </div>
          <TextLink href="/products">{t.landing.featured.viewAll}</TextLink>
        </Reveal>

        {products.length > 0 ? (
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product, i) => (
              <Reveal key={product.id} delay={(i % 5) * 80} variant="scale">
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-text-secondary">
            {t.landing.featured.empty}
          </p>
        )}
      </div>
    </section>
  );
}

// ========================================================
// Section: Categories — typographic index
// ========================================================
export function CategoriesSection({ categories }: { categories: Category[] }) {
  const { t, format } = useI18n();
  const [hovered, setHovered] = useState<string | null>(null);
  // Lead with categories that have stock; fall back to all if none do.
  const stocked = categories.filter((c) => c.productCount > 0);
  const shown = stocked.length > 0 ? stocked : categories;

  return (
    <section className="bg-surface py-24 sm:py-36">
      <div className={cn(container, "grid gap-14 lg:grid-cols-12")}>
        <Reveal className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Eyebrow>{t.landing.categories.eyebrow}</Eyebrow>
            <Display
              text={t.landing.categories.title}
              className="mt-6 text-5xl sm:text-7xl"
            />
            <ParallaxImage
              src="/landing/phone-cart.jpg"
              alt={t.landing.categories.imageAlt}
              sizes="40vw"
              strength={40}
              className="mt-10 hidden aspect-[4/3] rounded-[20px] lg:block"
            />
          </div>
        </Reveal>

        <ul className="border-t border-navy/15 lg:col-span-7">
          {shown.map((cat, i) => (
            <Reveal key={cat.id} delay={Math.min(i, 6) * 60}>
              <li>
                <Link
                  href={`/products?category=${cat.slug}`}
                  onMouseEnter={() => setHovered(cat.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="group flex items-baseline justify-between gap-4 border-b border-navy/15 py-5 sm:py-6"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="w-8 text-xs text-text-secondary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "text-2xl font-semibold uppercase tracking-tight text-navy transition-all duration-300 sm:text-4xl",
                        hovered === cat.id && "font-serif font-normal normal-case italic text-brand",
                        hovered && hovered !== cat.id && "opacity-40"
                      )}
                    >
                      {categoryName(t, cat.slug, cat.name)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-xs uppercase tracking-[0.15em] text-text-secondary">
                    <span className="hidden sm:inline">{format(t.landing.categories.productsCount, { n: cat.productCount })}</span>
                    <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-brand" />
                  </span>
                </Link>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ========================================================
// Section: Testimonials — featured quote + supporting voices
// ========================================================
// ========================================================
// Section: Affiliate program — "Share. Earn 5%."
// ========================================================
/** Interactive estimate: monthly sales through your links → your 5%. */
function EarningsCalculator() {
  const { t, formatNumber } = useI18n();
  const a = t.landing.affiliate;
  const [sales, setSales] = useState(500_000);
  const earnings = Math.round(sales * 0.05);
  const fcfa = (n: number) => `${formatNumber(n)} FCFA`;
  const pct = ((sales - 50_000) / (5_000_000 - 50_000)) * 100;

  return (
    <div className="rounded-[28px] bg-navy p-6 text-white shadow-[var(--shadow-modal)] sm:p-8">
      <p className="text-[11px] uppercase tracking-[0.25em] text-white/60">{a.calcTitle}</p>

      <label htmlFor="aff-sales" className="mt-6 block text-sm text-white/80">
        {a.calcSales}
      </label>
      <p className="mt-1 font-serif text-3xl [font-variant-numeric:lining-nums]">{fcfa(sales)}</p>
      <input
        id="aff-sales"
        type="range"
        min={50_000}
        max={5_000_000}
        step={50_000}
        value={sales}
        onChange={(e) => setSales(Number(e.target.value))}
        className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full accent-[var(--color-gold)]"
        style={{
          background: `linear-gradient(to right, var(--color-gold) ${pct}%, rgb(255 255 255 / 0.15) ${pct}%)`,
        }}
      />

      <div className="mt-8 border-t border-white/15 pt-6">
        <p className="text-sm text-white/70">{a.calcEarn}</p>
        <p
          key={earnings}
          className="mt-1 animate-[fade-in_0.3s_ease-out] font-serif text-5xl text-gold [font-variant-numeric:lining-nums] sm:text-6xl"
        >
          {fcfa(earnings)}
        </p>
        <p className="mt-1 text-sm text-white/60">{a.calcPerMonth}</p>
      </div>

      <div className="mt-8 flex items-center gap-3 border-t border-white/15 pt-6">
        <div className="flex items-center -space-x-2">
          {mobileMoney.map((m) => (
            <PayLogo key={m.id} method={m} small className="h-9 w-9 rounded-full border-2 border-navy" />
          ))}
        </div>
        <p className="text-xs text-white/70">
          {earnings >= 10_000 ? a.calcReady : a.calcFrom}
        </p>
      </div>
    </div>
  );
}

export function AffiliateSection() {
  const { t } = useI18n();
  const a = t.landing.affiliate;
  const steps = [
    { title: a.step1Title, text: a.step1Text },
    { title: a.step2Title, text: a.step2Text },
    { title: a.step3Title, text: a.step3Text },
    { title: a.step4Title, text: a.step4Text },
  ];
  return (
    <section id="affiliate" className="scroll-mt-20 bg-gold-light py-24 sm:py-36">
      <div className={cn(container, "grid gap-14 lg:grid-cols-12 lg:items-center")}>
        <div className="lg:col-span-7">
          <Reveal>
            <Eyebrow>{a.eyebrow}</Eyebrow>
          </Reveal>
          <Display
            text={a.title}
            className="mt-6 text-5xl sm:text-7xl"
          />
          <Reveal delay={150}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
              {a.lead}
            </p>
          </Reveal>

          <ol className="mt-10 grid gap-x-8 border-t border-navy/15 sm:grid-cols-2">
            {steps.map((step, idx) => (
              <Reveal key={step.title} delay={idx * 100}>
                <li className="grid grid-cols-[3rem_1fr] gap-3 border-b border-navy/15 py-5">
                  <span className="font-serif text-3xl italic text-brand">0{idx + 1}</span>
                  <div>
                    <h3 className="text-base font-semibold uppercase tracking-tight text-navy">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">{step.text}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>

          <Reveal className="mt-10 flex flex-wrap items-center gap-6">
            <PillLink href="/dashboard/affiliate">{a.become}</PillLink>
            <TextLink href="/products">{a.browse}</TextLink>
          </Reveal>
        </div>

        <Reveal className="lg:col-span-5" delay={200} variant="scale">
          <EarningsCalculator />
        </Reveal>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  const { t } = useI18n();
  const translated = testimonials.map((x) => ({
    ...x,
    quote: pick(t.content.testimonials, x.id, x.quote),
    country: pick(t.content.countries, x.country, x.country),
  }));
  const [featured, ...rest] = translated;
  if (!featured) return null;

  return (
    <section className="bg-cream py-24 sm:py-36">
      <div className={container}>
        <Reveal className="mx-auto max-w-4xl text-center">
          <Eyebrow>{t.landing.testimonials.eyebrow}</Eyebrow>
          <blockquote className="mt-10 font-serif text-3xl leading-[1.2] text-navy sm:text-5xl">
            <span className="text-brand">“</span>
            {featured.quote}
            <span className="text-brand">”</span>
          </blockquote>
          <p className="mt-8 text-[11px] uppercase tracking-[0.25em] text-text-secondary">
            <span className="font-semibold text-navy">{featured.name}</span>,{" "}
            {featured.company} · {featured.country}
          </p>
        </Reveal>

        {rest.length > 0 && (
          <div className="mt-20 grid gap-10 border-t border-navy/15 pt-12 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((item, i) => (
              <Reveal key={item.id} delay={i * 100}>
                <p className="font-serif text-xl italic leading-snug text-navy/85">
                  “{item.quote}”
                </p>
                <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-text-secondary">
                  <span className="font-semibold text-navy">{item.name}</span> · {item.country}
                </p>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ========================================================
// Section: FAQ
// ========================================================
export function FAQSection() {
  const { t } = useI18n();
  const items = faqs.map((f) => ({ ...f, ...pick(t.content.faqs, f.id, { question: f.question, answer: f.answer }) }));
  return (
    <section className="bg-surface py-24 sm:py-36">
      <div className={cn(container, "grid gap-12 lg:grid-cols-12")}>
        <Reveal className="lg:col-span-5">
          <Eyebrow>{t.landing.faq.eyebrow}</Eyebrow>
          <Display
            text={t.landing.faq.title}
            className="mt-6 text-5xl sm:text-7xl"
          />
          <p className="mt-6 max-w-sm text-base leading-relaxed text-text-secondary">
            {t.landing.faq.lead}
          </p>
        </Reveal>
        <Reveal className="lg:col-span-7" delay={150}>
          <Accordion items={items} />
        </Reveal>
      </div>
    </section>
  );
}

// ========================================================
// Section: CTA — full-bleed image
// ========================================================
export function CTASection() {
  const { t } = useI18n();
  return (
    <section className="bg-surface px-4 pb-6 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-[1600px] overflow-hidden rounded-[28px]">
        <ParallaxImage
          src="/landing/delivery-door.jpg"
          alt={t.landing.cta.imageAlt}
          sizes="100vw"
          strength={90}
          className="!absolute inset-0"
        />
        <div className="absolute inset-0 bg-navy/70" />
        <div className="relative px-6 py-24 text-center sm:py-36">
          <Reveal>
            <Display
              text={t.landing.cta.title}
              accentClass="text-gold"
              className="text-5xl text-white sm:text-7xl lg:text-8xl"
            />
            <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/75">
              {t.landing.cta.lead}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <PillLink href="/quote">{t.landing.cta.requestQuote}</PillLink>
              <PillLink href="/dashboard/messages" variant="light">
                {t.landing.cta.chat}
              </PillLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
