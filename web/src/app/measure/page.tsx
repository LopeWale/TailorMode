"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MeasurementCaptureFlow = dynamic(
  () => import("@/components/MeasurementCaptureFlow").then(mod => mod.MeasurementCaptureFlow),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#c4a77d]/30 border-t-[#c4a77d] rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function MeasurePage() {
  const router = useRouter();

  const handleComplete = (data: any) => {
    console.log("Measurement session complete:", data);
    router.push("/history");
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <MeasurementCaptureFlow
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
}
