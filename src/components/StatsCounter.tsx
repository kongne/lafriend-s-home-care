import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Award, Clock, Shield } from "lucide-react";

interface StatItem {
  icon: typeof Users;
  value: number;
  suffix: string;
  labelKey: string;
}

const getCountdownStart = (value: number) => {
  if (value >= 100) return value + 20;
  if (value >= 50) return value + 10;
  if (value >= 10) return value + 5;
  return value + 3;
};

const CountUp = ({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
  const startValue = getCountdownStart(end);
  const [count, setCount] = useState(startValue);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setCount(startValue);
  }, [startValue]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(end);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.max(end, Math.ceil(startValue - easeOutQuart * (startValue - end))));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [hasStarted, end, duration, startValue]);

  return <span ref={ref}>{count}{suffix}</span>;
};

export const StatsCounter = () => {
  const { t } = useLanguage();

  const stats: StatItem[] = [
    { icon: Users, value: 500, suffix: "+", labelKey: "stats.clients" },
    { icon: Clock, value: 10, suffix: "+", labelKey: "stats.years" },
    { icon: Award, value: 100, suffix: "%", labelKey: "stats.quality" },
    { icon: Shield, value: 24, suffix: "/7", labelKey: "stats.support" },
  ];

  return (
    <section className="section-padding bg-accent dark:bg-accent-foreground">
      <div className="section-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 lg:gap-12 w-full max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center text-center group px-2 py-2"
            >
              {/* Icon container */}
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-accent-foreground/10 mb-3 sm:mb-4 md:mb-5 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-accent-foreground" />
              </div>

              {/* Counter value */}
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-accent-foreground mb-1 sm:mb-2 md:mb-3 leading-tight">
                <CountUp end={stat.value} suffix={stat.suffix} />
              </div>

              {/* Label */}
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-accent-foreground/85 font-medium line-clamp-2">
                {t(stat.labelKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
