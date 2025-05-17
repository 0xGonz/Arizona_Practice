import { Router } from 'express';
import { z } from 'zod';
import { db } from './db';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import {
  monthlyFinancialData,
  doctorPerformance,
  departmentPerformance,
} from '@shared/schema';

const router = Router();

const rangeSchema = z.object({
  from: z.string(),
  to: z.string(),
});

// Employee Summary - aggregated data across all employees
router.get('/analytics/employee/summary', async (req, res) => {
  try {
    const { from, to } = rangeSchema.parse(req.query);
    
    // Query doctor performance data and group by month
    const rows = await db
      .select({
        month: doctorPerformance.month,
        revenue: sql`SUM(${doctorPerformance.revenue})`.as('revenue'),
        expense: sql`SUM(${doctorPerformance.expenses})`.as('expense'),
        net: sql`SUM(${doctorPerformance.netIncome})`.as('net')
      })
      .from(doctorPerformance)
      .where(
        and(
          gte(doctorPerformance.month, from),
          lte(doctorPerformance.month, to)
        )
      )
      .groupBy(doctorPerformance.month)
      .orderBy(doctorPerformance.month);
    
    res.json(rows);
  } catch (error) {
    console.error('Error in employee summary:', error);
    res.status(500).json({ error: 'Failed to fetch employee summary data' });
  }
});

// Employee Detail - data for a specific employee
router.get('/analytics/employee/detail', async (req, res) => {
  try {
    const queryParams = rangeSchema.extend({ 
      employeeId: z.string() 
    }).parse(req.query);
    
    const rows = await db
      .select({
        month: doctorPerformance.month,
        revenue: doctorPerformance.revenue,
        expense: doctorPerformance.expenses,
        net: doctorPerformance.netIncome,
        marginPct: sql`${doctorPerformance.netIncome} / NULLIF(${doctorPerformance.revenue}, 0) * 100`.as('margin_pct')
      })
      .from(doctorPerformance)
      .where(
        and(
          eq(doctorPerformance.name, queryParams.employeeId),
          gte(doctorPerformance.month, queryParams.from),
          lte(doctorPerformance.month, queryParams.to)
        )
      )
      .orderBy(doctorPerformance.month);
    
    res.json(rows);
  } catch (error) {
    console.error('Error in employee detail:', error);
    res.status(500).json({ error: 'Failed to fetch employee detail data' });
  }
});

// Business Summary - aggregated data across all business lines
router.get('/analytics/business/summary', async (req, res) => {
  try {
    const { from, to } = rangeSchema.parse(req.query);
    
    // Query department performance data and group by month
    const rows = await db
      .select({
        month: departmentPerformance.month,
        revenue: sql`SUM(${departmentPerformance.revenue})`.as('revenue'),
        expense: sql`SUM(${departmentPerformance.expenses})`.as('expense'),
        net: sql`SUM(${departmentPerformance.netIncome})`.as('net')
      })
      .from(departmentPerformance)
      .where(
        and(
          gte(departmentPerformance.month, from),
          lte(departmentPerformance.month, to)
        )
      )
      .groupBy(departmentPerformance.month)
      .orderBy(departmentPerformance.month);
    
    res.json(rows);
  } catch (error) {
    console.error('Error in business summary:', error);
    res.status(500).json({ error: 'Failed to fetch business summary data' });
  }
});

// Business Detail - data for a specific business line
router.get('/analytics/business/detail', async (req, res) => {
  try {
    const queryParams = rangeSchema.extend({ 
      businessId: z.string() 
    }).parse(req.query);
    
    const rows = await db
      .select({
        month: departmentPerformance.month,
        revenue: departmentPerformance.revenue,
        expense: departmentPerformance.expenses,
        net: departmentPerformance.netIncome,
        marginPct: sql`${departmentPerformance.netIncome} / NULLIF(${departmentPerformance.revenue}, 0) * 100`.as('margin_pct')
      })
      .from(departmentPerformance)
      .where(
        and(
          eq(departmentPerformance.name, queryParams.businessId),
          gte(departmentPerformance.month, queryParams.from),
          lte(departmentPerformance.month, queryParams.to)
        )
      )
      .orderBy(departmentPerformance.month);
    
    res.json(rows);
  } catch (error) {
    console.error('Error in business detail:', error);
    res.status(500).json({ error: 'Failed to fetch business detail data' });
  }
});

// Employee list - for populating dropdowns
router.get('/analytics/employee/list', async (req, res) => {
  try {
    const employees = await db
      .select({
        id: doctorPerformance.name,
        name: doctorPerformance.name
      })
      .from(doctorPerformance)
      .groupBy(doctorPerformance.name)
      .orderBy(doctorPerformance.name);
    
    res.json(employees);
  } catch (error) {
    console.error('Error in employee list:', error);
    res.status(500).json({ error: 'Failed to fetch employee list' });
  }
});

// Business line list - for populating dropdowns
router.get('/analytics/business/list', async (req, res) => {
  try {
    const businesses = await db
      .select({
        id: departmentPerformance.name,
        name: departmentPerformance.name
      })
      .from(departmentPerformance)
      .groupBy(departmentPerformance.name)
      .orderBy(departmentPerformance.name);
    
    res.json(businesses);
  } catch (error) {
    console.error('Error in business list:', error);
    res.status(500).json({ error: 'Failed to fetch business list' });
  }
});

export default router;