<script>
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
      const currentYear = ref(new Date().getFullYear());
      const currentMonth = ref(new Date().getMonth() + 1);

      // 計算屬性
      const displayText = computed(() => {
        if (selectedDate.value) {
          // 將 7 碼日期轉換為可讀格式 (例如: 1140701 -> 2025/07/01)
          const republicanYear = parseInt(selectedDate.value.substring(0, 3));
          const year = republicanYear + 1911; // 民國年轉西元年
          const month = selectedDate.value.substring(3, 5);
          const day = selectedDate.value.substring(5, 7);
          return `${year}/${month}/${day}`;
        }
        return props.placeholder;
      });

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

      const previousMonth = () => {
        if (currentMonth.value === 1) {
          currentMonth.value = 12;
          currentYear.value--;
        } else {
          currentMonth.value--;
        }
      };

      const nextMonth = () => {
        if (currentMonth.value === 12) {
          currentMonth.value = 1;
          currentYear.value++;
        } else {
          currentMonth.value++;
        }
      };

      const clearDate = () => {
        selectedDate.value = '';
        emit('update:modelValue', '');
        emit('date-selected', '');
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
        displayText,
        calendarDays,
        toggleCalendar,
        selectDate,
        previousMonth,
        nextMonth,
        clearDate,
      };
    },
  };
</script>

<template>
  <div class="date-picker-container">
    <!-- 日期顯示和操作按鈕 -->
    <div class="d-flex align-items-center gap-2 mb-2">
      <div class="flex-grow-1">
        <div v-if="selectedDate" class="my-content-sm-black">已選擇: {{ displayText }}</div>
        <div v-else class="my-content-xs-gray">
          {{ placeholder }}
        </div>
      </div>
      <button
        v-if="selectedDate"
        class="btn btn-sm btn-outline-danger"
        type="button"
        @click="clearDate"
        title="清除日期"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- 日曆 -->
    <div class="calendar-container bg-white border rounded shadow-sm p-2">
      <!-- 日曆標題 -->
      <div class="calendar-header d-flex justify-content-between align-items-center mb-2">
        <button class="btn btn-sm btn-outline-secondary" @click="previousMonth" title="上一個月">
          <i class="fas fa-chevron-left"></i>
        </button>
        <h6 class="mb-0 my-font-size-sm">{{ currentYear }}年{{ currentMonth }}月</h6>
        <button class="btn btn-sm btn-outline-secondary" @click="nextMonth" title="下一個月">
          <i class="fas fa-chevron-right"></i>
        </button>
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
    background-color: var(--my-color-blue) !important;
    color: white !important;
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
