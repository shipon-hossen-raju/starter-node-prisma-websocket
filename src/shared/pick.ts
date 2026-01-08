// import { ParsedQs } from "qs";

export const pick = <T, K extends readonly (keyof T)[]>(
  obj: T,
  keys: K
): Partial<Pick<T, K[number]>> | Record<string, string> => {
  const finalObj: Partial<Pick<T, K[number]>> = {};

  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      finalObj[key] = obj[key];
    }
  }

  return finalObj;
};

// const pickQueryString = <K extends readonly string[]>(
//   obj: ParsedQs,
//   keys: K
// ): Partial<Record<K[number], string>> => {
//   const result: Partial<Record<K[number], string>> = {};

//   for (const key of keys) {
//     const value = obj[key];
//     if (typeof value === "string") {
//       result[key] = value;
//     }
//   }

//   return result;
// };

// const pick = <T extends Record<string, unknown>, k extends keyof T>(
//   obj: T,
//   keys: k[]
// ): Partial<T> => {
//   const finalObj: Partial<T> = {};

//   for (const key of keys) {
//     if (obj && Object.hasOwnProperty.call(obj, key)) {
//       finalObj[key] = obj[key];
//     }
//   }

//   return finalObj;
// };

// export default pick;
