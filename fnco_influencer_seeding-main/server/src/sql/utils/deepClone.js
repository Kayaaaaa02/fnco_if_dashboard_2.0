import _ from "lodash";

export const deepClone = (obj) => {
  return _.cloneDeep(obj);
};
