import axios from 'axios';

const API_URL = 'https://api.binance.com/api/v3/klines';

async function fetchCandles(symbol: string, interval: string, limit: number, endTime?: number) {
    const params: any = {
        symbol,
        interval,
        limit,
    };
    console.log('endTime:', endTime)
    if (endTime) {
        params.endTime = endTime; // Для всех запросов после первого используем endTime
    }

    const response = await axios.get(API_URL, { params });
    return response.data as number[][];
}

export async function getHistoricalCandles(symbol: string, interval: string, totalCandles: number) {
    let candles: number[][] = [];
    let endTime: number | undefined = undefined; // Для первого запроса endTime не указываем
    let remainingCandles = totalCandles;

    while (remainingCandles > 0) {
        // Печатаем endTime для отладки
        console.log(`Fetching candles up to: ${endTime ? new Date(endTime).toISOString() : 'No endTime'}`);

        const candlesBatch = await fetchCandles(symbol, interval, 500, endTime);
        if (candlesBatch.length === 0) {
            console.log('No candles returned, exiting...');
            break; // Если нет данных, выходим
        }
        console.log('Start:', new Date(candlesBatch[0][0]))
        console.log('Stop:', new Date(candlesBatch[candlesBatch.length - 1][0]))
        candles.unshift(...candlesBatch);
        remainingCandles -= candlesBatch.length;

        // Обновляем endTime, используя timestamp последней свечи
        if (candlesBatch.length > 0) {
            endTime = candlesBatch[0][0] - 1; // Используем timestamp последней свечи минус 1 мс
        }

        // Если получено меньше 100 свечей, значит, мы дошли до конца
        if (candlesBatch.length < 100) {
            break;
        }
    }
    
    // candles.forEach((c, i) => {
    //     try {
    //         console.log('Change:', Math.round((c[0] - candles[i + 1][0]) / 1000 / 60), 'min')
    //     } catch (error) {

    //     }
    // })
    return candles
}
