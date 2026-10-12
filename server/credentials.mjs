import {
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
  chmodSync,
  unlinkSync,
} from "node:fs";
import { dirname } from "node:path";
export function credentials(path) {
  return {
    read() {
      if (!existsSync(path)) return null;
      return JSON.parse(readFileSync(path, "utf8"));
    },
    save(value) {
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
      chmodSync(dirname(path), 0o700);
      const temp = path + ".tmp";
      writeFileSync(temp, JSON.stringify(value), { mode: 0o600 });
      chmodSync(temp, 0o600);
      renameSync(temp, path);
    },
    clear() {
      if (existsSync(path)) unlinkSync(path);
    },
    status() {
      const value = this.read();
      return value
        ? {
            connected: true,
            username: value.username,
            version: value.version,
            verifiedAt: value.verifiedAt,
          }
        : { connected: false };
    },
  };
}
