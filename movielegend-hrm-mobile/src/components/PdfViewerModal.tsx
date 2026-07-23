import React, { useState, useEffect } from 'react';
import { Modal, SafeAreaView, View, Pressable, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  url: string | null;
  title?: string;
}

export function PdfViewerModal({ visible, onClose, url, title = 'Xem tài liệu' }: Props) {
  const [pdfHtml, setPdfHtml] = useState<string | null>(null);
  const [currentPdfUri, setCurrentPdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && url) {
      loadPdf(url);
    } else {
      setPdfHtml(null);
      setCurrentPdfUri(null);
      setLoading(false);
    }
  }, [visible, url]);

  const loadPdf = async (pdfUrl: string) => {
    try {
      setLoading(true);
      let cleanFileName = (pdfUrl.split('/').pop() || 'document').replace(/[^a-zA-Z0-9.-]/g, '_');
      if (!cleanFileName.toLowerCase().endsWith('.pdf')) cleanFileName += '.pdf';
      const localUri = FileSystem.documentDirectory + cleanFileName;
      const info = await FileSystem.getInfoAsync(localUri);
      let fileUri = localUri;
      if (!info.exists) {
        const { uri } = await FileSystem.downloadAsync(pdfUrl, localUri, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        fileUri = uri;
      }
      setCurrentPdfUri(fileUri);
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
      
      const html = `<!DOCTYPE html><html><head>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>body{margin:0;background:#525659;}canvas{display:block;margin:8px auto;box-shadow:0 2px 8px rgba(0,0,0,.4);}#loading{color:#fff;text-align:center;padding:40px;font-family:sans-serif;font-size:16px;}#error{color:#f88;text-align:center;padding:40px;font-family:sans-serif;}</style>
      </head><body>
        <div id="loading">Đang tải PDF...</div>
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
            document.getElementById('error').textContent='Lỗi tải file: ' + err.message;
          });
        </script>
      </body></html>`;
      
      setPdfHtml(html);
    } catch (e) {
      console.error('Lỗi load PDF', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#1a1a1a', gap: 8 }}>
          <Pressable
            onPress={onClose}
            style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#333', borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>✕ Đóng</Text>
          </Pressable>
          <Text style={{ color: '#fff', flex: 1, fontWeight: '600', fontSize: 15 }}>{title}</Text>
          
          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
          ) : currentPdfUri ? (
            <Pressable
              onPress={() => Sharing.shareAsync(currentPdfUri, { UTI: 'application/pdf', mimeType: 'application/pdf' }).catch(console.error)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary, borderRadius: 8 }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Lưu / Chia sẻ</Text>
            </Pressable>
          ) : null}
        </View>
        {pdfHtml ? (
          <WebView
            source={{ html: pdfHtml, baseUrl: '' }}
            style={{ flex: 1 }}
            originWhitelist={['*']}
            javaScriptEnabled
            startInLoadingState
            mixedContentMode="always"
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
