// src/store/familyStore.tsx
import React, {createContext, useContext, useReducer, useEffect, useCallback} from 'react';
import type {Family, Member, Coverage, Right, ExportSettings} from '../types';
import {storageService} from './storageService';
import {generateUUID} from '../utils/formatUtils';

// ========== State & Actions ==========
interface FamilyState {
  families: Family[];
  loading: boolean;
}

type FamilyAction =
  | {type: 'LOAD_FAMILIES'; payload: Family[]}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'ADD_FAMILY'; payload: Family}
  | {type: 'UPDATE_FAMILY'; payload: Family}
  | {type: 'DELETE_FAMILY'; payload: string}
  | {type: 'ADD_MEMBER'; payload: {familyId: string; member: Member}}
  | {type: 'UPDATE_MEMBER'; payload: {familyId: string; member: Member}}
  | {type: 'DELETE_MEMBER'; payload: {familyId: string; memberId: string}}
  | {type: 'UPDATE_EXPORT_SETTINGS'; payload: {familyId: string; settings: Partial<ExportSettings>}};

function familyReducer(state: FamilyState, action: FamilyAction): FamilyState {
  switch (action.type) {
    case 'LOAD_FAMILIES':
      return {...state, families: action.payload, loading: false};

    case 'SET_LOADING':
      return {...state, loading: action.payload};

    case 'ADD_FAMILY':
      return {...state, families: [...state.families, action.payload]};

    case 'UPDATE_FAMILY':
      return {
        ...state,
        families: state.families.map(f =>
          f.id === action.payload.id ? action.payload : f,
        ),
      };

    case 'DELETE_FAMILY':
      return {
        ...state,
        families: state.families.filter(f => f.id !== action.payload),
      };

    case 'ADD_MEMBER':
      return {
        ...state,
        families: state.families.map(f =>
          f.id === action.payload.familyId
            ? {...f, members: [...f.members, action.payload.member], updatedAt: new Date().toISOString()}
            : f,
        ),
      };

    case 'UPDATE_MEMBER':
      return {
        ...state,
        families: state.families.map(f =>
          f.id === action.payload.familyId
            ? {
                ...f,
                members: f.members.map(m =>
                  m.id === action.payload.member.id ? action.payload.member : m,
                ),
                updatedAt: new Date().toISOString(),
              }
            : f,
        ),
      };

    case 'DELETE_MEMBER':
      return {
        ...state,
        families: state.families.map(f =>
          f.id === action.payload.familyId
            ? {
                ...f,
                members: f.members.filter(m => m.id !== action.payload.memberId),
                updatedAt: new Date().toISOString(),
              }
            : f,
        ),
      };

    case 'UPDATE_EXPORT_SETTINGS':
      return {
        ...state,
        families: state.families.map(f =>
          f.id === action.payload.familyId
            ? {
                ...f,
                exportSettings: {...f.exportSettings, ...action.payload.settings},
                updatedAt: new Date().toISOString(),
              }
            : f,
        ),
      };

    default:
      return state;
  }
}

const defaultExportSettings: ExportSettings = {
  showName: true,
  showAgentInfo: true,
  agentName: '',
  agentPhone: '',
  customNotes: '',
  selectedMotto: '',
};

function createInitialFamily(
  id: string,
  name: string,
  structureType: string,
  structureLabel: string,
  members: Member[],
  agentInfo?: {name: string; phone: string},
): Family {
  const exportSettings: ExportSettings = {
    ...defaultExportSettings,
    agentName: agentInfo?.name || '',
    agentPhone: agentInfo?.phone || '',
  };
  return {
    id,
    name,
    structureType,
    structureLabel,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members,
    exportSettings,
  };
}

// ========== Context ==========
interface FamilyContextType {
  state: FamilyState;
  reloadFamilies: () => Promise<void>;
  addFamily: (name: string, structureType: string, structureLabel: string, members: Member[], agentInfo?: {name: string; phone: string}) => Promise<string>;
  updateFamily: (family: Family) => Promise<void>;
  deleteFamily: (id: string) => Promise<void>;
  addMember: (familyId: string, member: Member) => Promise<void>;
  updateMember: (familyId: string, member: Member) => Promise<void>;
  deleteMember: (familyId: string, memberId: string) => Promise<void>;
  updateExportSettings: (familyId: string, settings: Partial<ExportSettings>) => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | null>(null);

// ========== Provider ==========
export const FamilyProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [state, dispatch] = useReducer(familyReducer, {
    families: [],
    loading: true,
  });

  // 初始加载（定义在使用之前，避免 TDZ）
  const reloadFamilies = useCallback(async () => {
    dispatch({type: 'SET_LOADING', payload: true});
    const data = await storageService.getFamilies();
    if (data) {
      try {
        const families: Family[] = JSON.parse(data);
        dispatch({type: 'LOAD_FAMILIES', payload: families});
      } catch {
        dispatch({type: 'LOAD_FAMILIES', payload: []});
      }
    } else {
      dispatch({type: 'LOAD_FAMILIES', payload: []});
    }
  }, []);

  useEffect(() => {
    reloadFamilies();
  }, [reloadFamilies]);

  // 自动持久化
  useEffect(() => {
    if (!state.loading) {
      const timer = setTimeout(() => {
        storageService.saveFamilies(JSON.stringify(state.families));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state.families, state.loading]);

  const addFamily = useCallback(
    async (name: string, structureType: string, structureLabel: string, members: Member[], agentInfo?: {name: string; phone: string}) => {
      const id = generateUUID();
      const family = createInitialFamily(id, name, structureType, structureLabel, members, agentInfo);
      dispatch({type: 'ADD_FAMILY', payload: family});
      return id;
    },
    [],
  );

  const updateFamily = useCallback(async (family: Family) => {
    dispatch({type: 'UPDATE_FAMILY', payload: family});
  }, []);

  const deleteFamily = useCallback(async (id: string) => {
    dispatch({type: 'DELETE_FAMILY', payload: id});
  }, []);

  const addMember = useCallback(async (familyId: string, member: Member) => {
    dispatch({type: 'ADD_MEMBER', payload: {familyId, member}});
  }, []);

  const updateMember = useCallback(async (familyId: string, member: Member) => {
    dispatch({type: 'UPDATE_MEMBER', payload: {familyId, member}});
  }, []);

  const deleteMember = useCallback(async (familyId: string, memberId: string) => {
    dispatch({type: 'DELETE_MEMBER', payload: {familyId, memberId}});
  }, []);

  const updateExportSettings = useCallback(
    async (familyId: string, settings: Partial<ExportSettings>) => {
      dispatch({type: 'UPDATE_EXPORT_SETTINGS', payload: {familyId, settings}});
    },
    [],
  );

  return (
    <FamilyContext.Provider
      value={{
        state,
        reloadFamilies,
        addFamily,
        updateFamily,
        deleteFamily,
        addMember,
        updateMember,
        deleteMember,
        updateExportSettings,
      }}>
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = (): FamilyContextType => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};
