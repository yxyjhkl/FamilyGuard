// src/components/common/RoleAvatar.tsx
// 简笔画风格家庭成员头像组件
import React from 'react';
import Svg, {Circle, Path, G, Defs, LinearGradient, Stop} from 'react-native-svg';
import {colors} from '../../theme';
import type {MemberRole} from '../../types';

interface RoleAvatarProps {
  role: MemberRole;
  size?: number;
}

// 角色配置
const ROLE_CONFIG: Record<MemberRole, {
  headColor: string;
  bodyColor: string;
  skinColor: string;
  hairColor?: string;
}> = {
  husband: {
    headColor: '#4A90D9',
    bodyColor: '#3B7AC4',
    skinColor: '#FFDBB4',
    hairColor: '#3D3D3D',
  },
  wife: {
    headColor: '#E91E63',
    bodyColor: '#C2185B',
    skinColor: '#FFE4C4',
    hairColor: '#5D4037',
  },
  son: {
    headColor: '#3498DB',
    bodyColor: '#2980B9',
    skinColor: '#FFDBB4',
    hairColor: '#4A3728',
  },
  daughter: {
    headColor: '#9B59B6',
    bodyColor: '#8E44AD',
    skinColor: '#FFE4C4',
    hairColor: '#5D4037',
  },
  father: {
    headColor: '#4A90D9',
    bodyColor: '#3B7AC4',
    skinColor: '#FFDBB4',
    hairColor: '#757575',
  },
  mother: {
    headColor: '#E91E63',
    bodyColor: '#C2185B',
    skinColor: '#FFE4C4',
    hairColor: '#5D4037',
  },
  grandfather: {
    headColor: '#FF9800',
    bodyColor: '#F57C00',
    skinColor: '#FFDBB4',
    hairColor: '#E0E0E0', // 白发
  },
  grandmother: {
    headColor: '#E91E63',
    bodyColor: '#C2185B',
    skinColor: '#FFE4C4',
    hairColor: '#E0E0E0', // 白发
  },
  // 新增角色配置
  father_in_law: {
    headColor: '#4A90D9',
    bodyColor: '#3B7AC4',
    skinColor: '#FFDBB4',
    hairColor: '#9E9E9E', // 中年灰发
  },
  mother_in_law: {
    headColor: '#E91E63',
    bodyColor: '#C2185B',
    skinColor: '#FFE4C4',
    hairColor: '#9E9E9E',
  },
  brother: {
    headColor: '#3498DB',
    bodyColor: '#2980B9',
    skinColor: '#FFDBB4',
    hairColor: '#3D3D3D',
  },
  sister: {
    headColor: '#9B59B6',
    bodyColor: '#8E44AD',
    skinColor: '#FFE4C4',
    hairColor: '#5D4037',
  },
  son_in_law: {
    headColor: '#3498DB',
    bodyColor: '#2980B9',
    skinColor: '#FFDBB4',
    hairColor: '#3D3D3D',
  },
  daughter_in_law: {
    headColor: '#E91E63',
    bodyColor: '#C2185B',
    skinColor: '#FFE4C4',
    hairColor: '#5D4037',
  },
  other: {
    headColor: '#95A5A6',
    bodyColor: '#7F8C8D',
    skinColor: '#FFDBB4',
  },
};

// 丈夫/父亲 - 男性简笔画
const MaleAvatar: React.FC<{size: number; config: typeof ROLE_CONFIG.husband}> = ({size, config}) => {
  const s = size / 100;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="maleHead" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={config.headColor} stopOpacity="1" />
          <Stop offset="1" stopColor={config.bodyColor} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      {/* 身体 */}
      <Circle cx="50" cy="75" r="22" fill="url(#maleHead)" />
      {/* 头部 */}
      <Circle cx="50" cy="35" r="18" fill={config.skinColor} />
      {/* 头发 */}
      <Path
        d={`M32 35 Q32 18 50 18 Q68 18 68 35 Q65 28 50 28 Q35 28 32 35`}
        fill={config.hairColor || '#5D4037'}
      />
      {/* 眼睛 */}
      <Circle cx="43" cy="35" r="2.5" fill="#333" />
      <Circle cx="57" cy="35" r="2.5" fill="#333" />
      {/* 微笑 */}
      <Path
        d="M44 42 Q50 47 56 42"
        stroke="#333"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* 领口 */}
      <Path
        d="M38 55 L50 62 L62 55"
        stroke={config.skinColor}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
};

// 妻子/母亲 - 女性简笔画
const FemaleAvatar: React.FC<{size: number; config: typeof ROLE_CONFIG.wife}> = ({size, config}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="femaleHead" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={config.headColor} stopOpacity="1" />
          <Stop offset="1" stopColor={config.bodyColor} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      {/* 身体 */}
      <Circle cx="50" cy="75" r="22" fill="url(#femaleHead)" />
      {/* 头部 */}
      <Circle cx="50" cy="35" r="17" fill={config.skinColor} />
      {/* 头发 */}
      <Path
        d={`M30 38 Q28 20 50 15 Q72 20 70 38 L70 45 Q65 40 50 38 Q35 40 30 45 L30 38`}
        fill={config.hairColor || '#5D4037'}
      />
      {/* 头发装饰 */}
      <Circle cx="72" cy="30" r="4" fill="#FFD700" />
      {/* 眼睛 */}
      <Circle cx="43" cy="35" r="2.5" fill="#333" />
      <Circle cx="57" cy="35" r="2.5" fill="#333" />
      {/* 睫毛 */}
      <Path d="M40 32 L43 30" stroke="#333" strokeWidth="1" />
      <Path d="M60 32 L57 30" stroke="#333" strokeWidth="1" />
      {/* 微笑 */}
      <Path
        d="M44 42 Q50 48 56 42"
        stroke="#E91E63"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* 蝴蝶结 */}
      <G>
        <Path d="M35 18 Q40 12 50 15 Q60 12 65 18" fill="#FF69B4" />
        <Circle cx="50" cy="16" r="3" fill="#FF1493" />
      </G>
    </Svg>
  );
};

// 儿子 - 男孩简笔画
const SonAvatar: React.FC<{size: number; config: typeof ROLE_CONFIG.son}> = ({size, config}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="sonBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={config.headColor} stopOpacity="1" />
          <Stop offset="1" stopColor={config.bodyColor} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      {/* 身体 */}
      <Circle cx="50" cy="72" r="20" fill="url(#sonBody)" />
      {/* 头部 */}
      <Circle cx="50" cy="38" r="17" fill={config.skinColor} />
      {/* 头发 - 男孩短发 */}
      <Path
        d={`M33 38 Q33 22 50 22 Q67 22 67 38 Q64 30 50 30 Q36 30 33 38`}
        fill={config.hairColor || '#4A3728'}
      />
      {/* 呆毛 */}
      <Path
        d="M50 22 L48 12 L52 15 L50 22"
        fill={config.hairColor || '#4A3728'}
      />
      {/* 眼睛 - 大眼睛 */}
      <Circle cx="43" cy="38" r="3" fill="#333" />
      <Circle cx="57" cy="38" r="3" fill="#333" />
      <Circle cx="44" cy="37" r="1" fill="#fff" />
      <Circle cx="58" cy="37" r="1" fill="#fff" />
      {/* 微笑 */}
      <Path
        d="M44 45 Q50 51 56 45"
        stroke="#333"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
};

// 女儿 - 女孩简笔画
const DaughterAvatar: React.FC<{size: number; config: typeof ROLE_CONFIG.daughter}> = ({size, config}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="daughterBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={config.headColor} stopOpacity="1" />
          <Stop offset="1" stopColor={config.bodyColor} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      {/* 身体 */}
      <Circle cx="50" cy="72" r="20" fill="url(#daughterBody)" />
      {/* 头部 */}
      <Circle cx="50" cy="38" r="16" fill={config.skinColor} />
      {/* 头发 - 双马尾 */}
      <Path
        d={`M32 40 Q30 22 50 18 Q70 22 68 40 Q65 35 50 33 Q35 35 32 40`}
        fill={config.hairColor || '#5D4037'}
      />
      {/* 左马尾 */}
      <Path
        d="M32 40 Q25 50 22 65"
        stroke={config.hairColor || '#5D4037'}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* 右马尾 */}
      <Path
        d="M68 40 Q75 50 78 65"
        stroke={config.hairColor || '#5D4037'}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* 眼睛 */}
      <Circle cx="44" cy="38" r="3" fill="#333" />
      <Circle cx="56" cy="38" r="3" fill="#333" />
      <Circle cx="45" cy="37" r="1.2" fill="#fff" />
      <Circle cx="57" cy="37" r="1.2" fill="#fff" />
      {/* 腮红 */}
      <Circle cx="38" cy="43" r="4" fill="#FFB6C1" opacity="0.5" />
      <Circle cx="62" cy="43" r="4" fill="#FFB6C1" opacity="0.5" />
      {/* 微笑 */}
      <Path
        d="M45 46 Q50 51 55 46"
        stroke="#E91E63"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* 蝴蝶结 */}
      <G>
        <Path d="M42 22 Q45 18 50 20 Q55 18 58 22" fill="#FF69B4" />
        <Circle cx="50" cy="21" r="2.5" fill="#FF1493" />
      </G>
    </Svg>
  );
};

// 爷爷 - 老年男性简笔画
const GrandfatherAvatar: React.FC<{size: number; config: typeof ROLE_CONFIG.grandfather}> = ({size, config}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="grandfatherBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={config.headColor} stopOpacity="1" />
          <Stop offset="1" stopColor={config.bodyColor} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      {/* 身体 */}
      <Circle cx="50" cy="75" r="22" fill="url(#grandfatherBody)" />
      {/* 头部 */}
      <Circle cx="50" cy="35" r="18" fill={config.skinColor} />
      {/* 白发 - 老年男性 */}
      <Path
        d={`M32 38 Q30 22 50 20 Q70 22 68 38 Q65 30 50 28 Q35 30 32 38`}
        fill={config.hairColor || '#E0E0E0'}
      />
      {/* 眉毛 */}
      <Path d="M38 30 L46 32" stroke="#757575" strokeWidth="2" strokeLinecap="round" />
      <Path d="M62 30 L54 32" stroke="#757575" strokeWidth="2" strokeLinecap="round" />
      {/* 眼睛 */}
      <Circle cx="43" cy="36" r="2.5" fill="#333" />
      <Circle cx="57" cy="36" r="2.5" fill="#333" />
      {/* 鱼尾纹 */}
      <Path d="M38 40 L36 42" stroke="#BCAAA4" strokeWidth="1" />
      <Path d="M62 40 L64 42" stroke="#BCAAA4" strokeWidth="1" />
      {/* 微笑 */}
      <Path
        d="M44 43 Q50 48 56 43"
        stroke="#333"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* 胡子 */}
      <Path
        d="M42 48 Q50 54 58 48"
        stroke={config.hairColor || '#E0E0E0'}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* 老花镜 */}
      <Circle cx="43" cy="36" r="7" stroke="#8D6E63" strokeWidth="1.5" fill="none" />
      <Circle cx="57" cy="36" r="7" stroke="#8D6E63" strokeWidth="1.5" fill="none" />
      <Path d="M50 36 L50 36" stroke="#8D6E63" strokeWidth="2" />
    </Svg>
  );
};

// 奶奶 - 老年女性简笔画
const GrandmotherAvatar: React.FC<{size: number; config: typeof ROLE_CONFIG.grandmother}> = ({size, config}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="grandmotherBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={config.headColor} stopOpacity="1" />
          <Stop offset="1" stopColor={config.bodyColor} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      {/* 身体 */}
      <Circle cx="50" cy="75" r="22" fill="url(#grandmotherBody)" />
      {/* 头部 */}
      <Circle cx="50" cy="35" r="17" fill={config.skinColor} />
      {/* 白发 - 老年女性 */}
      <Path
        d={`M30 40 Q28 22 50 18 Q72 22 70 40 L70 45 Q65 38 50 36 Q35 38 30 45 L30 40`}
        fill={config.hairColor || '#E0E0E0'}
      />
      {/* 帽子/头巾 */}
      <Path
        d="M33 25 Q50 15 67 25"
        stroke="#FFB6C1"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* 眉毛 */}
      <Path d="M38 30 L45 31" stroke="#9E9E9E" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M62 30 L55 31" stroke="#9E9E9E" strokeWidth="1.5" strokeLinecap="round" />
      {/* 眼睛 */}
      <Circle cx="43" cy="35" r="2.5" fill="#333" />
      <Circle cx="57" cy="35" r="2.5" fill="#333" />
      {/* 鱼尾纹 */}
      <Path d="M38 38 L36 40" stroke="#BCAAA4" strokeWidth="1" />
      <Path d="M62 38 L64 40" stroke="#BCAAA4" strokeWidth="1" />
      {/* 腮红 */}
      <Circle cx="37" cy="40" r="4" fill="#FFB6C1" opacity="0.4" />
      <Circle cx="63" cy="40" r="4" fill="#FFB6C1" opacity="0.4" />
      {/* 微笑 */}
      <Path
        d="M44 43 Q50 49 56 43"
        stroke="#C2185B"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* 老花镜 */}
      <Circle cx="43" cy="35" r="6" stroke="#E91E63" strokeWidth="1.5" fill="none" />
      <Circle cx="57" cy="35" r="6" stroke="#E91E63" strokeWidth="1.5" fill="none" />
      <Path d="M49 35 L51 35" stroke="#E91E63" strokeWidth="2" />
    </Svg>
  );
};

// 其他 - 通用头像
const OtherAvatar: React.FC<{size: number; config: typeof ROLE_CONFIG.other}> = ({size, config}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="otherBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={config.headColor} stopOpacity="1" />
          <Stop offset="1" stopColor={config.bodyColor} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      {/* 身体 */}
      <Circle cx="50" cy="72" r="20" fill="url(#otherBody)" />
      {/* 头部 */}
      <Circle cx="50" cy="38" r="17" fill={config.skinColor} />
      {/* 眼镜 */}
      <Circle cx="43" cy="38" r="6" stroke="#333" strokeWidth="2" fill="none" />
      <Circle cx="57" cy="38" r="6" stroke="#333" strokeWidth="2" fill="none" />
      <Path d="M49 38 L51 38" stroke="#333" strokeWidth="2" />
      {/* 眼睛 */}
      <Circle cx="43" cy="38" r="2" fill="#333" />
      <Circle cx="57" cy="38" r="2" fill="#333" />
      {/* 微笑 */}
      <Path
        d="M44 46 Q50 50 56 46"
        stroke="#333"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
};

const RoleAvatar: React.FC<RoleAvatarProps> = ({role, size = 60}) => {
  const config = ROLE_CONFIG[role];

  switch (role) {
    case 'husband':
    case 'father':
    case 'father_in_law':
    case 'brother':
    case 'son_in_law':
      return <MaleAvatar size={size} config={config} />;
    case 'wife':
    case 'mother':
    case 'mother_in_law':
    case 'sister':
    case 'daughter_in_law':
      return <FemaleAvatar size={size} config={config} />;
    case 'son':
      return <SonAvatar size={size} config={config} />;
    case 'daughter':
      return <DaughterAvatar size={size} config={config} />;
    case 'grandfather':
      return <GrandfatherAvatar size={size} config={config} />;
    case 'grandmother':
      return <GrandmotherAvatar size={size} config={config} />;
    case 'other':
    default:
      return <OtherAvatar size={size} config={config} />;
  }
};

export default RoleAvatar;
