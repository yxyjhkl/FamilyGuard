// src/components/settings/RightConfigEditor.tsx
// 权益配置编辑器组件

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
import {RightConfig} from '../../types';
import {useSettings} from '../../store/settingsStore';
import {DEFAULT_RIGHTS} from '../../data/defaultRights';

interface Props {
  onClose?: () => void;
}

const RightConfigEditor: React.FC<Props> = ({onClose}) => {
  const {
    state,
    getActiveRights,
    addRight,
    removeRight,
    updateRight,
    reorderRights,
    resetRightsToDefault,
  } = useSettings();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingRight, setEditingRight] = useState<RightConfig | null>(null);
  const [newRight, setNewRight] = useState<Partial<RightConfig>>({
    id: '',
    label: '',
    shortLabel: '',
    icon: '✨',
    color: '#9B59B6',
    isDefault: false,
    sortOrder: 0,
  });

  const activeRights = getActiveRights();

  // 生成唯一ID
  const generateId = () => `custom_right_${Date.now()}`;

  // 处理添加
  const handleAdd = () => {
    if (!newRight.label || !newRight.shortLabel) {
      Alert.alert('提示', '请填写名称和简称');
      return;
    }
    
    const right: RightConfig = {
      id: generateId(),
      label: newRight.label!,
      shortLabel: newRight.shortLabel!,
      icon: newRight.icon || '✨',
      color: newRight.color || '#9B59B6',
      isDefault: false,
      sortOrder: activeRights.length + 1,
    };
    
    addRight(right);
    setIsAddModalVisible(false);
    resetNewRightForm();
  };

  // 处理更新
  const handleUpdate = () => {
    if (!editingRight) return;
    if (!editingRight.label || !editingRight.shortLabel) {
      Alert.alert('提示', '请填写名称和简称');
      return;
    }
    
    updateRight(editingRight);
    setEditingRight(null);
  };

  // 处理删除
  const handleDelete = (id: string) => {
    const right = state.customRights.find(r => r.id === id);
    if (right?.isDefault) {
      Alert.alert('提示', '默认权益项不能删除，可以隐藏');
      return;
    }
    
    Alert.alert(
      '确认删除',
      `确定要删除 "${right?.label}" 吗？`,
      [
        {text: '取消', style: 'cancel'},
        {text: '删除', style: 'destructive', onPress: () => removeRight(id)},
      ]
    );
  };

  // 重置表单
  const resetNewRightForm = () => {
    setNewRight({
      id: '',
      label: '',
      shortLabel: '',
      icon: '✨',
      color: '#9B59B6',
      isDefault: false,
      sortOrder: 0,
    });
  };

  // 上移
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...state.rightsOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderRights(newOrder);
  };

  // 下移
  const handleMoveDown = (index: number) => {
    if (index >= activeRights.length - 1) return;
    const newOrder = [...state.rightsOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderRights(newOrder);
  };

  // 重置为默认
  const handleReset = () => {
    Alert.alert(
      '确认重置',
      '确定要将权益配置恢复为默认8项吗？',
      [
        {text: '取消', style: 'cancel'},
        {text: '重置', style: 'destructive', onPress: () => resetRightsToDefault()},
      ]
    );
  };

  // 预设图标
  const iconOptions = ['✨', '🏡', '👨‍⚕️', '🏦', '🏛️', '🌳', '🔬', '💊', '📋', '🎁', '💰', '⭐'];

  // 预设颜色
  const colorOptions = ['#1ABC9C', '#3498DB', '#9B59B6', '#E74C3C', '#27AE60', '#F39C12', '#E91E63', '#00BCD4'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>权益项目配置</Text>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>恢复默认</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.subtitle}>
        当前 {activeRights.length} 项 · 可调整顺序、添加或隐藏权益项目
      </Text>

      <ScrollView style={styles.list}>
        {activeRights.map((right, index) => (
          <View key={right.id} style={styles.item}>
            <View style={[styles.itemIcon, {backgroundColor: right.color + '20'}]}>
              <Text style={styles.itemIconText}>{right.icon}</Text>
            </View>
            
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>{right.label}</Text>
              <Text style={styles.itemShortLabel}>简称：{right.shortLabel}</Text>
              {right.isDefault && (
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
                disabled={index >= activeRights.length - 1}
                style={[styles.moveButton, index >= activeRights.length - 1 && styles.moveButtonDisabled]}>
                <Text style={styles.moveButtonText}>↓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditingRight(right)}
                style={styles.editButton}>
                <Text style={styles.editButtonText}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(right.id)}
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
        <Text style={styles.addButtonText}>+ 添加自定义权益</Text>
      </TouchableOpacity>

      {/* 添加弹窗 */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>添加权益项目</Text>
            
            <Text style={styles.inputLabel}>名称</Text>
            <TextInput
              style={styles.input}
              value={newRight.label}
              onChangeText={(text) => setNewRight({...newRight, label: text})}
              placeholder="如：健康管理"
            />
            
            <Text style={styles.inputLabel}>简称</Text>
            <TextInput
              style={styles.input}
              value={newRight.shortLabel}
              onChangeText={(text) => setNewRight({...newRight, shortLabel: text})}
              placeholder="如：健"
              maxLength={2}
            />
            
            <Text style={styles.inputLabel}>图标</Text>
            <View style={styles.iconPicker}>
              {iconOptions.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    newRight.icon === icon && styles.iconOptionSelected,
                  ]}
                  onPress={() => setNewRight({...newRight, icon})}>
                  <Text style={styles.iconOptionText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.inputLabel}>颜色</Text>
            <View style={styles.colorPicker}>
              {colorOptions.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    {backgroundColor: color},
                    newRight.color === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setNewRight({...newRight, color})}
                />
              ))}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setIsAddModalVisible(false);
                  resetNewRightForm();
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
        visible={editingRight !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingRight(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>编辑权益项目</Text>
            
            <Text style={styles.inputLabel}>名称</Text>
            <TextInput
              style={styles.input}
              value={editingRight?.label || ''}
              onChangeText={(text) => setEditingRight(prev => prev ? {...prev, label: text} : null)}
            />
            
            <Text style={styles.inputLabel}>简称</Text>
            <TextInput
              style={styles.input}
              value={editingRight?.shortLabel || ''}
              onChangeText={(text) => setEditingRight(prev => prev ? {...prev, shortLabel: text} : null)}
              maxLength={2}
            />
            
            <Text style={styles.inputLabel}>图标</Text>
            <View style={styles.iconPicker}>
              {iconOptions.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    editingRight?.icon === icon && styles.iconOptionSelected,
                  ]}
                  onPress={() => setEditingRight(prev => prev ? {...prev, icon} : null)}>
                  <Text style={styles.iconOptionText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.inputLabel}>颜色</Text>
            <View style={styles.colorPicker}>
              {colorOptions.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    {backgroundColor: color},
                    editingRight?.color === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setEditingRight(prev => prev ? {...prev, color} : null)}
                />
              ))}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditingRight(null)}>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIconText: {
    fontSize: 22,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  itemShortLabel: {
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
    backgroundColor: '#1ABC9C',
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
  iconPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  iconOptionSelected: {
    backgroundColor: '#E8F4FD',
    borderWidth: 2,
    borderColor: '#3498DB',
  },
  iconOptionText: {
    fontSize: 24,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#333',
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
    backgroundColor: '#1ABC9C',
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
});

export default RightConfigEditor;
