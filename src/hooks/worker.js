import { pipeline, env } from '@xenova/transformers';
env.allowLocalModels = true;
env.useBrowserCache = false;

class Classifier {
  static task = 'zero-shot-classification';
  static model = 'Xenova/mobilebert-uncased-mnli';
  static instance = null;

  static async getInstance() {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, {
        progress_callback: (msg) => {
          self.postMessage(msg);
        },
      });
    }
    return this.instance;
  }
}

self.addEventListener('message', async (event) => {
  const classifier = await Classifier.getInstance();

  if (event.data.warmUp) {
    return;
  }

  const {
    name,
    version,
    text,
    labels = ["employment", "food"],
    hypothesis = "This text is about {}",
  } = event.data;

  const output = await classifier(text, labels, {
    multi_class: false,
    hypothesis_template: hypothesis,
  });
  self.postMessage({
    status: 'analyzed',
    output: {
      name,
      version: version + 1,
      ...JSON.parse(JSON.stringify(output))
    },
  });
});
