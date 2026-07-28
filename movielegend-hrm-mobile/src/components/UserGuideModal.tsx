import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { Ionicons } from '@expo/vector-icons';
import { saveUserGuideStatus } from '../storage/user-guide.storage';
import { apiUrl } from '../constants/env';
import Toast from 'react-native-toast-message';
import type { UserRole } from '../types/user.types';

export type GuideRoleKey = 'user' | 'admin' | 'leader';

export interface GuideItem {
  id: string;
  key: GuideRoleKey;
  label: string;
  title: string;
  fileName: string;
  url: string;
}

const BASE_SERVER_URL = apiUrl.replace(/\/api\/v1\/?$/, '');

export const GUIDE_FILES: Record<GuideRoleKey, GuideItem> = {
  user: {
    id: '1',
    key: 'user',
    label: 'Hướng dẫn cho Nhân viên',
    title: 'Cẩm nang Hướng dẫn Sử dụng cho Nhân viên',
    fileName: 'Cam_nang_huong_dan_su_dung_cho_nhan_vien_Movielegend.pdf',
    url: `${BASE_SERVER_URL}/uploads/employee_document%2F2026-07-28%2F10fabed1-8f7e-4c2b-9f98-f7e93a240791.pdf`,
  },
  admin: {
    id: '2',
    key: 'admin',
    label: 'Hướng dẫn cho Admin (Chuyên Nghiệp)',
    title: 'MovieLegend App Guide Chuyên Nghiệp (Admin)',
    fileName: 'MovieLegend_App_Guide_Chuyen_Nghiep.pdf',
    url: `${BASE_SERVER_URL}/uploads/employee_document%2F2026-07-28%2F2ac12c7d-ca9b-484f-8a11-dbf8a05abd2a.pdf`,
  },
  leader: {
    id: '3',
    key: 'leader',
    label: 'Hướng dẫn cho Leader (Quản lý)',
    title: 'Cẩm nang Hướng dẫn Sử dụng Role Leader',
    fileName: 'Cam_nang_huong_dan_su_dung_Role_Leader.pdf',
    url: `${BASE_SERVER_URL}/uploads/employee_document%2F2026-07-28%2F800c6748-9c25-4337-9a9d-8fbbc3193f23.pdf`,
  },
};

interface UserGuideModalProps {
  userId: string;
  userRoles?: UserRole[];
  isVisible: boolean;
  onClose: () => void;
}

export function UserGuideModal({ userId, userRoles = [], isVisible, onClose }: UserGuideModalProps) {
  const [viewMode, setViewMode] = useState<'prompt' | 'viewing'>('prompt');
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfHtml, setPdfHtml] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [localPdfUri, setLocalPdfUri] = useState<string | null>(null);

  // Lock guide strictly based on user's role
  const getRoleGuideKey = (): GuideRoleKey => {
    if (userRoles.includes('ADMIN') || userRoles.includes('HR')) {
      return 'admin';
    }
    if (userRoles.includes('LEADER')) {
      return 'leader';
    }
    return 'user';
  };

  const activeGuideKey = getRoleGuideKey();
  const activeGuide = GUIDE_FILES[activeGuideKey];

  useEffect(() => {
    if (isVisible && viewMode === 'viewing') {
      loadPdf(activeGuide.url, activeGuide.fileName);
    } else {
      setPdfHtml(null);
      setLocalPdfUri(null);
    }
  }, [isVisible, viewMode, activeGuideKey]);

  const loadPdf = async (pdfUrl: string, fileName: string) => {
    try {
      setLoadingPdf(true);

      if (Platform.OS === 'web') {
        const html = `
          <iframe src="${pdfUrl}" width="100%" height="100%" style="border: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0;"></iframe>
        `;
        setPdfHtml(html);
        setLoadingPdf(false);
        return;
      }

      const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const targetPath = `${FileSystem.documentDirectory}${cleanName}`;

      // Delete cached file if present to ensure fresh download
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
        encoding: FileSystem.EncodingType.Base64,
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
        const link = document.createElement('a');
        link.href = activeGuide.url;
        link.download = fileName;
        link.click();
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
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        {viewMode === 'prompt' ? (
          <View style={styles.promptContainer}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={activeGuideKey === 'admin' ? 'shield-checkmark' : activeGuideKey === 'leader' ? 'people' : 'book'}
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
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.viewerTitle} numberOfLines={1}>
                  {activeGuide.title}
                </Text>
              </View>
              <Pressable style={styles.downloadButton} onPress={handleDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.downloadButtonText}>Tải về</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* PDF Viewer */}
            <View style={styles.webviewWrapper}>
              {loadingPdf ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingText}>Đang tải cẩm nang...</Text>
                </View>
              ) : pdfHtml ? (
                <WebView
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
                <Text style={styles.startButtonText}>Đã hiểu & Bắt đầu</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  viewerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  webviewWrapper: {
    flex: 1,
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
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
