// import { Candle } from './binance';

import { CONFIG } from "./config";
import { getHistoricalCandles } from "./binance";
import { DataSample } from "./t";

export function prepareDataset(candles: number[][], windowSize: number): DataSample[] {
    const dataset: DataSample[] = [];

    // Применяем нормализацию
    // const normalizedCandles = normalizeData(candles);
    const noNormalizedCandles = candles;
    const allNormCandles = normalizeData(candles);

    const lastFinally = allNormCandles[allNormCandles.length - 2]
    const predLastFinally = allNormCandles[allNormCandles.length - 3]

    console.log('PredLast:', predLastFinally, new Date(predLastFinally[6]))
    console.log('Last:', lastFinally, new Date(lastFinally[6]))

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


export const candelsToInputs = async (candles?: number[][]) => {
    candles ||= await getHistoricalCandles('BTCUSDT', CONFIG.TIMEFRAME, 500);
    // const candles: number[][] = []

    // console.log('All:', candles)
    const inputs: number[][][] = []
    let i = 0
    while (i < candles.length - CONFIG.INPUT_SIZE - 1) {
        const input = candles.slice(candles.length - CONFIG.INPUT_SIZE - i, candles.length - i)
        // console.log('C', i, new Date(input[0][6]))
        inputs.push(normalizeData(input))
        i++
    }

    return inputs.reverse().map(inp => {
        return inp.map(c => {
            return {
                open: c[0],
                high: c[1],
                low: c[2],
                close: c[3],
                volume: c[4],
                closePrice: c[5],
                maxPrice: c[1],
                minPrice: c[2],
                closeTime: c[6]
            }
        })
    }) // возвращаем нормализованные inputs

}

export const prepareInputs = async (candles: number[][]) => {
    const currentInputs = await candelsToInputs(candles)


    const prepInputs = currentInputs.map(i => i.map(v => [v.open, v.high, v.low, v.close, v.volume]).flat())

    // currentInputs.forEach(inp => {
    //     console.log('Interval', inp.map(i => new Date(i.closeTime)))
    // })


    const set: {
        input: number[][]
        target: number[]
        maxClose: number
        currentPrice: number
    }[] = []

    prepInputs.forEach((input, i) => {
        if (i < 2 || !prepInputs[i + CONFIG.INPUT_SIZE + 5]) {
            return
        }

        const inputData = currentInputs[i]
        const nextInputs = currentInputs.slice(i + CONFIG.INPUT_SIZE, i + CONFIG.FORWARD_COUNT_CHEK + CONFIG.INPUT_SIZE)
        const nextPrices = nextInputs.map(i => i[0].closePrice || 0)
        const maxPrice = Math.max(...nextPrices)
        const currentPrice = inputData[inputData.length - 1].closePrice

      

        // Изменение [-5%,+5%] =>[0-1]
        // Вычисляем изменение в процентах
        const change = ((maxPrice - currentPrice) / currentPrice) * 100;
        // Нормализуем изменение в диапазоне [0, 1]
        const res_ = (change + (CONFIG.GROWTH_THRESHOLD - 1) * 100) / (2 * (CONFIG.GROWTH_THRESHOLD - 1) * 100);
        // Ограничиваем значение в диапазоне [0, 1]
        const res = Math.max(0, Math.min(1, res_));
        // console.log(`${currentPrice}->${maxPrice}: Изменение: ${change}%, Нормализованное значение: ${normalizedRes}`);


        // const res = maxPrice >= currentPrice * CONFIG.GROWTH_THRESHOLD
        //     ? 1
        //     : 0;


            // const gotProfit = currentPrice * CONFIG.GROWTH_THRESHOLD
            // const gotProfitHalf = currentPrice * (1 + (CONFIG.GROWTH_THRESHOLD - 1) / 2)
    
            // let res = 0
    
            // if (maxPrice >= gotProfit) {
            //     res = 1
            // } else if (maxPrice>= gotProfitHalf) {
            //     res = 0.5
            // } else if(maxPrice > gotProfitHalf && maxPrice > currentPrice) {
            //     res = 0.25
            // } else {
            //     res = 0
            // }
    


        set.push({
            input: splitArray(input, 5),
            target: [res],
            maxClose: maxPrice,
            currentPrice
        })

        // console.log('**********')
       
        // console.log('InpData', inputData)
        // console.log('InpDataTime', inputData.map(inp => new Date(inp.closeTime)))
        // console.log('currentPrice', currentPrice)
        // console.log('nextInputs', nextInputs)
        // console.log('Checked next prices', nextPrices)
       
        // console.log('nextInputsStarts:', nextInputs.map(inp => new Date(inp[0].closeTime)))
        // console.log('input', input)


        // console.log('Next list->', nextInputs.map(inp => new Date(inp[inp.length - 1][6])))
    })

    return {
        set, // сет для тренировки
        allPrepInputs: prepInputs // полные инпуты до последней свечи
    }
}

const splitArray = (arr: number[], chunkSize: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      result.push(arr.slice(i, i + chunkSize));
    }
    return result;
  };