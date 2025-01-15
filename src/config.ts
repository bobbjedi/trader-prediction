// config.ts
export const CONFIG = {
    CANDLE_LIMIT: 10000,  // Количество свечей в датасете
    INPUT_SIZE: 8,      // Количество свечей в выборке (на вход)
    TIMEFRAME: '1h',     // Таймфрейм свечей
    GROWTH_THRESHOLD: 1.01, // Порог роста (1.01 = 1%)
    FORWARD_COUNT_CHEK: 3 // количество свечей для проверки роста (в течение FORWARD_COUNT_CHEK свечей проверяется рост FORWARD_COUNT_CHEK)
  };
  