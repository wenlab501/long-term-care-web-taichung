<script>
  /**
   * =============================================================================
   * 📥 LoadingOverlay.vue - 載入覆蓋層組件
   * =============================================================================
   *
   * 用途：顯示全螢幕載入狀態的覆蓋層組件
   *
   * 功能特性：
   * - 🎯 全螢幕覆蓋顯示
   * - ⏳ 支援載入動畫和文字提示
   * - 📊 可選的進度條顯示
   * - 🎨 無障礙設計支援
   * - 📱 響應式設計
   *
   * @author 長期照護資源分析系統團隊
   * @version 2.0.0
   */

  import { computed } from 'vue';

  export default {
    name: 'LoadingOverlay',

    /**
     * =============================================================================
     * 🔧 組件屬性定義 (Component Props Configuration)
     * =============================================================================
     */
    props: {
      /**
       * ⏳ 是否顯示載入覆蓋層
       * @type {boolean}
       */
      isVisible: {
        type: Boolean,
        default: false,
        required: true,
        validator: (value) => typeof value === 'boolean',
      },

      /**
       * 📝 載入過程的主要文字描述
       * @type {string}
       */
      loadingText: {
        type: String,
        default: '載入中...',
        validator: (value) => typeof value === 'string' && value.length > 0,
      },

      /**
       * 📊 載入進度百分比 (0-100，-1 表示不顯示進度)
       * @type {number}
       */
      progress: {
        type: Number,
        default: -1,
        validator: (value) => {
          return typeof value === 'number' && !isNaN(value) && value >= -1 && value <= 100;
        },
      },

      /**
       * 📊 是否顯示進度條
       * @type {boolean}
       */
      showProgress: {
        type: Boolean,
        default: false,
      },

      /**
       * 📝 輔助說明文字 (可選)
       * @type {string}
       */
      subText: {
        type: String,
        default: '',
      },

      /**
       * 🎨 載入覆蓋層主題色彩
       * @type {('primary'|'secondary'|'success'|'warning'|'danger')}
       */
      theme: {
        type: String,
        default: 'primary',
        validator: (value) =>
          ['primary', 'secondary', 'success', 'warning', 'danger'].includes(value),
      },

      /**
       * 📏 載入動畫大小
       * @type {('sm'|'md'|'lg')}
       */
      size: {
        type: String,
        default: 'md',
        validator: (value) => ['sm', 'md', 'lg'].includes(value),
      },
    },

    /**
     * =============================================================================
     * 🔧 組件邏輯設定 (Component Setup)
     * =============================================================================
     */
    setup(props) {
      /**
       * 🎨 動態樣式計算 (Dynamic Style Computation)
       */

      // 載入動畫尺寸映射
      const spinnerSizes = {
        sm: { width: '1.5rem', height: '1.5rem' },
        md: { width: '2rem', height: '2rem' },
        lg: { width: '2.5rem', height: '2.5rem' },
      };

      // 計算載入動畫樣式
      const spinnerStyle = computed(() => ({
        ...spinnerSizes[props.size],
      }));

      // 計算主題CSS類名
      const themeClass = computed(() => `text-${props.theme}`);

      // 進度條樣式類名
      const progressBarClass = computed(() => `bg-${props.theme}`);

      // 格式化進度百分比
      const formattedProgress = computed(() => {
        if (props.progress < 0) return 0;
        return Math.max(0, Math.min(100, Math.round(props.progress)));
      });

      // 是否應該顯示進度條
      const shouldShowProgress = computed(() => {
        return props.showProgress && props.progress >= 0;
      });

      /**
       * 🔧 輔助方法 (Helper Methods)
       */

      // 獲取進度條的 aria-label
      const getProgressAriaLabel = () => {
        return `載入進度 ${formattedProgress.value} 百分比`;
      };

      // 獲取載入狀態的完整描述（用於螢幕閱讀器）
      const getLoadingDescription = () => {
        let description = props.loadingText;
        if (props.subText) {
          description += `，${props.subText}`;
        }
        if (shouldShowProgress.value) {
          description += `，進度 ${formattedProgress.value}%`;
        }
        return description;
      };

      return {
        // 計算屬性
        spinnerStyle,
        themeClass,
        progressBarClass,
        formattedProgress,
        shouldShowProgress,

        // 方法
        getProgressAriaLabel,
        getLoadingDescription,
      };
    },
  };
</script>

<template>
  <!--
    =============================================================================
    ⏳ 載入覆蓋層組件 (Loading Overlay Component)
    =============================================================================

    功能：在資料載入時顯示全螢幕覆蓋層，提供視覺化回饋
    特性：支援無障礙設計、進度條顯示、主題色彩配置
  -->
  <Transition
    name="loading-overlay"
    enter-active-class="loading-overlay-enter-active"
    leave-active-class="loading-overlay-leave-active"
    enter-from-class="loading-overlay-enter-from"
    leave-to-class="loading-overlay-leave-to"
  >
    <div
      v-if="isVisible"
      class="loading-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="getLoadingDescription()"
      aria-live="polite"
    >
      <!-- 🌊 背景遮罩層 (Background Overlay) -->
      <div class="loading-overlay__backdrop" @click.stop />

      <!-- 📄 載入內容卡片 (Loading Content Card) -->
      <div class="loading-overlay__content">
        <!-- ⏳ 載入動畫區域 (Loading Animation Section) -->
        <div class="loading-overlay__spinner-container">
          <div
            class="spinner-border mb-3"
            :class="themeClass"
            :style="spinnerStyle"
            role="status"
            aria-hidden="true"
          >
            <!-- 🔍 無障礙輔助文字 (Screen Reader Text) -->
            <span class="visually-hidden">{{ loadingText }}</span>
          </div>
        </div>

        <!-- 📝 主要載入文字區域 (Primary Loading Text Section) -->
        <div class="loading-overlay__text-container">
          <h2 class="loading-overlay__title my-title-lg-black" id="loading-title">
            {{ loadingText }}
          </h2>

          <!-- 📝 輔助說明文字 (Secondary Text) -->
          <p
            v-if="subText"
            class="loading-overlay__subtitle my-content-xs-gray mt-2 mb-0"
            id="loading-subtitle"
          >
            {{ subText }}
          </p>
        </div>

        <!-- 📊 載入進度條區域 (Loading Progress Section) -->
        <div v-if="shouldShowProgress" class="loading-overlay__progress-container mt-3">
          <!-- 📊 進度條標籤 (Progress Label) -->
          <div
            class="loading-overlay__progress-label d-flex justify-content-between align-items-center mb-2"
          >
            <small class="my-content-xs-gray">載入進度</small>
            <small class="my-content-xs-gray fw-bold">{{ formattedProgress }}%</small>
          </div>

          <!-- 📊 Bootstrap 進度條容器 (Bootstrap Progress Container) -->
          <div
            class="progress loading-overlay__progress-bar"
            role="progressbar"
            :aria-valuenow="formattedProgress"
            :aria-label="getProgressAriaLabel()"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <!-- 📊 進度條滑塊 (Progress Bar) -->
            <div
              class="progress-bar"
              :class="progressBarClass"
              :style="{ width: formattedProgress + '%' }"
            >
              <span class="visually-hidden">{{ formattedProgress }}% 完成</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
  /**
 * =============================================================================
 * 🎨 LoadingOverlay 組件樣式 (LoadingOverlay Component Styles)
 * =============================================================================
 */

  /* 📐 主容器樣式 (Main Container Styles) */
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  /* 🌊 背景遮罩樣式 (Background Overlay Styles) */
  .loading-overlay__backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }

  /* 📄 內容卡片樣式 (Content Card Styles) */
  .loading-overlay__content {
    position: relative;
    z-index: 1;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    padding: 2rem;
    text-align: center;
    min-width: 300px;
    max-width: 400px;
    width: 100%;
  }

  /* ⏳ 動畫容器樣式 (Spinner Container Styles) */
  .loading-overlay__spinner-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* 📝 文字容器樣式 (Text Container Styles) */
  .loading-overlay__text-container {
    margin: 0;
  }

  .loading-overlay__title {
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .loading-overlay__subtitle {
    margin: 0;
    line-height: 1.4;
    opacity: 0.8;
  }

  /* 📊 進度條容器樣式 (Progress Container Styles) */
  .loading-overlay__progress-container {
    width: 100%;
  }

  .loading-overlay__progress-label {
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .loading-overlay__progress-bar {
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    background-color: var(--my-color-gray-200);
  }

  .loading-overlay__progress-bar .progress-bar {
    transition: width 0.3s ease;
    border-radius: 4px;
  }

  /* 🎭 過渡動畫樣式 (Transition Animation Styles) */
  .loading-overlay-enter-active,
  .loading-overlay-leave-active {
    transition: all 0.3s ease;
  }

  .loading-overlay-enter-active .loading-overlay__content,
  .loading-overlay-leave-active .loading-overlay__content {
    transition: all 0.3s ease;
  }

  .loading-overlay-enter-from,
  .loading-overlay-leave-to {
    opacity: 0;
  }

  .loading-overlay-enter-from .loading-overlay__content,
  .loading-overlay-leave-to .loading-overlay__content {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }

  /* 📱 響應式樣式 (Responsive Styles) */
  @media (max-width: 576px) {
    .loading-overlay__content {
      min-width: 280px;
      margin: 1rem;
      padding: 1.5rem;
    }

    .loading-overlay__title {
      font-size: 1rem;
    }
  }

  @media (max-width: 360px) {
    .loading-overlay__content {
      min-width: 240px;
      padding: 1.25rem;
    }
  }

  /* ♿ 無障礙支援樣式 (Accessibility Styles) */
  @media (prefers-reduced-motion: reduce) {
    .loading-overlay-enter-active,
    .loading-overlay-leave-active,
    .loading-overlay__progress-bar .progress-bar {
      transition: none;
    }

    .spinner-border {
      animation: none;
      border-left-color: transparent;
    }
  }

  /* 🌙 深色模式支援 (Dark Mode Support) */
  @media (prefers-color-scheme: dark) {
    .loading-overlay__content {
      background: var(--my-color-gray-800, #2d3748);
      color: var(--my-color-white, #ffffff);
    }

    .loading-overlay__title {
      color: var(--my-color-white, #ffffff);
    }

    .loading-overlay__progress-bar {
      background-color: var(--my-color-gray-600, #4a5568);
    }
  }
</style>
