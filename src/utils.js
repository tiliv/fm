export function bufferize(topMargin, text, width, height, scrollOffset) {
  const buffer = [];
  const words = text.split(' ');
  let currentLine = [];

  words.forEach(word => {
    if (currentLine.join(' ').length + word.length + 1 > width) {
      buffer.push(currentLine);
      currentLine = [];
    }
    currentLine.push(word);
  });

  if (currentLine.length > 0) {
    buffer.push(currentLine);
  }

  const scrolledBuffer = buffer
    .slice(scrollOffset, scrollOffset + height - topMargin)
    .map(line => line.join(' '));
  scrolledBuffer.unshift(...Array(topMargin).fill(''));
  return scrolledBuffer;
}

export function bufferizeList(topMargin, buffer, width, height, scrollOffset) {
  const scrolledBuffer = buffer
    .slice(scrollOffset, scrollOffset + height - topMargin);
  scrolledBuffer.unshift(...Array(topMargin).fill(''));
  return scrolledBuffer;
}
