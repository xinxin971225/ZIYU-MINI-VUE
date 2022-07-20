export function needUpdateProps(preVnode, nextVnode) {
  const { props: preProps } = preVnode;
  const { props: nextProps } = nextVnode;
  for (const key in nextProps) {
    if (nextProps[key] !== preProps[key]) {
      return true;
    }
  }
  return false;
}
