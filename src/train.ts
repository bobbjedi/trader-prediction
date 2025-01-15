import * as tf from '@tensorflow/tfjs';
import { getHistoricalCandles } from './binance';
import { CONFIG } from './config';
import { normalizeArray, prepareDataset, splitDataset } from './dataset';
import { visualizeError, visualizeResults } from './visualizeResults';

export async function trainModel() {
    // Шаг 1: Загрузка и подготовка данных

    const countShow = 300
    const candles = await getHistoricalCandles('BTCUSDT', CONFIG.TIMEFRAME, CONFIG.CANDLE_LIMIT);
    const dataset = prepareDataset(candles, CONFIG.INPUT_SIZE);
    // const { trainData, testData } = splitDataset(dataset, 0.98);
    const trainData = dataset
    const testData = dataset.splice(-countShow)
    console.log('Set item:', testData[0])
    // Шаг 2: Разделяем данные на вход (inputs) и метки (targets)
    const trainInputs = trainData.map(sample => sample.input.flat());
    const trainLabels = trainData.map(sample => sample.target);

    const testInputs = testData.map(sample => sample.input.flat());
    const testLabels = testData.map(sample => sample.target);

    const testMaxClose = testData.map(sample => sample.maxClose || 0);
    const trainMaxClose = trainData.map(sample => sample.maxClose || 0);

    // Преобразуем данные в тензоры
    const trainInputsTensor = tf.tensor2d(trainInputs);
    const trainLabelsTensor = tf.tensor2d(trainLabels);

    const testInputsTensor = tf.tensor2d(testInputs);
    const testLabelsTensor = tf.tensor2d(testLabels);

    // Шаг 3: Создание модели
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [CONFIG.INPUT_SIZE * 5] }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));

    // model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    // model.add(tf.layers.dense({ units: 256, activation: 'relu' }));
    // model.add(tf.layers.dense({ units: 1256, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    // model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    // model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' })); // Активация для вероятностей

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

        const maxPriceTrain = Math.max(...trainData.slice(0, countShow).map(d => d.realPrice || 0))

        console.log('Last train open:', new Date(trainData[0].closeTime))

        visualizeResults(
            closeTrainLabels.slice(0, countShow).map(v => v * maxPriceTrain),
            predictedTrainDataArray.slice(0, countShow).map(v => v * maxPriceTrain),
            trainMaxClose.slice(0, countShow).map(v => v * maxPriceTrain),
            'chart-known');

        const res = await model.evaluate(testInputsTensor, testLabelsTensor) as tf.Scalar[];
        console.log(`Test Loss: ${res?.[0]}`, 'NM:', res?.[0].dataSync()?.[0]);
        console.log(`Test MSE: ${res?.[1]}`);

        errorTest.push(Number(res?.[0].dataSync()?.[0]) || 0)


        const predictedTestData = model.predict(testInputsTensor) as tf.Tensor;
        const predictedDataArray = await predictedTestData.array() as number[][];
        const predictedTestDataArray = predictedDataArray.map((data) => data[0]);
        const closeTestLabels = testLabels.map(label => label[0]); // Берем только close

        const maxPriceTest = Math.max(...testData.map(d => d.realPrice || 0))
        const minPriceTest = Math.min(...testData.map(d => d.realPrice || 0))

        console.log('Last test open:', new Date(testData[testData.length - 1]?.closeTime))
        visualizeResults(closeTestLabels.map(v => v * maxPriceTest), predictedTestDataArray.map(v => v * maxPriceTest), testData.map(d => d.realPrice || 0), 'chart-unknown');


        predictedTestDataArray.forEach((v, i) => {
            const predicted = v
            const last = Math.min(predictedTestDataArray[i - 1] || 1, predictedTestDataArray[i - 2] || 1,)
            const { realPrice, closeTime } = testData[i]
            const force = Math.round((predicted - last) * 100)
            if (force > 50) {
                const bestNext = Math.max(
                    testData[i + 1]?.realPrice || 0,
                    testData[i + 2]?.realPrice || 0,
                    testData[i + 3]?.realPrice || 0,
                    testData[i + 4]?.realPrice || 0,
                    testData[i + 5]?.realPrice || 0,
                )
                console.log(`
                    FORCE ${force} ${new Date(closeTime)} 
                    Price: ${realPrice} -> ${bestNext} change: ${(((bestNext - realPrice) / realPrice) * 100).toFixed(2)}%`)
            }
        })


        visualizeError(error, errorTest, 'chart-error')
        console.log('RENDER')
    }



    // Шаг 5: Обучение модели
    await model.fit(trainInputsTensor, trainLabelsTensor, {
        epochs: 200000,
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

    // Шаг 6: Оценка на тестовых данных



    // Шаг 7: Визуализация результатов

}
