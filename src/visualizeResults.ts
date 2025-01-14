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
    title: 'Real vs Predicted ' + id,
    xaxis: { title: 'Index' },
    yaxis: { title: 'Value' },
    hovermode: 'x',
  };

  Plotly.newPlot(id, data, layout);
};

export const visualizeError = (error: number[], errorTest: number[], id: string) => {
  const trace = {
    x: Array.from({ length: error.length }, (_, i) => i),
    y: error,
    mode: 'lines',
    name: 'Train Loss',
  };
  const trace2 = {
    x: Array.from({ length: errorTest.length }, (_, i) => i),
    y: errorTest,
    mode: 'lines',
    name: 'Test Loss',
  }
  const layout = {
    title: 'Loss',
    xaxis: { title: 'Mse Loss' },
    yaxis: { title: 'Epoch' },
    hovermode: 'x',
  };

  Plotly.newPlot(id, [trace, trace2], layout);
}