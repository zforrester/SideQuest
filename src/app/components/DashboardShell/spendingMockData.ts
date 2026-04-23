export type SpendingRange = "weeks" | "months" | "quarters" | "years";

export type SpendingBarPoint = {
  label: string;
  amount: number;
  heightPercent: number;
};

export type SpendingSeries = {
  range: SpendingRange;
  unitLabel: string;
  totalLabel: string;
  bars: SpendingBarPoint[];
};

type RawBar = {
  label: string;
  amount: number;
};

type RawSeries = {
  range: SpendingRange;
  unitLabel: string;
  totalLabel: string;
  bars: RawBar[];
};

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
  badgeCount?: number;
};

export type KpiCard = {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
};

export type PaymentSummaryCard = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
};

export type TransactionItem = {
  id: string;
  category: string;
  dateTime: string;
  amount: string;
};

export type CountryShare = {
  id: string;
  country: string;
  sharePercent: number;
};

export type DashboardMockData = {
  appName: string;
  userName: string;
  devTools: {
    toggleLabel: string;
    toggleDescription: string;
    inspectorTitle: string;
  };
  sidebarPrimary: NavItem[];
  sidebarSecondary: NavItem[];
  kpis: KpiCard[];
  paymentCards: PaymentSummaryCard[];
  transactions: TransactionItem[];
  topCountries: CountryShare[];
  sentimentScore: string;
  sentimentLabel: string;
  totalCustomers: string;
  customersDelta: string;
  customerInitials: string[];
  audienceGrowth: {
    filters: string[];
    activeFilter: string;
    yAxisLabels: string[];
    xAxisLabels: string[];
    highlightedPointLabel: string;
  };
};

function toPercent(amount: number, maxAmount: number): number {
  if (maxAmount <= 0) {
    return 0;
  }

  return Number(((amount / maxAmount) * 100).toFixed(2));
}

function createSeries(series: RawSeries): SpendingSeries {
  const maxAmount = Math.max(...series.bars.map((bar) => bar.amount));

  return {
    ...series,
    bars: series.bars.map((bar) => ({
      ...bar,
      heightPercent: toPercent(bar.amount, maxAmount),
    })),
  };
}

const rawSpendingData: Record<SpendingRange, RawSeries> = {
  weeks: {
    range: "weeks",
    unitLabel: "Spending this period",
    totalLabel: "$5,720",
    bars: [
      { label: "W1", amount: 620 },
      { label: "W2", amount: 780 },
      { label: "W3", amount: 560 },
      { label: "W4", amount: 910 },
      { label: "W5", amount: 740 },
      { label: "W6", amount: 840 },
      { label: "W7", amount: 690 },
      { label: "W8", amount: 960 },
    ],
  },
  months: {
    range: "months",
    unitLabel: "Spending this period",
    totalLabel: "$41,570",
    bars: [
      { label: "Jan", amount: 3120 },
      { label: "Feb", amount: 2890 },
      { label: "Mar", amount: 3350 },
      { label: "Apr", amount: 2980 },
      { label: "May", amount: 3540 },
      { label: "Jun", amount: 3260 },
      { label: "Jul", amount: 3720 },
      { label: "Aug", amount: 3410 },
      { label: "Sep", amount: 3580 },
      { label: "Oct", amount: 3840 },
      { label: "Nov", amount: 3670 },
      { label: "Dec", amount: 4210 },
    ],
  },
  quarters: {
    range: "quarters",
    unitLabel: "Spending this period",
    totalLabel: "$85,440",
    bars: [
      { label: "Q1 '24", amount: 9230 },
      { label: "Q2 '24", amount: 9780 },
      { label: "Q3 '24", amount: 10520 },
      { label: "Q4 '24", amount: 11140 },
      { label: "Q1 '25", amount: 10280 },
      { label: "Q2 '25", amount: 10960 },
      { label: "Q3 '25", amount: 11420 },
      { label: "Q4 '25", amount: 12110 },
    ],
  },
  years: {
    range: "years",
    unitLabel: "Spending this period",
    totalLabel: "$247,360",
    bars: [
      { label: "2020", amount: 35600 },
      { label: "2021", amount: 38120 },
      { label: "2022", amount: 40240 },
      { label: "2023", amount: 42980 },
      { label: "2024", amount: 44650 },
      { label: "2025", amount: 45770 },
    ],
  },
};

export const spendingMockData: Record<SpendingRange, SpendingSeries> = {
  weeks: createSeries(rawSpendingData.weeks),
  months: createSeries(rawSpendingData.months),
  quarters: createSeries(rawSpendingData.quarters),
  years: createSeries(rawSpendingData.years),
};

export const spendingRanges: SpendingRange[] = ["weeks", "months", "quarters", "years"];

export const dashboardMockData: DashboardMockData = {
  appName: "SideQuest",
  userName: "Derrick Fisher",
  devTools: {
    toggleLabel: "Dev mode",
    toggleDescription: "Inspect token usage under cursor",
    inspectorTitle: "DevInspect",
  },
  sidebarPrimary: [
    { id: "overview", label: "Overview", icon: "O", isActive: true },
    { id: "messages", label: "Messages", icon: "M", badgeCount: 2 },
    { id: "community", label: "Community", icon: "C" },
    { id: "payments", label: "Payments", icon: "P" },
    { id: "statistics", label: "Statistics", icon: "S" },
    { id: "referrals", label: "Referrals", icon: "R" },
  ],
  sidebarSecondary: [
    { id: "account", label: "Account", icon: "A" },
    { id: "settings", label: "Settings", icon: "G" },
  ],
  kpis: [
    { id: "followers", label: "Followers", value: "128,420", delta: "+25%", trend: "up" },
    { id: "likes", label: "Likes", value: "66,816", delta: "+32%", trend: "up" },
    { id: "ctr", label: "Click-through rate (CTR)", value: "2,420", delta: "+28%", trend: "up" },
  ],
  paymentCards: [
    { id: "freelance", title: "Freelance", subtitle: "Irregular payment", amount: "$1,500" },
    { id: "salary", title: "Salary", subtitle: "Regular payment", amount: "$4,000" },
  ],
  transactions: [
    { id: "taxi", category: "Taxi Trips", dateTime: "03 Aug 2022, 15:43", amount: "$56.50" },
    { id: "transport", category: "Public Transport", dateTime: "01 Aug 2022, 12:58", amount: "$2.50" },
    { id: "tickets", category: "Plane Tickets", dateTime: "28 Jul 2022, 21:40", amount: "$70.00" },
    { id: "gas", category: "Gas Station", dateTime: "28 Jul 2022, 09:28", amount: "$30.75" },
    { id: "gym", category: "Gym", dateTime: "26 Jul 2022, 18:25", amount: "$100.00" },
  ],
  topCountries: [
    { id: "us", country: "United States", sharePercent: 50 },
    { id: "ca", country: "Canada", sharePercent: 20 },
    { id: "ua", country: "Ukraine", sharePercent: 20 },
    { id: "es", country: "Spain", sharePercent: 10 },
    { id: "uk", country: "United Kingdom", sharePercent: 10 },
  ],
  sentimentScore: "4.85",
  sentimentLabel: "Positive",
  totalCustomers: "2,420",
  customersDelta: "+25%",
  customerInitials: ["AN", "JD", "SM", "RK"],
  audienceGrowth: {
    filters: ["Today", "This Week", "This Year"],
    activeFilter: "This Year",
    yAxisLabels: ["80k", "60k", "40k", "20k"],
    xAxisLabels: ["Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug"],
    highlightedPointLabel: "42,4k",
  },
};

export function getSpendingSeries(range: SpendingRange): SpendingSeries {
  return spendingMockData[range];
}
