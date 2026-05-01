// src/hooks/useFamily.ts
import {useCallback} from 'react';
import {useFamilyContext} from '../store/familyStore';
import {useSettings} from '../store/settingsStore';
import type {Family, Member} from '../types';
import {coverageOptions} from '../data/coverageOptions';
import {rightsOptions} from '../data/rightsOptions';
import {generateUUID} from '../utils/formatUtils';
import {DEFAULT_RECOMMENDED_AMOUNTS} from '../types';

export function useFamily() {
  const ctx = useFamilyContext();
  const {getRecommendedAmount, state: settingsState} = useSettings();

  // 根据模板创建家庭
  const createFamilyFromTemplate = useCallback(
    async (
      familyName: string,
      structureType: string,
      structureLabel: string,
      templateMembers: {role: Member['role']; defaultName: string; defaultAge: number}[],
    ): Promise<string> => {
      const members: Member[] = templateMembers.map(tm => ({
        id: generateUUID(),
        familyId: '',
        role: tm.role,
        name: tm.defaultName,
        age: tm.defaultAge,
        coverage: coverageOptions
          .filter(co => co.applicableRoles.includes(tm.role))
          .map(co => {
            // 使用全局设置的建议保额
            const recommended = getRecommendedAmount(co.type);
            return {
              type: co.type,
              label: co.label,
              hasCoverage: false,
              coverageAmount: 0,
              recommendedAmount: recommended,
              gapAmount: recommended,
              policyDetails: '',
            };
          }),
        rights: rightsOptions.map(r => ({
          type: r.type,
          label: r.label,
          hasRight: false,
          validityDate: '',
          notes: '',
        })),
      }));

      // 业务员信息（如果已设置）
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
    [ctx, getRecommendedAmount, settingsState.agentInfo],
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
