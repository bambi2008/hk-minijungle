import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "dist");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of [
  "index.html",
  "app.js",
  "p2-growth.js",
  "styles.css",
  "PUBLIC_PHOTO_TEST_GUIDE.md"
]) {
  await copyFile(resolve(root, file), resolve(output, file));
}

await cp(resolve(root, "assets"), resolve(output, "assets"), { recursive: true });
await mkdir(resolve(output, "data"), { recursive: true });
await copyFile(
  resolve(root, "data/public-photo-fixtures.json"),
  resolve(output, "data/public-photo-fixtures.json")
);

console.log("fivecrop-vercel-static-build-ok");
