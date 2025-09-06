<script>
  /**
   * DatePicker.vue
   *
   * Purpose:
   * - Minimal calendar for selecting a 7-digit ROC date string (YYYMMDD).
   * - Month navigation is disabled by design; fixed to 2025/07.
   *
   * Notes:
   * - Non-functional documentation only; no behavior or layout changes.
   */
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

  export default {
    name: 'DatePicker',

    props: {
      modelValue: {
        type: String,
        default: '',
      },
      placeholder: {
        type: String,
        default: '選擇服務日期',
      },
    },

    emits: ['update:modelValue', 'date-selected'],

    setup(props, { emit }) {
      // 響應式數據
      const isOpen = ref(false);
      const selectedDate = ref(props.modelValue || '');
      // 固定為 2025 年 7 月
      const currentYear = ref(2025);
      const currentMonth = ref(7);

      // 計算屬性

      const calendarDays = computed(() => {
        const year = currentYear.value;
        const month = currentMonth.value;
        const firstDay = new Date(year, month - 1, 1).getDay();
        const daysInMonth = new Date(year, month, 0).getDate();
        const days = [];

        // 添加空白天數（上個月的天數）
        for (let i = 0; i < firstDay; i++) {
          days.push({ day: '', isCurrentMonth: false });
        }

        // 添加當月的天數
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = formatDateTo7Digits(year, month, day);
          days.push({
            day,
            isCurrentMonth: true,
            isSelected: dateStr === selectedDate.value,
            dateStr,
          });
        }

        return days;
      });

      // 方法
      const formatDateTo7Digits = (year, month, day) => {
        const republicanYear = (year - 1911).toString().padStart(3, '0'); // 西元年轉民國年
        const monthStr = month.toString().padStart(2, '0');
        const dayStr = day.toString().padStart(2, '0');
        return `${republicanYear}${monthStr}${dayStr}`;
      };

      const parse7DigitsDate = (dateStr) => {
        if (dateStr.length === 7) {
          const republicanYear = parseInt(dateStr.substring(0, 3));
          const year = republicanYear + 1911; // 民國年轉西元年
          const month = parseInt(dateStr.substring(3, 5));
          const day = parseInt(dateStr.substring(5, 7));
          return { year, month, day };
        }
        return null;
      };

      const toggleCalendar = () => {
        isOpen.value = !isOpen.value;
        if (isOpen.value && selectedDate.value) {
          const parsed = parse7DigitsDate(selectedDate.value);
          if (parsed) {
            currentYear.value = parsed.year;
            currentMonth.value = parsed.month;
          }
        }
      };

      const selectDate = (day) => {
        if (day.isCurrentMonth && day.day) {
          const dateStr = formatDateTo7Digits(currentYear.value, currentMonth.value, day.day);
          selectedDate.value = dateStr;
          emit('update:modelValue', dateStr);
          emit('date-selected', dateStr);
          isOpen.value = false;
        }
      };

      // 禁用月份切換功能，固定為 2025 年 7 月
      const previousMonth = () => {
        // 不執行任何操作
      };

      const nextMonth = () => {
        // 不執行任何操作
      };

      const closeCalendar = (event) => {
        if (!event.target.closest('.date-picker-container')) {
          isOpen.value = false;
        }
      };

      // 監聽器
      watch(
        () => props.modelValue,
        (newValue) => {
          selectedDate.value = newValue || '';
        }
      );

      // 生命週期
      onMounted(() => {
        document.addEventListener('click', closeCalendar);
      });

      onUnmounted(() => {
        document.removeEventListener('click', closeCalendar);
      });

      return {
        isOpen,
        selectedDate,
        currentYear,
        currentMonth,
        calendarDays,
        toggleCalendar,
        selectDate,
        previousMonth,
        nextMonth,
      };
    },
  };
</script>

<template>
  <div class="date-picker-container">
    <!-- 日曆 -->
    <div class="calendar-container bg-white border rounded shadow-sm p-2">
      <!-- 日曆標題 -->
      <div class="calendar-header d-flex justify-content-center align-items-center mb-2">
        <h6 class="mb-0 my-font-size-sm">{{ currentYear }}年{{ currentMonth }}月</h6>
      </div>

      <!-- 星期標題 -->
      <div class="calendar-weekdays d-flex mb-1">
        <div
          v-for="day in ['日', '一', '二', '三', '四', '五', '六']"
          :key="day"
          class="calendar-weekday text-center my-font-size-xs my-title-xs-gray"
          style="flex: 1; padding: 4px 2px"
        >
          {{ day }}
        </div>
      </div>

      <!-- 日期格子 -->
      <div class="calendar-days">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="calendar-day text-center my-font-size-xs"
          :class="{
            'text-muted': !day.isCurrentMonth,
            'bg-primary text-white': day.isSelected,
            'calendar-day-hover': day.isCurrentMonth && day.day,
          }"
          @click="selectDate(day)"
        >
          {{ day.day }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }

  .calendar-day {
    transition: all 0.2s ease;
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    cursor: pointer;
    padding: 4px;
  }

  .calendar-day-hover:hover {
    background-color: var(--my-color-gray-100) !important;
  }

  .calendar-day.bg-primary {
    background-color: var(--my-color-red) !important; /* 使用紅色作為高亮 */
    color: white !important;
    font-weight: bold !important;
    border: 2px solid var(--my-color-red-hover) !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
  }

  .calendar-container {
    min-width: 280px;
  }

  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }

  .calendar-weekday {
    min-height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
  }
</style>
