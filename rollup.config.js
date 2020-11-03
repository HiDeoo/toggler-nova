import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/main.ts",
  plugins: [typescript(), commonjs()],
  output: {
    file: "toggler.novaextension/Scripts/main.js",
    sourcemap: true,
    format: "cjs",
  },
};
