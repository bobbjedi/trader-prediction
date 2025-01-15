// import { Candle } from './binance';

import { CONFIG } from "./config";

export function prepareDataset(candles: number[][], windowSize: number): DataSample[] {
    const dataset: DataSample[] = [];

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
            const usedNormalizedCandles = normalizeData(noNormalizedCandles.slice(i, i + windowSize + CONFIG.FORWARD_COUNT_CHEK));
            // console.log('usedNormalizedCandles', usedNormalizedCandles)
            const input = usedNormalizedCandles.slice(0, windowSize).map(candle => [
                candle[0], // open
                candle[1], // high
                candle[2], // low
                candle[3], // close
                candle[4], // volume
                candle[5] // реальная цена без форматирования
            ]);

            const checkCandels = []
            while (checkCandels.length < CONFIG.FORWARD_COUNT_CHEK) {
                checkCandels.push(usedNormalizedCandles[windowSize + checkCandels.length])
            }

            const max = Math.max(...checkCandels.map(c => c[5]));
            const targetPrice = input[input.length - 1][5] * CONFIG.GROWTH_THRESHOLD
            // Условие роста
            const res = max >= targetPrice
                ? 1
                : 0;

            // res && console.log('Max:', max, 'LastKnown:', input[input.length - 1][5])

            input.forEach(inp => {
                inp.length = 5
            })

            dataset.push({
                input,
                target: [res],
                maxClose: allNormCandles[i + windowSize - 1][3],
                realPrice: noNormalizedCandles[i + windowSize - 1][4],
                closeTime: noNormalizedCandles[i + windowSize - 1][6]
            });
        } catch (error) {
            console.log('Error preparing dataset:', error?.toString());
        }
    }
    console.log('IsOk:', dataset.filter(d => d.target[0] === 1).length, 'NotOk:', dataset.filter(d => d.target[0] === 0).length)
    // dataset.forEach(d => {
    //     console.log('I:', d.input, 'T:', d.target, 'M:', d.maxClose)
    // })
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

    const flattenPrices = allPrices.flat()
    const min = Math.min(...flattenPrices)
    const max = Math.max(...flattenPrices)

    const values = candles.map(c => c[5])
    const maxVolume = Math.max(...values)
    const minVolume = Math.min(...values)

    const closeTimes = candles.map(c => c[6])

    return allPrices.map((prices, i) => {
        return [
            ...prices.map(price => (price - min) / (max - min)),
            (values[i] - minVolume) / (maxVolume - minVolume),
            +candles[i][4], // закрытие без форматирования
            closeTimes[i] // время закрытия свечи
        ]  // нормализация в диапазоне [0, 1]
    });
}

export const normalizeArray = (array: number[]) => {
    const min = Math.min(...array);
    const max = Math.max(...array);

    return array.map(x => (x - min) / (max - min));
}