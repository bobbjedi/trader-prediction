export type Candle = {
    closeTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
  
  export type DataSample = {
    input: number[][]; // Входные свечи (N свечей)
    target: number[];  // Целевая свеча (OHLC или только close)
    maxClose: number;
    realPrice: number;
    closeTime: number
  };
  
  