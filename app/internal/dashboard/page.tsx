"use client";

import { Section } from "@/app/components/Section";
import Container from "@/app/components/Container";
import SectionTitle from "@/app/components/SectionTitle";
import { useHighPriorityMetrics } from "@/frontend/hooks/dashboard/useHighPriorityMetrics";
import { useMediumPriorityMetrics } from "@/frontend/hooks/dashboard/useMediumPriorityMetrics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid } from "recharts";
import PageSpinner from "@/app/components/PageSpinner";

const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function DashboardPage() {
    const { data: highPriority, isLoading: isLoadingHigh } = useHighPriorityMetrics();
    const { data: mediumPriority, isLoading: isLoadingMedium } = useMediumPriorityMetrics();

    if (isLoadingHigh || isLoadingMedium) {
        return <PageSpinner />;
    }

    // Format series data for charts
    const formatSeriesData = (series: { month: number; year: number; count: number }[]) => {
        return series.map(item => ({
            name: `${monthNames[item.month - 1]} ${item.year}`,
            value: item.count,
            month: item.month,
            year: item.year
        })).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });
    };

    const passesCreatedData = mediumPriority?.passesCreated ? formatSeriesData(mediumPriority.passesCreated) : [];
    const passesUpdatedData = mediumPriority?.passesUpdated ? formatSeriesData(mediumPriority.passesUpdated) : [];
    
    // Format passes to be due data and ensure we show next 12 months from the first month
    const passesToBeDueRaw = mediumPriority?.passesToBeDue ? formatSeriesData(mediumPriority.passesToBeDue) : [];
    const passesToBeDueData = (() => {
        if (passesToBeDueRaw.length === 0) return [];
        
        // Find the earliest month/year in the data
        const firstEntry = passesToBeDueRaw[0];
        let currentMonth = firstEntry.month;
        let currentYear = firstEntry.year;
        
        // Create a map of existing data for quick lookup
        const dataMap = new Map<string, number>();
        passesToBeDueRaw.forEach(item => {
            const key = `${item.year}-${item.month}`;
            dataMap.set(key, item.value);
        });
        
        // Generate 12 months starting from the first month
        const result = [];
        for (let i = 0; i < 12; i++) {
            const month = currentMonth;
            const year = currentYear;
            const key = `${year}-${month}`;
            const value = dataMap.get(key) || 0;
            
            result.push({
                name: monthNames[month - 1],
                value: value,
                month: month,
                year: year
            });
            
            // Move to next month
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
        }
        
        return result;
    })();

    // Payment status data
    const paymentStatusData = mediumPriority ? [
        { name: "Pendiente", value: mediumPriority.totalDue },
        { name: "Vencido", value: mediumPriority.totalOverdue },
        { name: "Pagado", value: mediumPriority.totalPaid },
    ] : [];
    // Used for pie charts
    const filteredPaymentStatusData = paymentStatusData.filter(item => item.value > 0);

    // Installation status data - convert to numbers and filter out zeros
    const installationData = mediumPriority ? [
        { name: "Google Wallet", value: mediumPriority.totalGoogleInstalled },
        { name: "Apple Wallet", value: mediumPriority.totalAppleInstalled },
        { name: "Ambos", value: mediumPriority.totalBothInstalled },
        { name: "Ninguno", value: mediumPriority.totalNoneInstalled },
    ] : [];
    // Used for pie charts
    const filteredInstallationData = installationData.filter(item => item.value > 0);

    // Student status data
    const studentStatusData = mediumPriority ? [
        { name: "Activo", value: mediumPriority.totalActive },
        { name: "Inactivo", value: mediumPriority.totalInactive },
        { name: "Graduado", value: mediumPriority.totalGraduated },
    ] : [];
    // Used for pie charts
    const filteredStudentStatusData = studentStatusData.filter(item => item.value > 0);

    // Chart configurations with proper color definitions
    const paymentChartConfig = {
        pendiente: {
            label: "Pendiente",
            color: "var(--chart-1)",
        },
        vencido: {
            label: "Vencido",
            color: "var(--chart-2)",
        },
        pagado: {
            label: "Pagado",
            color: "var(--chart-3)",
        },
    };

    const installationChartConfig = {
        google: {
            label: "Google Wallet",
            color: "var(--chart-1)",
        },
        apple: {
            label: "Apple Wallet",
            color: "var(--chart-2)",
        },
        ambos: {
            label: "Ambos",
            color: "var(--chart-3)",
        },
        ninguno: {
            label: "Ninguno",
            color: "var(--chart-4)",
        },
    };

    const studentStatusChartConfig = {
        activo: {
            label: "Activo",
            color: "var(--chart-1)",
        },
        inactivo: {
            label: "Inactivo",
            color: "var(--chart-2)",
        },
        graduado: {
            label: "Graduado",
            color: "var(--chart-3)",
        },
    };

    const timeSeriesChartConfig = {
        value: {
            label: "Cantidad",
        },
        count: {
            label: "Cantidad",
        },
    };

    // Color array for pie charts
    const paymentPieColors = [
        "var(--chart-1)",
        "var(--chart-2)",
        "var(--chart-3)",
    ];

    const installationPieColors = [
        "var(--chart-1)",
        "var(--chart-2)",
        "var(--chart-3)",
        "var(--chart-4)",
    ];

    const studentStatusPieColors = [
        "var(--chart-1)",
        "var(--chart-2)",
        "var(--chart-3)",
    ];

    return (
        <Section>
            <Container>
                <SectionTitle removeMargin={true}>Dashboard</SectionTitle>

                {/* High Priority Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Total de Pases</CardTitle>
                            <CardDescription>Pases registrados en el sistema</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{highPriority?.totalPasses.toLocaleString() ?? 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Estudiantes Activos</CardTitle>
                            <CardDescription>Estudiantes con estado activo</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{highPriority?.activeStudents.toLocaleString() ?? 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Instalaciones</CardTitle>
                            <CardDescription>Pases instalados en wallets</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{highPriority?.installCount.toLocaleString() ?? 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pagos Pendientes</CardTitle>
                            <CardDescription>Monto total de pagos pendientes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                ${highPriority?.duePayment.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) ?? '0'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 1: Payment, Installation, and Student Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Estado de Pagos</CardTitle>
                            <CardDescription>Distribución de estados de pago</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={paymentChartConfig}>
                                <PieChart>
                                    <Pie
                                        data={filteredPaymentStatusData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {filteredPaymentStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={paymentPieColors[index % paymentPieColors.length]} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Estado de Instalación</CardTitle>
                            <CardDescription>Distribución de instalaciones en wallets</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={installationChartConfig}>
                                <PieChart>
                                    <Pie
                                        data={filteredInstallationData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {filteredInstallationData.map((entry, index) => (
                                            <Cell key={`installation-cell-${index}`} fill={installationPieColors[index % installationPieColors.length]} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Estado de Estudiantes</CardTitle>
                            <CardDescription>Distribución de estados de estudiantes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={studentStatusChartConfig}>
                                <PieChart>
                                    <Pie
                                        data={filteredStudentStatusData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {filteredStudentStatusData.map((entry, index) => (
                                            <Cell key={`student-cell-${index}`} fill={studentStatusPieColors[index % studentStatusPieColors.length]} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2: Time Series */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pases Creados</CardTitle>
                            <CardDescription>Evolución mensual de pases creados</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={timeSeriesChartConfig}>
                                <LineChart data={passesCreatedData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pases Actualizados</CardTitle>
                            <CardDescription>Evolución mensual de pases actualizados</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={timeSeriesChartConfig}>
                                <LineChart data={passesUpdatedData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line type="monotone" dataKey="value" stroke="var(--chart-2)" strokeWidth={2} />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pases por Vencer</CardTitle>
                            <CardDescription>Pases que vencerán próximamente</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={timeSeriesChartConfig}>
                                <BarChart data={passesToBeDueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="value" fill="var(--chart-3)" />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            </Container>
        </Section>
    );
}

