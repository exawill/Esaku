/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./public/js/**/*.js",
    "./server/**/*.{js,ts}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#fbfaf6",
          100: "#f7f4ec",
          200: "#efe9d9",
          300: "#e6dec5"
        },
        ink: {
          900: "#1d1f22",
          800: "#26282d",
          700: "#33363c",
          600: "#494d55"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"]
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      boxShadow: {
        soft: "0 6px 24px -10px rgba(29, 31, 34, 0.18)"
      }
    }
  },
  plugins: []
};
