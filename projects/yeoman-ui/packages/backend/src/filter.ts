import {
  compact,
  difference,
  filter,
  get,
  intersection,
  isArray,
  isEmpty,
  isString,
  map,
  trim,
} from "lodash";

export enum GeneratorType {
  project = "project",
  module = "module",
}

function getCategories(filterObject?: any): string[] {
  const categories: string[] = get(filterObject, "categories", []);
  if (isArray(categories)) {
    const strValues = filter(categories, (category) => {
      return isString(category);
    });
    if (isEmpty(difference(categories, strValues))) {
      return categories;
    }
  }

  return [];
}

function getTypes(filterObject?: any): string[] {
  let types: string[] = [];
  const objectTypes: any = get(
    filterObject,
    "types",
    get(filterObject, "type")
  );
  if (isString(objectTypes)) {
    types.push(objectTypes);
  } else if (isArray(objectTypes)) {
    // leave only string values
    types = filter(objectTypes, (type) => isString(type));
  }

  return compact(map(types, trim));
}

export class GeneratorFilter {
  public static create(filterObject?: any) {
    const categories: string[] = getCategories(filterObject);
    const types: string[] = getTypes(filterObject);

    return new GeneratorFilter(types, categories);
  }

  public static hasIntersection(array1: string[], array2: string[]) {
    return isEmpty(array1) || !isEmpty(intersection(array1, array2));
  }

  private constructor(
    public readonly types: string[],
    public readonly categories: string[]
  ) {}
}
