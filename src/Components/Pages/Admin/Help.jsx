import React, { useEffect } from 'react';

const Help = () => {
  useEffect(() => {
    window.chatId = '3e1505ba-864e-49ce-9f3d-8b657b98b2e6';
    window.locale = 'ar';
    window.position = 'bottom-left';
    window.positionX = 30;
    window.positionY = 30;
    window.borderRadius = 3;
    window.helpdeskURL = 'https://helpclinic.zaetoon.com';

    const d = document;
    const s = d.createElement('script');
    s.src = 'https://helpclinic.zaetoon.com/assets/widget/zaetoon-widget.min.js';
    s.defer = true;
    d.getElementsByTagName('head')[0].appendChild(s);

    // Cleanup function to remove the script if the component unmounts
    return () => {
      d.getElementsByTagName('head')[0].removeChild(s);
    };
  }, []);

  return 
};

export default Help;