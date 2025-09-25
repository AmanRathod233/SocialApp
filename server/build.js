import esbuild from "esbuild";
import { glob } from "glob";

// Find all JS files in the current folder (excluding node_modules and dist)
const files = await glob("**/*.js", {
  posix: true,
  ignore: ["node_modules/**", "dist/**" ,"build.js"]
});

if (files.length === 0) {
  console.error("❌ No JS files found");
  process.exit(1);
}

console.log("📂 Files to build:", files);

esbuild.build({
  entryPoints: files,
  outdir: "dist",
  outbase: ".",        // preserve folder structure starting from project root
  bundle: false,
  platform: "node",
  format: "esm",       // or "cjs"
  target: ["node18"]   // match your Node version
}).then(() => {
  console.log("✅ Build complete. Files are in dist/");
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
