/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as _ from "lodash";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { parse } from "comment-json";
import { messages } from "./messages";
import { IServiceQuery, CF_PAGE_SIZE, IServiceFilters, eFilters, eServiceTypes } from "./types";

export async function dataContentAsObject(filePath: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return _.reduce(
      _.split(await fs.promises.readFile(filePath, { encoding: "utf8" }), os.EOL),
      (data: any, line: string) => {
        const parts = _.split(line, "=");
        if (_.size(parts) > 1) {
          data[_.trim(parts[0])] = _.trim(parts[1]);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return data;
      },
      {},
    );
  } catch (error) {
    // log error
    return {};
  }
}

export function ensureQuery(query?: IServiceQuery): IServiceQuery {
  query = query || {};
  _.defaults(query, { filters: [] });
  // default paging size is 50...
  _.defaults(query, { per_page: CF_PAGE_SIZE });
  return query;
}

export function padQuery(query: IServiceQuery, otherFilters: IServiceFilters[]): IServiceQuery {
  query = ensureQuery(query);
  _.each(otherFilters, (other) => {
    const filter = _.find(query.filters, ["key", other.key]);
    if (!_.size(filter?.value)) {
      query.filters = _.concat(query.filters, [other]);
    }
  });
  return query;
}

export function getGuid(resource: any): string {
  return _.get(resource, "guid", "");
}

export function getName(resource: any): string {
  return _.get(resource, "name", "");
}

export function getLabel(resource: any): string {
  return _.get(resource, "label", "");
}

export function getDescription(resource: any): string {
  return _.get(resource, "description", "");
}

export function getSpaceFieldGUID(spaceField: any): string {
  return _.get(spaceField, "GUID", "");
}

export function getOrgGUID(resource: any): string {
  return _.get(resource, ["relationships", "organization", "data", "guid"], "");
}

export function getTags(resource: any): string[] {
  return _.get(resource, "tags", []);
}

/**
 * Combine path to 'cf' configuration file
 * @param target: string (optional), determines which config file is looking for
 * @returns
 */
export function cfGetConfigFilePath(target?: string): string {
  const relatives = target ? ["targets", `${target}.config.json`] : [`config.json`];
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
  return path.join(_.get(process, "env.CF_HOME", os.homedir()), ".cf", ...relatives);
}

export function isUpsType(resource: any): boolean {
  return _.get(resource, "type", eServiceTypes.managed) === eServiceTypes.user_provided;
}

/**
 *  Get json value of config file
 * @param target: string (optional), in case a predefined target configuration file exists the value will be fetched from there
 * @returns object: json
 */
export async function cfGetConfigFileJson(target?: string): Promise<unknown> {
  try {
    return parse(await fs.promises.readFile(cfGetConfigFilePath(target), { encoding: "utf8" }));
  } catch (error) {
    // empty or non existing file
  }
}

/**
 *  Get field value from config file
 * @param field: string, name of requested field
 * @param target: string (optional), in case a predefined target configuration file exists the value will be fetched from there
 * @returns object: json
 */
export async function cfGetConfigFileField(field: string, target?: string): Promise<any> {
  return _.get(await cfGetConfigFileJson(target), `${field}`);
}

export async function getSpaceGuidThrowIfUndefined(): Promise<string> {
  const space: string = getSpaceFieldGUID(await cfGetConfigFileField("SpaceFields"));
  if (!space) {
    throw new Error(messages.cf_setting_not_set);
  }
  return space;
}

export async function padQuerySpace(query: IServiceQuery, otherFilters?: IServiceFilters[]): Promise<IServiceQuery> {
  query = padQuery(query, otherFilters);
  const filter = _.find(query.filters, ["key", eFilters.space_guids]);
  if (!_.size(filter?.value)) {
    query.filters = _.concat(query.filters, [
      { key: eFilters.space_guids, value: await getSpaceGuidThrowIfUndefined() },
    ]);
  }
  return query;
}

export function parseRawDictData(data: string): unknown {
  const result: any = {};
  _.each(_.compact(_.split(data, "\n")), (item) => {
    item = _.replace(_.trim(item), /^['"]|['"]$/g, "");
    const sep = _.indexOf(item, ":");
    if (sep > -1) {
      const key = _.toLower(_.trim(_.join(_.slice(item, 0, sep), "")));
      const value = _.trim(_.join(_.slice(item, sep + 1), ""));
      result[`${key}`] = value;
    }
  });
  return result;
}
