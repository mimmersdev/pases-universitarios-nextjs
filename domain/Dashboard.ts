export interface HighPriorityMetrics {
    totalPasses: number;
    activeStudents: number;
    installCount: number;
    duePayment: number;
}

export interface Series {
    month: number;
    year: number;
    count: number;
}

export interface MediumPriorityMetrics {
    // Payment Metrics
    totalDue: number;
    totalOverdue: number;
    totalPaid: number;

    // Installation Metrics
    totalGoogleInstalled: number;
    totalAppleInstalled: number;
    totalBothInstalled: number;
    totalNoneInstalled: number;

    // Student status metrics
    totalActive: number;
    totalInactive: number;
    totalGraduated: number;

    // Creation Metrics
    passesCreated: Series[];
    passesUpdated: Series[];

    // To be Due Metrics
    passesToBeDue: Series[];
}