import { useState, useEffect } from 'react';

import Progress from '../components/Progress';

export default function Analysis({ name, version, labels, hypothesis, output }) {
  // const [labels, setLabels] = useState(["job", "eating", "recreation"]);
  // const [hypothesis, setHypothesis] = useState("This text is about {}");

  // useEffect(() => {
  //   bind(name, () => {
  //     return { name, version, labels, hypothesis };
  //   });
  // }, [name]);

  return (
    <>
      <h2>{name}</h2>
      <p>{hypothesis}</p>
      <div className="textbox-container">
        <div className="progress-bars-container">
          {labels.map((label) => (
            <Progress key={label} text={label} percentage={output[label] || 0} />
          ))}
        </div>
      </div>
    </>
  )
}
