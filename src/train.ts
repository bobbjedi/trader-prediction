import * as tf from '@tensorflow/tfjs';
import { getHistoricalCandles } from './binance';
import { CONFIG } from './config';
import { candelsToInputs, normalizeArray, prepareDataset, prepareInputs, splitDataset } from './dataset';
import { visualizeError, visualizeResults } from './visualizeResults';
import { setDate } from './statistic';


tf.setBackend('webgl');

console.log('Available backends:', tf.engine().backendNames());

// Проверяем текущий бэкенд
console.log('Current backend:', tf.getBackend());

// Проверяем версию WebGL
console.log('WebGL version:', tf.ENV.get('WEBGL_VERSION'));

// Принудительно устанавливаем CPU бэкенд, если WebGL недоступен
if (tf.getBackend() !== 'webgl') {
  console.warn('WebGL недоступен. Переключаемся на CPU.');
  tf.setBackend('cpu');
}


export async function trainModel() {
    // Шаг 1: Загрузка и подготовка данных

    const countShow = 300
    const candles = await getHistoricalCandles('BTCUSDT', CONFIG.TIMEFRAME, CONFIG.CANDLE_LIMIT);
    const testRanTimeCandels = candles.splice(-candles.length * .25)

    // console.log('prepareInputs:', prepareInputs(testRanTimeCandels))

    const dataset = (await prepareInputs(candles)).set;
    // const { trainData, testData } = splitDataset(dataset, 0.98);
    const trainData = dataset
    const testData = dataset.splice(-countShow)
    console.log('Set item:', testData[0])
    // Шаг 2: Разделяем данные на вход (inputs) и метки (targets)
    const trainInputs = trainData.map(sample => sample.input);
    const trainLabels = trainData.map(sample => sample.target);

    console.log('trainInputs', trainInputs)
    const testInputs = testData.map(sample => sample.input);
    const testLabels = testData.map(sample => sample.target);

    // Преобразуем данные в тензоры
    const trainInputsTensor = tf.tensor3d(trainInputs);
    const trainLabelsTensor = tf.tensor2d(trainLabels);

    const testInputsTensor = tf.tensor3d(testInputs);
    const testLabelsTensor = tf.tensor2d(testLabels);

    // Шаг 3: Создание модели
    const model = tf.sequential();



    // CNN + LSTM

    // Сверточный слой
    model.add(tf.layers.conv1d({
        filters: 32,
        kernelSize: 3,
        activation: 'relu',
        inputShape: [CONFIG.INPUT_SIZE, 5],
    }));

    // MaxPooling слой
    model.add(tf.layers.maxPooling1d({
        poolSize: 2,
    }));

    // LSTM слой
    model.add(tf.layers.lstm({
        units: 64,
        returnSequences: false,
    }));

    // Полносвязный слой
    model.add(tf.layers.dense({
        units: 16,
        activation: 'relu',
    }));

    // Выходной слой
    model.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid',
    }));

    // Компиляция модели
    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
    });


    // LSTM:

    // model.add(tf.layers.lstm({
    //     units: 64, // Количество нейронов
    //     inputShape: [CONFIG.INPUT_SIZE, 5], // 10 свечей, 5 параметров (OHLCV)
    //     returnSequences: false, // Не возвращаем последовательность
    //   }));

    //   // Полносвязный слой
    //   model.add(tf.layers.dense({
    //     units: 32,
    //     activation: 'relu',
    //   }));

    //   // Выходной слой
    //   model.add(tf.layers.dense({
    //     units: 1,
    //     activation: 'sigmoid', // Вероятность от 0 до 1
    //   }));

    //   // Компиляция модели
    //   model.compile({
    //     optimizer: tf.train.adam(0.001), // Оптимизатор Adam
    //     loss: 'binaryCrossentropy', // Функция потерь для бинарной классификации
    //     metrics: ['accuracy'],
    //   });








    // model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [CONFIG.INPUT_SIZE * 5] }));



    // model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    // model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    // model.add(tf.layers.dense({ units: 32, activation: 'relu' }));

    // model.add(tf.layers.dropout({ rate: 0.2 }));

    // model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    // model.add(tf.layers.dense({ units: 256, activation: 'relu' }));
    // model.add(tf.layers.dense({ units: 1256, activation: 'relu' }));
    // model.add(tf.layers.dropout({ rate: 0.2 }));
    // model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    // model.add(tf.layers.dropout({ rate: 0.2 }));
    // model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Активация для вероятностей

    // Шаг 4: Компиляция модели
    // model.compile({
    //     optimizer: tf.train.adam(0.00001),
    //     loss: 'binaryCrossentropy', // Функция потерь для бинарной классификации
    //     metrics: ['accuracy'], // Для отслеживания точности
    // });
    model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError',
        metrics: ['mse'],
    });



    const error: number[] = []
    const errorTest: number[] = []
    const render = async () => {
        const predictedTrainData = model.predict(trainInputsTensor) as tf.Tensor;
        const predictedTDataArray = await predictedTrainData.array() as number[][];
        const predictedTrainDataArray = predictedTDataArray.map((data) => data[0]);
        const closeTrainLabels = trainLabels.map(label => label[0]); // Берем только close

        const maxPriceTrain = Math.max(...trainData.slice(0, countShow).map(d => d.currentPrice || 0))

        // console.log('maxPriceTrain', maxPriceTrain)
        // console.log('Last train open:', new Date(trainData[0].currentPrice))

        visualizeResults(
            closeTrainLabels.slice(0, countShow).map(v => v * maxPriceTrain),
            predictedTrainDataArray.slice(0, countShow).map(v => v * maxPriceTrain),
            trainData.slice(0, countShow).map(d => d.currentPrice || 0),
            'chart-known');

        const res = await model.evaluate(testInputsTensor, testLabelsTensor) as tf.Scalar[];
        // console.log(`Test Loss: ${res?.[0]}`, 'NM:', res?.[0].dataSync()?.[0]);
        // console.log(`Test MSE: ${res?.[1]}`);

        errorTest.push(Number(res?.[0].dataSync()?.[0]) || 0)


        const predictedTestData = model.predict(testInputsTensor) as tf.Tensor;
        const predictedDataArray = await predictedTestData.array() as number[][];
        const predictedTestDataArray = predictedDataArray.map((data) => data[0]);
        const closeTestLabels = testLabels.map(label => label[0]); // Берем только close

        const maxPriceTest = Math.max(...testData.map(d => d.currentPrice || 0))
        const minPriceTest = Math.min(...testData.map(d => d.currentPrice || 0))

        // console.log('Last test open:', new Date(testData[testData.length - 1]?.currentPrice))
        visualizeResults(
            closeTestLabels.map(v => v * maxPriceTest),
            predictedTestDataArray.map(v => v * maxPriceTest),
            testData.map(d => d.currentPrice || 0), 'chart-unknown'
        );

        console.log('****** Test *****')
        predictedTestDataArray.forEach((v, i) => {
            const predicted = v
            const last = Math.min(predictedTestDataArray[i - 1] || 1, predictedTestDataArray[i - 2] || 1,)
            const { currentPrice } = testData[i]
            const force = Math.round((predicted - last) * 100)
            if (force > 70) {
                const bestNext = Math.max(
                    testData[i + 1]?.currentPrice || 0,
                    testData[i + 2]?.currentPrice || 0,
                    testData[i + 3]?.currentPrice || 0,
                    testData[i + 4]?.currentPrice || 0,
                    testData[i + 5]?.currentPrice || 0,
                )
                console.log(`FORCE ${force} Price: ${currentPrice} -> ${bestNext} change: ${(((bestNext - currentPrice) / currentPrice) * 100).toFixed(2)}%`)
            }
        })


        visualizeError(error, errorTest, 'chart-error')

        useTest(model, testRanTimeCandels)
        // console.log('RENDER')

    }
    // чтобы в рантайме чекал цены для статистики
    // Шаг 5: Обучение модели
    model.fit(trainInputsTensor, trainLabelsTensor, {
        epochs: 5000,
        batchSize: 32,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch: ${epoch + 1}, Loss: ${logs?.loss}, MSE: ${logs?.mse}`);
                if (epoch % 5 === 0) {
                    error.push(logs?.loss || 0)
                    render()
                }
            },
        },
        validationData: [testInputsTensor, testLabelsTensor],
    });

    // setInterval(() => {
    //     useTest(model, testRanTimeCandels)
    // }, 10_000)

}



const useTest = async (model: tf.Sequential, candles: number[][]) => {
    const currentInputs = await candelsToInputs(candles)
    const prepInputs = currentInputs.map(i => i.map(v => [v.open, v.high, v.low, v.close, v.volume]))
    // console.log('CurrInps:', currentInputs.map(i => new Date(i[i.length - 1][6]) + ' ' + i[i.length - 1][5]))

    // console.log('PrepInps:', prepInputs)
    const predicts = (await (model.predict(tf.tensor3d(prepInputs)) as tf.Tensor).array() as number[][]).map(p => p[0])
    // console.log('Predictions:', predicts)
    console.log('****** RT *****')
    predicts.forEach((p, i) => {
        if (i < 2 || !prepInputs[i + 5]) {
            return
        }

        const force = Math.round((p - predicts[i - 2]) * 100)
        // console.log('Force', force , p, predicts[i - 2])
        const input = currentInputs[i]
        if (force < 50) {
            return
        }

        const nextInputs = currentInputs.slice(i + 1, i + 5)
        const maxPrice = Math.max(...nextInputs.map(i => i[i.length - 1].realPrice || 0))
        const currentPrice = input[input.length - 1].realPrice
        console.log('Force:', force, 'Price', currentPrice, '->', maxPrice, 'change:', ((maxPrice - currentPrice) / currentPrice * 100).toFixed(2))

        // console.log('Next list->', nextInputs.map(inp => new Date(inp[inp.length - 1][6])))
    })

}

const useRuntime = async (model: tf.Sequential) => {
    const currentInputs = (await candelsToInputs())
    const prepInputs = currentInputs.map(i => i.map(v => [v.open, v.high, v.low, v.close, v.volume]).flat())
    console.log('CurrInps:', currentInputs.map(i => new Date(i[i.length - 1].closeTime) + ' ' + i[i.length - 1].realPrice.toFixed(2)))

    // console.log('PrepInps:', prepInputs)
    const [_pred2ClosedValue, _predClosedValue, _lastClosedValue, _noClosedValue] = await (model.predict(tf.tensor2d(prepInputs)) as tf.Tensor).array() as number[][]
    // const [pred2ClosedValue, predClosedValue, lastClosedValue, noClosedValue] = await (model.predict(tf.tensor2d(prepInputs)) as tf.Tensor).array() as number[]
    const pred2ClosedValue = _pred2ClosedValue[0]
    const predClosedValue = _predClosedValue[0]
    const lastClosedValue = _lastClosedValue[0]
    const noClosedValue = _noClosedValue[0]


    const closeForce = Math.round((lastClosedValue - pred2ClosedValue) * 100)
    const noCloseForce = Math.round((noClosedValue - predClosedValue) * 100)

    console.log('LifetimePredictions:', [pred2ClosedValue, predClosedValue, lastClosedValue, noClosedValue])
    console.log('CloseForce:', closeForce, 'NoCloseForce:', noCloseForce)

    const lastCloseInput = currentInputs[currentInputs.length - 2]
    const lastCloseCandle = lastCloseInput[lastCloseInput.length - 1]
    console.log('>>>>> CurrentClosePrice:', new Date(lastCloseCandle.closeTime), lastCloseCandle.realPrice)

    if (closeForce > 50 || closeForce < -50) {
        setDate({
            closeTime: lastCloseCandle.closeTime,
            closePrice: lastCloseCandle.realPrice,
            force: closeForce
        })
    }
}