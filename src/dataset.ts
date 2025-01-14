// import { Candle } from './binance';

export function prepareDataset(candles: number[][], windowSize: number): DataSample[] {
    const dataset: DataSample[] = [];
    const GROWTH_THRESHOLD = 1.1; // Порог роста (5%)

    // Применяем нормализацию
    const normalizedCandles = normalizeData(candles);

    for (let i = 0; i < normalizedCandles.length - windowSize; i++) {
        // Проверяем выход за пределы массива
        if (i + windowSize + 1 >= normalizedCandles.length) {
            break;
        }

        try {
            const input = normalizedCandles.slice(i, i + windowSize).map(candle => [
                candle[0], // open
                candle[1], // high
                candle[2], // low
                candle[3], // close
                candle[4], // volume    
            ]);

            const max = Math.max(
                normalizedCandles[i + windowSize][3],
                normalizedCandles[i + windowSize + 1][3],
                // normalizedCandles[i + windowSize + 2][3],
                // normalizedCandles[i + windowSize + 3][3],
            );

            // Условие роста
            const res = max > input[input.length - 1][3] * GROWTH_THRESHOLD ? 1 : 0;

            dataset.push({ input, target: [res], maxClose: normalizedCandles[i + windowSize - 1][3] });
        } catch (error) {
            console.log('Error preparing dataset:', error?.toString());
        }
    }

    return dataset;
}




export function splitDataset(dataset: DataSample[], trainRatio: number = 0.8) {
    const trainSize = Math.floor(dataset.length * trainRatio);
    const trainData = dataset.slice(0, trainSize);
    const testData = dataset.slice(trainSize);

    return { trainData, testData };
}


// В src/dataset.ts

// Функция для подготовки данных для модели
export function prepareForTraining(dataset: DataSample[]) {
    const X: number[][][] = []; // Входные данные (массивы последовательностей)
    const y: number[][] = [];   // Целевые данные (следующие свечи)

    dataset.forEach(sample => {
        X.push(sample.input);
        y.push(sample.target);
    });

    return { X, y };
}


// Функция для нормализации цен
export function normalizeData(candles: number[][]) {
    const allPrices = candles.map(candle => [
        candle[1], // open
        candle[2], // high
        candle[3], // low
        candle[4]  // close
    ]);

    const flattenPrices = allPrices.flat();
    const min = Math.min(...flattenPrices) / 1.1;
    const max = Math.max(...flattenPrices) * 0.9;

    const values = candles.map(c => c[5])
    const maxVolume = Math.max(...values)
    const minVolume = Math.min(...values)

    return allPrices.map((prices, i) => {
        return [...prices.map(price => (price - min) / (max - min)), (values[i] - minVolume) / (maxVolume - minVolume)]  // нормализация в диапазоне [0, 1]
    });
}
