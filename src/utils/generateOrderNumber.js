const generateOrderNumber = () => {
  return `UGC-${Date.now()}`;
};

export default generateOrderNumber;
