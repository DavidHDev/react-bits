const HEX = /^#[0-9a-fA-F]{3,8}$/;
export const colorsOf = (props, definitions) => {
  const found = [];
  const add = value => {
    if (typeof value === 'string' && HEX.test(value) && !found.includes(value.toLowerCase())) {
      found.push(value.toLowerCase());
    }
  };
  definitions.forEach(definition => {
    const value = props[definition.name];
    if (definition.type === 'color') add(value);
    if (definition.type === 'colorArray' && Array.isArray(value)) value.forEach(add);
  });
  Object.values(props).forEach(value => (Array.isArray(value) ? value.forEach(add) : add(value)));
  return found.slice(0, 3);
};
