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
    <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 bg-accent">
      <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="flex flex-col items-center justify-center w-full">
          {/* Stats grid - centered and fully responsive */}
          <div className="w-full max-w-5xl">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 md:gap-8 lg:gap-10 w-full">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center text-center group px-1 xs:px-2 py-2"
                >
                  {/* Icon container - responsive sizing */}
                  <div className="inline-flex items-center justify-center w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-accent-foreground/10 mb-2 xs:mb-3 sm:mb-4 md:mb-5 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <stat.icon className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-accent-foreground" />
                  </div>
                  
                  {/* Counter value - responsive text sizing */}
                  <div className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-accent-foreground mb-1 xs:mb-1.5 sm:mb-2 md:mb-3 leading-tight">
                    <CountUp end={stat.value} suffix={stat.suffix} />
                  </div>
                  
                  {/* Label - responsive text sizing */}
                  <p className="text-xs xs:text-sm sm:text-sm md:text-base lg:text-lg text-accent-foreground/85 font-medium line-clamp-2">
                    {t(stat.labelKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
