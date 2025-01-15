import { SMA, EMA, RSI } from 'technicalindicators';

/**
 * Добавление технических индикаторов к данным.
 * @param candles Массив свечей.
 * @returns Массив свечей с дополнительными признаками.
 */
export function addFeatures(candles: number[][]): number[][] {
    const closes = candles.map(candle => candle[3]);

    // Скользящие средние (SMA, EMA)
    const sma = SMA.calculate({ period: 14, values: closes });
    const ema = EMA.calculate({ period: 14, values: closes });

    // Индекс относительной силы (RSI)
    const rsi = RSI.calculate({ period: 14, values: closes });

    // Добавляем индикаторы к каждой свече
    return candles.map((candle, index) => {
        const smaValue = sma[index - (candles.length - sma.length)] || 0;
        const emaValue = ema[index - (candles.length - ema.length)] || 0;
        const rsiValue = rsi[index - (candles.length - rsi.length)] || 0;

        return {
            ...candle,
            sma: smaValue,
            ema: emaValue,
            rsi: rsiValue,
        };
    });
}

/**
 * Нормализация данных с использованием мин-макс нормализации.
 * @param candles Массив свечей.
 * @returns Нормализованный массив свечей.
 */
export function normalizeData(candles: Candle[]): Candle[] {
    const flatCandles = candles.flatMap(candle => Object.values(candle));
    const min = Math.min(...flatCandles);
    const max = Math.max(...flatCandles);

    return candles.map(candle => {
        const normalizedCandle: Partial<Candle> = {};
        for (const key in candle) {
            const value = candle[key as keyof Candle];
            normalizedCandle[key as keyof Candle] = (value - min) / (max - min);
        }
        return normalizedCandle as Candle;
    });
}

/**
 * Генерация шума для улучшения данных.
 * @param candles Массив свечей.
 * @param noiseFactor Коэффициент шума.
 * @returns Массив свечей с шумом.
 */
// export function addNoise(candles: number[][], noiseFactor: number): number[][] {
//     return candles.map(candle => {
//         const noisyCandle: Record<string, number> = {};
//         for (const key in candle) {
//             const value = candle[key];
//             noisyCandle[key] = value + noiseFactor * Math.random();
//         }
//         return noisyCandle;
//     });
// }

/**
 * Формирование окна для временных рядов.
 * @param candles Массив свечей.
 * @param windowSize Размер окна.
 * @returns Массив данных для обучения.
 */
interface DataSample {
    input: number[][];  // Входные данные для модели
    target: number[];   // Целевые значения
    maxClose: number;   // Дополнительная информация (если используется)
}

export function prepareDataset(candles: number[][], windowSize: number): DataSample[] {
    const dataset: DataSample[] = [];

    for (let i = 0; i < candles.length - windowSize; i++) {
        const window = candles.slice(i, i + windowSize);
        const target = [candles[i + windowSize][3]]; // Предполагаем, что target — это close следующей свечи
        const maxClose = Math.max(...window.map(c => c[3]));

        dataset.push({
            input: window.map(c => [c[0], c[1], c[2], c[3], c[4]]),
            target,
            maxClose,
        });
    }

    return dataset;
}


/**
 * Разделение данных на обучающую и тестовую выборки.
 * @param dataset Массив данных для обучения.
 * @param trainRatio Доля данных для обучения.
 * @returns Объект с обучающей и тестовой выборками.
 */
export function splitDataset(dataset: DataSample[], trainRatio: number = 0.8): { trainData: DataSample[]; testData: DataSample[] } {
    const trainSize = Math.floor(dataset.length * trainRatio);
    return {
        trainData: dataset.slice(0, trainSize),
        testData: dataset.slice(trainSize),
    };
}

/**
 * Балансировка данных по классам.
 * @param dataset Массив данных.
 * @returns Сбалансированный массив данных.
 */
export function balanceClasses(dataset: DataSample[]): DataSample[] {
    const up = dataset.filter(sample => sample.target[0] > 0);
    const down = dataset.filter(sample => sample.target[0] <= 0);

    const size = Math.min(up.length, down.length);

    return [...up.slice(0, size), ...down.slice(0, size)];
}
