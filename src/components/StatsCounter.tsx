import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Award, Clock, Shield } from "lucide-react";

interface StatItem {
  icon: typeof Users;
  value: number;
  suffix: string;
  labelKey: string;
}

const CountUp = ({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [hasStarted, end, duration]);

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
    <section className="py-12 sm:py-16 lg:py-20 bg-accent">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end gap-8 lg:gap-12">
          {/* Stats grid - right aligned on large screens */}
          <div className="w-full lg:w-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="text-center group"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-accent-foreground/10 mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-accent-foreground" />
                  </div>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-accent-foreground mb-1 sm:mb-2">
                    <CountUp end={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-sm sm:text-base text-accent-foreground/80 font-medium">{t(stat.labelKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
