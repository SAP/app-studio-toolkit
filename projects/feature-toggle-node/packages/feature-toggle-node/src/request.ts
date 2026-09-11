import { log } from "./logger";
import * as https from "http";
import { Features } from "./client";

const ENV_FTM_HOST = "FTM_HOST";
const DEFAULT_SERVER_ENDPOINT = "http://ft-manager.feature-toggle.svc.cluster.local";
const API_ENDPOINT = "/v1/features";

function getEndpoint(): string {
  const host = process.env[ENV_FTM_HOST] || DEFAULT_SERVER_ENDPOINT;
  return host + API_ENDPOINT;
}

function makeRequest(): Promise<Uint8Array[]> {
  return new Promise((resolve, reject) => {
    https
      .get(getEndpoint(), (res) => {
        log("Get Toggles from server with Status Code: " + res.statusCode);

        const data: Uint8Array[] = [];
        res.on("data", (chunk) => {
          data.push(chunk);
        });

        res.on("end", () => {
          resolve(data);
        });
      })
      .on("error", (e) => {
        log(e.message);
        reject(e);
      });
  });
}

/*
 * requestFeatureToggles always returns value
 * */
export async function requestFeatureToggles(): Promise<Features | undefined> {
  try {
    const data = await makeRequest();
    return JSON.parse(Buffer.concat(data).toString());
  } catch (e: unknown) {
    if (e instanceof Error) {
      log(e.message); // This will work
    } else {
      log("An unknown error occurred");
    }
    return undefined;
  }
}
