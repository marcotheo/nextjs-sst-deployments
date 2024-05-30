import type { Config } from "tailwindcss";

import TailwinConfig from "../ui-components/tailwind.config";

const config = {
  ...TailwinConfig,
} satisfies Config;

export default config;
