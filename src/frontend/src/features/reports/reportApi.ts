import { httpClient } from "@/api/httpClient";
import type { ReportFilters, ReportOverview } from "./types";

export async function getReportOverview(filters: ReportFilters) {
  const response = await httpClient.get<ReportOverview>("/reports/overview", {
    params: {
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
    },
  });

  return response.data;
}
