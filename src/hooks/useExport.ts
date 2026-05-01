// src/hooks/useExport.ts
import {useCallback, useState} from 'react';
import type {Family} from '../types';
import {getMotto} from '../data/mottoList';

interface ExportState {
  exporting: boolean;
  preview: boolean;
  imageUri: string | null;
}

export function useExport() {
  const [state, setState] = useState<ExportState>({
    exporting: false,
    preview: false,
    imageUri: null,
  });

  const prepareExportData = useCallback((family: Family) => {
    // 组装导出数据（含缺口计算、金句选择等）
    const motto = family.exportSettings.selectedMotto || getMotto();
    const timestamp = new Date().toISOString();

    return {
      family,
      motto,
      timestamp,
      showName: family.exportSettings.showName,
      showAgentInfo: family.exportSettings.showAgentInfo,
      agentName: family.exportSettings.agentName,
      agentPhone: family.exportSettings.agentPhone,
      customNotes: family.exportSettings.customNotes,
    };
  }, []);

  const startExport = useCallback(() => {
    setState(prev => ({...prev, exporting: true}));
  }, []);

  const finishExport = useCallback((imageUri: string, success: boolean) => {
    setState({
      exporting: false,
      preview: true,
      imageUri: success ? imageUri : null,
    });
  }, []);

  const resetExport = useCallback(() => {
    setState({
      exporting: false,
      preview: false,
      imageUri: null,
    });
  }, []);

  return {
    ...state,
    prepareExportData,
    startExport,
    finishExport,
    resetExport,
  };
}
