// src/components/settings/CoverageConfigEditor.tsx
// 保障配置编辑器组件

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import {CoverageConfig, COVERAGE_CATEGORIES} from '../../types';
import {useSettings} from '../../store/settingsStore';
import {DEFAULT_COVERAGES} from '../../data/defaultCoverages';
import {validateName, validateAmount} from '../../utils/validationUtils';

interface Props {
  onClose?: () => void;
}

const CoverageConfigEditor: React.FC<Props> = ({onClose}) => {
  const {
    state,
    getActiveCoverages,
    addCoverage,
    removeCoverage,
    updateCoverage,
    reorderCoverages,
    resetCoveragesToDefault,
  } = useSettings();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingCoverage, setEditingCoverage] = useState<CoverageConfig | null>(null);
  const [newCoverage, setNewCoverage] = useState<Partial<CoverageConfig>>({
    id: '',
    label: '',
    shortLabel: '',
    category: 'other',
    icon: '📋',
    color: '#9B59B6',
    recommendedAmount: 0,
    isDefault: false,
    sortOrder: 0,
  });

  const activeCoverages = getActiveCoverages();

  // 生成唯一ID
  const generateId = () => `custom_${Date.now()}`;

  // 处理添加
  const handleAdd = () => {
    const labelResult = validateName(newCoverage.label || '');
    if (!labelResult.valid) {
      Alert.alert('名称无效', labelResult.error || '请输入有效的保障名称');
      return;
    }

    if (!newCoverage.shortLabel?.trim()) {
      Alert.alert('提示', '请填写简称');
      return;
    }

    const coverage: CoverageConfig = {
      id: generateId(),
      label: labelResult.value,
      shortLabel: newCoverage.shortLabel!.trim(),
      category: newCoverage.category || 'other',
      icon: newCoverage.icon || '📋',
      color: newCoverage.color || '#9B59B6',
      recommendedAmount: newCoverage.recommendedAmount || 0,
      isDefault: false,
      sortOrder: activeCoverages.length + 1,
    };

    addCoverage(coverage);
    setIsAddModalVisible(false);
    resetNewCoverageForm();
  };

  // 处理更新
  const handleUpdate = () => {
    if (!editingCoverage) return;

    const labelResult = validateName(editingCoverage.label || '');
    if (!labelResult.valid) {
      Alert.alert('名称无效', labelResult.error || '请输入有效的保障名称');
      return;
    }

    if (!editingCoverage.shortLabel?.trim()) {
      Alert.alert('提示', '请填写简称');
      return;
    }

    updateCoverage({
      ...editingCoverage,
      label: labelResult.value,
      shortLabel: editingCoverage.shortLabel.trim(),
    });
    setEditingCoverage(null);
  };

  // 处理删除
  const handleDelete = (id: string) => {
    const coverage = state.customCoverages.find(c => c.id === id);
    if (coverage?.isDefault) {
      Alert.alert('提示', '默认保障项不能删除，可以隐藏');
      return;
    }
    
    Alert.alert(
      '确认删除',
      `确定要删除 "${coverage?.label}" 吗？`,
      [
        {text: '取消', style: 'cancel'},
        {text: '删除', style: 'destructive', onPress: () => removeCoverage(id)},
      ]
    );
  };

  // 重置表单
  const resetNewCoverageForm = () => {
    setNewCoverage({
      id: '',
      label: '',
      shortLabel: '',
      category: 'other',
      icon: '📋',
      color: '#9B59B6',
      recommendedAmount: 0,
      isDefault: false,
      sortOrder: 0,
    });
  };

  // 上移
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...state.coverageOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderCoverages(newOrder);
  };

  // 下移
  const handleMoveDown = (index: number) => {
    if (index >= activeCoverages.length - 1) return;
    const newOrder = [...state.coverageOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderCoverages(newOrder);
  };

  // 重置为默认
  const handleReset = () => {
    Alert.alert(
      '确认重置',
      '确定要将保障配置恢复为默认18项吗？',
      [
        {text: '取消', style: 'cancel'},
        {text: '重置', style: 'destructive', onPress: () => resetCoveragesToDefault()},
      ]
    );
  };

  // 获取未添加的默认保障
  const getAvailableDefaults = () => {
    const addedIds = state.customCoverages.map(c => c.id);
    return DEFAULT_COVERAGES.filter(c => !addedIds.includes(c.id));
  };

  const renderCategoryColor = (category: CoverageConfig['category']) => {
    const cat = COVERAGE_CATEGORIES[category];
    return <View style={[styles.categoryDot, {backgroundColor: cat.color}]} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>保障项目配置</Text>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>恢复默认</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.subtitle}>
        当前 {activeCoverages.length} 项 · 可调整顺序、添加或隐藏保障项目
      </Text>

      <ScrollView style={styles.list}>
        {activeCoverages.map((coverage, index) => (
          <View key={coverage.id} style={styles.item}>
            <View style={[styles.itemIcon, {backgroundColor: coverage.color + '20'}]}>
              <Text style={styles.itemIconText}>{coverage.icon}</Text>
            </View>
            
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>{coverage.label}</Text>
              <View style={styles.itemMeta}>
                {renderCategoryColor(coverage.category)}
                <Text style={styles.itemMetaText}>
                  {COVERAGE_CATEGORIES[coverage.category].label}
                </Text>
                <Text style={styles.itemAmount}>
                  {coverage.recommendedAmount > 0 
                    ? `建议 ${coverage.recommendedAmount}万`
                    : '无建议保额'}
                </Text>
              </View>
              {coverage.isDefault && (
                <View style={styles.defaultTag}>
                  <Text style={styles.defaultTagText}>默认</Text>
                </View>
              )}
            </View>

            <View style={styles.itemActions}>
              <TouchableOpacity
                onPress={() => handleMoveUp(index)}
                disabled={index <= 0}
                style={[styles.moveButton, index <= 0 && styles.moveButtonDisabled]}>
                <Text style={styles.moveButtonText}>↑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleMoveDown(index)}
                disabled={index >= activeCoverages.length - 1}
                style={[styles.moveButton, index >= activeCoverages.length - 1 && styles.moveButtonDisabled]}>
                <Text style={styles.moveButtonText}>↓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditingCoverage(coverage)}
                style={styles.editButton}>
                <Text style={styles.editButtonText}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(coverage.id)}
                style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsAddModalVisible(true)}>
        <Text style={styles.addButtonText}>+ 添加自定义保障</Text>
      </TouchableOpacity>

      {/* 添加弹窗 */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>添加保障项目</Text>
            
            <Text style={styles.inputLabel}>名称</Text>
            <TextInput
              style={styles.input}
              value={newCoverage.label}
              onChangeText={(text) => setNewCoverage({...newCoverage, label: text})}
              placeholder="如：质子重离子"
            />
            
            <Text style={styles.inputLabel}>简称</Text>
            <TextInput
              style={styles.input}
              value={newCoverage.shortLabel}
              onChangeText={(text) => setNewCoverage({...newCoverage, shortLabel: text})}
              placeholder="如：质"
              maxLength={2}
            />
            
            <Text style={styles.inputLabel}>分类</Text>
            <View style={styles.categoryPicker}>
              {Object.entries(COVERAGE_CATEGORIES).map(([key, val]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryOption,
                    newCoverage.category === key && {backgroundColor: val.color + '30'},
                  ]}
                  onPress={() => setNewCoverage({...newCoverage, category: key as CoverageConfig['category']})}>
                  <Text style={styles.categoryOptionText}>{val.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>建议保额（万元）</Text>
            <TextInput
              style={styles.input}
              value={newCoverage.recommendedAmount?.toString() || ''}
              onChangeText={(text) => {
                // 允许输入过程（空字符串/小数点开头）
                if (text === '' || text === '.' || text.endsWith('.')) {
                  setNewCoverage({...newCoverage, recommendedAmount: parseFloat(text) || 0});
                  return;
                }
                const result = validateAmount(text, 10000);
                setNewCoverage({...newCoverage, recommendedAmount: result.value});
              }}
              keyboardType="decimal-pad"
              placeholder="0"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setIsAddModalVisible(false);
                  resetNewCoverageForm();
                }}>
                <Text style={styles.modalCancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleAdd}>
                <Text style={styles.modalConfirmButtonText}>添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        visible={editingCoverage !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingCoverage(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>编辑保障项目</Text>
            
            <Text style={styles.inputLabel}>名称</Text>
            <TextInput
              style={styles.input}
              value={editingCoverage?.label || ''}
              onChangeText={(text) => setEditingCoverage(prev => prev ? {...prev, label: text} : null)}
            />
            
            <Text style={styles.inputLabel}>简称</Text>
            <TextInput
              style={styles.input}
              value={editingCoverage?.shortLabel || ''}
              onChangeText={(text) => setEditingCoverage(prev => prev ? {...prev, shortLabel: text} : null)}
              maxLength={2}
            />
            
            <Text style={styles.inputLabel}>分类</Text>
            <View style={styles.categoryPicker}>
              {Object.entries(COVERAGE_CATEGORIES).map(([key, val]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryOption,
                    editingCoverage?.category === key && {backgroundColor: val.color + '30'},
                  ]}
                  onPress={() => setEditingCoverage(prev => prev ? {...prev, category: key as CoverageConfig['category']} : null)}>
                  <Text style={styles.categoryOptionText}>{val.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>建议保额（万元）</Text>
            <TextInput
              style={styles.input}
              value={editingCoverage?.recommendedAmount?.toString() || ''}
              onChangeText={(text) => {
                if (text === '' || text === '.' || text.endsWith('.')) {
                  setEditingCoverage(prev => prev ? {...prev, recommendedAmount: parseFloat(text) || 0} : null);
                  return;
                }
                const result = validateAmount(text, 10000);
                setEditingCoverage(prev => prev ? {...prev, recommendedAmount: result.value} : null);
              }}
              keyboardType="decimal-pad"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditingCoverage(null)}>
                <Text style={styles.modalCancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleUpdate}>
                <Text style={styles.modalConfirmButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFE5E5',
    borderRadius: 4,
  },
  resetButtonText: {
    fontSize: 12,
    color: '#E74C3C',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 12,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIconText: {
    fontSize: 20,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  itemMetaText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  itemAmount: {
    fontSize: 12,
    color: '#999',
  },
  defaultTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultTagText: {
    fontSize: 10,
    color: '#3498DB',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moveButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  moveButtonDisabled: {
    opacity: 0.3,
  },
  moveButtonText: {
    fontSize: 16,
    color: '#666',
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
    backgroundColor: '#E8F4FD',
    borderRadius: 4,
  },
  editButtonText: {
    fontSize: 12,
    color: '#3498DB',
  },
  deleteButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#E74C3C',
    fontWeight: '300',
  },
  addButton: {
    margin: 12,
    padding: 16,
    backgroundColor: '#4A90D9',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  categoryOptionText: {
    fontSize: 13,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
});

export default CoverageConfigEditor;
