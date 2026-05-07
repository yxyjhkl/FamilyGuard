// src/hooks/useFamily.ts
import {useCallback} from 'react';
import {useFamily as useFamilyStore} from '../store/familyStore';
import {useSettings} from '../store/settingsStore';
import type {Family, Member, FamilyStructureType, AnalysisMode} from '../types';
import {generateUUID} from '../utils/formatUtils';
import {QUICK_COVERAGES} from '../data/quickCoverages';

export function useFamily() {
  const ctx = useFamilyStore();
  const {
    getRecommendedAmount,
    state: settingsState,
    getActiveCoverages,
    getActiveRights,
  } = useSettings();

  // 根据模板创建家庭
  const createFamilyFromTemplate = useCallback(
    async (
      familyName: string,
      structureType: FamilyStructureType,
      structureLabel: string,
      templateMembers: {role: Member['role']; defaultName: string; defaultAge: number}[],
      mode: AnalysisMode = 'professional',
    ): Promise<string> => {
      const activeCoverages = getActiveCoverages();
      const activeRights = getActiveRights();
      const quickIds = QUICK_COVERAGES.map(c => c.id);

      // 快速版只取8项，精细版取全部
      const effectiveCoverages = activeCoverages.filter(co => {
        if (!co.isDefault) return false;
        return mode === 'quick' ? quickIds.includes(co.id) : true;
      });

      const members: Member[] = templateMembers.map(tm => ({
        id: generateUUID(),
        familyId: '',
        role: tm.role,
        name: tm.defaultName,
        age: tm.defaultAge,
        // 根据 mode 动态初始化保障配置
        coverage: effectiveCoverages.map(co => {
          // 使用全局设置的建议保额
          const recommended = co.recommendedAmount;
          return {
            id: co.id,
            hasCoverage: false,
            coverageAmount: 0,
            premium: undefined, // 年缴保费
            recommendedAmount: recommended,
            gapAmount: recommended,
            policyDetails: '',
          };
        }),
        // 使用动态权益配置
        rights: activeRights.map(r => ({
          id: r.id,
          hasRight: false,
          validityDate: '',
          notes: '',
        })),
      }));

      // 客户经理信息（如果已设置）
      const agentInfo = settingsState.agentInfo.name || settingsState.agentInfo.phone
        ? {name: settingsState.agentInfo.name, phone: settingsState.agentInfo.phone}
        : undefined;

      // 创建家庭（包含成员）
      const familyId = await ctx.addFamily(
        familyName,
        structureType,
        structureLabel,
        members,
        agentInfo,
      );

      return familyId;
    },
    [ctx, getActiveCoverages, getActiveRights, settingsState.agentInfo],
  );

  const getFamilyById = useCallback(
    (id: string): Family | undefined => {
      return ctx.state.families.find(f => f.id === id);
    },
    [ctx.state.families],
  );

  return {
    families: ctx.state.families,
    loading: ctx.state.loading,
    reloadFamilies: ctx.reloadFamilies,
    createFamilyFromTemplate,
    getFamilyById,
    addFamily: ctx.addFamily,
    updateFamily: ctx.updateFamily,
    deleteFamily: ctx.deleteFamily,
    addMember: ctx.addMember,
    updateMember: ctx.updateMember,
    deleteMember: ctx.deleteMember,
    updateExportSettings: ctx.updateExportSettings,
  };
}
