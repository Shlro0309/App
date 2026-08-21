package com.cybergame.service;

import com.cybergame.dto.response.ReportOverviewResponse;

import java.time.LocalDate;

public interface ReportService {

    ReportOverviewResponse getOverview(LocalDate fromDate, LocalDate toDate);
}
