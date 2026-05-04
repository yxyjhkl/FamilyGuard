// src/services/exportService.ts
// 导出服务 - 支持截图、保存相册和分享
import {Alert, Linking, Platform, PermissionsAndroid} from 'react-native';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import {logger} from '../utils/logger';

// 引导用户去设置页面开启权限
function openAppSettings(): void {
  Linking.openSettings().catch(() => {
    Alert.alert(
      '操作失败',
      '无法打开系统设置，请手动进入：设置 > 应用 > 家庭保障 > 权限',
    );
  });
}

class ExportService {
  private viewShotRef: ViewShot | null = null;

  setViewShotRef(ref: ViewShot | null) {
    this.viewShotRef = ref;
  }

  // 请求存储权限（Android）
  private async requestStoragePermission(): Promise<
    'granted' | 'denied' | 'never_ask_again'
  > {
    if (Platform.OS !== 'android') return 'granted';

    // Platform.Version 在 Android 上是字符串，需转换为数字
    const androidVersion = parseInt(String(Platform.Version), 10);

    try {
      // Android 13+ (API 33+) 使用照片权限
      if (androidVersion >= 33) {
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
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          return 'granted';
        }
        if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          return 'never_ask_again';
        }
        return 'denied';
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
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          return 'granted';
        }
        if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          return 'never_ask_again';
        }
        return 'denied';
      }
    } catch (err) {
      logger.warn('ExportService', '存储权限请求失败', err);
      return 'denied';
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
      logger.error('ExportService', '截图失败', error);
      Alert.alert('错误', '截图失败，请重试');
      return null;
    }
  }

  // 保存到相册
  async saveToAlbum(uri: string): Promise<boolean> {
    const permissionResult = await this.requestStoragePermission();

    if (permissionResult === 'granted') {
      // 权限已授予，执行保存
      try {
        await CameraRoll.saveAsset(uri, {type: 'photo'});
        return true;
      } catch (error) {
        logger.error('ExportService', '保存相册失败', error);
        // 尝试使用其他方式保存
        try {
          await CameraRoll.save(uri, {type: 'photo'});
          return true;
        } catch (error2) {
          logger.error('ExportService', '保存相册失败(备用方式)', error2);
          Alert.alert('错误', '保存到相册失败，请重试');
          return false;
        }
      }
    }

    if (permissionResult === 'never_ask_again') {
      // 用户勾选了"不再询问"，只能引导去设置开启
      Alert.alert(
        '权限被拒绝',
        '您已拒绝存储权限且不再提示，请在系统设置中手动开启权限后重试',
        [
          {text: '取消', style: 'cancel'},
          {text: '去设置', onPress: openAppSettings},
        ],
      );
      return false;
    }

    // permissionResult === 'denied'，用户拒绝但可以再次请求
    Alert.alert('权限不足', '请授予存储权限后重试');
    return false;
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
    } catch (error: unknown) {
      // 用户取消分享不算错误
      const errMsg = error instanceof Error ? error.message : '';
      if (errMsg.includes('User did not share')) {
        return;
      }
      logger.error('ExportService', '分享失败', error);
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
