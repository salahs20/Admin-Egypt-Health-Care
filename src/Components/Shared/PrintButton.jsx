import React from 'react';

const PrintButton = ({ content, title }) => {
  const handlePrint = () => {
    const printableContent = content
      .map((item) => `${item.name}, ${item.email}, ${item.phone}`)
      .join("\n");
    console.log(printableContent); // Replace with actual print logic
  };

  return (
    <button onClick={handlePrint} className="bg-blue-500 text-white py-2 px-4 rounded">
      Print {title}
    </button>
  );
};

export default PrintButton;