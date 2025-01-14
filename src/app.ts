// В src/app.ts

import { data } from '@tensorflow/tfjs';
import { getHistoricalCandles } from './binance';
import { CONFIG } from './config';
import { prepareDataset, splitDataset } from './dataset';
import { trainModel } from './train';

export async function runApp() {
    const appDiv = document.getElementById('app');
    if (!appDiv) {
        console.error('App container not found!');
        return;
    }

    appDiv.innerHTML = '<h1>Trading Candles Prediction</h1><p>Fetching data...</p>';

    try {
        // const candles = await getHistoricalCandles('BTCUSDT', CONFIG.TIMEFRAME, CONFIG.CANDLE_LIMIT);
        // console.log('candles', candles)
        // const dataset = prepareDataset(candles, CONFIG.INPUT_SIZE);
        // console.log('dataset:', dataset)
        // const { trainData, testData } = splitDataset(dataset);

        appDiv.innerHTML = `
      <h2>Dataset prepared</h2>
      <p>Train data size: ${}</p>
      <p>Test data size: ${}</p>
    `;

        // Обучаем модель
        const model = await trainModel();
        console.log("Trained Model:", model);

        // Предсказания можно будет сделать позже, после завершения обучения
        appDiv.innerHTML += '<p>Model training completed!</p>';
    } catch (error) {
        appDiv.innerHTML += '<p style="color:red;">Error fetching or processing data!</p>';
        console.error(error);
    }
}
