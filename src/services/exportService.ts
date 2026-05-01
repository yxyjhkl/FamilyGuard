// src/services/exportService.ts
// 导出服务 - 支持截图、保存相册和分享
import {Alert, Platform, PermissionsAndroid} from 'react-native';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';

class ExportService {
  private viewShotRef: ViewShot | null = null;

  setViewShotRef(ref: ViewShot | null) {
    this.viewShotRef = ref;
  }

  // 请求存储权限（Android）
  private async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      // Android 13+ 使用照片权限
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: '存储权限',
            message: '需要存储权限来保存检视图到相册',
            buttonNeutral: '稍后询问',
            buttonNegative: '取消',
            buttonPositive: '确定',
          },
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // Android 13 以下使用存储权限
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: '存储权限',
            message: '需要存储权限来保存检视图到相册',
            buttonNeutral: '稍后询问',
            buttonNegative: '取消',
            buttonPositive: '确定',
          },
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('存储权限请求失败:', err);
      return false;
    }
  }

  // 截图导出
  async captureView(): Promise<string | null> {
    if (!this.viewShotRef) {
      Alert.alert('错误', '截图组件未准备好，请稍后重试');
      return null;
    }

    try {
      const uri = await this.viewShotRef.capture?.();
      return uri ?? null;
    } catch (error) {
      console.error('截图失败:', error);
      Alert.alert('错误', '截图失败，请重试');
      return null;
    }
  }

  // 保存到相册
  async saveToAlbum(uri: string): Promise<boolean> {
    const hasPermission = await this.requestStoragePermission();
    if (!hasPermission) {
      Alert.alert('权限不足', '请授予存储权限后重试');
      return false;
    }

    try {
      await CameraRoll.saveAsset(uri, {type: 'photo'});
      return true;
    } catch (error) {
      console.error('保存相册失败:', error);
      // 尝试使用其他方式保存
      try {
        await CameraRoll.save(uri, {type: 'photo'});
        return true;
      } catch (error2) {
        console.error('保存相册失败(备用方式):', error2);
        Alert.alert('错误', '保存到相册失败，请重试');
        return false;
      }
    }
  }

  // 分享图片
  async shareToWeChat(uri: string): Promise<void> {
    try {
      await Share.open({
        url: Platform.OS === 'android' ? uri : uri,
        type: 'image/png',
        title: '家庭保障检视图',
        message: '这是我的家庭保障检视图，快来看看吧！',
        subject: '家庭保障检视图',
      });
    } catch (error: any) {
      // 用户取消分享不算错误
      if (error?.message?.includes('User did not share')) {
        return;
      }
      console.error('分享失败:', error);
      Alert.alert('错误', '分享失败，请重试');
    }
  }

  // 一键导出并分享
  async exportAndShare(shareType: 'album' | 'wechat'): Promise<void> {
    const uri = await this.captureView();
    if (!uri) return;

    if (shareType === 'album') {
      const success = await this.saveToAlbum(uri);
      if (success) {
        Alert.alert('成功', '检视图已保存到相册');
      }
    } else {
      await this.shareToWeChat(uri);
    }
  }
}

export const exportService = new ExportService();
