// src/data/familyTemplates.ts
import type {FamilyTemplate} from '../types';

export const familyTemplates: FamilyTemplate[] = [
  // ========== 常见家庭 ==========
  {
    id: 'couple_only',
    label: '二人世界',
    description: '新婚夫妻，暂无子女',
    category: 'common',
    members: [
      {role: 'husband', defaultName: '先生', defaultAge: 30},
      {role: 'wife', defaultName: '太太', defaultAge: 28},
    ],
  },
  {
    id: 'couple_son',
    label: '夫妻+儿子',
    description: '标准三口之家，育有一子',
    category: 'common',
    members: [
      {role: 'husband', defaultName: '爸爸', defaultAge: 35},
      {role: 'wife', defaultName: '妈妈', defaultAge: 33},
      {role: 'son', defaultName: '儿子', defaultAge: 5},
    ],
  },
  {
    id: 'couple_daughter',
    label: '夫妻+女儿',
    description: '标准三口之家，育有一女',
    category: 'common',
    members: [
      {role: 'husband', defaultName: '爸爸', defaultAge: 35},
      {role: 'wife', defaultName: '妈妈', defaultAge: 33},
      {role: 'daughter', defaultName: '女儿', defaultAge: 5},
    ],
  },
  {
    id: 'couple_son_daughter',
    label: '夫妻+1子1女',
    description: '标准四口之家，儿女双全',
    category: 'common',
    members: [
      {role: 'husband', defaultName: '爸爸', defaultAge: 38},
      {role: 'wife', defaultName: '妈妈', defaultAge: 36},
      {role: 'son', defaultName: '儿子', defaultAge: 8},
      {role: 'daughter', defaultName: '女儿', defaultAge: 4},
    ],
  },
  {
    id: 'couple_two_sons',
    label: '夫妻+2子',
    description: '四口之家，两个儿子',
    category: 'common',
    members: [
      {role: 'husband', defaultName: '爸爸', defaultAge: 38},
      {role: 'wife', defaultName: '妈妈', defaultAge: 36},
      {role: 'son', defaultName: '大儿子', defaultAge: 10},
      {role: 'son', defaultName: '小儿子', defaultAge: 6},
    ],
  },
  {
    id: 'couple_two_daughters',
    label: '夫妻+2女',
    description: '四口之家，两个女儿',
    category: 'common',
    members: [
      {role: 'husband', defaultName: '爸爸', defaultAge: 38},
      {role: 'wife', defaultName: '妈妈', defaultAge: 36},
      {role: 'daughter', defaultName: '大女儿', defaultAge: 10},
      {role: 'daughter', defaultName: '小女儿', defaultAge: 6},
    ],
  },
  {
    id: 'couple_three',
    label: '夫妻+3孩',
    description: '三孩家庭，三个孩子的热闹之家',
    category: 'common',
    members: [
      {role: 'husband', defaultName: '爸爸', defaultAge: 40},
      {role: 'wife', defaultName: '妈妈', defaultAge: 38},
      {role: 'son', defaultName: '大儿子', defaultAge: 12},
      {role: 'daughter', defaultName: '女儿', defaultAge: 8},
      {role: 'son', defaultName: '小儿子', defaultAge: 3},
    ],
  },
  {
    id: 'three_generations',
    label: '三代同堂',
    description: '夫妻+子女+老人，上有老下有小',
    category: 'common',
    members: [
      {role: 'husband', defaultName: '爸爸', defaultAge: 40},
      {role: 'wife', defaultName: '妈妈', defaultAge: 38},
      {role: 'son', defaultName: '儿子', defaultAge: 10},
      {role: 'grandfather', defaultName: '爷爷', defaultAge: 65},
      {role: 'grandmother', defaultName: '奶奶', defaultAge: 63},
    ],
  },

  // ========== 多元家庭 ==========
  {
    id: 'dink',
    label: '丁克家庭',
    description: '夫妻二人，主动选择不要孩子',
    category: 'special',
    members: [
      {role: 'husband', defaultName: '先生', defaultAge: 35},
      {role: 'wife', defaultName: '太太', defaultAge: 33},
    ],
  },
  {
    id: 'single',
    label: '独居一人',
    description: '未婚或离异独居',
    category: 'special',
    members: [
      {role: 'husband', defaultName: '本人', defaultAge: 30},
    ],
  },
  {
    id: 'single_father_wife',
    label: '单亲爸爸+儿子',
    description: '离异或丧偶，父亲独自带儿子',
    category: 'special',
    members: [
      {role: 'husband', defaultName: '爸爸', defaultAge: 38},
      {role: 'son', defaultName: '儿子', defaultAge: 8},
    ],
  },
  {
    id: 'single_father_daughter',
    label: '单亲爸爸+女儿',
    description: '离异或丧偶，父亲独自带女儿',
    category: 'special',
    members: [
      {role: 'husband', defaultName: '爸爸', defaultAge: 38},
      {role: 'daughter', defaultName: '女儿', defaultAge: 8},
    ],
  },
  {
    id: 'single_mother_son',
    label: '单亲妈妈+儿子',
    description: '离异或丧偶，母亲独自带儿子',
    category: 'special',
    members: [
      {role: 'wife', defaultName: '妈妈', defaultAge: 36},
      {role: 'son', defaultName: '儿子', defaultAge: 8},
    ],
  },
  {
    id: 'single_mother_daughter',
    label: '单亲妈妈+女儿',
    description: '离异或丧偶，母亲独自带女儿',
    category: 'special',
    members: [
      {role: 'wife', defaultName: '妈妈', defaultAge: 36},
      {role: 'daughter', defaultName: '女儿', defaultAge: 8},
    ],
  },
  {
    id: 'widow_father',
    label: '丧偶父亲+子女',
    description: '配偶离世，父亲独自抚养子女',
    category: 'special',
    members: [
      {role: 'husband', defaultName: '爸爸', defaultAge: 42},
      {role: 'son', defaultName: '儿子', defaultAge: 12},
      {role: 'daughter', defaultName: '女儿', defaultAge: 8},
    ],
  },
  {
    id: 'widow_mother',
    label: '丧偶母亲+子女',
    description: '配偶离世，母亲独自抚养子女',
    category: 'special',
    members: [
      {role: 'wife', defaultName: '妈妈', defaultAge: 40},
      {role: 'son', defaultName: '儿子', defaultAge: 12},
      {role: 'daughter', defaultName: '女儿', defaultAge: 8},
    ],
  },
  {
    id: 'blended_his_her',
    label: '重组家庭（双方带孩）',
    description: '双方均有子女，重新组合的家庭',
    category: 'special',
    members: [
      {role: 'husband', defaultName: '先生', defaultAge: 42},
      {role: 'wife', defaultName: '太太', defaultAge: 38},
      {role: 'son', defaultName: '我方儿子', defaultAge: 14},
      {role: 'daughter', defaultName: '对方女儿', defaultAge: 10},
      {role: 'son', defaultName: '共同儿子', defaultAge: 3},
    ],
  },
  {
    id: 'blended_his',
    label: '重组家庭（男方带孩）',
    description: '男方带子女进入新家庭',
    category: 'special',
    members: [
      {role: 'husband', defaultName: '先生', defaultAge: 40},
      {role: 'wife', defaultName: '太太', defaultAge: 35},
      {role: 'son', defaultName: '儿子', defaultAge: 12},
    ],
  },
  {
    id: 'blended_hers',
    label: '重组家庭（女方带孩）',
    description: '女方带子女进入新家庭',
    category: 'special',
    members: [
      {role: 'husband', defaultName: '先生', defaultAge: 38},
      {role: 'wife', defaultName: '太太', defaultAge: 36},
      {role: 'daughter', defaultName: '女儿', defaultAge: 8},
    ],
  },
  {
    id: 'grandparent_grandchild',
    label: '隔代家庭',
    description: '祖孙共同生活，父母在外',
    category: 'special',
    members: [
      {role: 'grandfather', defaultName: '爷爷', defaultAge: 68},
      {role: 'grandmother', defaultName: '奶奶', defaultAge: 65},
      {role: 'son', defaultName: '孙子', defaultAge: 8},
    ],
  },
  {
    id: 'empty_nest',
    label: '空巢老人',
    description: '子女已成年离家，老两口相伴',
    category: 'special',
    members: [
      {role: 'husband', defaultName: '老伴', defaultAge: 60},
      {role: 'wife', defaultName: '老伴', defaultAge: 58},
    ],
  },
  {
    id: 'single_parent_adult',
    label: '独居单亲+成年子女',
    description: '单亲父亲/母亲与成年子女',
    category: 'special',
    members: [
      {role: 'husband', defaultName: '父亲', defaultAge: 55},
      {role: 'son', defaultName: '儿子', defaultAge: 25},
    ],
  },
];
