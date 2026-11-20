"use client";

import Logo from "@/components/common/logo";
import LayerStepper from "./layer-stepper";
import LayerSummary from "./layer-summary";
import LeadChip from "./lead-chip";
import RideBar from "./ride-bar";
import ViewModeCrumb from "./view-mode-crumb";

export default function Brand() {
  return (
    <div className="pointer-events-none absolute top-hud-t left-[18px] z-20 flex flex-col gap-[14px] max-tablet:left-gutter-sm" data-hud data-brand>

      <div className="pointer-events-auto flex items-center gap-2.5 max-tablet:invisible max-tablet:h-8 max-tablet:self-start">
        <Logo size={26} radius={22} className="shadow-[0_0_22px_-4px_rgba(92,157,255,.75)]" />

        <span className="font-display text-2xl leading-none font-bold tracking-normal max-tablet:hidden">ODY</span>
      </div>

      <div className="flex flex-col gap-[2px]">
        <LayerStepper />
        <LayerSummary />
      </div>

      <LeadChip />
      <RideBar />
      <ViewModeCrumb />
    </div>
  );
}
