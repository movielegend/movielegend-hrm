import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { Ionicons } from '@expo/vector-icons';
import { saveUserGuideStatus } from '../storage/user-guide.storage';
import { resolveFileUrl } from '../utils/url';
import Toast from 'react-native-toast-message';
import type { UserRole } from '../types/user.types';

export type GuideRoleKey = 'user' | 'leader' | 'admin';

export interface GuideItem {
  id: string;
  key: GuideRoleKey;
  label: string;
  tabLabel: string;
  title: string;
  fileName: string;
  url: string;
}

export function getGuideFiles(): Record<GuideRoleKey, GuideItem> {
  return {
    user: {
      id: '1',
      key: 'user',
      label: 'Hướng dẫn cho Nhân viên',
      tabLabel: 'Nhân viên',
      title: 'Cẩm nang Hướng dẫn Sử dụng cho Nhân viên',
      fileName: 'Cam_nang_huong_dan_su_dung_cho_nhan_vien_Movielegend.pdf',
      url: resolveFileUrl('/uploads/Cam_nang_huong_dan_su_dung_cho_nhan_vien_Movielegend.pdf') || '',
    },
    leader: {
      id: '2',
      key: 'leader',
      label: 'Hướng dẫn cho Quản lý (Leader)',
      tabLabel: 'Quản lý (Leader)',
      title: 'Cẩm nang Hướng dẫn Sử dụng Role Leader',
      fileName: 'Cam_nang_huong_dan_su_dung_Role_Leader.pdf',
      url: resolveFileUrl('/uploads/Cam_nang_huong_dan_su_dung_Role_Leader.pdf') || '',
    },
    admin: {
      id: '3',
      key: 'admin',
      label: 'Hướng dẫn cho Quản trị (Admin)',
      tabLabel: 'Quản trị (Admin)',
      title: 'MovieLegend App Guide Chuyên Nghiệp (Admin)',
      fileName: 'MovieLegend_App_Guide_Chuyen_Nghiep.pdf',
      url: resolveFileUrl('/uploads/MovieLegend_App_Guide_Chuyen_Nghiep.pdf') || '',
    },
  };
}

export const GUIDE_FILES = getGuideFiles();

interface UserGuideModalProps {
  userId: string;
  userRoles?: UserRole[];
  isVisible: boolean;
  onClose: () => void;
  initialViewMode?: 'prompt' | 'viewing';
}

export function UserGuideModal({
  userId,
  userRoles = [],
  isVisible,
  onClose,
  initialViewMode = 'prompt',
}: UserGuideModalProps) {
  const guideFiles = useMemo(() => getGuideFiles(), [isVisible]);

  const getDefaultGuideKey = (): GuideRoleKey => {
    if (userRoles.includes('ADMIN') || userRoles.includes('HR') || userRoles.includes('ACCOUNTANT')) {
      return 'admin';
    }
    if (userRoles.includes('LEADER')) {
      return 'leader';
    }
    return 'user';
  };

  const getAvailableGuideKeys = (): GuideRoleKey[] => {
    if (userRoles.includes('ADMIN') || userRoles.includes('HR') || userRoles.includes('ACCOUNTANT')) {
      return ['admin', 'leader', 'user'];
    }
    if (userRoles.includes('LEADER')) {
      return ['leader', 'user'];
    }
    return ['user'];
  };

  const availableKeys = useMemo(() => getAvailableGuideKeys(), [userRoles]);
  const [selectedGuideKey, setSelectedGuideKey] = useState<GuideRoleKey>(getDefaultGuideKey);
  const [viewMode, setViewMode] = useState<'prompt' | 'viewing'>(initialViewMode);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfHtml, setPdfHtml] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [localPdfUri, setLocalPdfUri] = useState<string | null>(null);

  const activeGuide = guideFiles[selectedGuideKey] || guideFiles.user;

  useEffect(() => {
    if (isVisible) {
      setSelectedGuideKey(getDefaultGuideKey());
      setViewMode(initialViewMode);
    } else {
      setPdfHtml(null);
      setLocalPdfUri(null);
    }
  }, [isVisible, initialViewMode]);

  useEffect(() => {
    if (isVisible && viewMode === 'viewing') {
      loadPdf(activeGuide.url, activeGuide.fileName);
    }
  }, [isVisible, viewMode, selectedGuideKey]);

  const loadPdf = async (pdfUrl: string, fileName: string) => {
    try {
      setLoadingPdf(true);

      if (Platform.OS === 'web') {
        setLoadingPdf(false);
        return;
      }

      const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const targetPath = `${FileSystem.documentDirectory}${cleanName}`;

      const existingInfo = await FileSystem.getInfoAsync(targetPath);
      if (existingInfo.exists) {
        await FileSystem.deleteAsync(targetPath, { idempotent: true });
      }

      const { uri, status } = await FileSystem.downloadAsync(pdfUrl, targetPath, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });

      if (status !== 200) {
        throw new Error(`Download status: ${status}`);
      }

      setLocalPdfUri(uri);
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const html = `<!DOCTYPE html><html><head>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=3,user-scalable=yes">
        <style>
          body{margin:0;background:#525659;}
          canvas{display:block;margin:8px auto;box-shadow:0 2px 8px rgba(0,0,0,.4);max-width:100%;}
          #loading{color:#fff;text-align:center;padding:40px;font-family:sans-serif;font-size:15px;}
          #error{color:#f88;text-align:center;padding:40px;font-family:sans-serif;}
        </style>
      </head><body>
        <div id="loading">Đang tải tài liệu...</div>
        <div id="error"></div>
        <div id="container"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <script>
          pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const base64='${base64}';
          const binary=atob(base64);
          const bytes=new Uint8Array(binary.length);
          for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
          pdfjsLib.getDocument({data:bytes}).promise.then(function(pdf){
            document.getElementById('loading').style.display='none';
            for(let p=1;p<=pdf.numPages;p++){
              pdf.getPage(p).then(function(page){
                const vp=page.getViewport({scale:window.innerWidth/page.getViewport({scale:1}).width});
                const pixelRatio = window.devicePixelRatio || 1;
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = Math.floor(vp.width * pixelRatio);
                canvas.height = Math.floor(vp.height * pixelRatio);
                canvas.style.width = Math.floor(vp.width) + 'px';
                canvas.style.height = Math.floor(vp.height) + 'px';
                context.scale(pixelRatio, pixelRatio);
                document.getElementById('container').appendChild(canvas);
                page.render({canvasContext:context,viewport:vp});
              });
            }
          }).catch(function(err){
            document.getElementById('loading').style.display='none';
            document.getElementById('error').textContent='Không thể hiển thị PDF: ' + err.message;
          });
        </script>
      </body></html>`;

      setPdfHtml(html);
    } catch (err) {
      console.error('Error rendering guide PDF:', err);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleSkip = async () => {
    await saveUserGuideStatus(userId, 'skipped');
    onClose();
  };

  const handleViewGuide = () => {
    setViewMode('viewing');
  };

  const handleFinishViewing = async () => {
    await saveUserGuideStatus(userId, 'viewed');
    onClose();
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const fileName = activeGuide.fileName;
      const fileUri = localPdfUri || `${FileSystem.documentDirectory}${fileName}`;

      if (Platform.OS === 'ios') {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
      } else if (Platform.OS === 'android') {
        try {
          const contentUri = await FileSystem.getContentUriAsync(fileUri);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1,
            type: 'application/pdf',
          });
        } catch (e) {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
          }
        }
      } else {
        if (typeof window !== 'undefined') {
          const link = document.createElement('a');
          link.href = activeGuide.url;
          link.download = fileName;
          link.target = '_blank';
          link.click();
        }
      }
      Toast.show({
        type: 'success',
        text1: 'Đã tải thành công',
        text2: fileName,
      });
    } catch (error) {
      console.error('Download error:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi khi tải file',
        text2: 'Vui lòng thử lại sau',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {viewMode === 'prompt' ? (
          <View style={styles.promptContainer}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={selectedGuideKey === 'admin' ? 'shield-checkmark' : selectedGuideKey === 'leader' ? 'people' : 'book'}
                size={44}
                color="#0F172A"
              />
            </View>
            <Text style={styles.title}>Hướng Dẫn Sử Dụng</Text>
            <Text style={styles.message}>
              {activeGuide.title}
            </Text>

            <View style={styles.buttonRow}>
              <Pressable style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Bỏ qua</Text>
              </Pressable>
              <Pressable style={styles.viewButton} onPress={handleViewGuide}>
                <Text style={styles.viewButtonText}>Xem hướng dẫn</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.viewerContainer}>
            {/* Top Header */}
            <View style={styles.viewerHeader}>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </Pressable>
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <Text style={styles.viewerTitle} numberOfLines={1}>
                  {activeGuide.title}
                </Text>
              </View>
              <Pressable style={styles.downloadButton} onPress={handleDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.downloadButtonText}>Tải về</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Role tabs if multiple guides are accessible */}
            {availableKeys.length > 1 && (
              <View style={styles.tabBar}>
                {availableKeys.map((key) => {
                  const isSelected = key === selectedGuideKey;
                  return (
                    <Pressable
                      key={key}
                      style={[styles.tabItem, isSelected && styles.tabItemActive]}
                      onPress={() => setSelectedGuideKey(key)}
                    >
                      <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                        {guideFiles[key].tabLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* PDF Viewer */}
            <View style={styles.webviewWrapper}>
              {Platform.OS === 'web' ? (
                <View style={styles.webViewer}>
                  {activeGuide.url ? (
                    <iframe
                      src={activeGuide.url}
                      style={{ width: '100%', height: '100%', border: 'none' } as any}
                      title={activeGuide.title}
                    />
                  ) : (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.errorText}>Đang chuẩn bị tài liệu...</Text>
                    </View>
                  )}
                </View>
              ) : loadingPdf ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingText}>Đang tải cẩm nang...</Text>
                </View>
              ) : pdfHtml ? (
                <WebView
                  key={`webview-${selectedGuideKey}`}
                  source={{ html: pdfHtml, baseUrl: '' }}
                  style={styles.webview}
                  originWhitelist={['*']}
                  javaScriptEnabled
                  mixedContentMode="always"
                />
              ) : (
                <View style={styles.loadingContainer}>
                  <Text style={styles.errorText}>Không thể hiển thị PDF</Text>
                  <Pressable style={styles.retryButton} onPress={() => loadPdf(activeGuide.url, activeGuide.fileName)}>
                    <Text style={styles.retryButtonText}>Thử lại</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.viewerFooter}>
              <Pressable style={styles.startButton} onPress={handleFinishViewing}>
                <Text style={styles.startButtonText}>Đã hiểu & Đóng</Text>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptContainer: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  viewButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Viewer styles
  viewerContainer: {
    width: '95%',
    height: '92%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    overflow: 'hidden',
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  viewerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 6,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  webviewWrapper: {
    flex: 1,
    backgroundColor: '#525659',
  },
  webViewer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#525659',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#525659',
    gap: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 15,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewerFooter: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
