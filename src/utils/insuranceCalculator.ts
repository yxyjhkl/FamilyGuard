// src/utils/insuranceCalculator.ts - 保险保障评分计算工具

import { Member, Coverage } from '../types';

// FamilyMember 类型（用于分析）
export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  age?: number;
  annualIncome?: number;
  coverage?: Coverage[];
}

// InsuranceProduct 类型（用于分析）
export interface InsuranceProduct {
  id: string;
  name: string;
  type: string;
  coverage?: number;
  premium?: number;
  insuredMembers?: string[];
  coverageDetails?: Coverage[];
}

// 计算单个成员的保障评分
export function getCoverageScore(
  member: FamilyMember,
  products: InsuranceProduct[]
): number {
  if (!products || products.length === 0) return 0;

  let score = 0;
  const productTypes = new Set(products.map(p => p.type));

  // 基础保障评分
  if (productTypes.has('重疾险')) score += 25;
  if (productTypes.has('医疗险')) score += 25;
  if (productTypes.has('意外险')) score += 20;
  if (productTypes.has('寿险')) score += 20;
  if (productTypes.has('教育金')) score += 10;
  if (productTypes.has('养老金')) score += 10;
  if (productTypes.has('医疗险') && products.some(p => p.type === '百万医疗')) {
    score += 10;
  }

  // 保额充足性加分
  const totalCoverage = products.reduce((sum, p) => sum + (p.coverage || 0), 0);
  if (totalCoverage >= 100) score += 10;
  else if (totalCoverage >= 50) score += 5;

  return Math.min(score, 100);
}

// 计算家庭整体保障评分
export function getFamilyProtectionScore(
  members: FamilyMember[],
  products: InsuranceProduct[]
): { totalScore: number; totalPremium: number; coverageRate: number } {
  if (!members || members.length === 0) {
    return { totalScore: 0, totalPremium: 0, coverageRate: 0 };
  }

  // 计算每个成员的评分
  const memberScores = members.map(member => {
    const memberProducts = products.filter(p => 
      p.insuredMembers?.includes(member.id) || 
      p.insuredMembers?.includes('all')
    );
    return getCoverageScore(member, memberProducts);
  });

  // 家庭评分（成员评分的加权平均）
  const totalScore = Math.round(
    memberScores.reduce((sum, score) => sum + score, 0) / members.length
  );

  // 总保费
  const totalPremium = products.reduce((sum, p) => sum + (p.premium || 0), 0);

  // 保障覆盖率（至少有一项保障的成员比例）
  const coveredMembers = members.filter(member => {
    const memberProducts = products.filter(p => 
      p.insuredMembers?.includes(member.id) || 
      p.insuredMembers?.includes('all')
    );
    return memberProducts.length > 0;
  }).length;
  const coverageRate = Math.round((coveredMembers / members.length) * 100);

  return { totalScore, totalPremium, coverageRate };
}

// 计算保障缺口
export function calculateGap(
  currentCoverage: number,
  recommendedCoverage: number
): number {
  return Math.max(0, recommendedCoverage - currentCoverage);
}

// 计算保费占比是否合理（不超过年收入30%）
export function isPremiumReasonable(
  totalPremium: number,
  annualIncome: number
): boolean {
  if (!annualIncome) return true;
  return (totalPremium / annualIncome) <= 0.3;
}
