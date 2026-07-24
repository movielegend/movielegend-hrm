import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { useUpdateTemplateMapping } from '../../hooks/useContracts';
import { router, useLocalSearchParams } from 'expo-router';
import { resolveFileUrl } from '../../utils/url';
import * as FileSystem from 'expo-file-system/legacy';
import { Picker } from '@react-native-picker/picker';

export function SignaturePlacementScreen() {
  const params = useLocalSearchParams();
  const templateId = params.templateId as string;
  const pdfUrl = params.pdfUrl as string;
  const initialConfigStr = params.initialConfig as string;
  
  const updateMapping = useUpdateTemplateMapping(templateId);
  const webviewRef = useRef<WebView>(null);

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const [fields, setFields] = useState<any[]>([]);
  const fieldsRef = useRef<any[]>([]);
  useEffect(() => { fieldsRef.current = fields; }, [fields]);

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);

  useEffect(() => {
    if (initialConfigStr) {
      try {
        const config = JSON.parse(initialConfigStr);
        if (Array.isArray(config)) setFields(config);
      } catch (e) {}
    }
  }, [initialConfigStr]);

  useEffect(() => {
    async function loadPdf() {
      const url = resolveFileUrl(pdfUrl);
      try {
        if (!url) {
          Alert.alert('Lỗi', 'Không tìm thấy đường dẫn PDF');
          return;
        }
        let finalUrl = url.replace('http://', 'https://');
        const fileUri = FileSystem.cacheDirectory + 'temp_signature_pdf.pdf';
        await FileSystem.downloadAsync(finalUrl, fileUri, { headers: { 'ngrok-skip-browser-warning': '69420' } });
        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
        webviewRef.current?.postMessage(JSON.stringify({ type: 'load_pdf', data: base64, fields: fieldsRef.current }));
      } catch (e: any) {
        Alert.alert('Lỗi', 'Không thể tải file PDF');
        setIsLoading(false);
      }
    }
    setTimeout(() => { loadPdf(); }, 1000);
  }, [pdfUrl]);

  // Push updated fields to WebView
  useEffect(() => {
    webviewRef.current?.postMessage(JSON.stringify({ type: 'update_fields', fields }));
  }, [fields]);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
    <style>
        body { margin: 0; padding: 0; background-color: #f3f4f6; display: flex; justify-content: center; overflow: hidden; touch-action: none; }
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

                // If currently dragging this box, skip updating its position from state 
                // so we don't interrupt the user's drag
                if (activeBox !== el) {
                    el.style.left = screenX + 'px';
                    el.style.top = screenY + 'px';
                }

                el.className = 'field-box' + (field.selected ? ' selected' : '');
                el.style.width = (size.w * currentScale) + 'px';
                el.style.height = (size.h * currentScale) + 'px';
                el.innerText = field.label || field.id;
            });

            // Remove old boxes
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

        document.addEventListener('message', function(event) {
            const data = JSON.parse(event.data);
            if (data.type === 'load_pdf') {
                currentFields = data.fields || [];
                const binary = atob(data.data);
                const array = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
                pdfjsLib.getDocument({ data: array }).promise.then(function(pdfDoc_) {
                    pdfDoc = pdfDoc_;
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'init', totalPages: pdfDoc.numPages }));
                    renderPage(pageNum);
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
        });
    </script>
</body>
</html>
  `;

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'init') {
        setTotalPages(data.totalPages);
        setIsLoading(false);
      } else if (data.type === 'select_field') {
        setSelectedFieldId(data.id);
        setFields(prev => prev.map(f => ({ ...f, selected: f.id === data.id })));
      } else if (data.type === 'update_pos') {
        setFields(prev => prev.map(f => f.id === data.id ? { ...f, x: data.x, y: data.y } : f));
      }
    } catch (e) {}
  };

  const resizeSelectedField = (dw: number, dh: number) => {
    if (!selectedFieldId) return;
    setFields(prev => prev.map(f => {
      if (f.id === selectedFieldId) {
        const curW = f.width || getBoxSizeDefault(f.type).w;
        const curH = f.height || getBoxSizeDefault(f.type).h;
        return { ...f, width: Math.max(20, curW + dw), height: Math.max(20, curH + dh) };
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
      Alert.alert('Thành công', 'Đã lưu cấu hình hợp đồng', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <View style={styles.container}>
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
          scrollEnabled={false}
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
          </View>

          <SecondaryButton onPress={() => {
            setEditingField(fields.find(f => f.id === selectedFieldId));
            setShowFieldModal(true);
          }} style={{minHeight: 40, paddingHorizontal: 12}}>Sửa</SecondaryButton>
        </View>
      )}

      <View style={styles.footer}>
        <PrimaryButton onPress={handleSaveAll} loading={updateMapping.isPending} style={styles.saveBtn}>Lưu cấu hình</PrimaryButton>
      </View>

      <Modal visible={showFieldModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thuộc tính Trường</Text>
            
            <Text style={styles.label}>Tên hiển thị (VD: Họ Tên)</Text>
            <TextInput style={styles.input} value={editingField?.label} onChangeText={(text) => setEditingField({...editingField, label: text})} />

            <Text style={styles.label}>Loại trường</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={editingField?.type} onValueChange={(itemValue) => setEditingField({...editingField, type: itemValue})}>
                <Picker.Item label="Chữ ký" value="signature" />
                <Picker.Item label="Điền chữ (Text)" value="text" />
                <Picker.Item label="Đánh dấu (Checkbox)" value="checkbox" />
              </Picker>
            </View>

            <Text style={styles.label}>Quyền điền/ký</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={editingField?.role} onValueChange={(itemValue) => setEditingField({...editingField, role: itemValue})}>
                <Picker.Item label="Người lao động (Employee)" value="EMPLOYEE" />
                <Picker.Item label="Công ty (Company)" value="COMPANY" />
              </Picker>
            </View>

            <View style={{flexDirection: 'row', gap: 16, marginTop: 12}}>
              <View style={{flex: 1}}>
                <Text style={styles.label}>Chiều rộng</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4}}>
                  <Pressable onPress={() => setEditingField({...editingField, width: Math.max(20, (editingField?.width || getBoxSizeDefault(editingField?.type).w) - 10)})} style={styles.nudgeBtn}><MaterialCommunityIcons name="minus" size={20} color={colors.text}/></Pressable>
                  <Text style={{fontWeight: '600'}}>{editingField?.width || getBoxSizeDefault(editingField?.type || 'text').w}</Text>
                  <Pressable onPress={() => setEditingField({...editingField, width: (editingField?.width || getBoxSizeDefault(editingField?.type).w) + 10})} style={styles.nudgeBtn}><MaterialCommunityIcons name="plus" size={20} color={colors.text}/></Pressable>
                </View>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.label}>Chiều cao</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4}}>
                  <Pressable onPress={() => setEditingField({...editingField, height: Math.max(20, (editingField?.height || getBoxSizeDefault(editingField?.type).h) - 10)})} style={styles.nudgeBtn}><MaterialCommunityIcons name="minus" size={20} color={colors.text}/></Pressable>
                  <Text style={{fontWeight: '600'}}>{editingField?.height || getBoxSizeDefault(editingField?.type || 'text').h}</Text>
                  <Pressable onPress={() => setEditingField({...editingField, height: (editingField?.height || getBoxSizeDefault(editingField?.type).h) + 10})} style={styles.nudgeBtn}><MaterialCommunityIcons name="plus" size={20} color={colors.text}/></Pressable>
                </View>
              </View>
            </View>

            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 24}}>
              <SecondaryButton onPress={handleDeleteField} style={{borderColor: colors.error}}>Xoá</SecondaryButton>
              <View style={{flexDirection: 'row', gap: 12}}>
                <SecondaryButton onPress={() => setShowFieldModal(false)}>Hủy</SecondaryButton>
                <PrimaryButton onPress={handleSaveField}>Lưu</PrimaryButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#f9fafb', borderBottomWidth: 1, borderBottomColor: colors.border },
  pageBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  pageBtnDisabled: { opacity: 0.5 },
  pageText: { fontSize: 16, fontWeight: '500', color: colors.text, marginHorizontal: 16 },
  webviewContainer: { flex: 1, backgroundColor: '#f3f4f6' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10 },
  quickEdit: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border },
  nudgeBtn: { backgroundColor: '#f3f4f6', padding: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  footer: { padding: 16, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  saveBtn: { width: '100%' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginTop: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16 },
  pickerContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden' }
});
