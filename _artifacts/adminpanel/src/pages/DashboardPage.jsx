import { useState, useEffect } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { RidesPerDayChart } from "../components/charts/RidesPerDayChart";
import { TripDirectionDonut } from "../components/charts/TripDirectionDonut";
import { BreakDemandBarChart } from "../components/charts/BreakDemandBarChart";
import { LoadingState } from "../components/common/LoadingState";
import { dashboardService } from "../services/configServices";
import { useApp } from "../context/AppContext";
const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState("UMich");
  const { refreshKey, addToast } = useApp();
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    dashboardService.getStats().then((data) => {
      if (isMounted) setStats(data);
    }).catch(() => {
      addToast("Failed to load dashboard metrics", "error");
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [refreshKey, addToast]);
  return <div className="flex-1 flex flex-col">
      <PageHeader
    title="Dashboard"
    subtitle={`Platform overview \xB7 ${selectedSchool}`}
    actions={<div className="flex items-center gap-2">
            <span className="text-[12px] text-[#8A8A9A] font-medium">Campus:</span>
            <select
      value={selectedSchool}
      onChange={(e) => setSelectedSchool(e.target.value)}
      aria-label="Filter campus metrics"
      className="bg-white border border-[#E8E8E8] text-[13px] font-semibold text-[#1A1A2E] rounded-[8px] px-3 py-1.5 focus:border-[#3AAFA9] focus:outline-none cursor-pointer"
    >
              <option value="UMich">University of Michigan (UMich)</option>
              <option value="MSU">Michigan State University (MSU)</option>
              <option value="All">All Campuses Combined</option>
            </select>
          </div>}
  />

      <div className="p-5 sm:p-7">
        {isLoading || !stats ? <LoadingState message="Loading platform overview..." /> : <>
            {
    /* Top Stat Row (4 primary KPIs) */
  }
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
              <StatCard
    num={stats.totalUsers}
    label="Total Users"
    change={stats.totalUsersChange}
    changeType="up"
    tooltip="Total verified & pending student registrations"
  />
              <StatCard
    num={stats.activeTrips}
    label="Active Trips"
    change={stats.activeTripsChange}
    changeType="up"
    tooltip="Trips in Open, Nearly Full, or Grouped states"
  />
              <StatCard
    num={stats.completedRides}
    label="Completed Rides"
    change={stats.completedRidesChange}
    changeType="up"
    tooltip="Rides successfully dropped off with fare confirmed"
  />
              <StatCard
    num={stats.matchToCompleteRate}
    label="Match-to-Complete"
    change={stats.matchToCompleteChange}
    changeType="up"
    tooltip="Efficiency of coordinated groups successfully completing travel"
  />
            </div>

            {
    /* Second Stat Row (Secondary metrics) */
  }
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
              <StatCard
    num={stats.avgRidersPerGroup}
    label="Avg Riders/Group"
    tooltip="Average shared capacity utilization (max 4)"
  />
              <StatCard
    num={`$${stats.avgSavingsPerRider}`}
    label="Avg Savings/Rider"
    tooltip="Average student savings compared to solo Uber/Lyft fare"
  />
              <StatCard
    num={stats.paymentConfirmedRate}
    label="Payment Confirmed"
    tooltip="Percentage of rider reimbursement shares confirmed by booker"
  />
              <StatCard
    num={stats.avgReliability}
    label="Avg Reliability"
    tooltip="Aggregate campus peer reliability rating (scale 1-5)"
  />
            </div>

            {
    /* Line chart: rides per day */
  }
            <RidesPerDayChart data={stats.ridesPerDay} />

            {
    /* Split charts grid: Direction Donut & Break Demand Bar */
  }
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              <TripDirectionDonut data={stats.directionSplit} />
              <BreakDemandBarChart data={stats.demandByBreak} />
            </div>
          </>}
      </div>
    </div>;
};
export {
  DashboardPage
};
