import React from 'react';

import './index.css';
import ReactDOM from 'react-dom/client';

export function Options() {
  return <div>Options Page</div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
);
