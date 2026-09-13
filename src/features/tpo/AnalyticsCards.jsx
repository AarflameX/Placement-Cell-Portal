import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";

/**
 * SL-14: TPO Dashboard overview cards.
 * Active Drives, Total Applications, Placed Students — all live via onSnapshot.
 *
 * "Active" drive = status === "OPEN" AND deadline hasn't passed yet.
 * Both checks are used together: status alone can go stale if nobody
 * manually closes an expired drive, and deadline alone won't catch a
 * drive someone closed early.
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
    { label: "Active Drives", value: stats.activeDrives, color: "bg-blue-50 text-blue-700" },
    { label: "Total Applications", value: stats.totalApplications, color: "bg-purple-50 text-purple-700" },
    { label: "Placed Students", value: stats.placedStudents, color: "bg-green-50 text-green-700" },
  ];

  if (loading) {
    return <p className="p-4 text-gray-500">Loading dashboard…</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl p-5 shadow-sm ${card.color}`}>
          <p className="text-sm font-medium opacity-80">{card.label}</p>
          <p className="mt-1 text-3xl font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
