import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { PrimaryButton } from '../../components/Buttons';
import { useUpdateTemplateMapping } from '../../hooks/useContracts';
import { router, useLocalSearchParams } from 'expo-router';
import { resolveFileUrl } from '../../utils/url';
import * as FileSystem from 'expo-file-system';

export function SignaturePlacementScreen() {
  const params = useLocalSearchParams();
  const templateId = params.templateId as string;
  const pdfUrl = params.pdfUrl as string;
  const initialConfigStr = params.initialConfig as string;
  
  const updateMapping = useUpdateTemplateMapping(templateId);
  const webviewRef = useRef<WebView>(null);

  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [posX, setPosX] = useState(100);
  const [posY, setPosY] = useState(100);
  const [isLoading, setIsLoading] = useState(true);

  // Parse initial config
  const initPage = useRef(1);
  const initX = useRef(-1);
  const initY = useRef(-1);

  useEffect(() => {
    if (initialConfigStr) {
      try {
        const config = JSON.parse(initialConfigStr);
        const sig = config.find((c: any) => c.type === 'signature' && c.id === 'signature');
        if (sig) {
          initPage.current = sig.page || 1;
          initX.current = sig.x || 100;
          initY.current = sig.y || 100;
        }
      } catch (e) {}
    }
  }, [initialConfigStr]);

  // Load PDF as base64 in RN to avoid WebView CORS issues
  useEffect(() => {
    async function loadPdf() {
      try {
        const url = resolveFileUrl(pdfUrl);
        if (!url) {
          Alert.alert('Lỗi', 'Không tìm thấy đường dẫn PDF');
          return;
        }
        
        const fileUri = FileSystem.cacheDirectory + 'temp_signature_pdf.pdf';
        const headers: Record<string, string> = {
          'ngrok-skip-browser-warning': '69420'
        };
        
        // Download the file
        await FileSystem.downloadAsync(url, fileUri, { headers });
        // Read as base64
        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
        
        // Send base64 to webview
        webviewRef.current?.postMessage(JSON.stringify({ type: 'load_pdf', data: base64 }));
      } catch (e) {
        console.log('Error downloading PDF', e);
        Alert.alert('Lỗi', 'Không thể tải file PDF từ máy chủ');
        setIsLoading(false);
      }
    }
    
    // Give WebView time to initialize
    setTimeout(() => {
      loadPdf();
    }, 1000);
  }, [pdfUrl]);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
    <style>
        body { margin: 0; padding: 0; background-color: #f3f4f6; display: flex; justify-content: center; overflow: hidden; touch-action: none; }
        #pdf-container { position: relative; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        #sig-box { 
            position: absolute; 
            border: 2px dashed #3b82f6; 
            background-color: rgba(59, 130, 246, 0.2); 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            color: #1d4ed8; 
            font-weight: bold;
            font-family: sans-serif;
            font-size: 14px;
            cursor: move;
            touch-action: none;
            box-sizing: border-box;
            border-radius: 4px;
        }
        #loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-family: sans-serif; color: #6b7280; font-size: 16px; }
    </style>
</head>
<body>
    <div id="loading">Đang tải PDF...</div>
    <div id="pdf-container" style="display: none;">
        <canvas id="pdf-canvas"></canvas>
        <div id="sig-box">Vị trí chữ ký</div>
    </div>

    <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

        const initPage = ${initPage.current};
        let initX = ${initX.current};
        let initY = ${initY.current};

        let pdfDoc = null,
            pageNum = initPage,
            pageRendering = false,
            pageNumPending = null,
            canvas = document.getElementById('pdf-canvas'),
            ctx = canvas.getContext('2d'),
            sigBox = document.getElementById('sig-box'),
            container = document.getElementById('pdf-container'),
            currentScale = 1;

        const SIG_WIDTH = 150;
        const SIG_HEIGHT = 75;
        let pdfActualHeight = 0;

        function renderPage(num) {
            pageRendering = true;
            pdfDoc.getPage(num).then(function(page) {
                const unscaledViewport = page.getViewport({scale: 1});
                pdfActualHeight = unscaledViewport.height;

                currentScale = window.innerWidth / unscaledViewport.width;
                const viewport = page.getViewport({scale: currentScale});

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                container.style.width = viewport.width + 'px';
                container.style.height = viewport.height + 'px';

                sigBox.style.width = (SIG_WIDTH * currentScale) + 'px';
                sigBox.style.height = (SIG_HEIGHT * currentScale) + 'px';

                // Initial position or default centered
                let screenX = initX * currentScale;
                let screenY = (pdfActualHeight - initY - SIG_HEIGHT) * currentScale;

                if (initX === -1) {
                    screenX = (viewport.width - SIG_WIDTH * currentScale) / 2;
                    screenY = (viewport.height - SIG_HEIGHT * currentScale) / 2;
                    initX = -2; // Only center on first load
                }

                updateBoxPosition(screenX, screenY);

                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                const renderTask = page.render(renderContext);

                renderTask.promise.then(function() {
                    pageRendering = false;
                    document.getElementById('loading').style.display = 'none';
                    container.style.display = 'block';
                    if (pageNumPending !== null) {
                        renderPage(pageNumPending);
                        pageNumPending = null;
                    }
                    sendUpdate();
                });
            });
        }

        function handleMessage(event) {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'load_pdf') {
                    const binary = atob(data.data);
                    const array = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                        array[i] = binary.charCodeAt(i);
                    }
                    pdfjsLib.getDocument({ data: array }).promise.then(function(pdfDoc_) {
                        pdfDoc = pdfDoc_;
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'init', totalPages: pdfDoc.numPages }));
                        renderPage(pageNum);
                    }).catch(err => {
                        document.getElementById('loading').innerText = 'Lỗi render PDF: ' + err.message;
                    });
                } else if (data.type === 'prev_page' && pageNum > 1 && pdfDoc) {
                    pageNum--;
                    renderPage(pageNum);
                } else if (data.type === 'next_page' && pdfDoc && pageNum < pdfDoc.numPages) {
                    pageNum++;
                    renderPage(pageNum);
                }
            } catch (e) {
                // Ignore
            }
        }

        document.addEventListener('message', handleMessage);
        window.addEventListener('message', handleMessage);

        let isDragging = false;
        let startX, startY, initialBoxX, initialBoxY;

        sigBox.addEventListener('touchstart', function(e) {
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            initialBoxX = parseFloat(sigBox.style.left) || 0;
            initialBoxY = parseFloat(sigBox.style.top) || 0;
            e.preventDefault();
        });

        document.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            let dx = e.touches[0].clientX - startX;
            let dy = e.touches[0].clientY - startY;
            
            let newX = initialBoxX + dx;
            let newY = initialBoxY + dy;

            newX = Math.max(0, Math.min(newX, canvas.width - sigBox.offsetWidth));
            newY = Math.max(0, Math.min(newY, canvas.height - sigBox.offsetHeight));

            updateBoxPosition(newX, newY);
            e.preventDefault();
        }, {passive: false});

        document.addEventListener('touchend', function() {
            if (isDragging) {
                isDragging = false;
                sendUpdate();
            }
        });

        function updateBoxPosition(x, y) {
            sigBox.style.left = x + 'px';
            sigBox.style.top = y + 'px';
        }

        function sendUpdate() {
            let left = parseFloat(sigBox.style.left) || 0;
            let top = parseFloat(sigBox.style.top) || 0;

            let pdfX = left / currentScale;
            let pdfY = pdfActualHeight - (top / currentScale) - SIG_HEIGHT;

            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'position',
                page: pageNum,
                x: Math.round(pdfX),
                y: Math.round(pdfY)
            }));
        }
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
      } else if (data.type === 'position') {
        setCurrentPage(data.page);
        setPosX(data.x);
        setPosY(data.y);
      }
    } catch (e) {
      console.log('Error parsing webview message', e);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      webviewRef.current?.postMessage(JSON.stringify({ type: 'prev_page' }));
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      webviewRef.current?.postMessage(JSON.stringify({ type: 'next_page' }));
    }
  };

  const handleSave = async () => {
    try {
      await updateMapping.mutateAsync({
        mappingConfig: [
          {
            type: 'signature',
            id: 'signature',
            page: currentPage,
            x: posX,
            y: posY,
          }
        ]
      });
      Alert.alert('Thành công', 'Đã cập nhật vị trí chữ ký', [
        { text: 'OK', onPress: () => router.back() }
      ]);
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
        <Text style={styles.title}>Chọn vị trí chữ ký</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.toolbar}>
        <Pressable style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]} onPress={handlePrevPage} disabled={currentPage === 1}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={currentPage === 1 ? colors.muted : colors.text} />
        </Pressable>
        <Text style={styles.pageText}>Trang {currentPage} / {totalPages || 1}</Text>
        <Pressable style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]} onPress={handleNextPage} disabled={currentPage === totalPages}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={currentPage === totalPages ? colors.muted : colors.text} />
        </Pressable>
      </View>

      <View style={styles.webviewContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        <WebView
          ref={webviewRef}
          source={{ html: htmlContent, baseUrl: 'http://localhost' }}
          originWhitelist={['*']}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          onMessage={onMessage}
          style={styles.webview}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.coords}>
          <Text style={styles.coordText}>X: {posX}</Text>
          <Text style={styles.coordText}>Y: {posY}</Text>
          <Text style={styles.coordText}>Trang: {currentPage}</Text>
        </View>
        <PrimaryButton onPress={handleSave} loading={updateMapping.isPending} style={styles.saveBtn}>
          Lưu vị trí
        </PrimaryButton>
      </View>
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
  footer: { padding: 16, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  coords: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12, gap: 16 },
  coordText: { fontSize: 14, fontWeight: '500', color: colors.muted },
  saveBtn: { width: '100%' },
});
