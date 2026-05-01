// src/types/navigation.ts

import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from './index';

export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
export type FamilySelectScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FamilySelect'>;
export type MemberListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MemberList'>;
export type MemberDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MemberDetail'>;
export type ExportPreviewScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ExportPreview'>;

export type MemberListScreenRouteProp = RouteProp<RootStackParamList, 'MemberList'>;
export type MemberDetailScreenRouteProp = RouteProp<RootStackParamList, 'MemberDetail'>;
export type ExportPreviewScreenRouteProp = RouteProp<RootStackParamList, 'ExportPreview'>;
