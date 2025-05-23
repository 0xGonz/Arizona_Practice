// CSV Data Types
export type CSVType = 'monthly-e' | 'monthly-o';

export interface MonthlyCSVRow {
  'Line Item': string;
  [key: string]: string; // Employee/entity columns and "All Employees" summary
}

// Processed Data Types
export interface FinancialMetric {
  value: number;
  change?: number; // Percentage change
  previousValue?: number;
}

export interface KPIData {
  totalRevenue: FinancialMetric;
  totalExpenses: FinancialMetric;
  netIncome: FinancialMetric;
}

export interface RevenueMixItem {
  name: string;
  value: number;
  color: string;
}

export interface MarginTrendPoint {
  month: string;
  value: number;
}

export interface PerformerData {
  id: string;
  name: string;
  value: number;
  percentage: number;
  initials: string;
}

export interface AncillaryMetrics {
  revenue: number;
  expenses: number;
  profitMargin: number;
  roi: number;
}

// For comparing Professional vs Ancillary
export interface ComparisonData {
  category: string;
  professional: number;
  ancillary: number;
  color?: string;
}

// Hierarchical Line Item Structure
export interface LineItem {
  id: string;
  name: string;
  value: number;
  children?: LineItem[];
  parent?: string;
  depth: number;
}

// For Month-by-Month Tab Navigation
export interface MonthData {
  name: string;
  shortName: string;
  available: boolean;
  eFileUploaded: boolean;
  oFileUploaded: boolean;
}

// Upload Status
export interface UploadStatus {
  monthly: {
    [month: string]: {
      e: boolean;
      o: boolean;
    };
  };
}
