module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  corePlugins: {
    preflight: false, // Disable default styles for shadow DOM
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", "sans-serif"],
      },
    },
  },
};
