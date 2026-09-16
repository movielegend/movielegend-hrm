import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { useUpdateTemplateMapping } from '../../hooks/useContracts';
import { router, useLocalSearchParams } from 'expo-router';
import { resolveFileUrl } from '../../utils/url';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAlert } from '../../components/CustomAlert';

export function SignaturePlacementScreen() {
  const params = useLocalSearchParams();
  const templateId = params.templateId as string;
  const pdfUrl = params.pdfUrl as string;
  const initialConfigStr = params.initialConfig as string;
  
  const updateMapping = useUpdateTemplateMapping(templateId);
  const webviewRef = useRef<WebView>(null);
  const webviewReadyRef = useRef(false);
  const pdfBase64Ref = useRef<string | null>(null);

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const [fields, setFields] = useState<any[]>([]);
  const fieldsRef = useRef<any[]>([]);
  useEffect(() => { fieldsRef.current = fields; }, [fields]);

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (initialConfigStr) {
      try {
        const config = JSON.parse(initialConfigStr);
        if (Array.isArray(config)) setFields(config);
      } catch (e) {}
    }
  }, [initialConfigStr]);

  const sendPdfToWebview = React.useCallback(() => {
    if (webviewReadyRef.current && pdfBase64Ref.current && webviewRef.current) {
      webviewRef.current.postMessage(
        JSON.stringify({
          type: 'load_pdf',
          data: pdfBase64Ref.current,
          fields: fieldsRef.current,
        })
      );
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPdf() {
      const url = resolveFileUrl(pdfUrl);
      try {
        if (!url) {
          CustomAlert.alert('Lỗi', 'Không tìm thấy đường dẫn PDF');
          setIsLoading(false);
          return;
        }

        const safeId = templateId ? templateId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'temp';
        const fileUri = `${FileSystem.cacheDirectory}contract_tpl_${safeId}.pdf`;

        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        let needDownload = true;

        if (fileInfo.exists && (fileInfo as any).size > 1000) {
          try {
            const cachedBase64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
            if (isMounted) {
              pdfBase64Ref.current = cachedBase64;
              sendPdfToWebview();
              needDownload = false;
            }
          } catch (readErr) {
            needDownload = true;
          }
        }

        if (needDownload) {
          let downloadRes: any = null;
          try {
            downloadRes = await FileSystem.downloadAsync(url, fileUri, {
              headers: { 'ngrok-skip-browser-warning': '69420' },
            });
          } catch (err) {
            const altUrl = url.startsWith('https://')
              ? url.replace('https://', 'http://')
              : url.replace('http://', 'https://');
            downloadRes = await FileSystem.downloadAsync(altUrl, fileUri, {
              headers: { 'ngrok-skip-browser-warning': '69420' },
            });
          }

          if (downloadRes && downloadRes.status === 200) {
            const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
            if (isMounted) {
              pdfBase64Ref.current = base64;
              sendPdfToWebview();
            }
          } else {
            throw new Error(`Không thể tải file PDF (mã phản hồi ${downloadRes?.status || 'lỗi mạng'})`);
          }
        }
      } catch (e: any) {
        console.error('[SignaturePlacement] Error loading PDF:', e);
        if (isMounted) {
          CustomAlert.alert('Lỗi', 'Không thể tải file PDF');
          setIsLoading(false);
        }
      }
    }

    void loadPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl, templateId, sendPdfToWebview]);

  // Push updated fields to WebView
  useEffect(() => {
    if (webviewReadyRef.current) {
      webviewRef.current?.postMessage(JSON.stringify({ type: 'update_fields', fields }));
    }
  }, [fields]);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin />
    <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
    <style>
        body { margin: 0; padding: 0; background-color: #f3f4f6; display: flex; justify-content: center; padding-bottom: 100px; }
        #pdf-container { position: relative; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .field-box {
            position: absolute; 
            border: 2px solid #3b82f6; 
            background-color: rgba(59, 130, 246, 0.2); 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            color: #1d4ed8; 
            font-weight: bold;
            font-family: sans-serif;
            font-size: 12px;
            cursor: move;
            touch-action: none;
            box-sizing: border-box;
            border-radius: 4px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        .field-box.selected { border-color: #ef4444; background-color: rgba(239, 68, 68, 0.2); color: #ef4444; z-index: 10; }
        #loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-family: sans-serif; color: #6b7280; font-size: 16px; }
    </style>
</head>
<body>
    <div id="loading">Đang tải PDF...</div>
    <div id="pdf-container" style="display: none;">
        <canvas id="pdf-canvas"></canvas>
    </div>

    <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        let pdfDoc = null, pageNum = 1, currentScale = 1, pdfActualHeight = 0, currentFields = [];
        let canvas = document.getElementById('pdf-canvas');
        let ctx = canvas.getContext('2d');
        let container = document.getElementById('pdf-container');
        
        const getBoxSize = (field) => {
            let defW = 150, defH = 30;
            if (field.type === 'signature') { defW = 150; defH = 75; }
            if (field.type === 'checkbox') { defW = 30; defH = 30; }
            return { w: field.width || defW, h: field.height || defH };
        };

        function renderPage(num) {
            pdfDoc.getPage(num).then(function(page) {
                const unscaledViewport = page.getViewport({scale: 1});
                pdfActualHeight = unscaledViewport.height;
                currentScale = window.innerWidth / unscaledViewport.width;
                const viewport = page.getViewport({scale: currentScale});
                const dpr = window.devicePixelRatio || 1;
                canvas.width = viewport.width * dpr;
                canvas.height = viewport.height * dpr;
                canvas.style.width = viewport.width + 'px';
                canvas.style.height = viewport.height + 'px';
                container.style.width = viewport.width + 'px';
                container.style.height = viewport.height + 'px';

                drawFields();
                page.render({ canvasContext: ctx, viewport: viewport, transform: [dpr, 0, 0, dpr, 0, 0] }).promise.then(function() {
                    document.getElementById('loading').style.display = 'none';
                    container.style.display = 'block';
                });
            });
        }

        function drawFields() {
            let existingIds = [];
            currentFields.forEach(field => {
                if (field.page !== pageNum) return;
                let boxId = 'box-' + field.id;
                existingIds.push(boxId);
                let el = document.getElementById(boxId);
                let size = getBoxSize(field);
                
                let screenX = field.x * currentScale;
                let screenY = (pdfActualHeight - field.y - size.h) * currentScale;

                if (!el) {
                    el = document.createElement('div');
                    el.id = boxId;
                    setupDragging(el, field.id, size);
                    container.appendChild(el);
                }

                if (activeBox !== el) {
                    el.style.left = screenX + 'px';
                    el.style.top = screenY + 'px';
                }

                el.className = 'field-box' + (field.selected ? ' selected' : '');
                el.style.width = (size.w * currentScale) + 'px';
                el.style.height = (size.h * currentScale) + 'px';
                if (field.type === 'text') {
                    el.style.fontSize = (field.fontSize || 12) * currentScale + 'px';
                    el.style.justifyContent = 'flex-start';
                    el.style.alignItems = 'flex-end';
                    el.style.paddingLeft = (5 * currentScale) + 'px';
                    el.style.paddingBottom = (2 * currentScale) + 'px';
                } else {
                    el.style.fontSize = (12 * currentScale) + 'px';
                    el.style.justifyContent = 'center';
                    el.style.alignItems = 'center';
                    el.style.paddingLeft = '0px';
                    el.style.paddingBottom = '0px';
                }
                el.innerText = field.label || field.id;
            });

            document.querySelectorAll('.field-box').forEach(e => {
                if (!existingIds.includes(e.id)) e.remove();
            });
        }

        let activeBox = null, startX, startY, initialLeft, initialTop;
        
        function setupDragging(el, id, size) {
            el.addEventListener('touchstart', function(e) {
                activeBox = el;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                initialLeft = parseFloat(el.style.left) || 0;
                initialTop = parseFloat(el.style.top) || 0;
                
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select_field', id }));
                e.preventDefault();
            });
        }

        document.addEventListener('touchmove', function(e) {
            if (!activeBox) return;
            let dx = e.touches[0].clientX - startX;
            let dy = e.touches[0].clientY - startY;
            
            let newX = initialLeft + dx;
            let newY = initialTop + dy;

            newX = Math.max(0, Math.min(newX, canvas.width - activeBox.offsetWidth));
            newY = Math.max(0, Math.min(newY, canvas.height - activeBox.offsetHeight));
            
            activeBox.style.left = newX + 'px';
            activeBox.style.top = newY + 'px';
            e.preventDefault();
        }, {passive: false});

        document.addEventListener('touchend', function() {
            if (activeBox) {
                let id = activeBox.id.replace('box-', '');
                let field = currentFields.find(f => f.id === id);
                let size = getBoxSize(field);
                
                let left = parseFloat(activeBox.style.left) || 0;
                let top = parseFloat(activeBox.style.top) || 0;

                let pdfX = left / currentScale;
                let pdfY = pdfActualHeight - (top / currentScale) - size.h;
                
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'update_pos', id, x: Math.round(pdfX), y: Math.round(pdfY) }));
                activeBox = null;
            }
        });

        function handleIncomingMessage(event) {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (!data) return;
                if (data.type === 'load_pdf') {
                    currentFields = data.fields || [];
                    const binary = atob(data.data);
                    const array = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
                    pdfjsLib.getDocument({ data: array }).promise.then(function(pdfDoc_) {
                        pdfDoc = pdfDoc_;
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'init', totalPages: pdfDoc.numPages }));
                        renderPage(pageNum);
                    }).catch(function(err) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message }));
                    });
                } else if (data.type === 'update_fields') {
                    currentFields = data.fields || [];
                    if (pdfDoc) drawFields();
                } else if (data.type === 'prev_page' && pageNum > 1 && pdfDoc) {
                    pageNum--;
                    renderPage(pageNum);
                } else if (data.type === 'next_page' && pdfDoc && pageNum < pdfDoc.numPages) {
                    pageNum++;
                    renderPage(pageNum);
                }
            } catch (err) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message }));
            }
        }

        document.addEventListener('message', handleIncomingMessage);
        window.addEventListener('message', handleIncomingMessage);

        // Notify React Native that WebView is ready
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'webview_ready' }));
    </script>
</body>
</html>
  `;

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'webview_ready') {
        webviewReadyRef.current = true;
        sendPdfToWebview();
      } else if (data.type === 'init') {
        setTotalPages(data.totalPages);
        setIsLoading(false);
      } else if (data.type === 'select_field') {
        setSelectedFieldId(data.id);
        setFields(prev => prev.map(f => ({ ...f, selected: f.id === data.id })));
      } else if (data.type === 'update_pos') {
        setFields(prev => prev.map(f => f.id === data.id ? { ...f, x: data.x, y: data.y } : f));
      } else if (data.type === 'error') {
        console.error('[SignaturePlacement WebView Error]:', data.message);
        CustomAlert.alert('Lỗi', `Lỗi xử lý file PDF: ${data.message}`);
        setIsLoading(false);
      }
    } catch (e) {}
  };

  const getMaxFontSize = (w: number, h: number, label?: string) => {
    const textLen = Math.max(1, (label || '').length);
    const maxByWidth = Math.floor(w / (textLen * 0.6));
    return Math.max(8, Math.min(h, maxByWidth));
  };

  const resizeSelectedField = (dw: number, dh: number) => {
    if (!selectedFieldId) return;
    setFields(prev => prev.map(f => {
      if (f.id === selectedFieldId) {
        const curW = f.width || getBoxSizeDefault(f.type).w;
        const curH = f.height || getBoxSizeDefault(f.type).h;
        const newW = Math.max(20, curW + dw);
        const newH = Math.max(20, curH + dh);
        let newFontSize = f.fontSize || 12;
        if (f.type === 'text') {
            const maxFS = getMaxFontSize(newW, newH, f.label || f.id);
            newFontSize = Math.min(newFontSize, maxFS);
        }
        return { ...f, width: newW, height: newH, fontSize: newFontSize };
      }
      return f;
    }));
  };

  const updateSelectedFieldFontSize = (newSize: number) => {
    if (!selectedFieldId) return;
    setFields(prev => prev.map(f => {
      if (f.id === selectedFieldId && f.type === 'text') {
        const curW = f.width || getBoxSizeDefault(f.type).w;
        const curH = f.height || getBoxSizeDefault(f.type).h;
        const maxFS = getMaxFontSize(curW, curH, f.label || f.id);
        const clampedSize = Math.max(8, Math.min(newSize, maxFS));
        return { ...f, fontSize: clampedSize };
      }
      return f;
    }));
  };

  const getBoxSizeDefault = (type: string) => {
    if (type === 'signature') return { w: 150, h: 75 };
    if (type === 'checkbox') return { w: 30, h: 30 };
    return { w: 150, h: 30 };
  };

  const handleAddField = () => {
    setEditingField({
      id: 'field_' + Date.now(),
      type: 'signature',
      role: 'EMPLOYEE',
      label: 'Chữ ký',
      page: currentPage,
      x: 100,
      y: 100,
      fontSize: 12,
    });
    setShowFieldModal(true);
  };

  const handleSaveField = () => {
    setFields(prev => {
      const exists = prev.find(f => f.id === editingField.id);
      if (exists) {
        return prev.map(f => f.id === editingField.id ? { ...editingField, selected: true } : { ...f, selected: false });
      }
      return [...prev.map(f => ({ ...f, selected: false })), { ...editingField, selected: true }];
    });
    setShowFieldModal(false);
    setSelectedFieldId(editingField.id);
  };

  const handleDeleteField = () => {
    setFields(prev => prev.filter(f => f.id !== editingField.id));
    setShowFieldModal(false);
  };

  const handleSaveAll = async () => {
    try {
      // Remove 'selected' transient state before saving
      const cleanFields = fields.map(f => {
        const { selected, ...rest } = f;
        return rest;
      });
      await updateMapping.mutateAsync({ mappingConfig: cleanFields });
      CustomAlert.alert('Thành công', 'Đã lưu cấu hình hợp đồng', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      CustomAlert.alert('Lỗi', error?.message || 'Có lỗi xảy ra');
    }
  };

  const updateFieldWidth = (dw: number) => {
    if (!editingField) return;
    const curW = editingField.width || getBoxSizeDefault(editingField.type).w;
    const curH = editingField.height || getBoxSizeDefault(editingField.type).h;
    const newW = Math.max(20, curW + dw);
    let newFontSize = editingField.fontSize || 12;
    if (editingField.type === 'text') {
        const maxFS = getMaxFontSize(newW, curH, editingField.label);
        newFontSize = Math.min(newFontSize, maxFS);
    }
    setEditingField({ ...editingField, width: newW, fontSize: newFontSize });
  };

  const updateFieldHeight = (dh: number) => {
    if (!editingField) return;
    const curW = editingField.width || getBoxSizeDefault(editingField.type).w;
    const curH = editingField.height || getBoxSizeDefault(editingField.type).h;
    const newH = Math.max(20, curH + dh);
    let newFontSize = editingField.fontSize || 12;
    if (editingField.type === 'text') {
        const maxFS = getMaxFontSize(curW, newH, editingField.label);
        newFontSize = Math.min(newFontSize, maxFS);
    }
    setEditingField({ ...editingField, height: newH, fontSize: newFontSize });
  };

  const updateFieldFontSize = (df: number) => {
    if (!editingField || editingField.type !== 'text') return;
    const curW = editingField.width || getBoxSizeDefault(editingField.type).w;
    const curH = editingField.height || getBoxSizeDefault(editingField.type).h;
    const curFontSize = editingField.fontSize || 12;
    const maxFS = getMaxFontSize(curW, curH, editingField.label);
    const newFontSize = Math.max(8, Math.min(curFontSize + df, maxFS));
    setEditingField({ ...editingField, fontSize: newFontSize });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Cấu hình Hợp đồng</Text>
        <Pressable onPress={handleAddField}>
          <MaterialCommunityIcons name="plus-box-outline" size={28} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <Pressable style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]} onPress={() => { setCurrentPage(prev => Math.max(1, prev - 1)); webviewRef.current?.postMessage(JSON.stringify({ type: 'prev_page' })); }}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={currentPage === 1 ? colors.muted : colors.text} />
        </Pressable>
        <Text style={styles.pageText}>Trang {currentPage} / {totalPages || 1}</Text>
        <Pressable style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]} onPress={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); webviewRef.current?.postMessage(JSON.stringify({ type: 'next_page' })); }}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={currentPage === totalPages ? colors.muted : colors.text} />
        </Pressable>
      </View>

      <View style={styles.webviewContainer}>
        {isLoading && <ActivityIndicator size="large" color={colors.primary} style={styles.loadingOverlay} />}
        <WebView
          ref={webviewRef}
          source={{ html: htmlContent, baseUrl: 'http://localhost' }}
          originWhitelist={['*']}
          onMessage={onMessage}
          style={styles.webview}
          scrollEnabled={true}
          bounces={false}
        />
      </View>

      {selectedFieldId && (
        <View style={styles.quickEdit}>
          <Text style={{flex: 1, fontSize: 13, color: colors.text}} numberOfLines={2}>Đang chọn: {fields.find(f => f.id === selectedFieldId)?.label}</Text>
          
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 8}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Pressable onPress={() => resizeSelectedField(-10, 0)} style={styles.nudgeBtn}><MaterialCommunityIcons name="minus" size={18} color={colors.text}/></Pressable>
              <Text style={{fontSize: 11, fontWeight: '600', marginHorizontal: 2, minWidth: 32, textAlign: 'center'}}>Rộng</Text>
              <Pressable onPress={() => resizeSelectedField(10, 0)} style={styles.nudgeBtn}><MaterialCommunityIcons name="plus" size={18} color={colors.text}/></Pressable>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Pressable onPress={() => resizeSelectedField(0, -10)} style={styles.nudgeBtn}><MaterialCommunityIcons name="minus" size={18} color={colors.text}/></Pressable>
              <Text style={{fontSize: 11, fontWeight: '600', marginHorizontal: 2, minWidth: 26, textAlign: 'center'}}>Cao</Text>
              <Pressable onPress={() => resizeSelectedField(0, 10)} style={styles.nudgeBtn}><MaterialCommunityIcons name="plus" size={18} color={colors.text}/></Pressable>
            </View>
            
            {fields.find(f => f.id === selectedFieldId)?.type === 'text' && (
              <View style={{flexDirection: 'row', alignItems: 'center', marginLeft: 4}}>
                <Text style={{fontSize: 11, fontWeight: '600', marginRight: 4}}>Cỡ chữ</Text>
                <Pressable 
                  onPress={() => setShowFontSizeModal(true)}
                  style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 6, height: 26, width: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}
                >
                  <Text style={{fontSize: 12}}>{fields.find(f => f.id === selectedFieldId)?.fontSize || 12}</Text>
                </Pressable>
              </View>
            )}
          </View>

          <SecondaryButton onPress={() => {
            setEditingField(fields.find(f => f.id === selectedFieldId));
            setShowFieldModal(true);
          }} style={{minHeight: 40, paddingHorizontal: 12}}>Sửa</SecondaryButton>
        </View>
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PrimaryButton onPress={handleSaveAll} loading={updateMapping.isPending} style={styles.saveBtn}>Lưu cấu hình</PrimaryButton>
      </View>

      <Modal visible={showFontSizeModal} transparent animationType="fade" onRequestClose={() => setShowFontSizeModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowFontSizeModal(false)}>
          <View style={[styles.modalContent, { width: 200, padding: 0, maxHeight: 300 }]}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>Chọn cỡ chữ</Text>
            </View>
            <ScrollView bounces={false}>
              {[8, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
                <Pressable 
                  key={size}
                  style={({pressed}) => [{ paddingVertical: 12, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }, pressed && { backgroundColor: '#f9fafb' }]}
                  onPress={() => {
                    updateSelectedFieldFontSize(size);
                    setShowFontSizeModal(false);
                  }}
                >
                  <Text style={{ fontSize: 16, textAlign: 'center' }}>{size}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showFieldModal} transparent animationType="fade" onRequestClose={() => setShowFieldModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { maxHeight: '88%' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <MaterialCommunityIcons name="form-select" size={22} color={colors.primary} />
                <Text style={styles.modalTitle}>Thuộc tính trường</Text>
              </View>
              <Pressable onPress={() => setShowFieldModal(false)} style={styles.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
              {/* Tên hiển thị */}
              <Text style={styles.label}>Tên ngắn gọn (hiển thị trên hộp)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Chữ ký, Họ tên, Ngày ký..."
                placeholderTextColor="#94A3B8"
                value={editingField?.label}
                onChangeText={(text) => {
                  if (editingField?.type === 'text') {
                    const curW = editingField.width || getBoxSizeDefault(editingField.type).w;
                    const curH = editingField.height || getBoxSizeDefault(editingField.type).h;
                    const maxFS = getMaxFontSize(curW, curH, text);
                    const newFontSize = Math.min(editingField.fontSize || 12, maxFS);
                    setEditingField({ ...editingField, label: text, fontSize: newFontSize });
                  } else {
                    setEditingField({ ...editingField, label: text });
                  }
                }}
              />

              {/* Mô tả chi tiết */}
              <Text style={styles.label}>Mô tả chi tiết (hướng dẫn khi ký/điền)</Text>
              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                multiline
                numberOfLines={2}
                value={editingField?.description}
                onChangeText={(text) => setEditingField({ ...editingField, description: text })}
                placeholder="VD: Tích vào đây nếu bạn đồng ý trích nộp quỹ công đoàn..."
                placeholderTextColor="#94A3B8"
              />

              {/* Loại trường - Segmented Chips */}
              <Text style={styles.label}>Loại trường</Text>
              <View style={styles.segmentedRow}>
                {[
                  { type: 'signature', label: 'Chữ ký', icon: 'draw-pen' },
                  { type: 'text', label: 'Điền chữ', icon: 'format-text' },
                  { type: 'checkbox', label: 'Đánh dấu', icon: 'checkbox-marked-outline' },
                ].map((item) => {
                  const isSelected = editingField?.type === item.type;
                  return (
                    <Pressable
                      key={item.type}
                      onPress={() => {
                        const defaultSize = getBoxSizeDefault(item.type);
                        setEditingField({
                          ...editingField,
                          type: item.type,
                          width: defaultSize.w,
                          height: defaultSize.h,
                        });
                      }}
                      style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={18}
                        color={isSelected ? '#FFFFFF' : '#475569'}
                      />
                      <Text style={[styles.segmentBtnText, isSelected && styles.segmentBtnTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Quyền điền / ký - Segmented Chips */}
              <Text style={styles.label}>Quyền điền / ký</Text>
              <View style={styles.segmentedRow}>
                {[
                  { role: 'EMPLOYEE', label: 'Người lao động', icon: 'account-outline' },
                  { role: 'COMPANY', label: 'Công ty (Đại diện)', icon: 'domain' },
                ].map((item) => {
                  const isSelected = editingField?.role === item.role;
                  return (
                    <Pressable
                      key={item.role}
                      onPress={() => setEditingField({ ...editingField, role: item.role })}
                      style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={18}
                        color={isSelected ? '#FFFFFF' : '#475569'}
                      />
                      <Text style={[styles.segmentBtnText, isSelected && styles.segmentBtnTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Kích thước */}
              <View style={styles.dimensionRow}>
                <View style={styles.dimensionCol}>
                  <Text style={styles.labelSmall}>Chiều rộng</Text>
                  <View style={styles.stepperContainer}>
                    <Pressable onPress={() => updateFieldWidth(-10)} style={styles.stepperBtn}>
                      <MaterialCommunityIcons name="minus" size={18} color="#1E293B" />
                    </Pressable>
                    <Text style={styles.stepperValue}>
                      {editingField?.width || getBoxSizeDefault(editingField?.type || 'text').w}
                    </Text>
                    <Pressable onPress={() => updateFieldWidth(10)} style={styles.stepperBtn}>
                      <MaterialCommunityIcons name="plus" size={18} color="#1E293B" />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.dimensionCol}>
                  <Text style={styles.labelSmall}>Chiều cao</Text>
                  <View style={styles.stepperContainer}>
                    <Pressable onPress={() => updateFieldHeight(-10)} style={styles.stepperBtn}>
                      <MaterialCommunityIcons name="minus" size={18} color="#1E293B" />
                    </Pressable>
                    <Text style={styles.stepperValue}>
                      {editingField?.height || getBoxSizeDefault(editingField?.type || 'text').h}
                    </Text>
                    <Pressable onPress={() => updateFieldHeight(10)} style={styles.stepperBtn}>
                      <MaterialCommunityIcons name="plus" size={18} color="#1E293B" />
                    </Pressable>
                  </View>
                </View>
              </View>

              {editingField?.type === 'text' && (
                <View style={[styles.dimensionRow, { marginTop: 10 }]}>
                  <View style={styles.dimensionCol}>
                    <Text style={styles.labelSmall}>Cỡ chữ (pt)</Text>
                    <View style={styles.stepperContainer}>
                      <Pressable onPress={() => updateFieldFontSize(-1)} style={styles.stepperBtn}>
                        <MaterialCommunityIcons name="minus" size={18} color="#1E293B" />
                      </Pressable>
                      <Text style={styles.stepperValue}>{editingField?.fontSize || 12}</Text>
                      <Pressable onPress={() => updateFieldFontSize(1)} style={styles.stepperBtn}>
                        <MaterialCommunityIcons name="plus" size={18} color="#1E293B" />
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.dimensionCol} />
                </View>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalFooter}>
              {fields.some((f) => f.id === editingField?.id) ? (
                <Pressable onPress={handleDeleteField} style={styles.deleteBtn}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteBtnText}>Xoá</Text>
                </Pressable>
              ) : (
                <View style={{ flex: 1 }} />
              )}

              <View style={styles.modalFooterRight}>
                <Pressable onPress={() => setShowFieldModal(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </Pressable>
                <Pressable onPress={handleSaveField} style={styles.confirmBtn}>
                  <Text style={styles.confirmBtnText}>Lưu</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#fff',
  },
  backBtn: { padding: 6 },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pageBtn: {
    padding: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageText: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginHorizontal: 16 },
  webviewContainer: { flex: 1, backgroundColor: '#F1F5F9' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 10,
  },
  quickEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nudgeBtn: {
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: { width: '100%' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalScrollBody: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  segmentBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  segmentBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dimensionRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 12,
  },
  dimensionCol: {
    flex: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  modalFooterRight: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
