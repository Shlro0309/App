import { httpClient } from "@/api/httpClient";
import type { DashboardOverview } from "./types";

export async function getDashboardOverview() {
  const response = await httpClient.get<DashboardOverview>(
    "/dashboard/overview"
  );
  return response.data;
}
