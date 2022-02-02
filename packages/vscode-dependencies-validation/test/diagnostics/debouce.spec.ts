import * as proxyquire from "proxyquire";
import { noop, map, uniq } from "lodash";
import { URI } from "vscode-uri";
import type { WorkspaceFolder } from "vscode";
import { expect } from "chai";
import { loggerProxy } from "../moduleProxies";

const proxyQuireNoCallThru = proxyquire.noCallThru();

describe("debounce module", () => {
  let debounceModule: typeof import("../../src/diagnostics/debounce");

  beforeEach(() => {
    debounceModule = proxyQuireNoCallThru("../../src/diagnostics/debounce", {
      // we are only testing the caching logic, not any real flow...
      "./refreshDiagnostics": { refreshDiagnostics: noop },
      vscode: { workspace: {} },
      "../logger/logger": loggerProxy,
    });
  });

  describe("refreshDiagnostics optimization wrapper", () => {
    it("creates a **different** optimized wrapper for **different** URIs", () => {
      const paths = ["/foo/A", "/foo/B", "/foo/C"];
      // eslint-disable-next-line @typescript-eslint/unbound-method -- referencing **static** method
      const uris = map(paths, URI.file);
      const optimizedWrappers = map(
        uris,
        debounceModule.getOptimizedRefreshDiagnostics
      );
      const uniqWrappers = uniq(optimizedWrappers);
      expect(uniqWrappers).to.have.lengthOf(3);
    });

    it("caches the **same** optimized wrapper for URIs with the **same** `fsPath`", () => {
      const wrapperA = debounceModule.getOptimizedRefreshDiagnostics(
        URI.file("/foo/A")
      );
      const wrapperA2 = debounceModule.getOptimizedRefreshDiagnostics(
        URI.file("/foo/A")
      );
      const wrapperA3 = debounceModule.getOptimizedRefreshDiagnostics(
        URI.file("/foo/A")
      );

      expect(wrapperA).to.equal(wrapperA2);
      expect(wrapperA2).to.equal(wrapperA3);
    });
  });

  describe("garbage collection capabilities", () => {
    it("will cleanup obsolete references which are no longer part of the workspace", () => {
      const paths = ["/foo/A", "/foo/B", "/foo/C"];
      // eslint-disable-next-line @typescript-eslint/unbound-method -- referencing **static** method
      const uris = map(paths, URI.file);
      // for side effect of adding data to the cache
      map(uris, debounceModule.getOptimizedRefreshDiagnostics);

      const cache = debounceModule.internal.OPTIMIZED_PATHS_TO_FUNC;
      const cacheKeysBefore = Array.from(cache.keys());
      expect(cacheKeysBefore).to.deep.equal(paths);

      const garbageCollect = debounceModule.internal.garbageCollect;
      garbageCollect((uri) => {
        if (uri.path !== "/foo/B") {
          return undefined;
        } else {
          // the production code does not care about the details of the returned value
          return {} as unknown as WorkspaceFolder;
        }
      });

      const cacheKeysAfter = Array.from(cache.keys());
      expect(cacheKeysAfter).to.deep.equal(["/foo/B"]);
    });
  });
});
