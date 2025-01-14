// import { Candle } from './binance';

export function prepareDataset(candles: number[][], windowSize: number): DataSample[] {
    const dataset: DataSample[] = [];
    const GROWTH_THRESHOLD = 1.5; // Порог роста (10%)
    const COUNT_CHEK = 3;
    // Применяем нормализацию
    // const normalizedCandles = normalizeData(candles);
    const noNormalizedCandles = candles;
    const allNormCandles = normalizeData(candles);

    for (let i = 0; i < noNormalizedCandles.length - windowSize; i++) {
        // Проверяем выход за пределы массива
        if (i + windowSize + 1 >= noNormalizedCandles.length) {
            break;
        }

        try {
            const usedNormalizedCandles = normalizeData(noNormalizedCandles.slice(i, i + windowSize + COUNT_CHEK));

            const input = usedNormalizedCandles.slice(0, windowSize).map(candle => [
                candle[0], // open
                candle[1], // high
                candle[2], // low
                candle[3], // close
                candle[4], // volume    
            ]);

            const checkCandels = []
            while (checkCandels.length < COUNT_CHEK) {
                checkCandels.push(usedNormalizedCandles[windowSize + checkCandels.length])
            }
            // console.log('USED', usedNormalizedCandles)
            // console.log('INPUT', input)
            // console.log('checkCandels', checkCandels)

            const max = Math.max(...checkCandels.map(c => c[3]));

            // Условие роста
            const res = max > input[input.length - 1][3] * GROWTH_THRESHOLD ? 1 : 0;

            dataset.push({ input, target: [res], maxClose: allNormCandles[i + windowSize - 1][3] });
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
    const min = Math.min(...flattenPrices)
    const max = Math.max(...flattenPrices)

    const values = candles.map(c => c[5])
    const maxVolume = Math.max(...values)
    const minVolume = Math.min(...values)

    return allPrices.map((prices, i) => {
        return [...prices.map(price => (price - min) / (max - min)), (values[i] - minVolume) / (maxVolume - minVolume)]  // нормализация в диапазоне [0, 1]
    });
}

export const normalizeArray = (array: number[]) => {
    const min = Math.min(...array);
    const max = Math.max(...array);

    return array.map(x => (x - min) / (max - min));
}