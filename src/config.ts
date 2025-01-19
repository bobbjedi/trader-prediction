// config.ts
export const CONFIG = {
  CANDLE_LIMIT: 10000,  // Количество свечей в датасете
  INPUT_SIZE: 12,      // Количество свечей в выборке (на вход)
  TIMEFRAME: '6h',     // Таймфрейм свечей
  GROWTH_THRESHOLD: 1.05, // Порог роста (1.01 = 1%)
  FORWARD_COUNT_CHEK: 4 // количество свечей для проверки роста (в течение FORWARD_COUNT_CHEK свечей проверяется рост FORWARD_COUNT_CHEK)
};


const showConfig = () => {

  if (!globalThis.window) return;
  const el = document.getElementById('config');
  if (!el) return;
  el.innerHTML = `
    <div>Input size: ${CONFIG.INPUT_SIZE}</div>
    <div>Candle limit: ${CONFIG.CANDLE_LIMIT}</div>
    <div>Timeframe: ${CONFIG.TIMEFRAME}</div>
    <div>Growth threshold: ${CONFIG.GROWTH_THRESHOLD}</div>
    <div>Forward count check: ${CONFIG.FORWARD_COUNT_CHEK}</div>
    `
  // el.textContent = JSON.stringify(CONFIG, null, 2);
}
showConfig()