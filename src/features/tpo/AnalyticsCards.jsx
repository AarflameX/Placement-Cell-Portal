import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Briefcase, Users, Award } from "lucide-react";
import { db } from "../../services/firebase";
import { NoiseBackground } from "../../components/ui/noise-background";

/**
 * SL-14: TPO Dashboard overview cards.
 * Active Drives, Total Applications, Placed Students — all live via onSnapshot.
 */
export default function AnalyticsCards() {
  const [stats, setStats] = useState({
    activeDrives: 0,
    totalApplications: 0,
    placedStudents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubJobs = onSnapshot(collection(db, "jobs"), (snapshot) => {
      const now = Date.now();
      const active = snapshot.docs.filter((doc) => {
        const job = doc.data();
        const deadlineTime = job.deadline ? new Date(job.deadline).getTime() : null;
        const notExpired = deadlineTime === null || isNaN(deadlineTime) || deadlineTime > now;
        return job.status === "OPEN" && notExpired;
      }).length;

      setStats((prev) => ({ ...prev, activeDrives: active }));
      setLoading(false);
    });

    const unsubApplications = onSnapshot(collection(db, "applications"), (snapshot) => {
      const apps = snapshot.docs.map((d) => d.data());
      const placed = apps.filter((a) => a.status === "SELECTED").length;
      setStats((prev) => ({
        ...prev,
        totalApplications: snapshot.size,
        placedStudents: placed,
      }));
    });

    return () => {
      unsubJobs();
      unsubApplications();
    };
  }, []);

  const cards = [
    {
      label: "Active Drives",
      value: stats.activeDrives,
      subtitle: "Open for applications",
      icon: Briefcase,
      gradient: [
        "rgba(148, 163, 184, 0.4)",
        "rgba(100, 116, 139, 0.3)",
        "rgba(148, 163, 184, 0.35)",
      ],
      iconBg: "bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700",
    },
    {
      label: "Total Applications",
      value: stats.totalApplications,
      subtitle: "Across all drives",
      icon: Users,
      gradient: [
        "rgba(168, 140, 220, 0.4)",
        "rgba(140, 150, 200, 0.3)",
        "rgba(180, 170, 210, 0.35)",
      ],
      iconBg: "bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700",
    },
    {
      label: "Placed Students",
      value: stats.placedStudents,
      subtitle: "Selected candidates",
      icon: Award,
      gradient: [
        "rgba(240, 190, 130, 0.4)",
        "rgba(217, 180, 130, 0.3)",
        "rgba(230, 200, 150, 0.35)",
      ],
      iconBg: "bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121215] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <NoiseBackground
            key={card.label}
            gradientColors={card.gradient}
            noiseIntensity={0.2}
            containerClassName="rounded-2xl shadow-xs transition-shadow duration-200 hover:shadow-md"
            innerClassName="bg-white dark:bg-[#121215]"
            className="p-5 flex flex-col justify-between h-full"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                {card.label}
              </span>
              <div className={`p-2 rounded-lg border ${card.iconBg}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 tabular-nums">
                {card.value}
              </p>
              <p className="text-[11px] font-normal text-neutral-500 dark:text-neutral-400 mt-0.5">
                {card.subtitle}
              </p>
            </div>
          </NoiseBackground>
        );
      })}
    </div>
  );
}
