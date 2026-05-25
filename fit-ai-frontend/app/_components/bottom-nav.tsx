import dayjs from "dayjs";
import { getHomeData } from "@/app/_lib/api/fetch-generated";
import { BottomNavClient } from "@/app/_components/bottom-nav-client";

type BottomNavProps = Readonly<{
  activePage?: "home" | "calendar" | "stats" | "profile";
}>;

export async function BottomNav({ activePage = "home" }: BottomNavProps) {
  const today = dayjs();
  const homeData = await getHomeData(today.format("YYYY-MM-DD"));

  let calendarHref: string = "/";
  if (homeData.status === 200 && homeData.data) {
    if (homeData.data.todayWorkoutDay) {
      calendarHref = `/workout-plans/${homeData.data.todayWorkoutDay.workoutPlanId}/days/${homeData.data.todayWorkoutDay.id}`;
    } else if (homeData.data.activeWorkoutPlanId) {
      calendarHref = `/workout-plans/${homeData.data.activeWorkoutPlanId}`;
    }
  }

  return (
    <BottomNavClient activePage={activePage} calendarHref={calendarHref} />
  );
}
