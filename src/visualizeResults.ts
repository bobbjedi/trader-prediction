// src/visualizeResults.ts
import Plotly from 'plotly.js-dist'

export const visualizeResults = (realData: number[], predictedData: number[], testMaxClose: number[], id: string) => {
  const trace1 = {
    x: Array.from({ length: realData.length }, (_, i) => i), // Индексы для оси X
    y: realData,
    mode: 'lines',
    name: 'Real Data',
  };


  const trace2 = {
    x: Array.from({ length: predictedData.length }, (_, i) => i),
    y: predictedData,
    mode: 'lines',
    name: 'Predicted Data',
  };

  const trace3 = {
    x: Array.from({ length: testMaxClose.length }, (_, i) => i),
    y: testMaxClose,
    mode: 'lines',
    name: 'MaxClose Data',
  };

  const data = [trace1, trace2, trace3];

  const layout = {
    title: 'Real vs Predicted',
    xaxis: { title: 'Index' },
    yaxis: { title: 'Value' },
    hovermode: 'x',
  };

  Plotly.newPlot(id, data, layout);
};
