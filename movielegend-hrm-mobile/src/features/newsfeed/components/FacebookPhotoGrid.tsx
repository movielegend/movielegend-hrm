import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ImageView from '../../../components/ImageViewer/ImageViewer';

export type FacebookGridLayoutType = 'CLASSIC' | 'COLUMN' | 'GRID' | 'CAROUSEL';

export interface FacebookPhotoGridProps {
  images: string[];
  resolveUrl?: (uri?: string | null) => string | null;
  onImagePress?: (index: number) => void;
  showDeleteButton?: boolean;
  onDeleteImage?: (index: number) => void;
  containerStyle?: StyleProp<ViewStyle>;
  disableInternalViewer?: boolean;
  layoutType?: FacebookGridLayoutType;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 3;
const BORDER_RADIUS = 12;

export const FacebookPhotoGrid: React.FC<FacebookPhotoGridProps> = ({
  images,
  resolveUrl = (u) => u || null,
  onImagePress,
  showDeleteButton = false,
  onDeleteImage,
  containerStyle,
  disableInternalViewer = false,
  layoutType = 'CLASSIC',
}) => {
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - 32);
  const carouselScrollRef = useRef<ScrollView>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const resolvedImages = images.map((img) => resolveUrl(img) || img);
  const totalCount = images.length;

  const handlePress = (index: number) => {
    if (onImagePress) {
      onImagePress(index);
    }
    if (!disableInternalViewer) {
      setViewerIndex(index);
      setViewerVisible(true);
    }
  };

  const renderDeleteBtn = (index: number) => {
    if (!showDeleteButton || !onDeleteImage) return null;
    return (
      <Pressable
        style={styles.deleteBadge}
        onPress={(e) => {
          e.stopPropagation?.();
          onDeleteImage(index);
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Xóa ảnh"
      >
        <MaterialCommunityIcons name="close-circle" size={24} color="#EF4444" />
      </Pressable>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // 1 PHOTO: Full Width Hero (Universal)
  // ─────────────────────────────────────────────────────────────
  const renderSinglePhoto = () => (
    <View style={styles.singleImageContainer}>
      <Pressable
        style={styles.imageTouchable}
        onPress={() => handlePress(0)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: resolvedImages[0] }}
          style={styles.singleImage}
          resizeMode="cover"
        />
      </Pressable>
      {renderDeleteBtn(0)}
    </View>
  );

  // ─────────────────────────────────────────────────────────────
  // CAROUSEL / SLIDER LAYOUT (Sleek Facebook/Instagram Style)
  // ─────────────────────────────────────────────────────────────
  const handleCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const width = containerWidth || e.nativeEvent.layoutMeasurement.width || (SCREEN_WIDTH - 32);
    const newIdx = Math.round(offsetX / width);
    if (newIdx >= 0 && newIdx < totalCount && newIdx !== carouselIndex) {
      setCarouselIndex(newIdx);
    }
  };

  const scrollToSlide = (index: number) => {
    if (index < 0 || index >= totalCount) return;
    setCarouselIndex(index);
    carouselScrollRef.current?.scrollTo({
      x: index * containerWidth,
      animated: true,
    });
  };

  const renderCarouselLayout = () => {
    return (
      <View
        style={styles.carouselWrapper}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - containerWidth) > 1) {
            setContainerWidth(w);
          }
        }}
      >
        <ScrollView
          ref={carouselScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleCarouselScroll}
          scrollEventThrottle={16}
          style={styles.carouselScrollView}
        >
          {resolvedImages.map((uri, idx) => (
            <View
              key={`carousel-item-${idx}`}
              style={[styles.carouselSlide, { width: containerWidth }]}
            >
              <Pressable
                style={styles.imageTouchable}
                onPress={() => handlePress(idx)}
                activeOpacity={0.92}
              >
                <Image
                  source={{ uri }}
                  style={styles.fillImage}
                  resizeMode="cover"
                />
              </Pressable>
              {renderDeleteBtn(idx)}
            </View>
          ))}
        </ScrollView>

        {/* Counter Badge (e.g. 1/5) */}
        <View style={styles.carouselBadge}>
          <MaterialCommunityIcons name="image-multiple-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.carouselBadgeText}>
            {carouselIndex + 1} / {totalCount}
          </Text>
        </View>

        {/* Left Arrow Button */}
        {carouselIndex > 0 && (
          <Pressable
            style={[styles.carouselArrowBtn, styles.carouselArrowLeft]}
            onPress={() => scrollToSlide(carouselIndex - 1)}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="chevron-left" size={22} color="#FFFFFF" />
          </Pressable>
        )}

        {/* Right Arrow Button */}
        {carouselIndex < totalCount - 1 && (
          <Pressable
            style={[styles.carouselArrowBtn, styles.carouselArrowRight]}
            onPress={() => scrollToSlide(carouselIndex + 1)}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="chevron-right" size={22} color="#FFFFFF" />
          </Pressable>
        )}

        {/* Pagination Dots */}
        {totalCount <= 8 && (
          <View style={styles.carouselDotsContainer}>
            {resolvedImages.map((_, idx) => (
              <Pressable
                key={`dot-${idx}`}
                onPress={() => scrollToSlide(idx)}
                hitSlop={6}
              >
                <View
                  style={[
                    styles.carouselDot,
                    idx === carouselIndex ? styles.carouselDotActive : styles.carouselDotInactive,
                  ]}
                />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // GRID LAYOUT (Equal Symmetrical 2x2 or 2-column)
  // ─────────────────────────────────────────────────────────────
  const renderGridLayout = () => {
    if (totalCount === 2) {
      return (
        <View style={styles.dualRowContainer}>
          <View style={styles.dualImageHalf}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(0)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[0] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(0)}
          </View>
          <View style={styles.gapSpacer} />
          <View style={styles.dualImageHalf}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(1)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[1] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(1)}
          </View>
        </View>
      );
    }

    if (totalCount === 3) {
      return (
        <View style={styles.threeGridContainer}>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Pressable style={styles.imageTouchable} onPress={() => handlePress(0)} activeOpacity={0.9}>
                <Image source={{ uri: resolvedImages[0] }} style={styles.fillImage} resizeMode="cover" />
              </Pressable>
              {renderDeleteBtn(0)}
            </View>
            <View style={styles.gapSpacer} />
            <View style={styles.gridCell}>
              <Pressable style={styles.imageTouchable} onPress={() => handlePress(1)} activeOpacity={0.9}>
                <Image source={{ uri: resolvedImages[1] }} style={styles.fillImage} resizeMode="cover" />
              </Pressable>
              {renderDeleteBtn(1)}
            </View>
          </View>
          <View style={styles.horizontalGap} />
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Pressable style={styles.imageTouchable} onPress={() => handlePress(2)} activeOpacity={0.9}>
                <Image source={{ uri: resolvedImages[2] }} style={styles.fillImage} resizeMode="cover" />
              </Pressable>
              {renderDeleteBtn(2)}
            </View>
          </View>
        </View>
      );
    }

    // 4 or 5+ photos in 2x2 Grid
    const remainingCount = totalCount - 4;
    return (
      <View style={styles.fourEqualGridContainer}>
        <View style={styles.gridRow}>
          <View style={styles.gridCell}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(0)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[0] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(0)}
          </View>
          <View style={styles.gapSpacer} />
          <View style={styles.gridCell}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(1)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[1] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(1)}
          </View>
        </View>
        <View style={styles.horizontalGap} />
        <View style={styles.gridRow}>
          <View style={styles.gridCell}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(2)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[2] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(2)}
          </View>
          <View style={styles.gapSpacer} />
          <View style={styles.gridCell}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(3)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[3] }} style={styles.fillImage} resizeMode="cover" />
              {remainingCount > 0 && (
                <View style={styles.moreOverlay}>
                  <Text style={styles.moreOverlayText}>+{remainingCount + 1}</Text>
                </View>
              )}
            </Pressable>
            {renderDeleteBtn(3)}
          </View>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // COLUMN / VERTICAL SPLIT LAYOUT (Tall Left Photo 60% + Stacked Right)
  // ─────────────────────────────────────────────────────────────
  const renderColumnLayout = () => {
    if (totalCount === 2) {
      return (
        <View style={styles.columnContainer}>
          <View style={styles.columnLeft}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(0)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[0] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(0)}
          </View>
          <View style={styles.gapSpacer} />
          <View style={styles.columnRight}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(1)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[1] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(1)}
          </View>
        </View>
      );
    }

    if (totalCount === 3) {
      return (
        <View style={styles.columnContainer}>
          {/* Left tall portrait */}
          <View style={styles.columnLeft}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(0)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[0] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(0)}
          </View>
          <View style={styles.gapSpacer} />
          {/* Right 2 stacked */}
          <View style={styles.columnRightStacked}>
            <View style={styles.columnHalfItem}>
              <Pressable style={styles.imageTouchable} onPress={() => handlePress(1)} activeOpacity={0.9}>
                <Image source={{ uri: resolvedImages[1] }} style={styles.fillImage} resizeMode="cover" />
              </Pressable>
              {renderDeleteBtn(1)}
            </View>
            <View style={styles.horizontalGap} />
            <View style={styles.columnHalfItem}>
              <Pressable style={styles.imageTouchable} onPress={() => handlePress(2)} activeOpacity={0.9}>
                <Image source={{ uri: resolvedImages[2] }} style={styles.fillImage} resizeMode="cover" />
              </Pressable>
              {renderDeleteBtn(2)}
            </View>
          </View>
        </View>
      );
    }

    // 4 or 5+ photos: Tall Left + 3 Right Stacked
    const remainingCount = totalCount - 4;
    return (
      <View style={styles.columnContainer}>
        <View style={styles.columnLeft}>
          <Pressable style={styles.imageTouchable} onPress={() => handlePress(0)} activeOpacity={0.9}>
            <Image source={{ uri: resolvedImages[0] }} style={styles.fillImage} resizeMode="cover" />
          </Pressable>
          {renderDeleteBtn(0)}
        </View>
        <View style={styles.gapSpacer} />
        <View style={styles.columnRightStacked}>
          <View style={styles.columnThirdItem}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(1)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[1] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(1)}
          </View>
          <View style={styles.horizontalGap} />
          <View style={styles.columnThirdItem}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(2)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[2] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(2)}
          </View>
          <View style={styles.horizontalGap} />
          <View style={styles.columnThirdItem}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(3)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[3] }} style={styles.fillImage} resizeMode="cover" />
              {remainingCount > 0 && (
                <View style={styles.moreOverlay}>
                  <Text style={styles.moreOverlayText}>+{remainingCount + 1}</Text>
                </View>
              )}
            </Pressable>
            {renderDeleteBtn(3)}
          </View>
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // CLASSIC FACEBOOK LAYOUT (Top Hero Banner + Bottom Row)
  // ─────────────────────────────────────────────────────────────
  const renderClassicLayout = () => {
    if (totalCount === 2) {
      return (
        <View style={styles.dualRowContainer}>
          <View style={styles.dualImageHalf}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(0)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[0] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(0)}
          </View>
          <View style={styles.gapSpacer} />
          <View style={styles.dualImageHalf}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(1)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[1] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(1)}
          </View>
        </View>
      );
    }

    if (totalCount === 3) {
      return (
        <View style={styles.threeGridContainer}>
          {/* Top Banner (100%) */}
          <View style={styles.threeTopBanner}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(0)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[0] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(0)}
          </View>

          <View style={styles.horizontalGap} />

          {/* Bottom 2 Squares */}
          <View style={styles.bottomRow}>
            <View style={styles.bottomHalf}>
              <Pressable style={styles.imageTouchable} onPress={() => handlePress(1)} activeOpacity={0.9}>
                <Image source={{ uri: resolvedImages[1] }} style={styles.fillImage} resizeMode="cover" />
              </Pressable>
              {renderDeleteBtn(1)}
            </View>
            <View style={styles.gapSpacer} />
            <View style={styles.bottomHalf}>
              <Pressable style={styles.imageTouchable} onPress={() => handlePress(2)} activeOpacity={0.9}>
                <Image source={{ uri: resolvedImages[2] }} style={styles.fillImage} resizeMode="cover" />
              </Pressable>
              {renderDeleteBtn(2)}
            </View>
          </View>
        </View>
      );
    }

    if (totalCount === 4) {
      return (
        <View style={styles.fourGridContainer}>
          {/* Top Banner */}
          <View style={styles.fourTopBanner}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(0)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[0] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(0)}
          </View>

          <View style={styles.horizontalGap} />

          {/* Bottom 3 Photos */}
          <View style={styles.bottomRow}>
            <View style={styles.bottomThird}>
              <Pressable style={styles.imageTouchable} onPress={() => handlePress(1)} activeOpacity={0.9}>
                <Image source={{ uri: resolvedImages[1] }} style={styles.fillImage} resizeMode="cover" />
              </Pressable>
              {renderDeleteBtn(1)}
            </View>
            <View style={styles.gapSpacer} />
            <View style={styles.bottomThird}>
              <Pressable style={styles.imageTouchable} onPress={() => handlePress(2)} activeOpacity={0.9}>
                <Image source={{ uri: resolvedImages[2] }} style={styles.fillImage} resizeMode="cover" />
              </Pressable>
              {renderDeleteBtn(2)}
            </View>
            <View style={styles.gapSpacer} />
            <View style={styles.bottomThird}>
              <Pressable style={styles.imageTouchable} onPress={() => handlePress(3)} activeOpacity={0.9}>
                <Image source={{ uri: resolvedImages[3] }} style={styles.fillImage} resizeMode="cover" />
              </Pressable>
              {renderDeleteBtn(3)}
            </View>
          </View>
        </View>
      );
    }

    // 5+ PHOTOS
    const remainingCount = totalCount - 4;
    return (
      <View style={styles.fourGridContainer}>
        {/* Top Banner */}
        <View style={styles.fourTopBanner}>
          <Pressable style={styles.imageTouchable} onPress={() => handlePress(0)} activeOpacity={0.9}>
            <Image source={{ uri: resolvedImages[0] }} style={styles.fillImage} resizeMode="cover" />
          </Pressable>
          {renderDeleteBtn(0)}
        </View>

        <View style={styles.horizontalGap} />

        {/* Bottom 3 Photos with +N on 3rd */}
        <View style={styles.bottomRow}>
          <View style={styles.bottomThird}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(1)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[1] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(1)}
          </View>
          <View style={styles.gapSpacer} />
          <View style={styles.bottomThird}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(2)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[2] }} style={styles.fillImage} resizeMode="cover" />
            </Pressable>
            {renderDeleteBtn(2)}
          </View>
          <View style={styles.gapSpacer} />
          <View style={styles.bottomThird}>
            <Pressable style={styles.imageTouchable} onPress={() => handlePress(3)} activeOpacity={0.9}>
              <Image source={{ uri: resolvedImages[3] }} style={styles.fillImage} resizeMode="cover" />
              <View style={styles.moreOverlay}>
                <Text style={styles.moreOverlayText}>+{remainingCount + 1}</Text>
              </View>
            </Pressable>
            {renderDeleteBtn(3)}
          </View>
        </View>
      </View>
    );
  };

  // ── Dispatch layout renderer ──
  const renderLayout = () => {
    if (totalCount === 1) return renderSinglePhoto();

    switch (layoutType) {
      case 'CAROUSEL':
        return renderCarouselLayout();
      case 'GRID':
        return renderGridLayout();
      case 'COLUMN':
        return renderColumnLayout();
      case 'CLASSIC':
      default:
        return renderClassicLayout();
    }
  };

  return (
    <View style={[styles.rootContainer, containerStyle]}>
      {renderLayout()}

      {!disableInternalViewer && (
        <ImageView
          images={resolvedImages.map((uri) => ({ uri }))}
          imageIndex={viewerIndex}
          visible={viewerVisible}
          onRequestClose={() => setViewerVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    width: '100%',
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    marginTop: 8,
  },
  gapSpacer: {
    width: GAP,
    backgroundColor: '#FFFFFF',
  },
  horizontalGap: {
    height: GAP,
    backgroundColor: '#FFFFFF',
  },
  imageTouchable: {
    width: '100%',
    height: '100%',
  },
  fillImage: {
    width: '100%',
    height: '100%',
  },

  // 1 Image
  singleImageContainer: {
    width: '100%',
    height: 240,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },

  // 2 Images (Dual)
  dualRowContainer: {
    width: '100%',
    height: 220,
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  dualImageHalf: {
    flex: 1,
    height: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },

  // Classic 3 Images
  threeGridContainer: {
    width: '100%',
    height: 300,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  threeTopBanner: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  bottomRow: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
  },
  bottomHalf: {
    flex: 1,
    height: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },

  // Classic 4 & 5+ Images
  fourGridContainer: {
    width: '100%',
    height: 310,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  fourTopBanner: {
    width: '100%',
    height: 190,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  bottomThird: {
    flex: 1,
    height: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },

  // Grid Layout
  fourEqualGridContainer: {
    width: '100%',
    height: 300,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    height: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },

  // Column / Split Layout
  columnContainer: {
    width: '100%',
    height: 310,
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  columnLeft: {
    flex: 1.4,
    height: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  columnRight: {
    flex: 1,
    height: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  columnRightStacked: {
    flex: 1,
    height: '100%',
    flexDirection: 'column',
  },
  columnHalfItem: {
    flex: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  columnThirdItem: {
    flex: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },

  // Carousel Layout
  carouselWrapper: {
    width: '100%',
    height: 280,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  carouselScrollView: {
    width: '100%',
    height: '100%',
  },
  carouselSlide: {
    height: 280,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  carouselBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  carouselBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  carouselArrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  carouselArrowLeft: {
    left: 8,
  },
  carouselArrowRight: {
    right: 8,
  },
  carouselDotsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 5,
  },
  carouselDot: {
    height: 6,
    borderRadius: 3,
  },
  carouselDotActive: {
    width: 18,
    backgroundColor: '#3B82F6',
  },
  carouselDotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },

  // Overlay Count for 5+
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreOverlayText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Delete button
  deleteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 10,
  },
});
