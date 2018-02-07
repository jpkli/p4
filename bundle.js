import pipeline from './src/pipeline';

(function makeGlobal() {
  if (typeof window !== 'undefined') {
    window.p4 = pipeline;
  }
})();
